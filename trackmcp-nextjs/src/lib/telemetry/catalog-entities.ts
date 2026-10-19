import { createHash } from "node:crypto";

const HASH = /^[a-f0-9]{64}$/i;

export type CatalogEntityReadObservation = {
  event_id?: unknown;
  server_id?: unknown;
  environment?: unknown;
  catalog_kind?: unknown;
  catalog_item_name_hashes?: unknown;
  catalog_item_uri_hashes?: unknown;
  mcp_method?: unknown;
  started_at?: unknown;
  success?: unknown;
  is_error?: unknown;
  result_type?: unknown;
};

export type CatalogEntityReadWrite = {
  workspace_id: string;
  source_event_id: string;
  server_id: string | null;
  environment: string | null;
  catalog_kind: "resources" | "prompts";
  entity_hash: string;
  observed_at: string;
  success: boolean | null;
  is_error: boolean | null;
  result_type: string | null;
};

function text(value: unknown, max: number): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
}

function hashes(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && HASH.test(item)).map((item) => item.toLowerCase()).slice(0, 128) : [];
}

function eventHash(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/**
 * Project only single-entity read events. Catalog list snapshots are kept in
 * the version model; this projection is deliberately limited to resources/read
 * and prompts/get so one event cannot manufacture multiple read identities.
 */
export function buildCatalogEntityReadWrites(workspaceId: string, rows: readonly CatalogEntityReadObservation[]): CatalogEntityReadWrite[] {
  const writes: CatalogEntityReadWrite[] = [];
  for (const row of rows) {
    const eventId = text(row.event_id, 128);
    const kind = row.catalog_kind === "resources" || row.catalog_kind === "prompts" ? row.catalog_kind : null;
    const method = row.mcp_method;
    if (!eventId || !kind || (kind === "resources" && method !== "resources/read") || (kind === "prompts" && method !== "prompts/get")) continue;
    const candidates = kind === "resources" ? hashes(row.catalog_item_uri_hashes) : hashes(row.catalog_item_name_hashes);
    if (candidates.length !== 1) continue;
    const observedAt = text(row.started_at, 80);
    if (!observedAt || !Number.isFinite(Date.parse(observedAt))) continue;
    writes.push({
      workspace_id: workspaceId,
      source_event_id: eventId,
      server_id: text(row.server_id, 128),
      environment: text(row.environment, 64),
      catalog_kind: kind,
      entity_hash: candidates[0],
      observed_at: new Date(observedAt).toISOString(),
      success: typeof row.success === "boolean" ? row.success : null,
      is_error: typeof row.is_error === "boolean" ? row.is_error : null,
      result_type: text(row.result_type, 32),
    });
  }
  return writes;
}

export function entityProjectionFingerprint(write: Pick<CatalogEntityReadWrite, "workspace_id" | "source_event_id" | "catalog_kind" | "entity_hash">): string {
  return eventHash(`${write.workspace_id}:${write.source_event_id}:${write.catalog_kind}:${write.entity_hash}`);
}
