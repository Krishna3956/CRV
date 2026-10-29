import type { CanonicalTrackMCPEvent } from "./types.ts";
import { projectTrackMCPFact, type TrackMCPFact } from "./facts.ts";
import { persistTrackMCPFacts } from "./fact-writer.ts";
import { evaluateTrackMCPActionQueue, persistTrackMCPActionQueue } from "./action-queue.ts";
import { buildCatalogVersionWrites, type CatalogObservationRow, type ExistingCatalogVersion } from "./catalog-refresh.ts";
import { buildCatalogEntityReadWrites } from "./catalog-entities.ts";
import { buildTaskTransitionWrites, persistTrackMCPTaskTransitions } from "./task-transitions.ts";
import type { RefreshJobHandlerRegistry } from "./refresh-worker.ts";

const MAX_ROWS = 500;
// Keep task_id and payload in the bounded projection: task transition
// projection intentionally hashes the identifier and derives status only from
// this query result. Omitting either field silently turns valid task events
// into ordinary semantic facts with no transition history.
const EVENT_COLUMNS = "event_id,event_type,service,environment,started_at,client_name,client_version,transport,account_key,account_identity_source,account_identity_version,tool_name,duration_ms,payload_size_bytes,retry_number,result_type,interaction_id,interaction_link_source,retry_of_event_id,request_state_hash,input_request_count,input_response_count,resource_audience,resource_priority,is_error,success,error_class,error_code,task_id,payload";
const LEGACY_EVENT_COLUMNS = EVENT_COLUMNS.replace(",account_identity_version", "");

type QueryResult<T> = { data: T[] | null; error: { code?: string; message: string } | null };
type Query = {
  select(columns: string): Query;
  eq(column: string, value: string): Query;
  gte?(column: string, value: string): Query;
  lt?(column: string, value: string): Query;
  order(column: string, options: { ascending: boolean }): Query;
  limit(value: number): PromiseLike<QueryResult<unknown>>;
};
type RefreshAdmin = { from(table: string): Query & { upsert(rows: unknown[], options: { onConflict: string; ignoreDuplicates: boolean }): PromiseLike<{ error: { code?: string; message: string } | null }> } };
type RefreshHandlerOptions = { taskTransitionsEnabled?: boolean };

const REFRESH_WINDOW_MS = 15 * 60 * 1000;

/**
 * Ingest-created jobs carry their 15-minute source window in the dedupe key.
 * Restricting projection reads to that window avoids rescanning the newest 500
 * events for every job. Legacy/manual jobs keep the bounded latest-500 query.
 */
function jobWindow(job: { dedupe_key: string }): { start: string; end: string } | null {
  // Older accepted ingests included a batch fingerprint between the UTC
  // window and job kind. Preserve that source window when replaying those
  // rows; falling back to the latest bounded rows can silently omit an event
  // once a busy workspace has more than MAX_ROWS observations.
  const match = /^ingest-window:(\d+)(?::[a-f0-9]{64})?:[a-z_]+$/i.exec(job.dedupe_key);
  if (!match) return null;
  const window = Number(match[1]);
  if (!Number.isSafeInteger(window) || window < 0) return null;
  const start = new Date(window * REFRESH_WINDOW_MS);
  const end = new Date((window + 1) * REFRESH_WINDOW_MS);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return null;
  return { start: start.toISOString(), end: end.toISOString() };
}

function applyJobWindow(query: Query, job: { dedupe_key: string }, column: string): Query {
  const range = jobWindow(job);
  const gte = query.gte;
  const lt = query.lt;
  if (!range || typeof gte !== "function" || typeof lt !== "function") return query;
  return lt.call(gte.call(query, column, range.start), column, range.end);
}

function isMissingAccountIdentityVersionColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as Record<string, unknown>;
  const text = `${typeof record.code === "string" ? record.code : ""} ${typeof record.message === "string" ? record.message : ""}`.toLowerCase();
  return text.includes("account_identity_version") && (text.includes("column") || text.includes("pgrst204") || text.includes("42703"));
}

async function readProjectionEvents(admin: RefreshAdmin, job: { workspace_id: string; dedupe_key: string }) {
  const read = async (columns: string) => {
    const query = applyJobWindow(admin.from("trackmcp_events").select(columns).eq("workspace_id", job.workspace_id), job, "started_at");
    return query.order("started_at", { ascending: false }).limit(MAX_ROWS);
  };
  const result = await read(EVENT_COLUMNS);
  // The account identity version migration is additive and may lag a rolling
  // deployment. It is optional in the canonical event contract, so preserve
  // projection freshness by using the legacy select while that migration is
  // pending, matching the ingest and analytics compatibility path.
  return result.error && isMissingAccountIdentityVersionColumn(result.error)
    ? read(LEGACY_EVENT_COLUMNS)
    : result;
}

function retryable(error: unknown) {
  const message = error instanceof Error
    ? error.message
    : typeof error === "string"
      ? error
      : error && typeof error === "object"
        ? ["code", "message", "details", "hint"]
          .map((field) => {
            const value = (error as Record<string, unknown>)[field];
            return value === undefined || value === null || value === "" ? null : `${field}=${String(value)}`;
          })
          .filter((value): value is string => Boolean(value))
          .join("; ") || "refresh handler failed"
        : "refresh handler failed";
  const structured = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const databaseCode = typeof structured.code === "string" ? structured.code.toUpperCase() : "";
  const lowerMessage = message.toLowerCase();
  // Keep worker diagnostics useful without persisting provider SQL, table
  // names, URLs, or credentials. These categories are intentionally coarse
  // and bounded; the full error remains redacted by the worker boundary.
  const errorCode = databaseCode === "PGRST205" || databaseCode === "42P01" || /relation .* does not exist|could not find the table/i.test(lowerMessage)
    ? "schema_missing"
    : databaseCode === "23514" || /violates .*check constraint/i.test(lowerMessage)
      ? "constraint_violation"
      : databaseCode === "42P10" || /no unique or exclusion constraint matching/i.test(lowerMessage)
        ? "conflict_target_missing"
        : databaseCode === "23505" || /duplicate key value violates unique constraint/i.test(lowerMessage)
          ? "unique_conflict"
          : /timeout|timed out/i.test(lowerMessage)
            ? "handler_timeout"
            : "handler_failure";
  return { outcome: "retryable" as const, error_code: errorCode, detail: message.slice(0, 200) };
}

function uuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function ensureCatalogServerRegistryRows(admin: RefreshAdmin, workspaceId: string, serverIds: readonly unknown[]) {
  const existing = await admin.from("trackmcp_servers").select("id").eq("workspace_id", workspaceId).limit(MAX_ROWS);
  if (existing.error) return { error: existing.error, owned: new Set<string>() };
  const owned = new Set((existing.data || []).map((row) => (row && typeof row === "object" ? (row as { id?: unknown }).id : null)).filter(uuid));
  const candidates = [...new Set(serverIds.filter(uuid))].filter((serverId) => !owned.has(serverId));
  if (candidates.length) {
    const inserted = await admin.from("trackmcp_servers").upsert(candidates.map((serverId) => ({
      id: serverId,
      workspace_id: workspaceId,
      name: `MCP server ${serverId.slice(0, 8)}`,
      slug: `server-${serverId}`,
    })), { onConflict: "id", ignoreDuplicates: true });
    if (inserted.error) return { error: inserted.error, owned };
    const refreshed = await admin.from("trackmcp_servers").select("id").eq("workspace_id", workspaceId).limit(MAX_ROWS);
    if (refreshed.error) return { error: refreshed.error, owned };
    for (const row of refreshed.data || []) {
      const id = row && typeof row === "object" ? (row as { id?: unknown }).id : null;
      if (uuid(id)) owned.add(id);
    }
  }
  return { error: null, owned };
}

function factsFromRows(rows: unknown[]): TrackMCPFact[] {
  return rows.filter((row): row is CanonicalTrackMCPEvent => Boolean(row && typeof row === "object" && typeof (row as { event_id?: unknown }).event_id === "string"))
    .map((row) => projectTrackMCPFact(row));
}

export function createRefreshJobHandlers(admin: RefreshAdmin, options: RefreshHandlerOptions = {}): RefreshJobHandlerRegistry {
  // The transition-history migration is additive and service-role-only. Keep
  // it enabled by default so explicit task evidence is not silently discarded;
  // operators retain an explicit opt-out for rollback or migration windows.
  const taskTransitionsEnabled = options.taskTransitionsEnabled ?? process.env.TRACKMCP_TASK_TRANSITIONS_ENABLED !== "false";
  return {
    async fact_projection({ job, signal }) {
      if (signal?.aborted) return { outcome: "deferred", detail: "worker deadline deferred this job" };
      try {
        const result = await readProjectionEvents(admin, job);
        if (result.error) return retryable(result.error);
        const facts = factsFromRows(result.data || []);
        const persisted = await persistTrackMCPFacts(admin as never, job.workspace_id, facts);
        if (persisted.error) return retryable(persisted.error);
        if (taskTransitionsEnabled) {
          const transitions = await persistTrackMCPTaskTransitions(admin as never, buildTaskTransitionWrites(job.workspace_id, facts));
          if (transitions.error) return retryable(transitions.error);
        }
        return { outcome: "succeeded" as const };
      } catch (error) {
        return retryable(error);
      }
    },
    async action_queue_refresh({ job, signal }) {
      if (signal?.aborted) return { outcome: "deferred", detail: "worker deadline deferred this job" };
      try {
        const result = await admin.from("trackmcp_semantic_facts").select("source_event_id,fact_version,fact_type,event_type,service,environment,observed_at,semantic,dimensions,measures,error").eq("workspace_id", job.workspace_id).order("observed_at", { ascending: false }).limit(MAX_ROWS);
        if (result.error) return retryable(result.error);
        const facts = (result.data || []) as TrackMCPFact[];
        const persisted = await persistTrackMCPActionQueue(admin as never, evaluateTrackMCPActionQueue(job.workspace_id, facts));
        return persisted.error ? retryable(persisted.error) : { outcome: "succeeded" as const };
      } catch (error) {
        return retryable(error);
      }
    },
    async catalog_recompute({ job, signal }) {
      if (signal?.aborted) return { outcome: "deferred", detail: "worker deadline deferred this job" };
      try {
        const query = applyJobWindow(admin.from("trackmcp_events").select("server_id,environment_id,session_id,protocol_version,catalog_kind,catalog_item_count,catalog_item_name_hashes,catalog_item_uri_hashes,started_at").eq("workspace_id", job.workspace_id), job, "started_at");
        const result = await query.order("started_at", { ascending: false }).limit(MAX_ROWS);
        if (result.error) return retryable(result.error);
        const observations = (result.data || []) as CatalogObservationRow[];
        const registry = await ensureCatalogServerRegistryRows(admin, job.workspace_id, observations.map((observation) => observation.server_id));
        if (registry.error) return retryable(registry.error);
        const ownedObservations = observations.filter((observation) => registry.owned.has(typeof observation.server_id === "string" ? observation.server_id : ""));
        const existing = await admin.from("trackmcp_catalog_versions").select("id,server_id,environment_id,catalog_kind,item_count,item_name_hashes,item_uri_hashes,snapshot_hash,complete,truncated,discovered_at").eq("workspace_id", job.workspace_id).order("discovered_at", { ascending: false }).limit(MAX_ROWS);
        if (existing.error) return retryable(existing.error);
        const writes = buildCatalogVersionWrites(job.workspace_id, ownedObservations, (existing.data || []) as ExistingCatalogVersion[]);
        if (!writes.length) return { outcome: "succeeded" as const };
        const persisted = await admin.from("trackmcp_catalog_versions").upsert(writes, { onConflict: "workspace_id,server_id,environment_id,catalog_kind,snapshot_hash", ignoreDuplicates: true });
        return persisted.error ? retryable(persisted.error) : { outcome: "succeeded" as const };
      } catch (error) {
        return retryable(error);
      }
    },
    async catalog_entity_recompute({ job, signal }) {
      if (signal?.aborted) return { outcome: "deferred", detail: "worker deadline deferred this job" };
      try {
        const query = applyJobWindow(admin.from("trackmcp_events").select("event_id,server_id,environment,catalog_kind,catalog_item_name_hashes,catalog_item_uri_hashes,mcp_method,started_at,success,is_error,result_type").eq("workspace_id", job.workspace_id), job, "started_at");
        const result = await query.order("started_at", { ascending: false }).limit(MAX_ROWS);
        if (result.error) return retryable(result.error);
        const writes = buildCatalogEntityReadWrites(job.workspace_id, (result.data || []) as CatalogObservationRow[]);
        if (!writes.length) return { outcome: "succeeded" as const };
        const persisted = await admin.from("trackmcp_catalog_entity_reads").upsert(writes, { onConflict: "workspace_id,source_event_id,catalog_kind,entity_hash", ignoreDuplicates: true });
        return persisted.error ? retryable(persisted.error) : { outcome: "succeeded" as const };
      } catch (error) {
        return retryable(error);
      }
    },
    async retention_cleanup() {
      return { outcome: "failed" as const, error_code: "approval_required", detail: "retention cleanup requires an approved dry-run batch" };
    },
  };
}
