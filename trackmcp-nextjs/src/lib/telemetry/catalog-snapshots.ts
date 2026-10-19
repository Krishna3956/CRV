/**
 * Privacy-safe catalog snapshot/version semantics.
 *
 * Snapshots contain one-way identifier hashes only.  This module deliberately
 * does not accept raw names or URIs: SDKs hash before they reach the event
 * boundary and read models compare the bounded hash sets here.
 */

export const CATALOG_SNAPSHOT_MAX_HASHES = 128;
export const CATALOG_SNAPSHOT_MAX_DIFF_HASHES = 64;
export const CATALOG_SNAPSHOT_MAX_COUNT = 1_000_000;

export type CatalogSnapshotInput = {
  snapshot_hash: string;
  catalog_kind: "tools" | "resources" | "resource_templates" | "prompts";
  item_count: number;
  item_name_hashes?: readonly string[];
  item_uri_hashes?: readonly string[];
  complete?: boolean;
  truncated?: boolean;
  observed_at?: string;
};

export type CatalogSnapshotDiff = {
  changed: boolean;
  added_name_hashes: string[];
  removed_name_hashes: string[];
  added_uri_hashes: string[];
  removed_uri_hashes: string[];
  added_name_count: number;
  removed_name_count: number;
  added_uri_count: number;
  removed_uri_count: number;
  bounded: boolean;
  comparable: boolean;
};

export type CatalogSnapshotContract = {
  snapshot_hash: string;
  catalog_kind: CatalogSnapshotInput["catalog_kind"];
  item_count: number;
  item_name_hashes: string[];
  item_uri_hashes: string[];
  complete: boolean;
  truncated: boolean;
  observed_at: string | null;
};

const HASH = /^[a-f0-9]{64}$/i;
const SNAPSHOT_HASH = /^[a-f0-9]{64}$/i;
const KINDS = new Set<CatalogSnapshotInput["catalog_kind"]>(["tools", "resources", "resource_templates", "prompts"]);

function hashes(values: readonly string[] | undefined): string[] {
  return [...new Set((values || []).filter((value) => HASH.test(value)).map((value) => value.toLowerCase()))].slice(0, CATALOG_SNAPSHOT_MAX_HASHES).sort();
}

function validCount(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= CATALOG_SNAPSHOT_MAX_COUNT;
}

export function normalizeCatalogSnapshot(input: CatalogSnapshotInput): { ok: true; snapshot: CatalogSnapshotContract } | { ok: false; reason: string } {
  if (!SNAPSHOT_HASH.test(input.snapshot_hash)) return { ok: false, reason: "snapshot_hash must be a SHA-256 hex digest" };
  if (!KINDS.has(input.catalog_kind)) return { ok: false, reason: "catalog_kind is unsupported" };
  if (!validCount(input.item_count)) return { ok: false, reason: "item_count is outside the bounded range" };
  const complete = input.complete === true && input.truncated !== true;
  const truncated = input.truncated === true;
  if (complete && input.item_count > CATALOG_SNAPSHOT_MAX_HASHES && hashes(input.item_name_hashes).length < CATALOG_SNAPSHOT_MAX_HASHES) {
    return { ok: false, reason: "complete snapshots above the hash bound require a bounded hash prefix" };
  }
  return {
    ok: true,
    snapshot: {
      snapshot_hash: input.snapshot_hash.toLowerCase(),
      catalog_kind: input.catalog_kind,
      item_count: input.item_count,
      item_name_hashes: hashes(input.item_name_hashes),
      item_uri_hashes: hashes(input.item_uri_hashes),
      complete,
      truncated,
      observed_at: input.observed_at && Number.isFinite(Date.parse(input.observed_at)) ? new Date(input.observed_at).toISOString() : null,
    },
  };
}

function diffSet(before: readonly string[], after: readonly string[]) {
  const left = new Set(before);
  const right = new Set(after);
  const added = [...right].filter((value) => !left.has(value)).sort();
  const removed = [...left].filter((value) => !right.has(value)).sort();
  return { added, removed };
}

/**
 * Compare only when both snapshots are complete and of the same catalog kind.
 * A truncated or missing hash prefix must never be presented as a deletion.
 */
export function diffCatalogSnapshots(before: CatalogSnapshotContract | null, after: CatalogSnapshotContract): CatalogSnapshotDiff {
  const comparable = Boolean(before && before.catalog_kind === after.catalog_kind && before.complete && after.complete && !before.truncated && !after.truncated);
  if (!comparable || !before) {
    return { changed: Boolean(before && before.snapshot_hash !== after.snapshot_hash), added_name_hashes: [], removed_name_hashes: [], added_uri_hashes: [], removed_uri_hashes: [], added_name_count: 0, removed_name_count: 0, added_uri_count: 0, removed_uri_count: 0, bounded: true, comparable: false };
  }
  const names = diffSet(before.item_name_hashes, after.item_name_hashes);
  const uris = diffSet(before.item_uri_hashes, after.item_uri_hashes);
  return {
    changed: before.snapshot_hash !== after.snapshot_hash,
    added_name_hashes: names.added.slice(0, CATALOG_SNAPSHOT_MAX_DIFF_HASHES),
    removed_name_hashes: names.removed.slice(0, CATALOG_SNAPSHOT_MAX_DIFF_HASHES),
    added_uri_hashes: uris.added.slice(0, CATALOG_SNAPSHOT_MAX_DIFF_HASHES),
    removed_uri_hashes: uris.removed.slice(0, CATALOG_SNAPSHOT_MAX_DIFF_HASHES),
    added_name_count: names.added.length,
    removed_name_count: names.removed.length,
    added_uri_count: uris.added.length,
    removed_uri_count: uris.removed.length,
    bounded: names.added.length <= CATALOG_SNAPSHOT_MAX_DIFF_HASHES && names.removed.length <= CATALOG_SNAPSHOT_MAX_DIFF_HASHES && uris.added.length <= CATALOG_SNAPSHOT_MAX_DIFF_HASHES && uris.removed.length <= CATALOG_SNAPSHOT_MAX_DIFF_HASHES,
    comparable: true,
  };
}
