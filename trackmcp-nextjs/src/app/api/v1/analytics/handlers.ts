import { NextResponse } from "next/server.js";
import { getSupabaseServer } from "../../../../lib/auth/supabase-server.ts";
import { getSupabaseAdmin } from "../../../../lib/repository/supabase.ts";
import { hashTrackMCPKey } from "../../../../lib/telemetry/keys.ts";
import type { CatalogTool, CompletionSource, CorrelationQuality } from "../../../../lib/telemetry/analytics-types.ts";
import { completedForEvents, completionSourceForEvents, correlationQualityForEvents, isWorkflowLifecycleEvent, percentile } from "../../../../lib/telemetry/analytics.ts";
import type { CanonicalTrackMCPEvent, TrackMCPCorrelationHandleSource, TrackMCPIntentSource, TrackMCPObservationSource, TrackMCPSessionIdSource } from "../../../../lib/telemetry/types.ts";
import { projectTrackMCPFact } from "../../../../lib/telemetry/facts.ts";
import { aggregateTrackMCPFacts, aggregateTrackMCPFactsBy, type TrackMCPOutcomeGroupBy } from "../../../../lib/telemetry/outcomes.ts";
import { buildTrackMCPDataTrust } from "../../../../lib/telemetry/data-trust.ts";
import { classifyTrackMCPProtocolSignal, type TrackMCPProtocolSignal } from "../../../../lib/telemetry/semantic.ts";

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
  tool_name: string | null;
  tool_description: string | null;
  tool_description_hash: string | null;
  duration_ms: number | null;
  success: boolean | null;
  is_error: boolean | null;
  error_class: string | null;
  error_code: number | null;
  retry_number: number | null;
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
const boundedText = (value: unknown, max: number): string | null =>
  typeof value === "string" ? value.slice(0, max) : null;

function failed(event: { is_error?: boolean | null; success?: boolean | null }) { return event.is_error === true || event.success === false; }

function canonicalEventFromRow(event: EventRow): CanonicalTrackMCPEvent {
  const normalized = Object.fromEntries(Object.entries({ ...event, payload: event.payload || undefined }).filter(([, value]) => value !== null));
  return normalized as unknown as CanonicalTrackMCPEvent;
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

  const requestedDays = Number(url.searchParams.get("days") || 30);
  const days = Number.isFinite(requestedDays) ? Math.min(90, Math.max(1, Math.floor(requestedDays))) : 30;
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const analyticsQueryLimit = 10000;
  const generatedAt = new Date().toISOString();
  const { data, error } = await supabase.from("trackmcp_events")
    .select("event_id, schema_version, event_type, service, environment, server_id, deployment_id, server_version, sdk_version, observation_source, direction, transport, protocol_version, mcp_method, request_id, session_id, session_id_source, correlation_handle, correlation_handle_source, context, intent_source, missing_capability, task_id, workflow_id, client_name, client_version, account_key, account_identity_source, tool_name, tool_description, tool_description_hash, duration_ms, success, is_error, error_class, error_code, retry_number, schema_hash, catalog_kind, catalog_item_count, catalog_item_name_hashes, catalog_item_uri_hashes, payload_size_bytes, payload_policy, started_at, payload")
    .eq("workspace_id", workspaceId).gte("started_at", since).order("started_at", { ascending: true }).limit(analyticsQueryLimit);
  if (error) return NextResponse.json({ error: "Could not load analytics." }, { status: 500 });

  // Snapshot rows are service-written and explicitly workspace-scoped by the
  // additive catalog migration. If an operator has not applied that migration
  // yet, preserve the current analytics response and expose a truthful status
  // instead of turning the whole dashboard into a 500.
  const catalogBeforeParam = url.searchParams.get("catalog_before");
  const catalogBefore = catalogBeforeParam && Number.isFinite(Date.parse(catalogBeforeParam)) ? new Date(catalogBeforeParam).toISOString() : null;
  const catalogQuery = supabase.from("trackmcp_catalog_versions")
    .select("id,server_id,environment_id,catalog_kind,item_count,item_name_hashes,item_uri_hashes,snapshot_hash,previous_snapshot_id,complete,truncated,diff,discovered_at")
    .eq("workspace_id", workspaceId).gte("discovered_at", since).order("discovered_at", { ascending: false });
  if (catalogBefore) catalogQuery.lt("discovered_at", catalogBefore);
  const catalogVersionsResult = await catalogQuery.limit(101);
  const rawCatalogVersions: unknown[] = catalogVersionsResult.error ? [] : (catalogVersionsResult.data || []) as unknown[];
  const catalogHasMore = rawCatalogVersions.length > 100;
  const catalogPageRows = rawCatalogVersions.slice(0, 100);
  const catalogVersions = catalogPageRows.filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object")).map((row) => ({
    id: boundedText(row.id, 128),
    server_id: boundedText(row.server_id, 128),
    environment_id: boundedText(row.environment_id, 128),
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
  const catalogVersionStatus = catalogVersionsResult.error ? "schema_unavailable" : catalogVersions.length ? "available" : "no_snapshot_rows";
  const entityReadsResult = await supabase.from("trackmcp_catalog_entity_reads")
    .select("catalog_kind,entity_hash,success,is_error,result_type,observed_at")
    .eq("workspace_id", workspaceId).gte("observed_at", since).order("observed_at", { ascending: true }).limit(10001);
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

  const events = ((data || []) as EventRow[]).filter((event) => event.observation_source === "server");
  const facts = events.map(canonicalEventFromRow).map(projectTrackMCPFact);
  const identityEligible = events.filter((event) => event.account_identity_source === "resolver" || event.account_identity_source === "unresolved").length;
  const identityResolved = events.filter((event) => event.account_identity_source === "resolver" && Boolean(event.account_key)).length;
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
  const observedAccountKeys = new Set<string>();
  let resolverLinkedEvents = 0;
  let unresolvedEvents = 0;
  for (const event of calls) {
    if (event.account_identity_source === "resolver" && event.account_key) {
      observedAccountKeys.add(event.account_key);
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
  const outcomeEvents = events.filter(isWorkflowLifecycleEvent);
  const outcomeNames = new Set(outcomeEvents.map((event) => event.payload?.workflow_name as string));
  const explicitOutcomes = [...outcomeNames].map((name) => { const matching = outcomeEvents.filter((event) => event.payload?.workflow_name === name); return { name: name.slice(0, 256), started: matching.filter((event) => event.payload?.status === "started").length, completed: matching.filter((event) => event.payload?.status === "completed").length, failed: matching.filter((event) => event.payload?.status === "failed").length }; });
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
    ...toolRows.filter((tool) => tool.error_rate >= 0.1).slice(0, 3).map((tool) => ({ level: "error", title: `${tool.name} is failing ${Math.round(tool.error_rate * 100)}% of calls`, detail: `${tool.errors} failed calls in the selected period. Inspect its arguments and returned errors first.`, metric: `${tool.errors} errors` })),
    ...toolRows.filter((tool) => tool.avg_ms !== null && tool.avg_ms >= 500).sort((a, b) => (b.avg_ms || 0) - (a.avg_ms || 0)).slice(0, 2).map((tool) => ({ level: "warn", title: `${tool.name} is slowing down sessions`, detail: `Average duration is ${tool.avg_ms}ms. Slow tools compound when agents chain several calls.`, metric: `${tool.avg_ms}ms average` })),
    ...(unusedTools.length ? [{ level: "info", title: `${unusedTools.length} discovered tool${unusedTools.length === 1 ? " is" : "s are"} unused`, detail: `${unusedTools.slice(0, 3).join(", ")}${unusedTools.length > 3 ? " and more" : ""} were advertised but not called in this period.`, metric: "Review descriptions" }] : []),
    ...(explicitStarted > 0 && explicitCompleted / explicitStarted < 0.8 ? [{ level: "warn", title: "Some tracked workflows are not completing", detail: "Compare the failing workflow steps with their tool sequences to find the point where users get stuck.", metric: `${Math.round((explicitCompleted / explicitStarted) * 100)}% complete` }] : []),
  ].slice(0, 5);

  const protocols = events.filter((event) => event.event_type === "protocol");
  const protocolVersions = [...new Set(events.map((event) => event.protocol_version).filter(Boolean))];
  const services = [...new Set(events.map((event) => event.service?.trim()).filter((value): value is string => Boolean(value)))];
  const environments = [...new Set(events.map((event) => event.environment?.trim()).filter((value): value is string => Boolean(value)))];
  const transports = [...new Set(events.map((event) => event.transport).filter(Boolean))];
  const methods = [...new Set(events.map((event) => event.mcp_method).filter(Boolean))];
  const protocolSignalCounts: Record<TrackMCPProtocolSignal, number> = { notification: 0, progress: 0, catalog_changed: 0, subscription_started: 0, subscription_stopped: 0 };
  let protocolSignalEvents = 0;
  for (const event of events) {
    const signal = classifyTrackMCPProtocolSignal(event);
    if (signal) {
      protocolSignalCounts[signal] += 1;
      protocolSignalEvents += 1;
    }
  }
  const resourceEvents = events.filter((event) => event.mcp_method?.startsWith("resources/"));
  const promptEvents = events.filter((event) => event.mcp_method?.startsWith("prompts/"));
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
  return NextResponse.json({ range_days: days, total_events: events.length, protocol_events: protocols.length, catalog_events: catalogs,
    protocol_versions: protocolVersions.slice(0, MAX_PUBLIC_DIMENSION_ITEMS),
    services: services.slice(0, MAX_PUBLIC_DIMENSION_ITEMS),
    environments: environments.slice(0, MAX_PUBLIC_DIMENSION_ITEMS),
    interaction_surfaces: {
      resources: { events: resourceEvents.length, methods: [...new Set(resourceEvents.map((event) => event.mcp_method).filter(Boolean))].slice(0, MAX_PUBLIC_DIMENSION_ITEMS), entity_count: resourceEntityHashes.size, entity_identity: "sha256_hash_count", entity_analytics: entityReadAnalytics("resources") },
      prompts: { events: promptEvents.length, methods: [...new Set(promptEvents.map((event) => event.mcp_method).filter(Boolean))].slice(0, MAX_PUBLIC_DIMENSION_ITEMS), entity_count: promptEntityHashes.size, entity_identity: "sha256_hash_count", entity_analytics: entityReadAnalytics("prompts") },
    },
    protocol_signals: { ...protocolSignalCounts, observed_events: protocolSignalEvents },
    transports: transports.slice(0, MAX_PUBLIC_DIMENSION_ITEMS),
    methods: methods.slice(0, MAX_PUBLIC_DIMENSION_ITEMS),
    tool_calls: calls.length, sessions: workflowRows.length, errors: calls.filter(failed).length,
    completion_rate: explicitStarted > 0 ? explicitCompleted / explicitStarted : workflowRows.length ? completed / workflowRows.length : null,
    completion_source: completionSource, correlation_quality: correlationQuality, correlation_handle_source: correlationHandleSource,
    intent_sources: intentSources,
    missing_capabilities: [...missingCapabilities.entries()].map(([name, reports]) => ({ name: name.slice(0, 256), reports })).sort((a, b) => b.reports - a.reports || a.name.localeCompare(b.name)).slice(0, MAX_PUBLIC_DIMENSION_ITEMS),
    funnel: { connections: events.filter((event) => event.event_type === "session").length, discovered_tools: catalog.size, tool_calls: calls.length, successful_calls: calls.filter((event) => !failed(event)).length },
    timeline: [...timeline.entries()].map(([date, value]) => ({ date, ...value })).slice(-366),
    account_summary: {
      observed_account_keys: observedAccountKeys.size,
      eligible_events: eligibleAccountEvents,
      resolver_linked_events: resolverLinkedEvents,
      unresolved_events: unresolvedEvents,
      resolver_coverage: eligibleAccountEvents ? resolverLinkedEvents / eligibleAccountEvents : null,
      limitation: "Observed resolver-linked account keys are privacy-safe dimensions, not named customers or unique people.",
    },
    clients: [...clients.entries()].map(([name, value]) => ({ name: name.slice(0, 256), calls: value.calls, versions: [...value.versions].slice(0, 20) })).sort((a, b) => b.calls - a.calls).slice(0, MAX_PUBLIC_DIMENSION_ITEMS),
    tools: toolRows.slice(0, MAX_PUBLIC_LIST_ITEMS), catalog_tools: [...catalog.values()].slice(0, MAX_PUBLIC_LIST_ITEMS),
    unused_tools: unusedTools.slice(0, MAX_PUBLIC_LIST_ITEMS), workflows: workflowRows.slice(0, 100), outcomes: explicitOutcomes.slice(0, MAX_PUBLIC_DIMENSION_ITEMS),
    founder_os: { facts: aggregateTrackMCPFacts(facts), groups: outcomeGroups, identity_coverage: identityCoverage, identity_source_counts: identitySourceCounts },
    catalog_versions: catalogVersions,
    catalog_next_cursor: catalogHasMore ? catalogVersions.at(-1)?.discovered_at || null : null,
    catalog_version_status: catalogVersionStatus,
    refresh_status: { status: refreshStatus, ...refreshCounts, max_queue_lag_ms: maxQueueLagMs, max_attempt_count: maxAttemptCount, last_successful_run: lastSuccessfulRun },
    data_trust: buildTrackMCPDataTrust({ generatedAt, querySince: since, sourceEventCount: events.length, returnedEventCount: data?.length || 0, queryLimit: analyticsQueryLimit, observedThrough: events.length ? events[events.length - 1].started_at : null }), insights });
  };
}

export const GET = createAnalyticsHandler();
