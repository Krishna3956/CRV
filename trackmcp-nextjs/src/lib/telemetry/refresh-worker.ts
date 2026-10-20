/**
 * Execution boundary for Founder OS refresh jobs.
 *
 * This module deliberately contains no scheduler and no Supabase client. A
 * production adapter must provide an atomic claim operation (implemented by a
 * service-role worker), while handlers remain idempotent and bounded. Keeping
 * the boundary explicit prevents a web request from accidentally becoming a
 * scheduler or leaking worker errors into durable rows.
 */
import {
  recordRefreshJobResultForOwner,
  type TrackMCPRefreshJob,
  type TrackMCPRefreshJobKind,
  type TrackMCPRefreshJobResult,
} from "./refresh-jobs.ts";

export type RefreshJobClaimStore = {
  /** Must atomically claim one due job and return the post-claim row. */
  claimNext(input: { owner: string; now: Date; leaseMs: number }): Promise<TrackMCPRefreshJob | null>;
  /** Persist a lifecycle transition using id + lease owner as a guard. */
  saveResult(input: { previous: TrackMCPRefreshJob; next: TrackMCPRefreshJob }): Promise<void>;
};

export type RefreshJobHandlerContext = {
  job: Readonly<TrackMCPRefreshJob>;
  now: Date;
  signal?: AbortSignal;
};

export type RefreshJobHandler = (context: RefreshJobHandlerContext) =>
  Promise<TrackMCPRefreshJobResult | void>;

export type RefreshJobHandlerRegistry = Partial<Record<TrackMCPRefreshJobKind, RefreshJobHandler>>;

export type RefreshWorkerOptions = {
  store: RefreshJobClaimStore;
  handlers: RefreshJobHandlerRegistry;
  owner: string;
  now?: () => Date;
  leaseMs?: number;
  signal?: AbortSignal;
};

export type RefreshWorkerRunResult =
  | { ok: true; state: "idle" }
  | { ok: true; state: "succeeded" | "retryable" | "failed"; job: TrackMCPRefreshJob }
  | { ok: false; code: "invalid_worker" | "missing_handler" | "claim_failed" | "persist_failed"; message: string };

export type RefreshBatchOptions = {
  /** Maximum number of jobs one external trigger may ask this worker to run. */
  maxJobs?: number;
  /** Maximum wall-clock time for the whole batch, including handler work. */
  maxDurationMs?: number;
  signal?: AbortSignal;
};

export type RefreshBatchResult = {
  processed: number;
  succeeded: number;
  retryable: number;
  failed: number;
  idle: boolean;
  aborted: boolean;
  errors: Array<Extract<RefreshWorkerRunResult, { ok: false }>['code']>;
  /** Maximum queued age observed for a claimed job in this invocation. */
  max_queue_lag_ms: number;
  /** Highest attempt count observed for a claimed job in this invocation. */
  max_attempt_count: number;
  /** Server-side timestamp for interpreting the bounded metrics. */
  observed_at: string;
};

const MAX_HANDLER_DETAIL = 240;
const DEFAULT_LEASE_MS = 5 * 60 * 1000;
const DEFAULT_BATCH_DURATION_MS = 45_000;

function safeError(error: unknown): { code: string; detail: string | undefined } {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "worker_failure";
  // Error details are operational labels only. Never persist URLs, credentials,
  // bearer strings, or multiline stack traces in a refresh-job row.
  const detail = raw
    .replace(/[\r\n]+/g, " ")
    .replace(/(?:bearer\s+|api[_-]?key\s*[:=]\s*|secret\s*[:=]\s*|token\s*[:=]\s*)\S+/gi, "[redacted]")
    .replace(/tmcp_[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/https?:\/\/\S+/gi, "[url]")
    .slice(0, MAX_HANDLER_DETAIL);
  const code = detail.toLowerCase().includes("timeout") ? "handler_timeout" : "handler_failure";
  return { code, detail: detail || undefined };
}

function resultFromHandler(value: TrackMCPRefreshJobResult | void): TrackMCPRefreshJobResult {
  if (!value) return { outcome: "succeeded" };
  if (value.outcome === "succeeded") return value;
  if (value.outcome === "deferred") return value;
  // Handler-provided diagnostics are treated as untrusted, just like thrown
  // errors. Keep the durable lifecycle row limited to safe labels.
  const safe = safeError(`${value.error_code}${value.detail ? `: ${value.detail}` : ""}`);
  return { outcome: value.outcome, error_code: safe.code, detail: safe.detail };
}

/** Run at most one job. The caller controls scheduling and repetition. */
export async function runRefreshJobOnce(options: RefreshWorkerOptions): Promise<RefreshWorkerRunResult> {
  const now = options.now?.() ?? new Date();
  const leaseMs = options.leaseMs ?? DEFAULT_LEASE_MS;
  if (!options.store || !options.handlers || !options.owner || !Number.isInteger(leaseMs) || leaseMs < 5_000 || leaseMs > 60 * 60 * 1000) {
    return { ok: false, code: "invalid_worker", message: "Worker store, owner, handlers, or lease is invalid." };
  }

  let claimed: TrackMCPRefreshJob | null;
  try {
    claimed = await options.store.claimNext({ owner: options.owner, now, leaseMs });
  } catch {
    return { ok: false, code: "claim_failed", message: "Unable to claim refresh work." };
  }
  if (!claimed) return { ok: true, state: "idle" };

  const handler = options.handlers[claimed.kind];
  let result: TrackMCPRefreshJobResult;
  if (!handler) {
    result = { outcome: "failed", error_code: "missing_handler", detail: `No handler registered for ${claimed.kind}` };
  } else {
    try {
      result = resultFromHandler(await handler({ job: claimed, now, signal: options.signal }));
    } catch (error) {
      const safe = safeError(error);
      result = { outcome: "retryable", error_code: safe.code, detail: safe.detail };
    }
  }

  const transition = recordRefreshJobResultForOwner(claimed, options.owner, result, now);
  if (!transition.ok) return { ok: false, code: "persist_failed", message: transition.message };
  try {
    await options.store.saveResult({ previous: claimed, next: transition.job });
  } catch {
    return { ok: false, code: "persist_failed", message: "Unable to persist refresh-job result." };
  }
  return { ok: true, state: transition.job.state as "succeeded" | "retryable" | "failed", job: transition.job };
}

/**
 * Run a bounded batch when invoked by an external scheduler or queue consumer.
 * This function does not create timers, claim unbounded work, or turn a web
 * request into a scheduler. The caller still owns invocation frequency.
 */
export async function runRefreshJobBatch(
  options: RefreshWorkerOptions,
  batch: RefreshBatchOptions = {},
): Promise<RefreshBatchResult> {
  const maxJobs = batch.maxJobs ?? 10;
  const maxDurationMs = batch.maxDurationMs ?? DEFAULT_BATCH_DURATION_MS;
  const observedAt = options.now?.() ?? new Date();
  if (!Number.isInteger(maxJobs) || maxJobs < 1 || maxJobs > 100 || !Number.isInteger(maxDurationMs) || maxDurationMs < 1 || maxDurationMs > 60_000) {
    return { processed: 0, succeeded: 0, retryable: 0, failed: 0, idle: false, aborted: false, errors: ["invalid_worker"], max_queue_lag_ms: 0, max_attempt_count: 0, observed_at: observedAt.toISOString() };
  }
  const summary: RefreshBatchResult = { processed: 0, succeeded: 0, retryable: 0, failed: 0, idle: false, aborted: false, errors: [], max_queue_lag_ms: 0, max_attempt_count: 0, observed_at: observedAt.toISOString() };
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort();
  if (batch.signal?.aborted) controller.abort();
  else batch.signal?.addEventListener("abort", abortFromCaller, { once: true });
  const deadline = setTimeout(() => controller.abort(), maxDurationMs);
  try {
    for (let index = 0; index < maxJobs; index += 1) {
      if (controller.signal.aborted) {
        summary.aborted = true;
        break;
      }
      const result = await runRefreshJobOnce({ ...options, signal: controller.signal });
      if (!result.ok) {
        summary.errors.push(result.code);
        break;
      }
      if (result.state === "idle") {
        summary.idle = true;
        break;
      }
      if (result.job) {
        const createdAt = Date.parse(result.job.created_at);
        if (Number.isFinite(createdAt)) summary.max_queue_lag_ms = Math.max(summary.max_queue_lag_ms, Math.min(86_400_000, Math.max(0, observedAt.getTime() - createdAt)));
        summary.max_attempt_count = Math.max(summary.max_attempt_count, Math.min(8, Math.max(0, result.job.attempt_count)));
      }
      summary.processed += 1;
      summary[result.state] += 1;
      if (controller.signal.aborted) {
        summary.aborted = true;
        break;
      }
    }
  } finally {
    clearTimeout(deadline);
    batch.signal?.removeEventListener("abort", abortFromCaller);
  }
  return summary;
}

/**
 * There is intentionally no default interval scheduler. Deployments should
 * invoke runRefreshJobOnce from an authenticated worker/queue runtime and
 * choose their own trigger (cron, queue delivery, or platform job).
 */
export const REFRESH_WORKER_POLICY = {
  schedulerEnabledByDefault: false,
  maxJobsPerInvocation: 100,
  maxBatchJobs: 100,
  defaultBatchDurationMs: DEFAULT_BATCH_DURATION_MS,
  maxBatchDurationMs: 60_000,
  externalSchedulerRequired: true,
  rawPayloadsPersisted: false,
} as const;
