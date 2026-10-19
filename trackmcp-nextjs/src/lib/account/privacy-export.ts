/**
 * The account export contract deliberately excludes raw telemetry payloads,
 * API keys, device-code material, and auth tokens. Keep this projection in a
 * pure helper so route tests can prove that a future query cannot accidentally
 * turn the export into a secret/payload dump.
 */

export const PRIVACY_EXPORT_VERSION = "2026-10-19.v2";

type JsonRecord = Record<string, unknown>;

function boundedString(value: unknown, max = 256): string | null {
  return typeof value === "string" && value.trim() ? value.slice(0, max) : null;
}

function boundedNumber(value: unknown, max = Number.MAX_SAFE_INTEGER): number | null {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(-max, value)) : null;
}

const HASH = /^[a-f0-9]{64}$/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function projectHashes(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && HASH.test(item)).slice(0, 128).map((item) => item.toLowerCase())
    : [];
}

/** Allowlist the small, derived action evidence contract; never export arbitrary JSON. */
function projectActionEvidence(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const input = value as JsonRecord;
  const output: JsonRecord = {};
  for (const key of ["tool_name", "previous_deployment_id", "comparison_deployment_id"]) {
    const result = boundedString(input[key]);
    if (result) output[key] = result;
  }
  for (const key of ["count", "calls", "failures", "workflows", "unresolved"]) {
    const result = boundedNumber(input[key], 1_000_000_000);
    if (result !== null) output[key] = result;
  }
  for (const key of ["error_rate", "unresolved_rate", "completion_rate"]) {
    const result = boundedNumber(input[key], 1);
    if (result !== null) output[key] = result;
  }
  for (const key of ["catalog_changed"]) {
    if (typeof input[key] === "boolean") output[key] = input[key];
  }
  return output;
}

function projectSemantic(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const input = value as JsonRecord;
  const output: JsonRecord = {};
  for (const key of ["contract_version", "classifier_version", "source_event_id", "scope", "outcome", "evidence_quality", "reason", "protocol_signal"]) {
    const result = boundedString(input[key], 128);
    if (result) output[key] = result;
  }
  const quality = input.data_quality;
  if (quality && typeof quality === "object" && !Array.isArray(quality)) {
    const q = quality as JsonRecord;
    output.data_quality = {
      flags: Array.isArray(q.flags) ? q.flags.filter((flag): flag is string => typeof flag === "string").slice(0, 16).map((flag) => flag.slice(0, 64)) : [],
      score: boundedString(q.score, 32),
    };
  }
  return output;
}

function projectFactDimensions(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const input = value as JsonRecord;
  const output: JsonRecord = {};
  for (const key of ["client_name", "client_version", "tool_name", "transport", "resource_audience"]) {
    const result = boundedString(input[key]);
    if (result) output[key] = result;
  }
  const priority = boundedNumber(input.resource_priority, 1);
  if (priority !== null) output.resource_priority = priority;
  return output;
}

function projectFactMeasures(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const input = value as JsonRecord;
  const output: JsonRecord = {};
  for (const [key, max] of [["duration_ms", 86_400_000], ["payload_size_bytes", 100_000_000], ["retry_number", 1_000], ["input_request_count", 100], ["input_response_count", 100]] as const) {
    const result = boundedNumber(input[key], max);
    if (result !== null) output[key] = result;
  }
  return output;
}

function projectFactError(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as JsonRecord;
  const output: JsonRecord = {};
  const errorClass = boundedString(input.class, 128);
  if (errorClass) output.class = errorClass;
  const code = boundedNumber(input.code, 999);
  if (code !== null) output.code = code;
  return Object.keys(output).length ? output : null;
}

function projectCatalogDiff(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const input = value as JsonRecord;
  const output: JsonRecord = {};
  const status = boundedString(input.status, 32);
  if (status) output.status = status;
  for (const key of ["added_name_count", "removed_name_count", "added_uri_count", "removed_uri_count"]) {
    const count = boundedNumber(input[key], 100_000_000);
    if (count !== null) output[key] = count;
  }
  return output;
}

export function projectEvent(row: JsonRecord): JsonRecord {
  return {
    id: typeof row.id === "string" ? row.id : null,
    event_id: typeof row.event_id === "string" ? row.event_id : null,
    event_type: typeof row.event_type === "string" ? row.event_type : null,
    service: typeof row.service === "string" ? row.service : null,
    environment: typeof row.environment === "string" ? row.environment : null,
    session_id: typeof row.session_id === "string" ? row.session_id : null,
    client_name: typeof row.client_name === "string" ? row.client_name : null,
    tool_name: typeof row.tool_name === "string" ? row.tool_name : null,
    started_at: typeof row.started_at === "string" ? row.started_at : null,
    duration_ms: typeof row.duration_ms === "number" ? row.duration_ms : null,
    success: typeof row.success === "boolean" ? row.success : null,
    is_error: typeof row.is_error === "boolean" ? row.is_error : null,
    received_at: typeof row.received_at === "string" ? row.received_at : null,
    account_identity_source:
      typeof row.account_identity_source === "string" ? row.account_identity_source : null,
    // account_key is intentionally omitted: it is a correlation identifier,
    // not useful to an end user and should not leave the service by default.
  };
}

export function projectFact(row: JsonRecord): JsonRecord {
  return {
    source_event_id: typeof row.source_event_id === "string" ? row.source_event_id : null,
    fact_version: typeof row.fact_version === "string" ? row.fact_version : null,
    fact_type: typeof row.fact_type === "string" ? row.fact_type : null,
    event_type: typeof row.event_type === "string" ? row.event_type : null,
    service: typeof row.service === "string" ? row.service : null,
    environment: typeof row.environment === "string" ? row.environment : null,
    observed_at: typeof row.observed_at === "string" ? row.observed_at : null,
    semantic: projectSemantic(row.semantic),
    dimensions: projectFactDimensions(row.dimensions),
    measures: projectFactMeasures(row.measures),
    error: projectFactError(row.error),
  };
}

export function projectAction(row: JsonRecord): JsonRecord {
  return {
    id: typeof row.id === "string" ? row.id : null,
    fingerprint: typeof row.fingerprint === "string" ? row.fingerprint : null,
    rule_key: typeof row.rule_key === "string" ? row.rule_key : null,
    status: typeof row.status === "string" ? row.status : null,
    severity: typeof row.severity === "string" ? row.severity : null,
    title: typeof row.title === "string" ? row.title : null,
    evidence: projectActionEvidence(row.evidence),
    first_seen_at: typeof row.first_seen_at === "string" ? row.first_seen_at : null,
    last_seen_at: typeof row.last_seen_at === "string" ? row.last_seen_at : null,
    resolved_at: typeof row.resolved_at === "string" ? row.resolved_at : null,
  };
}

export function projectCatalogVersion(row: JsonRecord): JsonRecord {
  return {
    id: typeof row.id === "string" ? row.id : null,
    server_id: typeof row.server_id === "string" ? row.server_id : null,
    environment_id: typeof row.environment_id === "string" ? row.environment_id : null,
    session_id: typeof row.session_id === "string" ? row.session_id : null,
    protocol_version: typeof row.protocol_version === "string" ? row.protocol_version : null,
    catalog_kind: typeof row.catalog_kind === "string" ? row.catalog_kind : null,
    item_count: typeof row.item_count === "number" ? row.item_count : null,
    item_name_hashes: projectHashes(row.item_name_hashes),
    item_uri_hashes: projectHashes(row.item_uri_hashes),
    snapshot_hash: typeof row.snapshot_hash === "string" && HASH.test(row.snapshot_hash) ? row.snapshot_hash.toLowerCase() : null,
    previous_snapshot_id: typeof row.previous_snapshot_id === "string" && UUID.test(row.previous_snapshot_id) ? row.previous_snapshot_id : null,
    complete: row.complete === true,
    truncated: row.truncated === true,
    observation_source: typeof row.observation_source === "string" ? row.observation_source : null,
    diff: projectCatalogDiff(row.diff),
    discovered_at: typeof row.discovered_at === "string" ? row.discovered_at : null,
  };
}

export function projectCatalogEntityRead(row: JsonRecord): JsonRecord {
  return {
    source_event_id: typeof row.source_event_id === "string" ? row.source_event_id : null,
    server_id: typeof row.server_id === "string" ? row.server_id : null,
    environment: typeof row.environment === "string" ? row.environment : null,
    catalog_kind: row.catalog_kind === "resources" || row.catalog_kind === "prompts" ? row.catalog_kind : null,
    entity_hash: typeof row.entity_hash === "string" && /^[a-f0-9]{64}$/i.test(row.entity_hash) ? row.entity_hash.toLowerCase() : null,
    observed_at: typeof row.observed_at === "string" ? row.observed_at : null,
    success: typeof row.success === "boolean" ? row.success : null,
    is_error: typeof row.is_error === "boolean" ? row.is_error : null,
    result_type: typeof row.result_type === "string" ? row.result_type : null,
  };
}

export function projectActivationMilestone(row: JsonRecord): JsonRecord {
  return {
    id: typeof row.id === "string" ? row.id : null,
    workspace_id: typeof row.workspace_id === "string" ? row.workspace_id : null,
    first_accepted_at: typeof row.first_accepted_at === "string" ? row.first_accepted_at : null,
    sdk_version: typeof row.sdk_version === "string" ? row.sdk_version : null,
    service: typeof row.service === "string" ? row.service : null,
    environment: typeof row.environment === "string" ? row.environment : null,
    event_type: typeof row.event_type === "string" ? row.event_type : null,
    observation_source: typeof row.observation_source === "string" ? row.observation_source : null,
    created_at: typeof row.created_at === "string" ? row.created_at : null,
  };
}

export function clampExportLimit(value: string | null): number {
  const parsed = Number(value || 100);
  if (!Number.isFinite(parsed)) return 100;
  return Math.min(500, Math.max(1, Math.floor(parsed)));
}
