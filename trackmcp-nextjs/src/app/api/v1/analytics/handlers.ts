import { NextResponse } from "next/server.js";
import { createHash } from "node:crypto";
import { getSupabaseServer } from "../../../../lib/auth/supabase-server.ts";
import { getSupabaseAdmin } from "../../../../lib/repository/supabase.ts";
import { hashTrackMCPKey } from "../../../../lib/telemetry/keys.ts";
import type { CatalogTool, CompletionSource, CorrelationQuality } from "../../../../lib/telemetry/analytics-types.ts";
import { completedForEvents, completionSourceForEvents, correlationQualityForEvents, isWorkflowLifecycleEvent, percentile } from "../../../../lib/telemetry/analytics.ts";
import { TRACKMCP_ACCOUNT_IDENTITY_VERSION, type CanonicalTrackMCPEvent, type TrackMCPCorrelationHandleSource, type TrackMCPIntentSource, type TrackMCPObservationSource, type TrackMCPSessionIdSource } from "../../../../lib/telemetry/types.ts";
import { projectTrackMCPFact } from "../../../../lib/telemetry/facts.ts";
import { aggregateTrackMCPFacts, aggregateTrackMCPFactsBy, type TrackMCPOutcomeGroupBy } from "../../../../lib/telemetry/outcomes.ts";
import { aggregateTaskLifecycles, type TrackMCPTaskTransitionObservation } from "../../../../lib/telemetry/task-lifecycle.ts";
import { buildTrackMCPDataTrust } from "../../../../lib/telemetry/data-trust.ts";
import { classifyTrackMCPProtocolSignal, protocolFamilyForCapabilityName, protocolFamilyForMethod, type TrackMCPProtocolFamily, type TrackMCPProtocolSignal } from "../../../../lib/telemetry/semantic.ts";
import { evaluateWorkerHealth } from "../../../../lib/telemetry/worker-health.ts";
import { correlateCatalogNotifications, type CatalogNotificationInput } from "../../../../lib/telemetry/catalog-correlations.ts";
import { decodeCatalogCursor, encodeCatalogCursor } from "../../../../lib/telemetry/catalog-cursor.ts";

type EventRow = {
  event_id: string;
  schema_version: string;
  event_type: "protocol" | "tool_call" | "session" | "catalog" | "workflow" | "custom";
  service: string;
  environment: string;
  server_id: string | null;
  deployment_id: string | null;
  server_version: string | null;
  sdk_version: string | null;
  observation_source: TrackMCPObservationSource | null;
  direction: string | null;
  transport: string | null;
  protocol_version: string | null;
  mcp_method: string | null;
  request_id: string | null;
  session_id: string | null;
  session_id_source: TrackMCPSessionIdSource | null;
  correlation_handle: string | null;
  correlation_handle_source: TrackMCPCorrelationHandleSource | null;
  context: string | null;
  intent_source: TrackMCPIntentSource | null;
  missing_capability: string | null;
  task_id: string | null;
  workflow_id: string | null;
  client_name: string | null;
  client_version: string | null;
  account_key: string | null;
  account_identity_source: "resolver" | "unresolved" | null;
  account_identity_version: string | null;
  tool_name: string | null;
  tool_description: string | null;
  tool_description_hash: string | null;
  duration_ms: number | null;
  success: boolean | null;
  is_error: boolean | null;
  error_class: string | null;
  error_code: number | null;
  retry_number: number | null;
  result_type: "complete" | "input_required" | "task" | null;
  interaction_id: string | null;
  interaction_link_source: string | null;
  retry_of_event_id: string | null;
  request_state_hash: string | null;
  input_request_count: number | null;
  input_response_count: number | null;
  resource_audience: "user" | "assistant" | null;
  resource_priority: number | null;
  schema_hash: string | null;
  catalog_kind: "tools" | "resources" | "resource_templates" | "prompts" | null;
  catalog_item_count: number | null;
  catalog_item_name_hashes: string[] | null;
  catalog_item_uri_hashes: string[] | null;
  payload_size_bytes: number | null;
  payload_policy: "metadata" | "redacted" | "full" | null;
  started_at: string;
  payload: Record<string, unknown> | null;
};

const MAX_PUBLIC_LIST_ITEMS = 500;
const MAX_PUBLIC_DIMENSION_ITEMS = 100;
const ANALYTICS_CACHE_TTL_MS = 2_000;
const ANALYTICS_CACHE_MAX_ENTRIES = 64;
const protocolTransportNames = ["stdio", "streamable_http", "sse", "custom"] as const;
type ProtocolTransportName = typeof protocolTransportNames[number];
type ProtocolCapabilityMatch = "advertised" | "not_advertised" | "unknown";
type ProtocolFamilyOutcome = {
  observations: number;
  requests: number;
  responses: number;
  matched: number;
  matched_advertised: number;
  matched_without_advertisement: number;
  matched_unknown: number;
  completed: number;
  errors: number;
  input_required: number;
  unknown: number;
  capability_advertised: boolean | null;
};

type AnalyticsCacheEntry = { expires_at: number; body: Record<string, unknown> };

// All Founder OS v2 read models are bounded projections of this same analytics
// response. A short, authenticated, workspace-scoped cache prevents twelve
// dashboard routes from repeating the 10k-event/100k-history scan while a
// customer loads a page. The TTL is deliberately shorter than the dashboard
// refresh interval and every request still authenticates before reading it.
const analyticsResponseCache = new WeakMap<object, Map<string, AnalyticsCacheEntry>>();

function getAnalyticsCache(supabase: object): Map<string, AnalyticsCacheEntry> {
  const existing = analyticsResponseCache.get(supabase);
  if (existing) return existing;
  const created = new Map<string, AnalyticsCacheEntry>();
  analyticsResponseCache.set(supabase, created);
  return created;
}

function analyticsCacheKey(workspaceId: string, apiKey: string, query: string): string {
  // The API key is hashed before entering the process-local key so credentials
  // can never be retained in cache keys or diagnostic output. Session-auth
  // requests are still workspace-scoped after membership validation.
  const credentialScope = apiKey ? hashTrackMCPKey(apiKey) : "session";
  return `${workspaceId}\u0000${credentialScope}\u0000${query}`;
}

function readCachedAnalytics(supabase: object, key: string): Record<string, unknown> | null {
  const cache = getAnalyticsCache(supabase);
  const now = Date.now();
  for (const [entryKey, entry] of cache) {
    if (entry.expires_at <= now) cache.delete(entryKey);
  }
  const entry = cache.get(key);
  if (!entry || entry.expires_at <= now) {
    if (entry) cache.delete(key);
    return null;
  }
  return entry.body;
}

function writeCachedAnalytics(supabase: object, key: string, body: Record<string, unknown>): void {
  const cache = getAnalyticsCache(supabase);
  cache.set(key, { expires_at: Date.now() + ANALYTICS_CACHE_TTL_MS, body });
  while (cache.size > ANALYTICS_CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (typeof oldest !== "string") break;
    cache.delete(oldest);
  }
}
// A single failed call is useful trace evidence, not a product-wide issue.
// Match the quality surface's minimum before ranking a tool as broken.
const MIN_ISSUE_TOOL_CALLS = 30;
const MIN_ISSUE_WORKFLOW_STARTS = 10;
const boundedText = (value: unknown, max: number): string | null =>
  typeof value === "string" ? value.slice(0, max) : null;

function isMissingAccountIdentityVersionColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as Record<string, unknown>;
  const text = `${typeof record.code === "string" ? record.code : ""} ${typeof record.message === "string" ? record.message : ""}`.toLowerCase();
  return text.includes("account_identity_version") && (text.includes("column") || text.includes("pgrst204") || text.includes("42703"));
}

function failed(event: { is_error?: boolean | null; success?: boolean | null }) { return event.is_error === true || event.success === false; }

function canonicalEventFromRow(event: EventRow): CanonicalTrackMCPEvent {
  const normalized = Object.fromEntries(Object.entries({ ...event, payload: event.payload || undefined }).filter(([, value]) => value !== null));
  return normalized as unknown as CanonicalTrackMCPEvent;
}

/** Namespace identity maps by derivation version so rotations cannot silently merge accounts. */
function accountIdentityKey(event: { account_key?: unknown; account_identity_source?: unknown; account_identity_version?: unknown }): string | null {
  if (event.account_identity_source !== "resolver" || typeof event.account_key !== "string" || !event.account_key) return null;
  const version = typeof event.account_identity_version === "string" && event.account_identity_version
    ? event.account_identity_version
    : TRACKMCP_ACCOUNT_IDENTITY_VERSION;
  return `${version}:${event.account_key}`;
}

function catalogFromEvent(event: EventRow): CatalogTool[] {
  if (event.event_type !== "catalog" && event.event_type !== "custom" || event.payload?.name !== "tools_discovered") return [];
  const result = event.payload.result;
  const fromPayload: unknown[] = Array.isArray(event.payload.tools) ? event.payload.tools : result && typeof result === "object" && Array.isArray((result as Record<string, unknown>).tools) ? (result as Record<string, unknown>).tools as unknown[] : [];
  return fromPayload.flatMap((tool): CatalogTool[] => {
    if (!tool || typeof tool !== "object" || typeof (tool as { name?: unknown }).name !== "string") return [];
    const record = tool as Record<string, unknown>;
    return [{
      name: (record.name as string).slice(0, 256),
      description: boundedText(record.description, 2_000),
      tool_description_hash: boundedText(record.tool_description_hash, 256),
      schema_hash: boundedText(record.schema_hash, 256),
    }];
  });
}

export function createAnalyticsHandler(getAdmin: typeof getSupabaseAdmin = getSupabaseAdmin, getServer: typeof getSupabaseServer = getSupabaseServer) {
  return async function GET(req: Request) {
  const supabase = getAdmin();
  if (!supabase) return NextResponse.json({ error: "Analytics service is not configured." }, { status: 503 });
  const authorization = req.headers.get("authorization") || "";
  const apiKey = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  let workspaceId: string | undefined;
  const url = new URL(req.url);
  const requestedWorkspaceId = url.searchParams.get("workspace_id")?.trim() || "";
  if (apiKey) {
    const { data: key, error } = await supabase.from("trackmcp_api_keys").select("workspace_id, revoked_at").eq("key_hash", hashTrackMCPKey(apiKey)).maybeSingle();
    if (error) return NextResponse.json({ error: "Could not authenticate analytics request." }, { status: 500 });
    if (!key || key.revoked_at) return NextResponse.json({ error: "Invalid or revoked API key." }, { status: 401 });
    workspaceId = key.workspace_id;
  } else {
    const auth = await getServer();
    const { data: userData } = await auth.auth.getUser();
    if (!userData.user) return NextResponse.json({ error: "Sign in or provide a workspace API key." }, { status: 401 });
    if (!requestedWorkspaceId || requestedWorkspaceId.length > 128) return NextResponse.json({ error: "workspace_id is required." }, { status: 400 });
    const membershipQuery = supabase.from("trackmcp_workspace_members").select("workspace_id").eq("user_id", userData.user.id);
    if (requestedWorkspaceId) membershipQuery.eq("workspace_id", requestedWorkspaceId);
    const { data: membership, error } = await membershipQuery.limit(1).maybeSingle();
    if (error) return NextResponse.json({ error: "Could not authenticate dashboard request." }, { status: 500 });
    if (!membership) return NextResponse.json({ error: requestedWorkspaceId ? "You do not have access to that workspace." : "Create a workspace first." }, { status: 404 });
    workspaceId = membership.workspace_id;
  }
  if (!workspaceId) return NextResponse.json({ error: "Workspace context is unavailable." }, { status: 401 });

  const requestedDays = Number(url.searchParams.get("days") || 30);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  let days = Number.isFinite(requestedDays) ? Math.min(90, Math.max(1, Math.floor(requestedDays))) : 30;
  let since = new Date(Date.now() - days * 86400000).toISOString();
  let until: string | null = null;
  if (fromParam || toParam) {
    if (!fromParam || !toParam || !/^\d{4}-\d{2}-\d{2}$/.test(fromParam) || !/^\d{4}-\d{2}-\d{2}$/.test(toParam)) {
      return NextResponse.json({ error: "from and to must be ISO dates (YYYY-MM-DD)." }, { status: 400 });
    }
    const start = new Date(`${fromParam}T00:00:00.000Z`);
    const end = new Date(`${toParam}T00:00:00.000Z`);
    const span = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || span < 1 || span > 90) {
      return NextResponse.json({ error: "Custom date ranges must be 1 through 90 days." }, { status: 400 });
    }
    days = span;
    since = start.toISOString();
    until = new Date(end.getTime() + 86400000).toISOString();
  }
  const cacheKey = analyticsCacheKey(workspaceId, apiKey, url.search);
  const cachedBody = readCachedAnalytics(supabase, cacheKey);
  if (cachedBody) return NextResponse.json(cachedBody);
  const analyticsQueryLimit = 10000;
  const generatedAt = new Date().toISOString();
  const eventSelect = "event_id, schema_version, event_type, service, environment, server_id, deployment_id, server_version, sdk_version, observation_source, direction, transport, protocol_version, mcp_method, request_id, session_id, session_id_source, correlation_handle, correlation_handle_source, context, intent_source, missing_capability, task_id, workflow_id, client_name, client_version, account_key, account_identity_source, account_identity_version, tool_name, tool_description, tool_description_hash, duration_ms, success, is_error, error_class, error_code, retry_number, result_type, interaction_id, interaction_link_source, retry_of_event_id, request_state_hash, input_request_count, input_response_count, resource_audience, resource_priority, schema_hash, catalog_kind, catalog_item_count, catalog_item_name_hashes, catalog_item_uri_hashes, payload_size_bytes, payload_policy, started_at, payload";
  const readEvents = async (select: string) => {
    const query = supabase.from("trackmcp_events").select(select).eq("workspace_id", workspaceId).gte("started_at", since);
    if (until) query.lt("started_at", until);
    return query.order("started_at", { ascending: true }).limit(analyticsQueryLimit);
  };
  let { data, error } = await readEvents(eventSelect);
  if (error && isMissingAccountIdentityVersionColumn(error)) ({ data, error } = await readEvents(eventSelect.replace(", account_identity_version", "")));
  if (error) return NextResponse.json({ error: "Could not load analytics." }, { status: 500 });

  // The first Founder OS slice needs a lifetime-first-seen signal to
  // distinguish new from returning accounts. Keep this side query narrow:
  // it contains no payloads and no identifiers other than the already hashed
  // resolver key. If the bounded scan is capped, the response explicitly
  // marks the classification as insufficient rather than inventing a trend.
  const historyLimit = 100_000;
  const historySelect = "event_id, account_key, account_identity_source, account_identity_version, started_at, event_type, mcp_method, tool_name, is_error, success, result_type, duration_ms, interaction_id, request_state_hash, retry_number, retry_of_event_id";
  const readHistory = async (select: string) => supabase.from("trackmcp_events")
    .select(select)
    .eq("workspace_id", workspaceId)
    .eq("observation_source", "server")
    .order("started_at", { ascending: true })
    .limit(historyLimit);
  let historyResult = await readHistory(historySelect);
  if (historyResult.error && isMissingAccountIdentityVersionColumn(historyResult.error)) historyResult = await readHistory(historySelect.replace(", account_identity_version", ""));
  const historyRows = historyResult.error ? [] : ((historyResult.data || []) as Array<{ event_id?: unknown; account_key?: unknown; account_identity_source?: unknown; account_identity_version?: unknown; started_at?: unknown; event_type?: unknown; mcp_method?: unknown; tool_name?: unknown; is_error?: unknown; success?: unknown; result_type?: unknown; duration_ms?: unknown; interaction_id?: unknown; request_state_hash?: unknown; retry_number?: unknown; retry_of_event_id?: unknown }>);
  const historyCapped = historyRows.length >= historyLimit;

  // Snapshot rows are service-written and explicitly workspace-scoped by the
  // additive catalog migration. If an operator has not applied that migration
  // yet, preserve the current analytics response and expose a truthful status
  // instead of turning the whole dashboard into a 500.
  const catalogBeforeParam = url.searchParams.get("catalog_before");
  const catalogBefore = decodeCatalogCursor(catalogBeforeParam, workspaceId);
  const catalogQuery = supabase.from("trackmcp_catalog_versions")
    .select("id,server_id,environment_id,transport,catalog_kind,item_count,item_name_hashes,item_uri_hashes,snapshot_hash,previous_snapshot_id,complete,truncated,diff,discovered_at")
    .eq("workspace_id", workspaceId).gte("discovered_at", since).order("discovered_at", { ascending: false });
  if (catalogBefore) catalogQuery.lt("discovered_at", catalogBefore);
  if (until) catalogQuery.lt("discovered_at", until);
  const catalogVersionsResult = await catalogQuery.limit(101);
  const rawCatalogVersions: unknown[] = catalogVersionsResult.error ? [] : (catalogVersionsResult.data || []) as unknown[];
  const catalogHasMore = rawCatalogVersions.length > 100;
  const catalogPageRows = rawCatalogVersions.slice(0, 100);
  const catalogVersionsBase = catalogPageRows.filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object")).map((row) => ({
    id: boundedText(row.id, 128),
    server_id: boundedText(row.server_id, 128),
    environment_id: boundedText(row.environment_id, 128),
    transport: boundedText(row.transport, 32) || "unknown",
    catalog_kind: boundedText(row.catalog_kind, 32),
    item_count: typeof row.item_count === "number" && Number.isInteger(row.item_count) ? row.item_count : null,
    item_name_hashes: Array.isArray(row.item_name_hashes) ? row.item_name_hashes.filter((value): value is string => typeof value === "string" && /^[a-f0-9]{64}$/i.test(value)).slice(0, 128) : [],
    item_uri_hashes: Array.isArray(row.item_uri_hashes) ? row.item_uri_hashes.filter((value): value is string => typeof value === "string" && /^[a-f0-9]{64}$/i.test(value)).slice(0, 128) : [],
    snapshot_hash: typeof row.snapshot_hash === "string" && /^[a-f0-9]{64}$/i.test(row.snapshot_hash) ? row.snapshot_hash.toLowerCase() : null,
    previous_snapshot_id: boundedText(row.previous_snapshot_id, 128),
    complete: row.complete === true,
    truncated: row.truncated === true,
    diff: row.diff && typeof row.diff === "object" && !Array.isArray(row.diff) ? row.diff : {},
    discovered_at: boundedText(row.discovered_at, 80),
  }));
  const predecessorIds = [...new Set(catalogPageRows
    .filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object"))
    .map((row) => boundedText(row.previous_snapshot_id, 128))
    .filter((id): id is string => Boolean(id)))].slice(0, 128);
  const predecessorById = new Map<string, Record<string, unknown>>();
  if (predecessorIds.length && !catalogVersionsResult.error) {
    const predecessorQuery = supabase.from("trackmcp_catalog_versions")
      .select("id,transport,catalog_kind,item_count,item_name_hashes,item_uri_hashes,snapshot_hash,complete,truncated,diff,discovered_at")
      .eq("workspace_id", workspaceId);
    const predecessorResult = await predecessorQuery.in("id", predecessorIds).limit(128);
    if (!predecessorResult.error && Array.isArray(predecessorResult.data)) {
      for (const row of predecessorResult.data) {
        if (row && typeof row === "object" && typeof (row as Record<string, unknown>).id === "string") predecessorById.set((row as Record<string, unknown>).id as string, row as Record<string, unknown>);
      }
    }
  }
  const catalogVersions = catalogVersionsBase.map((version) => {
    const previousId = version.previous_snapshot_id;
    const predecessor = previousId ? predecessorById.get(previousId) : null;
    return {
      ...version,
      previous_snapshot: predecessor ? {
        id: boundedText(predecessor.id, 128),
        version: typeof predecessor.snapshot_hash === "string" && /^[a-f0-9]{64}$/i.test(predecessor.snapshot_hash) ? predecessor.snapshot_hash.toLowerCase() : null,
        observed_at: boundedText(predecessor.discovered_at, 80),
        transport: boundedText(predecessor.transport, 32) || "unknown",
        catalog_kind: boundedText(predecessor.catalog_kind, 32),
        item_count: typeof predecessor.item_count === "number" && Number.isInteger(predecessor.item_count) ? predecessor.item_count : null,
        item_name_hashes: Array.isArray(predecessor.item_name_hashes) ? predecessor.item_name_hashes.filter((value): value is string => typeof value === "string" && /^[a-f0-9]{64}$/i.test(value)).slice(0, 128) : [],
        item_uri_hashes: Array.isArray(predecessor.item_uri_hashes) ? predecessor.item_uri_hashes.filter((value): value is string => typeof value === "string" && /^[a-f0-9]{64}$/i.test(value)).slice(0, 128) : [],
        complete: predecessor.complete === true,
        truncated: predecessor.truncated === true,
        diff: predecessor.diff && typeof predecessor.diff === "object" && !Array.isArray(predecessor.diff) ? predecessor.diff : {},
      } : null,
      previous_snapshot_status: !previousId ? "not_requested" : predecessor ? "available" : "not_in_window",
    };
  });
  const catalogVersionStatus = catalogVersionsResult.error ? "schema_unavailable" : catalogVersions.length ? "available" : "no_snapshot_rows";
  const catalogSnapshotSummary = {
    versions: catalogVersions.length,
    changed_versions: catalogVersions.filter((version) => version.diff && typeof version.diff === "object" && (version.diff as Record<string, unknown>).changed === true).length,
    diff_computed: catalogVersions.filter((version) => version.diff && typeof version.diff === "object" && (version.diff as Record<string, unknown>).status === "computed").length,
    truncated_versions: catalogVersions.filter((version) => version.truncated).length,
    page_bounded: catalogHasMore,
    limitation: "Snapshot rows are versioned catalog observations. Notification-family counts are correlated only through the bounded same-scope evidence join when a unique snapshot is available; ambiguous or unmatched notifications remain unresolved, and no snapshot version is inferred.",
  };
  const entityReadsQuery = supabase.from("trackmcp_catalog_entity_reads")
    .select("catalog_kind,entity_hash,success,is_error,result_type,observed_at")
    .eq("workspace_id", workspaceId).gte("observed_at", since);
  if (until) entityReadsQuery.lt("observed_at", until);
  const entityReadsResult = await entityReadsQuery.order("observed_at", { ascending: true }).limit(10001);
  const entityRows = entityReadsResult.error ? [] : (entityReadsResult.data || []) as Array<Record<string, unknown>>;
  const entityReadAnalytics = (kind: "resources" | "prompts") => {
    const rows = entityRows.filter((row) => row.catalog_kind === kind && typeof row.entity_hash === "string" && /^[a-f0-9]{64}$/i.test(row.entity_hash));
    const status = entityReadsResult.error ? "schema_unavailable" as const : rows.length ? "available" as const : "no_rows" as const;
    return {
      status,
      read_events: rows.length,
      successful_reads: rows.filter((row) => row.success === true && row.is_error !== true).length,
      failed_reads: rows.filter((row) => row.is_error === true || row.success === false).length,
      input_required_reads: rows.filter((row) => row.result_type === "input_required").length,
    };
  };
  const refreshJobsResult = await supabase.from("trackmcp_refresh_jobs")
    .select("state,attempt_count,created_at,updated_at,completed_at,last_error_code")
    .eq("workspace_id", workspaceId).order("updated_at", { ascending: false }).limit(100);
  const refreshJobs = refreshJobsResult.error ? [] : (refreshJobsResult.data || []) as Array<Record<string, unknown>>;
  const refreshNow = Date.now();
  const refreshCounts = { queued: 0, running: 0, retryable: 0, failed: 0, succeeded: 0 };
  let maxQueueLagMs = 0;
  let maxAttemptCount = 0;
  let lastSuccessfulRun: string | null = null;
  for (const job of refreshJobs) {
    const state = typeof job.state === "string" && job.state in refreshCounts ? job.state as keyof typeof refreshCounts : null;
    if (state) refreshCounts[state] += 1;
    const attempt = typeof job.attempt_count === "number" && Number.isInteger(job.attempt_count) ? job.attempt_count : 0;
    maxAttemptCount = Math.max(maxAttemptCount, Math.min(8, Math.max(0, attempt)));
    const created = typeof job.created_at === "string" ? Date.parse(job.created_at) : NaN;
    if (Number.isFinite(created) && state && ["queued", "running", "retryable"].includes(state)) maxQueueLagMs = Math.max(maxQueueLagMs, Math.min(86_400_000, Math.max(0, refreshNow - created)));
    if (state === "succeeded" && typeof job.completed_at === "string" && (!lastSuccessfulRun || job.completed_at > lastSuccessfulRun)) lastSuccessfulRun = job.completed_at;
  }
  // A present row is not proof that the worker is healthy. Surface queued,
  // retrying, and failed work as degraded so the dashboard cannot turn a
  // stalled scheduler into an "available" green state.
  const refreshStatus = refreshJobsResult.error
    ? "schema_unavailable"
    : !refreshJobs.length
      ? "no_jobs"
      : refreshCounts.failed > 0 || refreshCounts.retryable > 0 || refreshCounts.queued > 0 || refreshCounts.running > 0
        ? "degraded"
        : "available";
  const workerHealth = evaluateWorkerHealth(refreshJobs.map((job) => ({
    state: job.state === "succeeded" ? "completed" : job.state,
    queued_at: job.created_at,
    completed_at: job.completed_at,
    attempts: job.attempt_count,
  })));

  const events = ((data || []) as unknown as EventRow[]).filter((event) => event.observation_source === "server");
  const catalogNotificationInputs: CatalogNotificationInput[] = events.flatMap((event) => {
    const catalogKind = event.mcp_method === "notifications/tools/list_changed"
      ? "tools"
      : event.mcp_method === "notifications/resources/list_changed" || event.mcp_method === "notifications/resources/updated"
        ? "resources"
        : event.mcp_method === "notifications/prompts/list_changed"
          ? "prompts"
          : null;
    if (!catalogKind || !event.started_at) return [];
    return [{ server_id: event.server_id, environment: event.environment, catalog_kind: catalogKind, started_at: event.started_at }];
  });
  const catalogCorrelations = correlateCatalogNotifications(catalogNotificationInputs, catalogVersions);
  const protocolFamilyCounts = new Map<string, number>();
  const protocolFamilyOutcomes = new Map<string, ProtocolFamilyOutcome>();
  const protocolFamilyHandles = new Map<string, { requests: Map<string, ProtocolCapabilityMatch>; responses: Set<string> }>();
  const protocolTransportOutcomes = new Map<string, { transport: string; observations: number; requests: number; responses: number; matched: number; completed: number; errors: number; input_required: number; unknown: number }>();
  const protocolTransportHandles = new Map<string, { requests: Set<string>; responses: Set<string> }>();
  const mrtrRequestStateHashes = new Set<string>();
  const mrtrInteractionHashes = new Set<string>();
  const mrtrRetryLinks = new Set<string>();
  const advertisedFamiliesByScope = new Map<string, Set<string>>();
  const observedFamilyScopes = new Map<string, Set<string>>();
  const protocolFamilyEvents = (data || []) as unknown as EventRow[];
  const durableFactsResult = await supabase.from("trackmcp_semantic_facts")
    .select("source_event_id,semantic,dimensions,measures,event_type,observed_at,service,environment")
    .eq("workspace_id", workspaceId).gte("observed_at", since).limit(analyticsQueryLimit);
  const durableFamilyRows = durableFactsResult.error ? [] : ((durableFactsResult.data || []) as unknown[]).flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const record = row as Record<string, unknown>;
    const semantic = record.semantic;
    const dimensions = record.dimensions;
    const measures = record.measures;
    if (!semantic || typeof semantic !== "object" || Array.isArray(semantic) || !dimensions || typeof dimensions !== "object" || Array.isArray(dimensions)) return [];
    const outcome = (semantic as Record<string, unknown>).outcome;
    const signal = (semantic as Record<string, unknown>).protocol_signal;
    const family = (dimensions as Record<string, unknown>).protocol_family;
    if (typeof family !== "string" || typeof outcome !== "string") return [];
    if (!["sampling", "elicitation", "completion", "tasks", "control_signal", "resources", "prompts", "tools", "subscriptions", "notifications", "roots", "logging"].includes(family)) return [];
    if (!["completed", "failed", "pending", "unknown", "not_observable"].includes(outcome)) return [];
    const safeMeasures = measures && typeof measures === "object" && !Array.isArray(measures) ? measures as Record<string, unknown> : {};
    const safeDimensions = dimensions as Record<string, unknown>;
    const transport = protocolTransportNames.includes(safeDimensions.transport as ProtocolTransportName) ? safeDimensions.transport as ProtocolTransportName : undefined;
    const capabilityFamilies = Array.isArray(safeDimensions.capability_families)
      ? safeDimensions.capability_families.filter((value): value is string => typeof value === "string").slice(0, 16)
      : [];
    return [{
      source_event_id: typeof record.source_event_id === "string" ? record.source_event_id.slice(0, 128) : undefined,
      family,
      transport,
      outcome,
      scope_key: `${typeof record.service === "string" ? record.service.slice(0, 128) : "unknown"}:${typeof record.environment === "string" ? record.environment.slice(0, 64) : "unknown"}:${typeof safeDimensions.server_id === "string" ? safeDimensions.server_id.slice(0, 128) : "unknown"}`,
      capability_families: capabilityFamilies,
      signal: signal === "notification" || signal === "progress" || signal === "cancelled" || signal === "catalog_changed" || signal === "resource_changed" || signal === "subscription_started" || signal === "subscription_stopped" ? signal : undefined,
      catalog_change_kind: safeDimensions.catalog_change_kind === "tools" || safeDimensions.catalog_change_kind === "resources" || safeDimensions.catalog_change_kind === "resource_templates" || safeDimensions.catalog_change_kind === "prompts" ? safeDimensions.catalog_change_kind : undefined,
      protocol_decision: safeDimensions.protocol_decision === "accept" || safeDimensions.protocol_decision === "decline" || safeDimensions.protocol_decision === "cancel" ? safeDimensions.protocol_decision : undefined,
      observed_at: typeof record.observed_at === "string" ? record.observed_at : undefined,
      observation_kind: safeDimensions.protocol_observation_kind === "protocol_request" || safeDimensions.protocol_observation_kind === "protocol_response" ? safeDimensions.protocol_observation_kind : undefined,
      interaction_id_hash: typeof safeDimensions.interaction_id_hash === "string" ? safeDimensions.interaction_id_hash : undefined,
      request_state_hash: typeof safeDimensions.request_state_hash === "string" && /^[0-9a-f]{64}$/.test(safeDimensions.request_state_hash) ? safeDimensions.request_state_hash : undefined,
      retry_of_event_id: typeof safeDimensions.retry_of_event_id === "string" ? safeDimensions.retry_of_event_id.slice(0, 128) : undefined,
      completion_value_count: typeof safeMeasures.completion_value_count === "number" ? safeMeasures.completion_value_count : undefined,
      completion_total: typeof safeMeasures.completion_total === "number" ? safeMeasures.completion_total : undefined,
      completion_has_more: typeof safeMeasures.completion_has_more === "boolean" ? safeMeasures.completion_has_more : undefined,
    }];
  });
  // Semantic facts are the durable projection when the refresh worker has
  // materialized them. Older deployments may not have rows yet, so retain the
  // bounded event-window fallback without changing the public contract.
  const familySource = durableFamilyRows.length ? "durable_facts" as const : "event_window" as const;
  const protocolFamilySourceRows = durableFamilyRows.length ? durableFamilyRows : protocolFamilyEvents.flatMap((event) => {
    const hintedFamily = event.payload && typeof event.payload === "object" && !Array.isArray(event.payload)
      ? (event.payload._trackmcp && typeof event.payload._trackmcp === "object" && !Array.isArray(event.payload._trackmcp) ? (event.payload._trackmcp as Record<string, unknown>).protocol_family : undefined)
      : undefined;
    const family = typeof hintedFamily === "string" ? hintedFamily : protocolFamilyForMethod(event.mcp_method);
    if (family !== "sampling" && family !== "elicitation" && family !== "completion" && family !== "tasks" && family !== "control_signal" && family !== "resources" && family !== "prompts" && family !== "tools" && family !== "subscriptions" && family !== "notifications" && family !== "roots" && family !== "logging") return [];
    const outcome = event.is_error === true || event.success === false ? "failed" : event.result_type === "input_required" ? "pending" : event.result_type === "complete" ? "completed" : "unknown";
    const metadata = event.payload && typeof event.payload === "object" && !Array.isArray(event.payload)
      && event.payload._trackmcp && typeof event.payload._trackmcp === "object" && !Array.isArray(event.payload._trackmcp)
      ? event.payload._trackmcp as Record<string, unknown>
      : undefined;
    const rawCapabilities = metadata?.capability_names ?? (event.payload && typeof event.payload === "object" && !Array.isArray(event.payload) ? event.payload.capability_names : undefined);
    const capabilityFamilies = [...new Set((Array.isArray(rawCapabilities) ? rawCapabilities.filter((value): value is string => typeof value === "string") : typeof rawCapabilities === "string" ? rawCapabilities.split(",") : [])
      .map((name) => protocolFamilyForCapabilityName(name.trim()))
      .filter((family): family is TrackMCPProtocolFamily => Boolean(family)))].slice(0, 16);
    return [{
      source_event_id: typeof event.event_id === "string" ? event.event_id.slice(0, 128) : undefined,
      family,
      transport: protocolTransportNames.includes(event.transport as ProtocolTransportName) ? event.transport as ProtocolTransportName : undefined,
      outcome,
      scope_key: `${event.service.slice(0, 128)}:${event.environment.slice(0, 64)}:${event.server_id?.slice(0, 128) || "unknown"}`,
      capability_families: capabilityFamilies,
      observation_kind: metadata?.observation_kind === "protocol_request" || metadata?.observation_kind === "protocol_response" ? metadata.observation_kind : undefined,
      protocol_decision: metadata?.protocol_decision === "accept" || metadata?.protocol_decision === "decline" || metadata?.protocol_decision === "cancel" ? metadata.protocol_decision : undefined,
      interaction_id_hash: typeof event.interaction_id === "string" ? createHash("sha256").update(event.interaction_id, "utf8").digest("hex") : undefined,
      request_state_hash: typeof event.request_state_hash === "string" && /^[0-9a-f]{64}$/.test(event.request_state_hash) ? event.request_state_hash : undefined,
      retry_of_event_id: typeof event.retry_of_event_id === "string" ? event.retry_of_event_id.slice(0, 128) : undefined,
    }];
  });
  // Resolve capability advertisements before matching requests and responses.
  // Event order is not a protocol guarantee, so a response must not become
  // "negotiated" merely because its initialize event happened to be scanned
  // first. The map contains only bounded family names and server scopes.
  for (const row of protocolFamilySourceRows) {
    if (!row.scope_key || !Array.isArray(row.capability_families) || !row.capability_families.length) continue;
    const advertised = advertisedFamiliesByScope.get(row.scope_key) || new Set<string>();
    for (const capabilityFamily of row.capability_families) advertised.add(capabilityFamily);
    advertisedFamiliesByScope.set(row.scope_key, advertised);
  }
  const capabilityMatchForRow = (row: { family: string; scope_key?: string; }): ProtocolCapabilityMatch => {
    if (!row.scope_key) return "unknown";
    const advertised = advertisedFamiliesByScope.get(row.scope_key);
    if (!advertised) return "unknown";
    return advertised.has(row.family) ? "advertised" : "not_advertised";
  };
  for (const row of protocolFamilySourceRows) {
    const { family, outcome } = row;
    protocolFamilyCounts.set(family, (protocolFamilyCounts.get(family) || 0) + 1);
    const current = protocolFamilyOutcomes.get(family) || { observations: 0, requests: 0, responses: 0, matched: 0, matched_advertised: 0, matched_without_advertisement: 0, matched_unknown: 0, completed: 0, errors: 0, input_required: 0, unknown: 0, capability_advertised: null };
    const transportKey = row.transport || "unknown";
    const transportOutcomeKey = `${transportKey}:${family}`;
    const transportCurrent = protocolTransportOutcomes.get(transportOutcomeKey) || { transport: transportKey, observations: 0, requests: 0, responses: 0, matched: 0, completed: 0, errors: 0, input_required: 0, unknown: 0 };
    transportCurrent.observations += 1;
    const scopeKey = typeof row.scope_key === "string" ? row.scope_key : undefined;
    if (scopeKey) {
      const scopes = observedFamilyScopes.get(family) || new Set<string>();
      scopes.add(scopeKey);
      observedFamilyScopes.set(family, scopes);
    }
    if (row.request_state_hash) mrtrRequestStateHashes.add(`${scopeKey || "unknown"}:${row.request_state_hash}`);
    if (row.interaction_id_hash) mrtrInteractionHashes.add(`${scopeKey || "unknown"}:${row.interaction_id_hash}`);
    if (row.retry_of_event_id) mrtrRetryLinks.add(`${scopeKey || "unknown"}:${row.retry_of_event_id}`);
    current.observations += 1;
    if (row.observation_kind === "protocol_request") current.requests += 1;
    if (row.observation_kind === "protocol_response") current.responses += 1;
    if (row.observation_kind === "protocol_request") transportCurrent.requests += 1;
    if (row.observation_kind === "protocol_response") transportCurrent.responses += 1;
    const primaryLink = row.interaction_id_hash
      || row.request_state_hash
      || (row.observation_kind === "protocol_request" && row.source_event_id ? `event:${row.source_event_id}` : undefined)
      || (row.observation_kind === "protocol_response" && row.retry_of_event_id ? `event:${row.retry_of_event_id}` : undefined);
    // The opaque handle is only meaningful inside the observed server scope.
    // Prefix it before matching so two servers that reuse a request/interaction
    // handle cannot manufacture a cross-server response pair.
    const scopedLink = primaryLink && scopeKey ? `${scopeKey}:${primaryLink}` : primaryLink;
    if (scopedLink && row.observation_kind) {
      const handle = protocolFamilyHandles.get(family) || { requests: new Map<string, ProtocolCapabilityMatch>(), responses: new Set<string>() };
      if (row.observation_kind === "protocol_request") handle.requests.set(scopedLink, capabilityMatchForRow(row));
      else handle.responses.add(scopedLink);
      protocolFamilyHandles.set(family, handle);
      const transportHandle = protocolTransportHandles.get(transportOutcomeKey) || { requests: new Set<string>(), responses: new Set<string>() };
      transportHandle[row.observation_kind === "protocol_request" ? "requests" : "responses"].add(scopedLink);
      protocolTransportHandles.set(transportOutcomeKey, transportHandle);
    }
    if (outcome === "failed") current.errors += 1;
    else if (outcome === "pending") current.input_required += 1;
    else if (outcome === "completed") current.completed += 1;
    else current.unknown += 1;
    if (outcome === "failed") transportCurrent.errors += 1;
    else if (outcome === "pending") transportCurrent.input_required += 1;
    else if (outcome === "completed") transportCurrent.completed += 1;
    else transportCurrent.unknown += 1;
    protocolFamilyOutcomes.set(family, current);
    protocolTransportOutcomes.set(transportOutcomeKey, transportCurrent);
  }
  for (const [family, handle] of protocolFamilyHandles) {
    const current = protocolFamilyOutcomes.get(family);
    if (!current) continue;
    for (const [value, capabilityMatch] of handle.requests) {
      if (!handle.responses.has(value)) continue;
      current.matched += 1;
      if (capabilityMatch === "advertised") current.matched_advertised += 1;
      else if (capabilityMatch === "not_advertised") current.matched_without_advertisement += 1;
      else current.matched_unknown += 1;
    }
  }
  for (const [key, handle] of protocolTransportHandles) {
    const current = protocolTransportOutcomes.get(key);
    if (current) current.matched = [...handle.requests].filter((value) => handle.responses.has(value)).length;
  }
  for (const [family, current] of protocolFamilyOutcomes) {
    if (!advertisedFamiliesByScope.size) {
      current.capability_advertised = null;
      continue;
    }
    const scopes = observedFamilyScopes.get(family) || new Set<string>();
    current.capability_advertised = [...scopes].some((scope) => advertisedFamiliesByScope.get(scope)?.has(family) === true);
  }
  const protocolCapabilityGaps = [...protocolFamilyOutcomes.keys()].flatMap((family) => {
    const requestsWithoutAdvertisement = protocolFamilySourceRows.filter((row) => {
      if (row.family !== family || row.observation_kind !== "protocol_request" || typeof row.scope_key !== "string") return false;
      const advertised = advertisedFamiliesByScope.get(row.scope_key);
      return Boolean(advertised && !advertised.has(family));
    }).length;
    return requestsWithoutAdvertisement ? [{ family: family as TrackMCPProtocolFamily, requests_without_advertisement: requestsWithoutAdvertisement, limitation: "A request without an observed capability advertisement is a negotiation signal, not proof that the peer rejected or could not support the operation." }] : [];
  }).sort((a, b) => b.requests_without_advertisement - a.requests_without_advertisement || a.family.localeCompare(b.family));
  const protocolMrtrLinkage = {
    request_state_hashes: mrtrRequestStateHashes.size,
    interaction_hashes: mrtrInteractionHashes.size,
    retry_links: mrtrRetryLinks.size,
    matched_pairs: [...protocolFamilyOutcomes.values()].reduce((sum, value) => sum + value.matched, 0),
    source: familySource,
    limitation: "Counts are metadata-only evidence. Hashes and retry identifiers are never returned; a matched pair requires the same explicit interaction/request-state handle or an allowlisted retry link within the bounded workspace window.",
  };
  const protocolDecisions = {
    elicitation: { accept: 0, decline: 0, cancel: 0 },
    sampling: { accept: 0, decline: 0, cancel: 0 },
  };
  for (const row of protocolFamilySourceRows) {
    if ((row.family === "elicitation" || row.family === "sampling") && (row.protocol_decision === "accept" || row.protocol_decision === "decline" || row.protocol_decision === "cancel")) {
      protocolDecisions[row.family][row.protocol_decision] += 1;
    }
  }
  const protocolDecisionSummary = {
    ...protocolDecisions,
    limitation: "Only explicit allowlisted protocol decisions are counted. Accept is an observed protocol action, not proof that a user approved a business operation; user-entered values are never retained.",
  };
  const durableCompletionRows = durableFamilyRows.filter((row) => row.family === "completion");
  const durableCompletionEvidence = durableCompletionRows.some((row) => row.observation_kind === "protocol_request" || row.observation_kind === "protocol_response");
  const completionResponses = durableCompletionEvidence
    ? []
    : protocolFamilyEvents.filter((event) => {
    if (event.mcp_method !== "completion/complete" || !event.payload || typeof event.payload !== "object" || Array.isArray(event.payload)) return false;
    const metadata = (event.payload as Record<string, unknown>)._trackmcp;
    return Boolean(metadata && typeof metadata === "object" && !Array.isArray(metadata) && (metadata as Record<string, unknown>).observation_kind === "protocol_response");
    });
  const completionRequests = durableCompletionEvidence
    ? []
    : protocolFamilyEvents.filter((event) => {
    if (event.mcp_method !== "completion/complete" || !event.payload || typeof event.payload !== "object" || Array.isArray(event.payload)) return false;
    const metadata = (event.payload as Record<string, unknown>)._trackmcp;
    return Boolean(metadata && typeof metadata === "object" && !Array.isArray(metadata) && (metadata as Record<string, unknown>).observation_kind === "protocol_request");
    });
  let completionWithMetadata = 0;
  let completionWithSuggestions = 0;
  let completionEmpty = 0;
  let completionPartial = 0;
  const completionRows = durableCompletionEvidence
    ? durableCompletionRows.map((row) => ({ observation_kind: row.observation_kind, count: row.completion_value_count, total: row.completion_total, hasMore: row.completion_has_more === true }))
    : completionResponses.map((event) => {
      const metadata = (event.payload as Record<string, unknown>)._trackmcp as Record<string, unknown>;
      return { observation_kind: metadata.observation_kind, count: metadata.completion_value_count, total: metadata.completion_total, hasMore: metadata.completion_has_more === true };
    });
  for (const row of completionRows) {
    if (row.observation_kind !== "protocol_response" || (typeof row.count !== "number" && typeof row.total !== "number" && typeof row.hasMore !== "boolean")) continue;
    completionWithMetadata += 1;
    if (typeof row.count === "number" && row.count > 0) completionWithSuggestions += 1;
    else if (row.count === 0) completionEmpty += 1;
    if (row.hasMore) completionPartial += 1;
  }
  const completionRequestCount = durableCompletionEvidence
    ? durableCompletionRows.filter((row) => row.observation_kind === "protocol_request").length
    : completionRequests.length;
  const completionOutcome = protocolFamilyOutcomes.get("completion");
  const completionMatchedRequests = Math.min(completionRequestCount, completionOutcome?.matched || 0);
  const completionActivity = {
    requests: completionRequestCount,
    matched_requests: completionMatchedRequests,
    unmatched_requests: Math.max(0, completionRequestCount - completionMatchedRequests),
    capability_advertised: completionOutcome?.capability_advertised ?? null,
    responses_with_metadata: completionWithMetadata,
    with_suggestions: completionWithSuggestions,
    empty_suggestions: completionEmpty,
    partial: completionPartial,
    limitation: "Suggestion values, prompt/resource references, and argument contents are never returned. Older events without bounded completion metadata remain in protocol-family outcomes but are not classified as empty or partial.",
  };
  const facts = events.map(canonicalEventFromRow).map(projectTrackMCPFact);
  // The transition table is additive and may not exist on older deployments.
  // A missing schema must not break analytics; when present it extends the
  // bounded event-window projection so late completion/expiry remains visible.
  const transitionResult = await supabase.from("trackmcp_task_transitions")
    .select("task_id_hash,state,observed_at,evidence_quality,service,environment,server_id,transport")
    .eq("workspace_id", workspaceId).gte("observed_at", since).order("observed_at", { ascending: true }).limit(10000);
  const taskTransitions = transitionResult.error ? [] : ((transitionResult.data || []) as Array<Record<string, unknown>>).flatMap((row): TrackMCPTaskTransitionObservation[] => {
    const state = row.state;
    const quality = row.evidence_quality;
    if (typeof row.task_id_hash !== "string" || !/^[a-f0-9]{64}$/i.test(row.task_id_hash) || typeof row.observed_at !== "string") return [];
    if (state !== "working" && state !== "input_required" && state !== "completed" && state !== "failed" && state !== "cancelled" && state !== "expired") return [];
    if (quality !== "observed" && quality !== "insufficient_data" && quality !== "conflicting") return [];
    return [{ task_id_hash: row.task_id_hash.toLowerCase(), state, observed_at: row.observed_at.slice(0, 80), evidence_quality: quality, scope: {
      service: typeof row.service === "string" ? row.service : "unknown",
      environment: typeof row.environment === "string" ? row.environment : "unknown",
      server_id: typeof row.server_id === "string" ? row.server_id : null,
      transport: row.transport === "stdio" || row.transport === "streamable_http" || row.transport === "sse" || row.transport === "custom" ? row.transport : "unknown",
    } }];
  });
  const identityEligible = events.filter((event) => event.account_identity_source === "resolver" || event.account_identity_source === "unresolved").length;
  const identityResolved = events.filter((event) => Boolean(accountIdentityKey(event))).length;
  const identityCoverage = {
    numerator: identityResolved,
    denominator: identityEligible,
    value: identityEligible > 0 ? identityResolved / identityEligible : null,
    source: "account_identity_source=resolver",
    limitation: "Event-weighted coverage; not a count of unique organizations or end users.",
  };
  const identitySourceCounts = {
    resolver: identityResolved,
    unresolved: Math.max(0, identityEligible - identityResolved),
  };
  const outcomeGroups = Object.fromEntries(((["service", "environment", "tool_name", "client_name", "transport"] as TrackMCPOutcomeGroupBy[]).map((groupBy) => [groupBy, aggregateTrackMCPFactsBy(facts, groupBy)]))) as Record<TrackMCPOutcomeGroupBy, ReturnType<typeof aggregateTrackMCPFactsBy>>;
  const intentSources: Record<TrackMCPIntentSource, number> = { context_parameter: 0, external_callback: 0, fallback: 0, missing: 0 };
  const missingCapabilities = new Map<string, number>();
  for (const event of events) {
    intentSources[event.intent_source || "missing"] += 1;
    if (event.missing_capability) missingCapabilities.set(event.missing_capability, (missingCapabilities.get(event.missing_capability) || 0) + 1);
  }
  const calls = events.filter((event) => event.event_type === "tool_call");
  const accountEventCounts = new Map<string, number>();
  const accountEventDays = new Map<string, Set<string>>();
  const recentAccountKeys = new Set<string>();
  const sevenDaysAgo = Date.now() - 7 * 86400000;
  for (const event of events) {
    const key = accountIdentityKey(event);
    if (!key) continue;
    accountEventCounts.set(key, (accountEventCounts.get(key) || 0) + 1);
    const days = accountEventDays.get(key) || new Set<string>();
    days.add(event.started_at.slice(0, 10));
    accountEventDays.set(key, days);
    if (Date.parse(event.started_at) >= sevenDaysAgo) recentAccountKeys.add(key);
  }
  const deploymentIds = new Set<string>();
  let deploymentLinkedEvents = 0;
  for (const event of events) {
    if (event.deployment_id && /^[a-zA-Z0-9_-]{1,128}$/.test(event.deployment_id)) {
      deploymentIds.add(event.deployment_id);
      deploymentLinkedEvents += 1;
    }
  }
  const observedAccountKeys = new Set<string>();
  let resolverLinkedEvents = 0;
  let unresolvedEvents = 0;
  for (const event of calls) {
    const key = accountIdentityKey(event);
    if (key) {
      observedAccountKeys.add(key);
      resolverLinkedEvents += 1;
    } else if (event.account_identity_source === "unresolved") {
      unresolvedEvents += 1;
    }
  }
  const eligibleAccountEvents = resolverLinkedEvents + unresolvedEvents;
  const sessions = new Map<string, EventRow[]>();
  for (const event of events) if (event.session_id) sessions.set(event.session_id, [...(sessions.get(event.session_id) || []), event]);
  const clients = new Map<string, { calls: number; versions: Set<string> }>();
  const tools = new Map<string, { calls: number; errors: number; durations: number[] }>();
  const catalog = new Map<string, CatalogTool>();
  for (const event of events) for (const tool of catalogFromEvent(event)) catalog.set(tool.name, tool);
  for (const event of calls) {
    // The Founder OS spec requires missing/self-reported client identity to
    // remain visible as an explicit category. Dropping null names makes the
    // client chart look more certain than the evidence supports.
    const clientName = event.client_name?.trim() || "Unknown client";
    {
      const client = clients.get(clientName) || { calls: 0, versions: new Set<string>() };
      client.calls += 1;
      if (event.client_version) client.versions.add(event.client_version);
      clients.set(clientName, client);
    }
    if (!event.tool_name) continue;
    const tool = tools.get(event.tool_name) || { calls: 0, errors: 0, durations: [] };
    tool.calls += 1;
    if (failed(event)) tool.errors += 1;
    if (typeof event.duration_ms === "number") tool.durations.push(event.duration_ms);
    tools.set(event.tool_name, tool);
  }
  const toolRows = [...tools.entries()].map(([name, value]) => ({
    name: name.slice(0, 256),
    calls: value.calls,
    errors: value.errors,
    error_rate: value.calls ? value.errors / value.calls : 0,
    avg_ms: value.durations.length ? Math.round(value.durations.reduce((a, b) => a + b, 0) / value.durations.length) : null,
    p50_ms: percentile(value.durations, 0.5),
    p95_ms: percentile(value.durations, 0.95),
    latency_sample_count: value.durations.length,
    discovered: catalog.has(name),
    description: catalog.get(name)?.description?.slice(0, 2_000) || null,
    schema_hash: catalog.get(name)?.schema_hash || null,
  })).sort((a, b) => b.calls - a.calls);
  const unusedTools = [...catalog.keys()].filter((name) => !tools.has(name));

  const periodStartMs = Date.parse(since);
  const periodEndMs = Date.now();
  const periodLengthMs = Math.max(86_400_000, days * 86_400_000);
  const previousPeriodStartMs = periodStartMs - periodLengthMs;
  const currentAccountActivity = new Map<string, { count: number; days: Set<string> }>();
  for (const event of events) {
    const key = accountIdentityKey(event);
    if (!key) continue;
    const existing = currentAccountActivity.get(key) || { count: 0, days: new Set<string>() };
    existing.count += 1;
    existing.days.add(event.started_at.slice(0, 10));
    currentAccountActivity.set(key, existing);
  }
  const historicalAccountFirstSeen = new Map<string, number>();
  const previousPeriodAccounts = new Set<string>();
  const growthBuckets = new Map<string, Set<string>>();
  for (const row of historyRows) {
    const key = accountIdentityKey(row);
    if (!key || typeof row.started_at !== "string") continue;
    const timestamp = Date.parse(row.started_at);
    if (!Number.isFinite(timestamp)) continue;
    const existing = historicalAccountFirstSeen.get(key);
    if (existing === undefined || timestamp < existing) historicalAccountFirstSeen.set(key, timestamp);
    if (timestamp >= previousPeriodStartMs && timestamp < periodStartMs) previousPeriodAccounts.add(key);
    if (timestamp >= periodStartMs && timestamp <= periodEndMs) {
      const bucket = new Date(timestamp);
      // Founder OS adoption is intentionally reported as a weekly signal.
      // Week starts on Monday in UTC so the server result is stable for every
      // viewer and does not silently depend on a browser's local timezone.
      bucket.setUTCDate(bucket.getUTCDate() - ((bucket.getUTCDay() + 6) % 7));
      bucket.setUTCHours(0, 0, 0, 0);
      const bucketKey = bucket.toISOString().slice(0, 10);
      const set = growthBuckets.get(bucketKey) || new Set<string>();
      set.add(key);
      growthBuckets.set(bucketKey, set);
    }
  }
  const currentAccountKeys = new Set(currentAccountActivity.keys());
  const newAccounts = historyCapped ? null : [...currentAccountKeys].filter((key) => {
    const firstSeen = historicalAccountFirstSeen.get(key);
    return firstSeen !== undefined && firstSeen >= periodStartMs;
  }).length;
  const returningAccounts = historyCapped ? null : [...currentAccountKeys].filter((key) => {
    const firstSeen = historicalAccountFirstSeen.get(key);
    return firstSeen !== undefined && firstSeen < periodStartMs;
  }).length;
  const clientBreakdown = [...clients.entries()].map(([name, value]) => ({
    name: name.slice(0, 256),
    calls: value.calls,
    share: calls.length ? value.calls / calls.length : null,
    identity_source: name === "Unknown client" ? "unrecognized" as const : "self_reported" as const,
  })).sort((a, b) => b.calls - a.calls).slice(0, MAX_PUBLIC_DIMENSION_ITEMS);
  const topAccounts = [...currentAccountActivity.values()]
    .sort((a, b) => b.count - a.count || b.days.size - a.days.size)
    .slice(0, 20)
    .map((value, index) => ({ rank: index + 1, activity_count: value.count, active_days: value.days.size, identity_source: "resolver" as const }));
  const growth = [...growthBuckets.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-366).map(([period_start, accounts]) => ({ period_start, active_accounts: accounts.size }));
  const currentToolAccounts = new Map<string, Set<string>>();
  for (const event of calls) {
    if (!event.tool_name) continue;
    const key = accountIdentityKey(event);
    if (!key) continue;
    const accountsForTool = currentToolAccounts.get(key) || new Set<string>();
    accountsForTool.add(event.tool_name);
    currentToolAccounts.set(key, accountsForTool);
  }
  const adoptionBuckets = { "1 tool": 0, "2-3 tools": 0, "4-6 tools": 0, "7+ tools": 0 } as Record<"1 tool" | "2-3 tools" | "4-6 tools" | "7+ tools", number>;
  for (const toolSet of currentToolAccounts.values()) {
    const count = toolSet.size;
    if (count === 1) adoptionBuckets["1 tool"] += 1;
    else if (count <= 3) adoptionBuckets["2-3 tools"] += 1;
    else if (count <= 6) adoptionBuckets["4-6 tools"] += 1;
    else adoptionBuckets["7+ tools"] += 1;
  }
  const averageToolsUsed = currentToolAccounts.size
    ? [...currentToolAccounts.values()].reduce((total, toolSet) => total + toolSet.size, 0) / currentToolAccounts.size
    : null;
  const previousPeriodCalls = historyRows.filter((row) => row.event_type === "tool_call" && typeof row.started_at === "string" && Date.parse(row.started_at) >= previousPeriodStartMs && Date.parse(row.started_at) < periodStartMs).length;
  const trendBuckets = new Map<string, Map<string, number>>();
  for (const event of calls) {
    if (!event.tool_name) continue;
    const timestamp = Date.parse(event.started_at);
    if (!Number.isFinite(timestamp)) continue;
    const bucket = new Date(timestamp);
    bucket.setUTCDate(bucket.getUTCDate() - bucket.getUTCDay());
    bucket.setUTCHours(0, 0, 0, 0);
    const period = bucket.toISOString().slice(0, 10);
    const byTool = trendBuckets.get(period) || new Map<string, number>();
    byTool.set(event.tool_name, (byTool.get(event.tool_name) || 0) + 1);
    trendBuckets.set(period, byTool);
  }
  const topTrendTools = new Set(toolRows.slice(0, 6).map((tool) => tool.name));
  const capabilityTrend = [...trendBuckets.entries()].sort(([a], [b]) => a.localeCompare(b)).flatMap(([period_start, byTool]) => {
    const summarized = new Map<string, number>();
    for (const [toolName, count] of byTool) {
      const name = topTrendTools.has(toolName) ? toolName : "Other";
      summarized.set(name, (summarized.get(name) || 0) + count);
    }
    return [...summarized.entries()].map(([tool_name, calls]) => ({ period_start, tool_name, calls }));
  }).slice(-500);
  const capabilityReliability = toolRows.slice(0, MAX_PUBLIC_LIST_ITEMS).map((tool) => {
    const matching = calls.filter((event) => event.tool_name === tool.name);
    const inputRequired = matching.filter((event) => event.result_type === "input_required").length;
    return { tool_name: tool.name, calls: tool.calls, error_rate: tool.calls ? tool.errors / tool.calls : null, input_required_rate: tool.calls ? inputRequired / tool.calls : null, p95_ms: tool.p95_ms };
  }).sort((a, b) => (b.error_rate || 0) - (a.error_rate || 0) || b.calls - a.calls);
  const toolDetails = toolRows.slice(0, MAX_PUBLIC_DIMENSION_ITEMS).map((tool) => {
    const matching = calls.filter((event) => event.tool_name === tool.name);
    const accountCalls = new Map<string, number>();
    const weekly = new Map<string, { calls: number; errors: number }>();
    for (const event of matching) {
      const key = accountIdentityKey(event);
      if (key) accountCalls.set(key, (accountCalls.get(key) || 0) + 1);
      const timestamp = Date.parse(event.started_at);
      if (!Number.isFinite(timestamp)) continue;
      const bucket = new Date(timestamp);
      bucket.setUTCDate(bucket.getUTCDate() - bucket.getUTCDay());
      bucket.setUTCHours(0, 0, 0, 0);
      const weekKey = bucket.toISOString().slice(0, 10);
      const current = weekly.get(weekKey) || { calls: 0, errors: 0 };
      current.calls += 1;
      if (failed(event)) current.errors += 1;
      weekly.set(weekKey, current);
    }
    return {
      tool_name: tool.name,
      calls: tool.calls,
      error_rate: tool.calls ? tool.errors / tool.calls : null,
      p95_ms: tool.p95_ms,
      top_accounts: [...accountCalls.values()].sort((a, b) => b - a).slice(0, 10).map((count, index) => ({ rank: index + 1, calls: count })),
      trend: [...weekly.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([period_start, value]) => ({ period_start, ...value })),
    };
  });
  const resourceEvents = events.filter((event) => event.mcp_method?.startsWith("resources/"));
  const promptEvents = events.filter((event) => event.mcp_method?.startsWith("prompts/"));
  // A catalog/list/subscribe observation is useful telemetry, but it is not a
  // resource read or prompt invocation. Keep it in interaction_surfaces while
  // excluding it from this product-use read model.
  const resourceReadEvents = resourceEvents.filter((event) => event.mcp_method === "resources/read");
  const promptCallEvents = promptEvents.filter((event) => event.mcp_method === "prompts/get");
  type SurfaceEvent = { event_id?: unknown; mcp_method?: unknown; started_at?: unknown; is_error?: unknown; success?: unknown; result_type?: unknown; interaction_id?: unknown; request_state_hash?: unknown; retry_number?: unknown; retry_of_event_id?: unknown };
  type SurfaceOutcome = "complete" | "stalled" | "errored" | "unknown";
  type SurfaceSummary = { interactions: number; observations: number; complete: number; stalled: number; errored: number; unknown: number; linked_retry_count: number; by_method: Map<string, { interactions: number; complete: number; stalled: number; errored: number; unknown: number }> };
  const surfaceOutcome = (event: SurfaceEvent): SurfaceOutcome => {
    // Do not let success:true turn an explicit input request into completion.
    // A missing result type remains unknown: it is never an inferred success
    // and never an error merely because the outcome was not inspectable.
    if (event.is_error === true || event.success === false) return "errored";
    if (event.result_type === "input_required") return "stalled";
    if (event.result_type === "complete") return "complete";
    return "unknown";
  };
  const surfaceSummary = (items: SurfaceEvent[]): SurfaceSummary => {
    const interactions = new Map<string, { method: string; outcome: SurfaceOutcome; observations: number }>();
    for (const [index, event] of items.entries()) {
      const interactionId = typeof event.interaction_id === "string" && event.interaction_id ? event.interaction_id : null;
      const requestState = typeof event.request_state_hash === "string" && event.request_state_hash ? event.request_state_hash : null;
      // Collapse only evidence that carries a correlation handle. Never group
      // unlinked same-method events, since doing so would invent retry linkage.
      const eventId = typeof event.event_id === "string" && event.event_id ? event.event_id : String(index);
      const key = interactionId ? `interaction:${interactionId}` : requestState ? `request:${requestState}` : `event:${eventId}`;
      const current = interactions.get(key);
      const method = typeof event.mcp_method === "string" && event.mcp_method ? event.mcp_method : "safe method unavailable";
      if (current) {
        current.outcome = surfaceOutcome(event);
        current.observations += 1;
      } else interactions.set(key, { method, outcome: surfaceOutcome(event), observations: 1 });
    }
    const by_method = new Map<string, { interactions: number; complete: number; stalled: number; errored: number; unknown: number }>();
    let complete = 0; let stalled = 0; let errored = 0; let unknown = 0; let linked_retry_count = 0;
    for (const interaction of interactions.values()) {
      if (interaction.outcome === "complete") complete += 1;
      if (interaction.outcome === "stalled") stalled += 1;
      if (interaction.outcome === "errored") errored += 1;
      if (interaction.outcome === "unknown") unknown += 1;
      linked_retry_count += Math.max(0, interaction.observations - 1);
      const method = by_method.get(interaction.method) || { interactions: 0, complete: 0, stalled: 0, errored: 0, unknown: 0 };
      method.interactions += 1;
      method[interaction.outcome] += 1;
      by_method.set(interaction.method, method);
    }
    return { interactions: interactions.size, observations: items.length, complete, stalled, errored, unknown, linked_retry_count, by_method };
  };
  const resourceSummary = surfaceSummary(resourceReadEvents);
  const promptSummary = surfaceSummary(promptCallEvents);
  const previousSurfaceEvents = historyRows.filter((row) => row.event_type === "protocol" && typeof row.started_at === "string" && Date.parse(row.started_at) >= previousPeriodStartMs && Date.parse(row.started_at) < periodStartMs);
  const previousResourceReads = surfaceSummary(previousSurfaceEvents.filter((row) => row.mcp_method === "resources/read")).interactions;
  const previousPromptCalls = surfaceSummary(previousSurfaceEvents.filter((row) => row.mcp_method === "prompts/get")).interactions;
  const groupSurface = (summary: SurfaceSummary) =>
    [...summary.by_method.entries()].sort((a, b) => b[1].interactions - a[1].interactions).slice(0, MAX_PUBLIC_LIST_ITEMS).map(([name, value]) => ({
      name: name.slice(0, 128),
      calls: value.interactions,
      share: summary.interactions ? value.interactions / summary.interactions : null,
      completion_rate: value.interactions ? value.complete / value.interactions : null,
      stall_rate: value.interactions ? value.stalled / value.interactions : null,
      error_rate: value.interactions ? value.errored / value.interactions : null,
      unknown_rate: value.interactions ? value.unknown / value.interactions : null,
    }));
  const surfaceTrend = new Map<string, number>();
  for (const event of [...resourceReadEvents, ...promptCallEvents]) {
    const timestamp = Date.parse(event.started_at);
    if (!Number.isFinite(timestamp)) continue;
    const bucket = new Date(timestamp); bucket.setUTCDate(bucket.getUTCDate() - bucket.getUTCDay()); bucket.setUTCHours(0, 0, 0, 0);
    const kind = event.mcp_method?.startsWith("prompts/") ? "prompt" : "resource";
    const name = event.mcp_method || `${kind} (hashed identity)`;
    const key = `${bucket.toISOString().slice(0, 10)}|${kind}|${name}`;
    surfaceTrend.set(key, (surfaceTrend.get(key) || 0) + 1);
  }
  const resourcePromptActivity = {
    resource_reads: resourceSummary.interactions,
    prompt_calls: promptSummary.interactions,
    resource_observations: resourceSummary.observations,
    prompt_observations: promptSummary.observations,
    previous_period_resource_reads: previousResourceReads,
    previous_period_prompt_calls: previousPromptCalls,
    resource_completion_rate: resourceSummary.interactions ? resourceSummary.complete / resourceSummary.interactions : null,
    resource_stall_rate: resourceSummary.interactions ? resourceSummary.stalled / resourceSummary.interactions : null,
    resource_error_rate: resourceSummary.interactions ? resourceSummary.errored / resourceSummary.interactions : null,
    prompt_completion_rate: promptSummary.interactions ? promptSummary.complete / promptSummary.interactions : null,
    prompt_stall_rate: promptSummary.interactions ? promptSummary.stalled / promptSummary.interactions : null,
    prompt_error_rate: promptSummary.interactions ? promptSummary.errored / promptSummary.interactions : null,
    outcomes: [
      { kind: "resource" as const, interactions: resourceSummary.interactions, complete: resourceSummary.complete, stalled: resourceSummary.stalled, errored: resourceSummary.errored, unknown: resourceSummary.unknown, linked_retry_count: resourceSummary.linked_retry_count },
      { kind: "prompt" as const, interactions: promptSummary.interactions, complete: promptSummary.complete, stalled: promptSummary.stalled, errored: promptSummary.errored, unknown: promptSummary.unknown, linked_retry_count: promptSummary.linked_retry_count },
    ],
    resource_breakdown: groupSurface(resourceSummary),
    prompt_breakdown: groupSurface(promptSummary),
    trend: [...surfaceTrend.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-500).map(([key, calls]) => { const [period_start, kind, name] = key.split("|"); return { period_start, kind: kind as "resource" | "prompt", name, calls }; }),
    limitation: `${historyCapped || historyResult.error ? "Current-period activity is complete, but previous-period comparison is bounded by the available history scan. " : ""}Only resources/read and prompts/get are product-use interactions; list, catalog, and subscription methods remain separate protocol evidence. Missing result type remains unknown rather than success or error. Explicitly linked retries are collapsed to one interaction; unlinked repeats remain distinct observations. Names are represented by safe protocol methods; raw URIs, prompt names, arguments, and contents are never exposed.`,
  };
  const interactions = new Map<string, { path: string[]; stalled: boolean; stalled_step?: string; retried: boolean; terminal_evidence: "explicit_error" | "input_required" | "unknown" }>();
  for (const event of calls) {
    // Interaction/session IDs may be reused by independent servers. Scope the
    // bounded path to the observed server before grouping; a missing server ID
    // is deliberately treated as its own limited-evidence scope.
    const scope = event.server_id || "server-unavailable";
    const key = `${scope.slice(0, 128)}:${(event.interaction_id || event.session_id || event.event_id).slice(0, 128)}`;
    const current = interactions.get(key) || { path: [], stalled: false, retried: false, terminal_evidence: "unknown" as const };
    if (event.tool_name && current.path.length < 50) current.path.push(event.tool_name.slice(0, 128));
    if (event.result_type === "input_required") { current.stalled = true; current.stalled_step ||= event.tool_name?.slice(0, 128); }
    if (event.retry_number != null || event.retry_of_event_id) current.retried = true;
    // Terminal evidence describes the last observed event. An earlier failure
    // followed by a later retry is not presented as where the path stopped.
    current.terminal_evidence = failed(event) ? "explicit_error" : event.result_type === "input_required" ? "input_required" : "unknown";
    interactions.set(key, current);
  }
  const pathGroups = new Map<string, { path: string[]; interactions: number; terminal_evidence: "explicit_error" | "input_required" | "unknown" }>();
  for (const item of interactions.values()) {
    if (!item.path.length) continue;
    const path = item.path.slice(0, 8);
    const key = `${path.join(" → ")}\u0000${item.terminal_evidence}`;
    const current = pathGroups.get(key) || { path, interactions: 0, terminal_evidence: item.terminal_evidence };
    current.interactions += 1;
    // Do not merge differing terminal states under the same visual path.
    // Including the state in the grouping key keeps their evidence distinct.
    pathGroups.set(key, current);
  }
  const journeyGroups = [...pathGroups.values()].sort((a, b) => b.interactions - a.interactions);
  const topPath = journeyGroups[0]?.path || [];
  const topTerminalEvidence = journeyGroups[0]?.terminal_evidence;
  const funnel = topPath.map((step, index) => {
    // Keep the funnel cohort aligned with the winning path/evidence group.
    // Otherwise identical tool paths from different servers or terminal
    // states would be merged into a misleading reach count.
    const reached = [...interactions.values()].filter((item) => item.terminal_evidence === topTerminalEvidence && item.path.slice(0, index + 1).join("\u0000") === topPath.slice(0, index + 1).join("\u0000")).length;
    return { step, reached, share: interactions.size ? reached / interactions.size : null };
  });
  const stallRetryGroups = new Map<string, { step: string; interactions: number; resumed: number }>();
  for (const item of interactions.values()) {
    if (!item.stalled) continue;
    const step = item.stalled_step || "Unknown step";
    const current = stallRetryGroups.get(step) || { step, interactions: 0, resumed: 0 };
    current.interactions += 1;
    if (item.retried) current.resumed += 1;
    stallRetryGroups.set(step, current);
  }
  const journeyActivity = {
    interaction_count: interactions.size,
    typical_journey_length: interactions.size ? [...interactions.values()].map((item) => item.path.length).sort((a, b) => a - b)[Math.floor((interactions.size - 1) * 0.5)] || null : null,
    stalled_interactions: [...interactions.values()].filter((item) => item.stalled).length,
    resumed_after_stall: [...interactions.values()].filter((item) => item.stalled && item.retried).length,
    common_paths: journeyGroups.slice(0, 10).map((item) => ({ path: item.path, interactions: item.interactions, share: interactions.size ? item.interactions / interactions.size : null })),
    drop_off: journeyGroups.slice(0, 10).map((item) => ({ path: item.path, interactions: item.interactions, terminal_evidence: item.terminal_evidence })),
    funnel,
    stall_retry: [...stallRetryGroups.values()].sort((a, b) => b.interactions - a.interactions).slice(0, 10).map((item) => ({ step: item.step, interactions: item.interactions, status: item.resumed > 0 ? "resumed" as const : "not_observed" as const })),
    limitation: "Paths are bounded sequences of observed tool calls scoped to an observed server and grouped by interaction or session identity. Terminal evidence is the latest observed event; missing terminal events are unknown, not abandonment. Cross-server journeys outside this workspace are not visible.",
  };
  // The product outcome surface is intentionally narrower than the general
  // fact stream: a successful tool transport is not evidence that customer
  // work completed. Retain only explicit workflow lifecycle and task-state
  // facts here; tool reliability remains on the capability-quality surface.
  const outcomeEvidenceFacts = facts.filter((fact) =>
    fact.semantic.task_status !== undefined
    || (fact.event_type === "workflow" && (fact.semantic.reason === "workflow_completed" || fact.semantic.reason === "workflow_failed" || fact.semantic.reason === "workflow_pending")),
  );
  const aggregate = aggregateTrackMCPFacts(outcomeEvidenceFacts);
  const allFactsAggregate = aggregateTrackMCPFacts(facts);
  const taskLifecycles = aggregateTaskLifecycles(facts, taskTransitions);
  const taskStates = { working: 0, input_required: 0, completed: 0, failed: 0, cancelled: 0, expired: 0, unknown: 0 };
  for (const task of taskLifecycles) taskStates[task.state] += 1;
  const outcomeTrend = new Map<string, { completed: number; failed: number; unknown: number; pending: number }>();
  for (const fact of outcomeEvidenceFacts) {
    const day = fact.observed_at.slice(0, 10);
    const current = outcomeTrend.get(day) || { completed: 0, failed: 0, unknown: 0, pending: 0 };
    if (fact.semantic.outcome === "completed") current.completed += 1;
    else if (fact.semantic.outcome === "failed") current.failed += 1;
    else if (fact.semantic.outcome === "pending") current.pending += 1;
    else current.unknown += 1;
    outcomeTrend.set(day, current);
  }
  const outcomeActivity = {
    completed: aggregate.outcomes.completed,
    failed: aggregate.outcomes.failed,
    pending: aggregate.outcomes.pending,
    unknown: aggregate.outcomes.unknown,
    not_observable: aggregate.outcomes.not_observable,
    completion_rate: aggregate.workflow_completion_rate,
    error_rate: aggregate.error_rate,
    task_states: taskStates,
    trend: [...outcomeTrend.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-366).map(([period_start, value]) => ({ period_start, ...value })),
    limitation: "Completion and error rates use explicit semantic outcome evidence only. Unknown and not-observable states are retained; missing events are never converted into success, failure, or abandonment.",
  };
  const outcomeEvents = events.filter(isWorkflowLifecycleEvent);
  // Only named workflow outcomes can be grouped. Older SDKs may emit a
  // lifecycle event without workflow_name; do not let that malformed or
  // legacy row crash analytics (or become a fake "undefined" journey).
  const outcomeNames = new Set(
    outcomeEvents
      .map((event) => event.payload?.workflow_name)
      .filter((name): name is string => typeof name === "string" && name.trim().length > 0),
  );
  const explicitOutcomes = [...outcomeNames].map((name) => {
    const matching = outcomeEvents.filter((event) => event.payload?.workflow_name === name);
    const started = matching.filter((event) => event.payload?.status === "started").length;
    const completed = matching.filter((event) => event.payload?.status === "completed").length;
    const failed = matching.filter((event) => event.payload?.status === "failed").length;
    return { name: name.slice(0, 256), started, completed, failed, unresolved: Math.max(0, started - completed - failed) };
  });
  const workflowRows = [...sessions.entries()].map(([id, sessionEvents]) => {
    const sessionCalls = sessionEvents.filter((event) => event.event_type === "tool_call");
    const handle = sessionEvents.find((event) => event.correlation_handle)?.correlation_handle || null;
    const sessionHandleSources = [...new Set(sessionEvents.map((event) => event.correlation_handle_source).filter((source): source is TrackMCPCorrelationHandleSource => Boolean(source && source !== "missing")))];
    const handleSource = sessionHandleSources.length === 1 ? sessionHandleSources[0] : sessionHandleSources.length === 0 ? "missing" : null;
    return { session_id: id.slice(0, 128), correlation_handle: handle ? handle.slice(0, 128) : null, correlation_handle_source: handleSource, client_name: (sessionEvents.find((event) => event.client_name)?.client_name || "Unknown client").slice(0, 256), calls: sessionCalls.length, tools: sessionCalls.map((event) => event.tool_name?.slice(0, 256)).filter(Boolean).slice(0, 200), started_at: sessionEvents[0]?.started_at, duration_ms: sessionEvents.length > 1 ? Math.max(...sessionEvents.map((event) => new Date(event.started_at).getTime())) - new Date(sessionEvents[0].started_at).getTime() : 0, completed: completedForEvents(sessionEvents, failed), completion_source: completionSourceForEvents(sessionEvents), correlation_quality: correlationQualityForEvents(sessionEvents) };
  }).filter((workflow) => workflow.calls > 0).sort((a, b) => b.started_at.localeCompare(a.started_at)).slice(0, 100);
  const completed = workflowRows.filter((workflow) => workflow.completed).length;
  const explicitStarted = explicitOutcomes.reduce((sum, outcome) => sum + outcome.started, 0);
  const explicitCompleted = explicitOutcomes.reduce((sum, outcome) => sum + outcome.completed, 0);
  const timeline = new Map<string, { events: number; calls: number; errors: number }>();
  for (const event of events) { const day = event.started_at.slice(0, 10); const item = timeline.get(day) || { events: 0, calls: 0, errors: 0 }; item.events += 1; if (event.event_type === "tool_call") { item.calls += 1; if (failed(event)) item.errors += 1; } timeline.set(day, item); }
  const insights = [
    ...toolRows.filter((tool) => tool.calls >= MIN_ISSUE_TOOL_CALLS && tool.error_rate >= 0.1).slice(0, 3).map((tool) => ({ level: "error", title: `${tool.name} has elevated observed errors`, detail: `${tool.errors} failed calls across ${tool.calls} observed calls in the selected period. Inspect bounded error evidence before deciding what to change.`, metric: `${tool.errors}/${tool.calls} calls · ${Math.round(tool.error_rate * 100)}% error rate`, affected_volume: tool.errors, eligible_volume: tool.calls, threshold: { minimum_calls: MIN_ISSUE_TOOL_CALLS, error_rate: 0.1 }, confidence: "high" as const, suggested_action: "Open the bounded evidence and compare error classes before changing the capability." })),
    ...toolRows.filter((tool) => tool.calls >= MIN_ISSUE_TOOL_CALLS && tool.avg_ms !== null && tool.avg_ms >= 500).sort((a, b) => (b.avg_ms || 0) - (a.avg_ms || 0)).slice(0, 2).map((tool) => ({ level: "warn", title: `${tool.name} has elevated observed latency`, detail: `Average duration is ${tool.avg_ms}ms across ${tool.calls} observed calls. This is a performance signal, not a root-cause diagnosis.`, metric: `${tool.avg_ms}ms average · ${tool.calls} calls`, affected_volume: tool.calls, eligible_volume: tool.calls, threshold: { minimum_calls: MIN_ISSUE_TOOL_CALLS, average_ms: 500 }, confidence: "medium" as const, suggested_action: "Compare p95 latency and bounded dependency evidence before changing the capability." })),
    ...(unusedTools.length ? [{ level: "info", title: `${unusedTools.length} discovered tool${unusedTools.length === 1 ? " is" : "s are"} unused`, detail: `${unusedTools.slice(0, 3).join(", ")}${unusedTools.length > 3 ? " and more" : ""} were advertised but not called in this period.`, metric: "Review descriptions", affected_volume: unusedTools.length, eligible_volume: unusedTools.length, threshold: { comparison: "advertised_not_observed" }, confidence: "medium" as const, suggested_action: "Review discoverability and descriptions; do not infer that unused means unwanted." }] : []),
    ...(explicitStarted >= MIN_ISSUE_WORKFLOW_STARTS && explicitCompleted / explicitStarted < 0.8 ? [{ level: "warn", title: "Tracked workflows have low observed completion", detail: `${explicitCompleted} completed of ${explicitStarted} explicitly started workflows. This is an investigation signal, not a causal conclusion.`, metric: `${Math.round((explicitCompleted / explicitStarted) * 100)}% complete · ${explicitStarted} starts`, affected_volume: explicitStarted - explicitCompleted, eligible_volume: explicitStarted, threshold: { minimum_workflow_starts: MIN_ISSUE_WORKFLOW_STARTS, completion_rate: 0.8 }, confidence: "high" as const, suggested_action: "Open journey and outcome evidence to inspect explicit terminal states." }] : []),
  ].sort((left, right) => {
    const confidence = (value: "high" | "medium" | "low") => value === "high" ? 0 : value === "medium" ? 1 : 2;
    return confidence(left.confidence) - confidence(right.confidence) || (right.affected_volume || 0) - (left.affected_volume || 0) || left.title.localeCompare(right.title);
  }).slice(0, 5);
  const issueActivity = {
    actionable_signals: insights.length,
    high_confidence_signals: insights.filter((item) => item.confidence === "high").length,
    affected_volume: insights.some((item) => typeof item.affected_volume === "number") ? insights.reduce((sum, item) => sum + (typeof item.affected_volume === "number" ? item.affected_volume : 0), 0) : null,
    suggested_actions: insights.filter((item) => typeof item.suggested_action === "string" && item.suggested_action.length > 0).length,
    limitation: `Signals require at least ${MIN_ISSUE_TOOL_CALLS} observed tool calls or ${MIN_ISSUE_WORKFLOW_STARTS} explicit workflow starts. They are bounded prompts for investigation, not diagnoses. Affected volume is the sum of reported signal volume and may overlap across rules.`,
  };

  const protocols = events.filter((event) => event.event_type === "protocol");
  const protocolVersions = [...new Set(events.map((event) => event.protocol_version).filter(Boolean))];
  const services = [...new Set(events.map((event) => event.service?.trim()).filter((value): value is string => Boolean(value)))];
  const environments = [...new Set(events.map((event) => event.environment?.trim()).filter((value): value is string => Boolean(value)))];
  const transports = [...new Set(events.map((event) => event.transport).filter(Boolean))];
  const methods = [...new Set(events.map((event) => event.mcp_method).filter(Boolean))];
  const protocolSignalCounts: Record<TrackMCPProtocolSignal, number> = { notification: 0, progress: 0, cancelled: 0, catalog_changed: 0, resource_changed: 0, subscription_started: 0, subscription_stopped: 0 };
  const protocolSignalTimeline = new Map<string, Record<TrackMCPProtocolSignal, number>>();
  let protocolSignalEvents = 0;
  const durableSignalRows = durableFamilyRows.filter((row) => row.signal !== undefined);
  const signalRows = durableSignalRows.length
    ? durableSignalRows.map((row) => ({ signal: row.signal as TrackMCPProtocolSignal, started_at: row.observed_at, catalog_change_kind: row.catalog_change_kind }))
    : events.flatMap((event) => {
      const signal = classifyTrackMCPProtocolSignal(event);
      if (!signal) return [];
      const catalogChangeKind = event.mcp_method === "notifications/tools/list_changed"
        ? "tools"
        : event.mcp_method === "notifications/resources/list_changed" || event.mcp_method === "notifications/resources/updated"
          ? "resources"
          : event.mcp_method === "notifications/prompts/list_changed"
            ? "prompts"
            : undefined;
      return [{ signal, started_at: event.started_at, catalog_change_kind: catalogChangeKind }];
    });
  const catalogChangeKinds = { tools: 0, resources: 0, resource_templates: 0, prompts: 0 };
  for (const row of signalRows) {
    const signal = row.signal;
    if (signal) {
      protocolSignalCounts[signal] += 1;
      protocolSignalEvents += 1;
      const day = typeof row.started_at === "string" ? row.started_at.slice(0, 10) : "unknown";
      const dayCounts = protocolSignalTimeline.get(day) || { notification: 0, progress: 0, cancelled: 0, catalog_changed: 0, resource_changed: 0, subscription_started: 0, subscription_stopped: 0 };
      dayCounts[signal] += 1;
      protocolSignalTimeline.set(day, dayCounts);
      if (signal === "catalog_changed" && (row.catalog_change_kind === "tools" || row.catalog_change_kind === "resources" || row.catalog_change_kind === "resource_templates" || row.catalog_change_kind === "prompts")) catalogChangeKinds[row.catalog_change_kind] += 1;
    }
  }
  // Catalog observations already contain bounded SHA-256 identity hashes. We
  // expose only unique counts here; raw resource URIs, prompt names, and
  // arguments never leave the server.
  const resourceEntityHashes = new Set<string>();
  const promptEntityHashes = new Set<string>();
  for (const event of events) {
    if (event.catalog_kind === "resources" || event.catalog_kind === "resource_templates") {
      for (const hash of event.catalog_item_uri_hashes || []) if (/^[a-f0-9]{64}$/i.test(hash)) resourceEntityHashes.add(hash.toLowerCase());
    }
    if (event.catalog_kind === "prompts") {
      for (const hash of event.catalog_item_name_hashes || []) if (/^[a-f0-9]{64}$/i.test(hash)) promptEntityHashes.add(hash.toLowerCase());
    }
  }
  const catalogs = events.filter((event) => event.event_type === "catalog").length;
  const completionSource: CompletionSource = completionSourceForEvents(events);
  const correlationQuality: CorrelationQuality = correlationQualityForEvents(events);
  const handleSources = [...new Set(events.map((event) => event.correlation_handle_source).filter((source): source is TrackMCPCorrelationHandleSource => Boolean(source)))];
  const correlationHandleSource: TrackMCPCorrelationHandleSource | null = handleSources.length === 1 ? handleSources[0] : handleSources.length === 0 ? "missing" : null;
  const responseBody: Record<string, unknown> = { range_days: days, total_events: events.length, protocol_events: protocols.length, catalog_events: catalogs,
    protocol_versions: protocolVersions.slice(0, MAX_PUBLIC_DIMENSION_ITEMS),
    services: services.slice(0, MAX_PUBLIC_DIMENSION_ITEMS),
    environments: environments.slice(0, MAX_PUBLIC_DIMENSION_ITEMS),
    deployment_summary: {
      observed_deployments: deploymentIds.size,
      linked_events: deploymentLinkedEvents,
      limitation: "Count-only deployment linkage derived from telemetry; deployment names, IDs, and release health are not exposed here.",
    },
    interaction_surfaces: {
      resources: { events: resourceEvents.length, methods: [...new Set(resourceEvents.map((event) => event.mcp_method).filter(Boolean))].slice(0, MAX_PUBLIC_DIMENSION_ITEMS), entity_count: resourceEntityHashes.size, entity_identity: "sha256_hash_count", entity_analytics: entityReadAnalytics("resources") },
      prompts: { events: promptEvents.length, methods: [...new Set(promptEvents.map((event) => event.mcp_method).filter(Boolean))].slice(0, MAX_PUBLIC_DIMENSION_ITEMS), entity_count: promptEntityHashes.size, entity_identity: "sha256_hash_count", entity_analytics: entityReadAnalytics("prompts") },
    },
    protocol_signals: { ...protocolSignalCounts, observed_events: protocolSignalEvents, catalog_change_kinds: catalogChangeKinds, timeline: [...protocolSignalTimeline.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-366).map(([date, counts]) => ({ date, ...counts, observed_events: Object.values(counts).reduce((sum, value) => sum + value, 0) })) },
    catalog_snapshot_summary: { ...catalogSnapshotSummary, notification_correlations: catalogCorrelations },
    protocol_family_activity: [...protocolFamilyCounts.entries()].map(([family, observations]) => ({ family: family as TrackMCPProtocolFamily, observations })).sort((a, b) => b.observations - a.observations || a.family.localeCompare(b.family)),
    protocol_family_outcomes: [...protocolFamilyOutcomes.entries()].map(([family, outcome]) => ({ family: family as TrackMCPProtocolFamily, ...outcome })).sort((a, b) => b.observations - a.observations || a.family.localeCompare(b.family)),
    protocol_family_outcome_source: familySource,
    protocol_transport_outcomes: [...protocolTransportOutcomes.values()].sort((a, b) => b.observations - a.observations || a.transport.localeCompare(b.transport)),
    protocol_mrtr_linkage: protocolMrtrLinkage,
    protocol_capability_gaps: protocolCapabilityGaps,
    protocol_decisions: protocolDecisionSummary,
    completion_activity: completionActivity,
    transports: transports.slice(0, MAX_PUBLIC_DIMENSION_ITEMS),
    methods: methods.slice(0, MAX_PUBLIC_DIMENSION_ITEMS),
    tool_calls: calls.length, sessions: workflowRows.length, errors: calls.filter(failed).length,
    completion_rate: explicitStarted > 0 ? explicitCompleted / explicitStarted : workflowRows.length ? completed / workflowRows.length : null,
    completion_source: completionSource, correlation_quality: correlationQuality, correlation_handle_source: correlationHandleSource,
    intent_sources: intentSources,
    missing_capabilities: [...missingCapabilities.entries()].map(([name, reports]) => ({ name: name.slice(0, 256), reports })).sort((a, b) => b.reports - a.reports || a.name.localeCompare(b.name)).slice(0, MAX_PUBLIC_DIMENSION_ITEMS),
    funnel: { connections: events.filter((event) => event.event_type === "session").length, discovered_tools: catalog.size, tool_calls: calls.length, successful_calls: calls.filter((event) => !failed(event)).length },
    tool_adoption: { advertised: catalog.size, observed: toolRows.filter((tool) => tool.calls > 0).length, breadth: catalog.size ? toolRows.filter((tool) => tool.calls > 0).length / catalog.size : null, unused: unusedTools.length },
    timeline: [...timeline.entries()].map(([date, value]) => ({ date, ...value })).slice(-366),
    account_summary: {
      observed_account_keys: observedAccountKeys.size,
      active_account_keys: accountEventCounts.size,
      active_account_keys_7d: recentAccountKeys.size,
      returning_account_keys: [...accountEventDays.values()].filter((days) => days.size > 1).length,
      account_activity_bands: {
        one_event: [...accountEventCounts.values()].filter((count) => count === 1).length,
        repeat: [...accountEventCounts.values()].filter((count) => count >= 2 && count < 10).length,
        high_activity: [...accountEventCounts.values()].filter((count) => count >= 10).length,
      },
      eligible_events: eligibleAccountEvents,
      resolver_linked_events: resolverLinkedEvents,
      unresolved_events: unresolvedEvents,
      resolver_coverage: eligibleAccountEvents ? resolverLinkedEvents / eligibleAccountEvents : null,
      limitation: "Observed resolver-linked account keys are privacy-safe dimensions, not named customers or unique people.",
    },
    clients: [...clients.entries()].map(([name, value]) => ({ name: name.slice(0, 256), calls: value.calls, versions: [...value.versions].slice(0, 20) })).sort((a, b) => b.calls - a.calls).slice(0, MAX_PUBLIC_DIMENSION_ITEMS),
    who_is_using_it: {
      active_accounts: currentAccountKeys.size,
      previous_period_active_accounts: previousPeriodAccounts.size,
      new_accounts: newAccounts,
      returning_accounts: returningAccounts,
      classification_status: historyCapped || historyResult.error ? "insufficient_data" : "available",
      growth,
      client_breakdown: clientBreakdown,
      top_accounts: topAccounts,
      identity_coverage: eligibleAccountEvents ? resolverLinkedEvents / eligibleAccountEvents : null,
      limitation: historyCapped || historyResult.error
        ? "New versus returning classification is unavailable because the bounded history scan was incomplete."
        : "Account identity is resolver-linked and privacy-safe; MCP client names are optional self-reported metadata. Account names are not available from MCP itself.",
    },
    capability_activity: {
      total_calls: calls.length,
      previous_period_calls: previousPeriodCalls,
      overall_error_rate: calls.length ? calls.filter(failed).length / calls.length : null,
      avg_tools_used_per_account: averageToolsUsed,
      advertised_tools: catalog.size,
      adoption_distribution: Object.entries(adoptionBuckets).map(([bucket, accounts]) => ({ bucket: bucket as keyof typeof adoptionBuckets, accounts })),
      trend: capabilityTrend,
      reliability: capabilityReliability,
      tool_details: toolDetails,
      limitation: historyCapped || historyResult.error
        ? "The selected-period tool view is complete, but previous-period comparison is limited by the bounded history scan."
        : "Tool activity is observed at the instrumented server boundary; calls that never reach the server are not included.",
    },
    resource_prompt_activity: resourcePromptActivity,
    journey_activity: journeyActivity,
    outcome_activity: outcomeActivity,
    issue_activity: issueActivity,
    tools: toolRows.slice(0, MAX_PUBLIC_LIST_ITEMS), catalog_tools: [...catalog.values()].slice(0, MAX_PUBLIC_LIST_ITEMS),
    unused_tools: unusedTools.slice(0, MAX_PUBLIC_LIST_ITEMS), workflows: workflowRows.slice(0, 100), outcomes: explicitOutcomes.slice(0, MAX_PUBLIC_DIMENSION_ITEMS),
    founder_os: { facts: allFactsAggregate, groups: outcomeGroups, identity_coverage: identityCoverage, identity_source_counts: identitySourceCounts, tasks: taskLifecycles },
    catalog_versions: catalogVersions,
    catalog_next_cursor: catalogHasMore && catalogVersions.at(-1)?.discovered_at
      ? encodeCatalogCursor(workspaceId, catalogVersions.at(-1)?.discovered_at || "")
      : null,
    catalog_version_status: catalogVersionStatus,
    refresh_status: { status: refreshStatus, ...refreshCounts, max_queue_lag_ms: maxQueueLagMs, max_attempt_count: maxAttemptCount, last_successful_run: lastSuccessfulRun, worker_health: workerHealth },
    data_trust: buildTrackMCPDataTrust({ generatedAt, querySince: since, sourceEventCount: events.length, returnedEventCount: data?.length || 0, queryLimit: analyticsQueryLimit, observedThrough: events.length ? events[events.length - 1].started_at : null }), insights };
  writeCachedAnalytics(supabase, cacheKey, responseBody);
  return NextResponse.json(responseBody);
  };
}

export const GET = createAnalyticsHandler();
