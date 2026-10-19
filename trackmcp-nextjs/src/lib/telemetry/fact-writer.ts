import type { TrackMCPFact } from "./facts.ts";

/** The exact bounded row written to trackmcp_semantic_facts. */
export type TrackMCPSemanticFactRow = {
  workspace_id: string;
  source_event_id: string;
  fact_version: TrackMCPFact["fact_version"];
  fact_type: TrackMCPFact["fact_type"];
  event_type: TrackMCPFact["event_type"];
  service: string;
  environment: string;
  observed_at: string;
  semantic: TrackMCPFact["semantic"];
  dimensions: TrackMCPFact["dimensions"];
  measures: TrackMCPFact["measures"];
  error: TrackMCPFact["error"] | null;
};

export function toSemanticFactRow(workspaceId: string, fact: TrackMCPFact): TrackMCPSemanticFactRow {
  return {
    workspace_id: workspaceId,
    source_event_id: fact.source_event_id,
    fact_version: fact.fact_version,
    fact_type: fact.fact_type,
    event_type: fact.event_type,
    service: fact.service,
    environment: fact.environment,
    observed_at: fact.observed_at,
    semantic: fact.semantic,
    dimensions: fact.dimensions,
    measures: fact.measures,
    error: fact.error ?? null,
  };
}

type UpsertResult = { error: { code?: string; message: string } | null };
type FactWriterClient = {
  from(table: "trackmcp_semantic_facts"): {
    upsert(rows: TrackMCPSemanticFactRow[], options: { onConflict: string; ignoreDuplicates: boolean }): PromiseLike<UpsertResult>;
  };
};

/**
 * Persist facts only after the event write succeeds. This boundary deliberately
 * accepts projected facts rather than events, making it impossible for raw
 * payloads/request IDs/correlation handles to enter the read model.
 */
export async function persistTrackMCPFacts(client: FactWriterClient, workspaceId: string, facts: readonly TrackMCPFact[]) {
  if (!facts.length) return { attempted: 0, error: null };
  const rows = facts.map((fact) => toSemanticFactRow(workspaceId, fact));
  const result = await client.from("trackmcp_semantic_facts").upsert(rows, {
    onConflict: "workspace_id,source_event_id,fact_version",
    ignoreDuplicates: false,
  });
  return { attempted: rows.length, error: result.error };
}

