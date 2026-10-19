import { createHash } from "node:crypto";
import { diffCatalogSnapshots, normalizeCatalogSnapshot, type CatalogSnapshotContract, type CatalogSnapshotInput } from "./catalog-snapshots.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CatalogObservationRow = {
  server_id?: unknown;
  environment_id?: unknown;
  session_id?: unknown;
  protocol_version?: unknown;
  catalog_kind?: unknown;
  catalog_item_count?: unknown;
  catalog_item_name_hashes?: unknown;
  catalog_item_uri_hashes?: unknown;
  started_at?: unknown;
};

export type CatalogVersionWrite = {
  workspace_id: string;
  server_id: string;
  environment_id: string | null;
  session_id: string | null;
  protocol_version: string | null;
  catalog_kind: "tools" | "resources" | "resource_templates" | "prompts";
  item_count: number;
  item_name_hashes: string[];
  item_uri_hashes: string[];
  snapshot_hash: string;
  previous_snapshot_id: string | null;
  complete: boolean;
  truncated: boolean;
  observation_source: "worker";
  diff: Record<string, unknown>;
  discovered_at: string;
};

export type ExistingCatalogVersion = {
  id?: unknown;
  server_id?: unknown;
  environment_id?: unknown;
  catalog_kind?: unknown;
  item_count?: unknown;
  item_name_hashes?: unknown;
  item_uri_hashes?: unknown;
  snapshot_hash?: unknown;
  complete?: unknown;
  truncated?: unknown;
  discovered_at?: unknown;
};

function text(value: unknown, max: number): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
}

function hashes(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 128) : [];
}

function stableHash(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function keyFor(row: { server_id?: unknown; environment_id?: unknown; catalog_kind?: unknown }): string | null {
  const server = text(row.server_id, 64);
  if (!server || !UUID.test(server)) return null;
  const environment = text(row.environment_id, 64);
  if (environment && !UUID.test(environment)) return null;
  const kind = text(row.catalog_kind, 32);
  return `${server}:${environment || "none"}:${kind || "unknown"}`;
}

function snapshotFromExisting(row: ExistingCatalogVersion): CatalogSnapshotContract | null {
  const hash = text(row.snapshot_hash, 64);
  const kind = text(row.catalog_kind, 32) as CatalogSnapshotInput["catalog_kind"] | null;
  const count = typeof row.item_count === "number" ? row.item_count : Number(row.item_count);
  if (!hash || !/^[a-f0-9]{64}$/i.test(hash) || !kind || !Number.isInteger(count)) return null;
  const normalized = normalizeCatalogSnapshot({
    snapshot_hash: hash,
    catalog_kind: kind,
    item_count: count,
    item_name_hashes: hashes(row.item_name_hashes),
    item_uri_hashes: hashes(row.item_uri_hashes),
    complete: row.complete === true,
    truncated: row.truncated === true,
    observed_at: text(row.discovered_at, 80) || undefined,
  });
  return normalized.ok ? normalized.snapshot : null;
}

/**
 * Turn accepted metadata-only catalog observations into one bounded version
 * row per server/environment/kind. The newest observation wins; malformed
 * identifiers are ignored rather than coerced into foreign keys.
 */
export function buildCatalogVersionWrites(workspaceId: string, rows: readonly CatalogObservationRow[], previousRows: readonly ExistingCatalogVersion[] = [], now = new Date()): CatalogVersionWrite[] {
  const newest = new Map<string, CatalogObservationRow>();
  for (const row of rows) {
    const key = keyFor(row);
    if (!key || newest.has(key)) continue;
    newest.set(key, row);
  }
  const previous = new Map<string, ExistingCatalogVersion>();
  for (const row of previousRows) {
    const key = keyFor(row);
    if (key && !previous.has(key)) previous.set(key, row);
  }
  const writes: CatalogVersionWrite[] = [];
  for (const row of newest.values()) {
    const serverId = text(row.server_id, 64);
    const kind = text(row.catalog_kind, 32) as CatalogSnapshotInput["catalog_kind"] | null;
    const itemCount = typeof row.catalog_item_count === "number" ? row.catalog_item_count : Number(row.catalog_item_count);
    if (!serverId || !kind || !Number.isInteger(itemCount) || !Number.isFinite(itemCount)) continue;
    const nameHashes = hashes(row.catalog_item_name_hashes);
    const uriHashes = hashes(row.catalog_item_uri_hashes);
    const truncated = itemCount > 128 || nameHashes.length >= 128 || uriHashes.length >= 128;
    const normalized = normalizeCatalogSnapshot({
      snapshot_hash: stableHash({ kind, itemCount, nameHashes, uriHashes }),
      catalog_kind: kind,
      item_count: itemCount,
      item_name_hashes: nameHashes,
      item_uri_hashes: uriHashes,
      complete: !truncated,
      truncated,
      observed_at: text(row.started_at, 80) || now.toISOString(),
    });
    if (!normalized.ok) continue;
    const previousRow = previous.get(keyFor(row) || "");
    const previousSnapshot = previousRow ? snapshotFromExisting(previousRow) : null;
    const snapshotDiff = diffCatalogSnapshots(previousSnapshot, normalized.snapshot);
    const isDuplicate = previousSnapshot?.snapshot_hash === normalized.snapshot.snapshot_hash;
    writes.push({
      workspace_id: workspaceId,
      server_id: serverId,
      environment_id: text(row.environment_id, 64),
      session_id: text(row.session_id, 256),
      protocol_version: text(row.protocol_version, 128),
      catalog_kind: normalized.snapshot.catalog_kind,
      item_count: normalized.snapshot.item_count,
      item_name_hashes: normalized.snapshot.item_name_hashes,
      item_uri_hashes: normalized.snapshot.item_uri_hashes,
      snapshot_hash: normalized.snapshot.snapshot_hash,
      previous_snapshot_id: !isDuplicate && typeof previousRow?.id === "string" ? previousRow.id : null,
      complete: normalized.snapshot.complete,
      truncated: normalized.snapshot.truncated,
      observation_source: "worker",
      diff: isDuplicate ? { status: "unchanged" } : {
        status: snapshotDiff.comparable ? "computed" : "not_comparable",
        changed: snapshotDiff.changed,
        added_name_count: snapshotDiff.added_name_count,
        removed_name_count: snapshotDiff.removed_name_count,
        added_uri_count: snapshotDiff.added_uri_count,
        removed_uri_count: snapshotDiff.removed_uri_count,
        added_name_hashes: snapshotDiff.added_name_hashes,
        removed_name_hashes: snapshotDiff.removed_name_hashes,
        added_uri_hashes: snapshotDiff.added_uri_hashes,
        removed_uri_hashes: snapshotDiff.removed_uri_hashes,
        bounded: snapshotDiff.bounded,
      },
      discovered_at: normalized.snapshot.observed_at || now.toISOString(),
    });
  }
  return writes;
}
