import type { CanonicalTrackMCPEvent } from "./types.ts";
import { projectTrackMCPFact, type TrackMCPFact } from "./facts.ts";
import { persistTrackMCPFacts } from "./fact-writer.ts";
import { evaluateTrackMCPActionQueue, persistTrackMCPActionQueue } from "./action-queue.ts";
import { buildCatalogVersionWrites, type CatalogObservationRow, type ExistingCatalogVersion } from "./catalog-refresh.ts";
import { buildCatalogEntityReadWrites } from "./catalog-entities.ts";
import { buildTaskTransitionWrites, persistTrackMCPTaskTransitions } from "./task-transitions.ts";
import type { RefreshJobHandlerRegistry } from "./refresh-worker.ts";

const MAX_ROWS = 500;
const EVENT_COLUMNS = "event_id,event_type,service,environment,started_at,client_name,client_version,transport,account_key,account_identity_source,tool_name,duration_ms,payload_size_bytes,retry_number,result_type,interaction_id,input_request_count,input_response_count,resource_audience,resource_priority,is_error,success,error_class,error_code";

type QueryResult<T> = { data: T[] | null; error: { code?: string; message: string } | null };
type Query = { select(columns: string): Query; eq(column: string, value: string): Query; order(column: string, options: { ascending: boolean }): Query; limit(value: number): PromiseLike<QueryResult<unknown>> };
type RefreshAdmin = { from(table: string): Query & { upsert(rows: unknown[], options: { onConflict: string; ignoreDuplicates: boolean }): PromiseLike<{ error: { code?: string; message: string } | null }> } };
type RefreshHandlerOptions = { taskTransitionsEnabled?: boolean };

function retryable(error: unknown) {
  const message = error instanceof Error ? error.message : "refresh handler failed";
  return { outcome: "retryable" as const, error_code: "handler_failure", detail: message.slice(0, 200) };
}

function factsFromRows(rows: unknown[]): TrackMCPFact[] {
  return rows.filter((row): row is CanonicalTrackMCPEvent => Boolean(row && typeof row === "object" && typeof (row as { event_id?: unknown }).event_id === "string"))
    .map((row) => projectTrackMCPFact(row));
}

export function createRefreshJobHandlers(admin: RefreshAdmin, options: RefreshHandlerOptions = {}): RefreshJobHandlerRegistry {
  const taskTransitionsEnabled = options.taskTransitionsEnabled ?? process.env.TRACKMCP_TASK_TRANSITIONS_ENABLED === "true";
  return {
    async fact_projection({ job, signal }) {
      if (signal?.aborted) return { outcome: "retryable", error_code: "cancelled", detail: "worker was cancelled" };
      try {
        const result = await admin.from("trackmcp_events").select(EVENT_COLUMNS).eq("workspace_id", job.workspace_id).order("started_at", { ascending: false }).limit(MAX_ROWS);
        if (result.error) return retryable(result.error.message);
        const facts = factsFromRows(result.data || []);
        const persisted = await persistTrackMCPFacts(admin as never, job.workspace_id, facts);
        if (persisted.error) return retryable(persisted.error.message);
        if (taskTransitionsEnabled) {
          const transitions = await persistTrackMCPTaskTransitions(admin as never, buildTaskTransitionWrites(job.workspace_id, facts));
          if (transitions.error) return retryable(transitions.error.message);
        }
        return { outcome: "succeeded" as const };
      } catch (error) {
        return retryable(error);
      }
    },
    async action_queue_refresh({ job, signal }) {
      if (signal?.aborted) return { outcome: "retryable", error_code: "cancelled", detail: "worker was cancelled" };
      try {
        const result = await admin.from("trackmcp_semantic_facts").select("source_event_id,fact_version,fact_type,event_type,service,environment,observed_at,semantic,dimensions,measures,error").eq("workspace_id", job.workspace_id).order("observed_at", { ascending: false }).limit(MAX_ROWS);
        if (result.error) return retryable(result.error.message);
        const facts = (result.data || []) as TrackMCPFact[];
        const persisted = await persistTrackMCPActionQueue(admin as never, evaluateTrackMCPActionQueue(job.workspace_id, facts));
        return persisted.error ? retryable(persisted.error.message) : { outcome: "succeeded" as const };
      } catch (error) {
        return retryable(error);
      }
    },
    async catalog_recompute({ job, signal }) {
      if (signal?.aborted) return { outcome: "retryable", error_code: "cancelled", detail: "worker was cancelled" };
      try {
        const result = await admin.from("trackmcp_events").select("server_id,environment_id,session_id,protocol_version,catalog_kind,catalog_item_count,catalog_item_name_hashes,catalog_item_uri_hashes,started_at").eq("workspace_id", job.workspace_id).order("started_at", { ascending: false }).limit(MAX_ROWS);
        if (result.error) return retryable(result.error.message);
        const observations = (result.data || []) as CatalogObservationRow[];
        const existing = await admin.from("trackmcp_catalog_versions").select("id,server_id,environment_id,catalog_kind,item_count,item_name_hashes,item_uri_hashes,snapshot_hash,complete,truncated,discovered_at").eq("workspace_id", job.workspace_id).order("discovered_at", { ascending: false }).limit(MAX_ROWS);
        if (existing.error) return retryable(existing.error.message);
        const writes = buildCatalogVersionWrites(job.workspace_id, observations, (existing.data || []) as ExistingCatalogVersion[]);
        if (!writes.length) return { outcome: "succeeded" as const };
        const persisted = await admin.from("trackmcp_catalog_versions").upsert(writes, { onConflict: "workspace_id,server_id,environment_id,catalog_kind,snapshot_hash", ignoreDuplicates: true });
        return persisted.error ? retryable(persisted.error.message) : { outcome: "succeeded" as const };
      } catch (error) {
        return retryable(error);
      }
    },
    async catalog_entity_recompute({ job, signal }) {
      if (signal?.aborted) return { outcome: "retryable", error_code: "cancelled", detail: "worker was cancelled" };
      try {
        const result = await admin.from("trackmcp_events").select("event_id,server_id,environment,catalog_kind,catalog_item_name_hashes,catalog_item_uri_hashes,mcp_method,started_at,success,is_error,result_type").eq("workspace_id", job.workspace_id).order("started_at", { ascending: false }).limit(MAX_ROWS);
        if (result.error) return retryable(result.error.message);
        const writes = buildCatalogEntityReadWrites(job.workspace_id, (result.data || []) as CatalogObservationRow[]);
        if (!writes.length) return { outcome: "succeeded" as const };
        const persisted = await admin.from("trackmcp_catalog_entity_reads").upsert(writes, { onConflict: "workspace_id,source_event_id,catalog_kind,entity_hash", ignoreDuplicates: true });
        return persisted.error ? retryable(persisted.error.message) : { outcome: "succeeded" as const };
      } catch (error) {
        return retryable(error);
      }
    },
    async retention_cleanup() {
      return { outcome: "failed" as const, error_code: "approval_required", detail: "retention cleanup requires an approved dry-run batch" };
    },
  };
}
