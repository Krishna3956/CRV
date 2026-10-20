/**
 * Durable refresh-job policy for Founder OS derived read models.
 *
 * The web request path must not become the scheduler. A worker claims a
 * bounded job, performs an idempotent projection/cleanup, and records an
 * explicit terminal or retryable result. This module is intentionally pure so
 * worker adapters (Supabase, a queue service, or a local test store) cannot
 * bypass the lifecycle invariants.
 */

export type TrackMCPRefreshJobKind =
  | "fact_projection"
  | "action_queue_refresh"
  | "catalog_recompute"
  | "catalog_entity_recompute"
  | "retention_cleanup";

export type TrackMCPRefreshJobState = "queued" | "running" | "retryable" | "succeeded" | "failed" | "cancelled";

export type TrackMCPRefreshJob = {
  id: string;
  workspace_id: string;
  kind: TrackMCPRefreshJobKind;
  dedupe_key: string;
  state: TrackMCPRefreshJobState;
  attempt_count: number;
  max_attempts: number;
  available_at: string;
  lease_owner: string | null;
  lease_until: string | null;
  last_error_code: string | null;
  last_error_detail: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type TrackMCPRefreshJobResult =
  | { outcome: "succeeded" }
  /** The bounded worker deadline stopped before this job ran to completion. */
  | { outcome: "deferred"; detail?: string }
  | { outcome: "retryable"; error_code: string; detail?: string }
  | { outcome: "failed"; error_code: string; detail?: string };

export type RefreshJobDecision =
  | { ok: true; job: TrackMCPRefreshJob; changed: boolean }
  | { ok: false; code: "invalid_input" | "not_due" | "not_claimable" | "invalid_transition" | "lease_expired"; message: string };

const MAX_ID = 200;
const MAX_ERROR_CODE = 80;
const MAX_ERROR_DETAIL = 240;
const MAX_ATTEMPTS = 8;
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_LEASE_MS = 5 * 60 * 1000;
const MAX_BACKOFF_MS = 12 * 60 * 60 * 1000;
const SUPPORTED_KINDS = new Set<TrackMCPRefreshJobKind>([
  "fact_projection", "action_queue_refresh", "catalog_recompute", "catalog_entity_recompute", "retention_cleanup",
]);

function bounded(value: string, max = MAX_ID): boolean {
  return value.length > 0 && value.length <= max && !/[\r\n]/.test(value);
}

function isoMs(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function errorCode(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, MAX_ERROR_CODE) || "worker_failure";
}

function errorDetail(value?: string): string | null {
  if (!value) return null;
  // Error details are diagnostic labels only; strip line breaks and common
  // credential-shaped values before they can enter the durable job row.
  const redacted = value.replace(/[\r\n]+/g, " ").replace(/(?:bearer\s+|api[_-]?key\s*[:=]\s*|secret\s*[:=]\s*)\S+/gi, "[redacted]");
  return redacted.slice(0, MAX_ERROR_DETAIL) || null;
}

export function refreshJobBackoffMs(attemptCount: number): number | null {
  if (!Number.isInteger(attemptCount) || attemptCount < 1 || attemptCount > MAX_ATTEMPTS) return null;
  return Math.min(MAX_BACKOFF_MS, 60_000 * (5 ** (attemptCount - 1)));
}

export function createRefreshJob(input: {
  id: string;
  workspace_id: string;
  kind: TrackMCPRefreshJobKind;
  dedupe_key: string;
  now?: Date;
  max_attempts?: number;
}): { ok: true; job: TrackMCPRefreshJob } | { ok: false; code: "invalid_input"; message: string } {
  const now = input.now || new Date();
  const maxAttempts = input.max_attempts ?? DEFAULT_MAX_ATTEMPTS;
  if (!bounded(input.id) || !bounded(input.workspace_id) || !bounded(input.dedupe_key) || !SUPPORTED_KINDS.has(input.kind)) return { ok: false, code: "invalid_input", message: "Job identity or kind is invalid." };
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > MAX_ATTEMPTS) return { ok: false, code: "invalid_input", message: "max_attempts must be between 1 and 8." };
  const timestamp = now.toISOString();
  return { ok: true, job: { id: input.id, workspace_id: input.workspace_id, kind: input.kind, dedupe_key: input.dedupe_key, state: "queued", attempt_count: 0, max_attempts: maxAttempts, available_at: timestamp, lease_owner: null, lease_until: null, last_error_code: null, last_error_detail: null, created_at: timestamp, updated_at: timestamp, completed_at: null } };
}

/** Claim queued/retryable work, or recover a job whose lease expired. */
export function claimRefreshJob(current: TrackMCPRefreshJob, owner: string, now = new Date(), leaseMs = DEFAULT_LEASE_MS): RefreshJobDecision {
  const nowMs = now.getTime();
  if (!bounded(owner) || !Number.isFinite(nowMs) || !Number.isInteger(leaseMs) || leaseMs < 5_000 || leaseMs > 60 * 60 * 1000) return { ok: false, code: "invalid_input", message: "Worker owner, time, or lease is invalid." };
  const available = isoMs(current.available_at);
  const lease = current.lease_until ? isoMs(current.lease_until) : null;
  if (available === null || !Number.isInteger(current.attempt_count) || current.attempt_count < 0 || current.attempt_count >= current.max_attempts) return { ok: false, code: "invalid_input", message: "Job scheduling metadata is invalid." };
  if (["succeeded", "failed", "cancelled"].includes(current.state)) return { ok: false, code: "not_claimable", message: "Terminal jobs cannot be claimed." };
  if (current.state === "running" && lease !== null && lease > nowMs) return { ok: false, code: "not_claimable", message: "Job is leased by another worker." };
  if (current.state !== "running" && available > nowMs) return { ok: false, code: "not_due", message: "Job is not due yet." };
  const attempt = current.attempt_count + 1;
  if (attempt > current.max_attempts) return { ok: false, code: "not_claimable", message: "Job has exhausted its attempts." };
  const updated: TrackMCPRefreshJob = { ...current, state: "running", attempt_count: attempt, lease_owner: owner, lease_until: new Date(nowMs + leaseMs).toISOString(), updated_at: now.toISOString() };
  return { ok: true, job: updated, changed: true };
}

export function recordRefreshJobResult(current: TrackMCPRefreshJob, result: TrackMCPRefreshJobResult, now = new Date()): RefreshJobDecision {
  if (current.state !== "running") return { ok: false, code: "invalid_transition", message: "Only a running job can record a result." };
  const timestamp = now.toISOString();
  if (result.outcome === "succeeded") return { ok: true, changed: true, job: { ...current, state: "succeeded", lease_owner: null, lease_until: null, last_error_code: null, last_error_detail: null, completed_at: timestamp, updated_at: timestamp } };
  if (result.outcome === "deferred") return { ok: true, changed: true, job: { ...current, state: "queued", available_at: timestamp, lease_owner: null, lease_until: null, last_error_code: null, last_error_detail: errorDetail(result.detail), completed_at: null, updated_at: timestamp } };
  const code = errorCode(result.error_code);
  const detail = errorDetail(result.detail);
  const exhausted = result.outcome === "failed" || current.attempt_count >= current.max_attempts || refreshJobBackoffMs(current.attempt_count) === null;
  if (exhausted) return { ok: true, changed: true, job: { ...current, state: "failed", lease_owner: null, lease_until: null, last_error_code: code, last_error_detail: detail, completed_at: timestamp, updated_at: timestamp } };
  const delay = refreshJobBackoffMs(current.attempt_count)!;
  return { ok: true, changed: true, job: { ...current, state: "retryable", lease_owner: null, lease_until: null, available_at: new Date(now.getTime() + delay).toISOString(), last_error_code: code, last_error_detail: detail, updated_at: timestamp } };
}

/**
 * Lease-fenced result transition for distributed workers. The owner and lease
 * are checked immediately before the write so a slow worker cannot complete a
 * job after another worker has recovered its expired lease.
 */
export function recordRefreshJobResultForOwner(current: TrackMCPRefreshJob, owner: string, result: TrackMCPRefreshJobResult, now = new Date()): RefreshJobDecision {
  if (!bounded(owner) || current.lease_owner !== owner) return { ok: false, code: "invalid_transition", message: "Worker does not own this refresh-job lease." };
  const leaseUntil = current.lease_until ? isoMs(current.lease_until) : null;
  if (leaseUntil === null || leaseUntil <= now.getTime()) return { ok: false, code: "lease_expired", message: "Refresh-job lease expired before the result was recorded." };
  return recordRefreshJobResult(current, result, now);
}

export const TRACKMCP_REFRESH_JOB_LIMITS = { max_attempts: MAX_ATTEMPTS, default_max_attempts: DEFAULT_MAX_ATTEMPTS, max_error_code: MAX_ERROR_CODE, max_error_detail: MAX_ERROR_DETAIL, max_backoff_hours: 12 } as const;
