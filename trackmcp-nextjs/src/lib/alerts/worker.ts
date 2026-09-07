import { randomUUID } from "node:crypto";
import { evaluateAlertConfiguration } from "./evaluator.ts";
import { MAX_ALERT_RUN_ERROR_BYTES, MAX_ACTIVE_ALERT_CONFIGS, MAX_PENDING_DELIVERIES, MAX_DELIVERY_ATTEMPTS, WORKER_LOCK_LEASE_MS, WORKER_TIMEOUT_MS, isRegressionMetric } from "./policy.ts";
import { markIncidentDelivered } from "./persistence.ts";
import { POLICY_VERSION, regressionWindows } from "../telemetry/regressions.ts";
import { sendSignedWebhook, shouldRetry, retryDelayMs, type WebhookDeliveryResult } from "./delivery.ts";
import type { AlertConfiguration, AlertIncident } from "./types.ts";
import { environmentSecretProvider, type AlertSecretProvider } from "./secrets.ts";

const CONFIG_COLUMNS = "id, workspace_id, metric, tool_name, environment, destination_ids, policy_version, enabled, paused, created_at, updated_at";
const DESTINATION_COLUMNS = "id, workspace_id, kind, endpoint_url, secret_ref, enabled, revoked_at";
const RUN_COLUMNS = "id, lock_key, evaluation_key, state, config_count, incident_count, error_code, started_at, finished_at";

type WorkerQuery = {
  select: (columns: string) => WorkerQuery;
  eq: (field: string, value: unknown) => WorkerQuery;
  in: (field: string, values: string[]) => WorkerQuery;
  lte: (field: string, value: string) => WorkerQuery;
  order: (field: string, options: { ascending: boolean }) => WorkerQuery;
  limit: (value: number) => Promise<{ data: unknown[] | null; error: unknown }>;
  insert: (row: Record<string, unknown>) => WorkerQuery;
  update: (row: Record<string, unknown>) => WorkerQuery;
  upsert: (row: Record<string, unknown>, options: { onConflict: string; ignoreDuplicates: boolean }) => WorkerQuery;
  maybeSingle: () => Promise<{ data: unknown; error: { code?: string } | unknown }>;
  single: () => Promise<{ data: unknown; error: { code?: string } | unknown }>;
};

export type AlertWorkerAdmin = {
  from: (table: string) => WorkerQuery;
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
};

type WorkerConfiguration = AlertConfiguration;
type Destination = { id: string; workspace_id: string; kind: string; endpoint_url: string | null; secret_ref: string; enabled: boolean; revoked_at: string | null };

export type AlertWorkerResult = {
  state: "succeeded" | "failed" | "timed_out";
  configurations: number;
  incidents: number;
  deliveries: number;
  skipped: number;
  error_code: string | null;
};

function boundedErrorCode(error: unknown): string {
  const value = error instanceof Error ? error.name : "worker_failure";
  return value.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, MAX_ALERT_RUN_ERROR_BYTES) || "worker_failure";
}

function configurationFromRow(row: Record<string, unknown>): WorkerConfiguration | null {
  if (typeof row.id !== "string" || typeof row.workspace_id !== "string" || !isRegressionMetric(row.metric)) return null;
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    metric: row.metric,
    tool_name: typeof row.tool_name === "string" ? row.tool_name : null,
    environment: typeof row.environment === "string" ? row.environment : null,
    destination_ids: Array.isArray(row.destination_ids) ? row.destination_ids.filter((id): id is string => typeof id === "string").slice(0, 10) : [],
    policy_version: typeof row.policy_version === "string" ? row.policy_version : "",
    enabled: row.enabled === true,
    paused: row.paused === true,
    created_at: String(row.created_at || ""),
    updated_at: String(row.updated_at || ""),
  };
}

function invalidIncident(configuration: WorkerConfiguration, reason: "invalid_policy" | "invalid_destination", now: Date): Record<string, unknown> {
  const windows = regressionWindows(now);
  const evaluationKey = [configuration.id, windows.comparison.end, POLICY_VERSION].join("|");
  return {
    workspace_id: configuration.workspace_id,
    alert_id: configuration.id,
    identity: [configuration.workspace_id, configuration.id, configuration.metric, configuration.tool_name || "*", configuration.environment || "*"].join("|"),
    evaluation_key: evaluationKey,
    metric: configuration.metric,
    state: "invalid_configuration",
    severity: null,
    tool_name: configuration.tool_name,
    environment: configuration.environment,
    data_status: "insufficient_data",
    baseline: null,
    comparison: null,
    threshold: {},
    reasons: [reason],
    evidence: {},
    first_seen_at: now.toISOString(),
    last_seen_at: now.toISOString(),
    revision: 1,
    updated_at: now.toISOString(),
  };
}

async function persistInvalid(admin: AlertWorkerAdmin, configuration: WorkerConfiguration, reason: "invalid_policy" | "invalid_destination", now: Date): Promise<AlertIncident | null> {
  const result = await admin.from("trackmcp_alert_incidents").upsert(invalidIncident(configuration, reason, now), { onConflict: "workspace_id,evaluation_key", ignoreDuplicates: false }).select("id, workspace_id, alert_id, identity, metric, state, severity, tool_name, environment, data_status, baseline, comparison, threshold, reasons, evidence, first_seen_at, last_seen_at, acknowledged_at, resolved_at, suppressed_reason, recovery, revision").single();
  return result.error ? null : result.data as AlertIncident | null;
}

function destinationUsable(value: unknown, workspaceId: string): value is Destination {
  const row = value as Record<string, unknown>;
  return typeof row.id === "string" && row.workspace_id === workspaceId && row.kind === "webhook" && typeof row.endpoint_url === "string" && typeof row.secret_ref === "string" && row.enabled === true && row.revoked_at === null;
}

async function reloadDestination(admin: AlertWorkerAdmin, workspaceId: string, destinationId: string): Promise<Destination | null> {
  const result = await admin.from("trackmcp_alert_destinations").select(DESTINATION_COLUMNS).eq("workspace_id", workspaceId).eq("id", destinationId).maybeSingle();
  return result.error || !result.data || !destinationUsable(result.data, workspaceId) ? null : result.data as Destination;
}

type DestinationValidator = (url: string) => Promise<{ ok: true; url: string } | { ok: false; reason: string }>;

async function recordDelivery(admin: AlertWorkerAdmin, workspaceId: string, incident: AlertIncident, destination: Destination, attemptNumber: number, secretProvider: AlertSecretProvider, now: Date, fetchImpl?: typeof fetch, validateDestination?: DestinationValidator): Promise<{ delivered: boolean; attempted: boolean }> {
  const latest = await reloadDestination(admin, workspaceId, destination.id);
  if (!latest) return { delivered: false, attempted: false };
  destination = latest;
  const evaluationBoundary = incident.comparison?.window.end || incident.last_seen_at;
  const idempotencyKey = `${incident.id}:${evaluationBoundary}:${incident.state}:${destination.id}`.slice(0, 512);
  const claim = await admin.from("trackmcp_alert_deliveries").insert({ workspace_id: workspaceId, incident_id: incident.id, destination_id: destination.id, idempotency_key: idempotencyKey, state: "in_flight", attempt_number: attemptNumber, started_at: now.toISOString() }).select("id").maybeSingle();
  if (claim.error) {
    if ((claim.error as { code?: string }).code === "23505") return { delivered: false, attempted: false };
    return { delivered: false, attempted: true };
  }
  if (!claim.data) return { delivered: false, attempted: true };
  const secret = await secretProvider(destination.secret_ref);
  const finalDestination = await reloadDestination(admin, workspaceId, destination.id);
  if (!finalDestination || finalDestination.endpoint_url !== destination.endpoint_url || finalDestination.secret_ref !== destination.secret_ref) {
    await admin.from("trackmcp_alert_deliveries").update({ state: "permanent_failure", error_code: "destination_changed", finished_at: new Date().toISOString() }).eq("workspace_id", workspaceId).eq("id", (claim.data as { id: string }).id).select("id").maybeSingle();
    return { delivered: false, attempted: true };
  }
  const result: WebhookDeliveryResult = secret
    ? await sendSignedWebhook({ url: finalDestination.endpoint_url!, secret, incident, idempotencyKey, fetchImpl, validateDestination })
    : { state: "redacted_failure", http_status: null, error_code: "secret_unavailable" };
  const nextAttemptAt = shouldRetry(result, attemptNumber) && retryDelayMs(attemptNumber) !== null ? new Date(now.getTime() + retryDelayMs(attemptNumber)!).toISOString() : null;
  await admin.from("trackmcp_alert_deliveries").update({ state: result.state, http_status: result.http_status, error_code: result.error_code, finished_at: new Date().toISOString(), next_attempt_at: nextAttemptAt }).eq("workspace_id", workspaceId).eq("id", (claim.data as { id: string }).id).select("id").maybeSingle();
  return { delivered: result.state === "delivered", attempted: true };
}

async function processPendingDeliveries(admin: AlertWorkerAdmin, secretProvider: AlertSecretProvider, now: Date, deadline: number, fetchImpl?: typeof fetch, validateDestination?: DestinationValidator): Promise<number> {
  const pending = await admin.from("trackmcp_alert_deliveries").select("id, workspace_id, incident_id, destination_id, state, attempt_number, idempotency_key, next_attempt_at").eq("state", "retryable_failure").lte("next_attempt_at", now.toISOString()).order("next_attempt_at", { ascending: true }).limit(MAX_PENDING_DELIVERIES);
  if (pending.error || !Array.isArray(pending.data)) return 0;
  let delivered = 0;
  for (const raw of pending.data as Record<string, unknown>[]) {
    if (Date.now() >= deadline) break;
    const attempt = Number(raw.attempt_number || 1) + 1;
    if (attempt > MAX_DELIVERY_ATTEMPTS) continue;
    const incidentResult = await admin.from("trackmcp_alert_incidents").select("id, workspace_id, alert_id, identity, metric, state, severity, tool_name, environment, data_status, baseline, comparison, threshold, reasons, evidence, first_seen_at, last_seen_at, acknowledged_at, resolved_at, suppressed_reason, recovery, revision").eq("workspace_id", String(raw.workspace_id)).eq("id", String(raw.incident_id)).maybeSingle();
    const destinationResult = await admin.from("trackmcp_alert_destinations").select(DESTINATION_COLUMNS).eq("workspace_id", String(raw.workspace_id)).eq("id", String(raw.destination_id)).maybeSingle();
    if (incidentResult.error || destinationResult.error || !incidentResult.data || !destinationUsable(destinationResult.data, String(raw.workspace_id))) continue;
    const claim = await admin.from("trackmcp_alert_deliveries").update({ state: "in_flight", attempt_number: attempt, started_at: now.toISOString() }).eq("workspace_id", String(raw.workspace_id)).eq("id", String(raw.id)).eq("state", "retryable_failure").select("id").maybeSingle();
    if (claim.error || !claim.data) continue;
    const incident = incidentResult.data as AlertIncident;
    const destination = destinationResult.data as Destination;
    const secret = await secretProvider(destination.secret_ref);
    const finalDestination = await reloadDestination(admin, String(raw.workspace_id), String(raw.destination_id));
    if (!finalDestination || finalDestination.endpoint_url !== destination.endpoint_url || finalDestination.secret_ref !== destination.secret_ref) {
      await admin.from("trackmcp_alert_deliveries").update({ state: "permanent_failure", error_code: "destination_changed", finished_at: new Date().toISOString() }).eq("workspace_id", String(raw.workspace_id)).eq("id", String(raw.id)).select("id").maybeSingle();
      continue;
    }
    const result = secret ? await sendSignedWebhook({ url: finalDestination.endpoint_url!, secret, incident, idempotencyKey: String(raw.idempotency_key), fetchImpl, validateDestination }) : { state: "redacted_failure" as const, http_status: null, error_code: "secret_unavailable" };
    const nextAttemptAt = shouldRetry(result, attempt) && retryDelayMs(attempt) !== null ? new Date(now.getTime() + retryDelayMs(attempt)!).toISOString() : null;
    await admin.from("trackmcp_alert_deliveries").update({ state: result.state, http_status: result.http_status, error_code: result.error_code, finished_at: new Date().toISOString(), next_attempt_at: nextAttemptAt }).eq("workspace_id", String(raw.workspace_id)).eq("id", String(raw.id)).select("id").maybeSingle();
    if (result.state === "delivered") delivered += 1;
  }
  return delivered;
}

export async function runAlertsWorker(admin: AlertWorkerAdmin, options: { now?: Date; ownerId?: string; secretProvider?: AlertSecretProvider; maxDurationMs?: number; fetchImpl?: typeof fetch; validateDestination?: DestinationValidator } = {}): Promise<AlertWorkerResult> {
  const now = options.now || new Date();
  const deadline = Date.now() + Math.min(options.maxDurationMs || WORKER_TIMEOUT_MS, WORKER_TIMEOUT_MS);
  const ownerId = options.ownerId || randomUUID();
  const secretProvider = options.secretProvider || environmentSecretProvider();
  const configsResult = await admin.from("trackmcp_alert_configs").select(CONFIG_COLUMNS).eq("enabled", true).eq("paused", false).order("created_at", { ascending: true }).limit(MAX_ACTIVE_ALERT_CONFIGS + 1);
  if (configsResult.error || !Array.isArray(configsResult.data)) return { state: "failed", configurations: 0, incidents: 0, deliveries: 0, skipped: 0, error_code: "configuration_query_failed" };
  const rows = configsResult.data as Record<string, unknown>[];
  if (rows.length > MAX_ACTIVE_ALERT_CONFIGS) return { state: "failed", configurations: 0, incidents: 0, deliveries: 0, skipped: 0, error_code: "configuration_limit_exceeded" };
  let incidents = 0;
  let deliveries = await processPendingDeliveries(admin, secretProvider, now, deadline, options.fetchImpl, options.validateDestination);
  let skipped = 0;
  for (const row of rows) {
    if (Date.now() >= deadline) return { state: "timed_out", configurations: rows.length, incidents, deliveries, skipped, error_code: "worker_timeout" };
    const configuration = configurationFromRow(row);
    if (!configuration) { skipped += 1; continue; }
    const windows = regressionWindows(now);
    const lockKey = `${configuration.workspace_id}:${configuration.id}`;
    const evaluationKey = `${configuration.id}:${windows.comparison.end}:${POLICY_VERSION}`;
    const claim = await admin.rpc("trackmcp_claim_alert_evaluation", { p_lock_key: lockKey, p_owner_id: ownerId, p_now: now.toISOString(), p_lease_until: new Date(now.getTime() + WORKER_LOCK_LEASE_MS).toISOString() });
    if (claim.error || claim.data !== true) { skipped += 1; continue; }
    try {
      await admin.from("trackmcp_alert_evaluation_runs").insert({ lock_key: lockKey, evaluation_key: evaluationKey, state: "started", config_count: 1, incident_count: 0, started_at: now.toISOString() }).select(RUN_COLUMNS).maybeSingle();
      const destinationResult = configuration.destination_ids.length
        ? await admin.from("trackmcp_alert_destinations").select(DESTINATION_COLUMNS).eq("workspace_id", configuration.workspace_id).in("id", configuration.destination_ids).limit(configuration.destination_ids.length)
        : { data: [], error: null };
      const destinations = Array.isArray(destinationResult.data) ? destinationResult.data.filter((value) => destinationUsable(value, configuration.workspace_id)) as Destination[] : [];
      const valid = configuration.policy_version === POLICY_VERSION && destinationResult.error === null && destinations.length === configuration.destination_ids.length;
      if (!valid) {
        const incident = await persistInvalid(admin, configuration, configuration.policy_version === POLICY_VERSION ? "invalid_destination" : "invalid_policy", now);
        if (incident) incidents += 1;
        await admin.from("trackmcp_alert_evaluation_runs").update({ state: "succeeded", incident_count: incident ? 1 : 0, finished_at: new Date().toISOString() }).eq("lock_key", lockKey).eq("evaluation_key", evaluationKey).select("id").maybeSingle();
        continue;
      }
      const evaluation = await evaluateAlertConfiguration(admin as unknown as Parameters<typeof evaluateAlertConfiguration>[0], configuration, now);
      if (evaluation.error) throw evaluation.error;
      incidents += evaluation.incidents.length;
      for (const evaluated of evaluation.evaluations) {
        const persisted = evaluated.incident;
        if (!evaluated.delivery_due) continue;
        for (const destination of destinations) {
          const attempt = await recordDelivery(admin, configuration.workspace_id, persisted, destination, 1, secretProvider, now, options.fetchImpl, options.validateDestination);
          if (attempt.delivered) {
            deliveries += 1;
            await markIncidentDelivered(admin as unknown as Parameters<typeof markIncidentDelivered>[0], configuration.workspace_id, persisted.id, new Date().toISOString());
          }
        }
      }
      await admin.from("trackmcp_alert_evaluation_runs").update({ state: "succeeded", incident_count: evaluation.incidents.length, finished_at: new Date().toISOString() }).eq("lock_key", lockKey).eq("evaluation_key", evaluationKey).select("id").maybeSingle();
    } catch (error) {
      await admin.from("trackmcp_alert_evaluation_runs").update({ state: "failed", error_code: boundedErrorCode(error), finished_at: new Date().toISOString() }).eq("lock_key", lockKey).eq("evaluation_key", evaluationKey).select("id").maybeSingle();
    } finally {
      await admin.rpc("trackmcp_release_alert_evaluation", { p_lock_key: lockKey, p_owner_id: ownerId, p_now: new Date().toISOString() });
    }
  }
  return { state: "succeeded", configurations: rows.length, incidents, deliveries, skipped, error_code: null };
}
