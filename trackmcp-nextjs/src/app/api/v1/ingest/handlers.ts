import { NextResponse } from "next/server.js";
import { getSupabaseAdmin } from "../../../../lib/repository/supabase.ts";
import { hashTrackMCPKey } from "../../../../lib/telemetry/keys.ts";
import { recordFirstAcceptedIngest } from "../../../../lib/activation/milestones.ts";
import type { CanonicalTrackMCPEvent } from "../../../../lib/telemetry/types.ts";
import { deduplicateEvents, MAX_BATCH_EVENTS, MAX_REQUEST_BYTES, normalizeTrackMCPEvent, sanitizeIngestPayload, sanitizeIntentText } from "../../../../lib/telemetry/validation.ts";
import { projectTrackMCPFact } from "../../../../lib/telemetry/facts.ts";
import { persistTrackMCPFacts } from "../../../../lib/telemetry/fact-writer.ts";
import { evaluateTrackMCPActionQueue, persistTrackMCPActionQueue } from "../../../../lib/telemetry/action-queue.ts";
import { enqueueTrackMCPRefreshJobs, refreshBatchFingerprint } from "../../../../lib/telemetry/refresh-enqueue.ts";

function responseBody(error?: string, rejected = 0) {
  return { accepted: 0, ignored_duplicates: 0, rejected, ...(error ? { error } : {}) };
}

function uuidOrNull(value: string | null | undefined): string | null {
  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

/**
 * Catalog projections reference the server registry. Telemetry clients are
 * allowed to send a stable server UUID before a dashboard user has manually
 * created a registry entry, so materialize the minimal tenant-scoped record
 * here. This is idempotent, contains no payload data, and deliberately does
 * not create environments from untrusted labels.
 */
async function ensureServerRegistryRows(supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>, workspaceId: string, serverIds: readonly (string | null | undefined)[]) {
  const rows = [...new Set(serverIds.map(uuidOrNull).filter((value): value is string => Boolean(value)))].map((serverId) => ({
    id: serverId,
    workspace_id: workspaceId,
    name: `MCP server ${serverId.slice(0, 8)}`,
    slug: `server-${serverId}`,
  }));
  if (!rows.length) return;
  const { error } = await supabase.from("trackmcp_servers").upsert(rows, { onConflict: "id", ignoreDuplicates: false });
  if (error) console.error("TrackMCP server registry upsert failed", { code: error.code, message: error.message });
}

function invalidBatchResponse(reason: string, rejected: number, status = 400) {
  return NextResponse.json(responseBody(reason, rejected), { status });
}

export function createIngestHandler(getAdmin: typeof getSupabaseAdmin = getSupabaseAdmin, options: { refreshJobsEnabled?: boolean } = {}) {
  // Refresh enqueue is part of the supported ingest path now that the queue
  // migration and fail-open worker boundary are shipped. Keep an explicit
  // opt-out for rollback/maintenance, but do not silently disable derived
  // read-model freshness when the environment variable is absent.
  const refreshJobsEnabled = options.refreshJobsEnabled ?? process.env.TRACKMCP_ENABLE_REFRESH_JOBS !== "false";
  return async function POST(req: Request) {
  const supabase = getAdmin();
  if (!supabase) return NextResponse.json({ error: "Ingest service is not configured." }, { status: 503 });

  const authorization = req.headers.get("authorization") || "";
  const apiKey = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!apiKey) return NextResponse.json({ error: "Missing API key." }, { status: 401 });

  let body: unknown;
  try {
    const rawBody = await req.arrayBuffer();
    if (rawBody.byteLength > MAX_REQUEST_BYTES) return invalidBatchResponse(`request exceeds ${MAX_REQUEST_BYTES} bytes`, 0, 413);
    body = JSON.parse(new TextDecoder().decode(rawBody)) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !Array.isArray((body as { events?: unknown }).events)) {
    return invalidBatchResponse("events must be an array", 0);
  }
  const rawEvents = (body as { events: unknown[] }).events;
  if (rawEvents.length === 0 || rawEvents.length > MAX_BATCH_EVENTS) {
    return invalidBatchResponse(`events must contain 1-${MAX_BATCH_EVENTS} items`, rawEvents.length > MAX_BATCH_EVENTS ? rawEvents.length : 0, 413);
  }

  const normalized: CanonicalTrackMCPEvent[] = [];
  for (const rawEvent of rawEvents) {
    const result = normalizeTrackMCPEvent(rawEvent);
    if (!result.ok) return invalidBatchResponse(result.reason, 1);
    normalized.push(result.event);
  }

  const { data: key, error: keyError } = await supabase
    .from("trackmcp_api_keys")
    .select("id, workspace_id, revoked_at")
    .eq("key_hash", hashTrackMCPKey(apiKey))
    .maybeSingle();
  if (keyError || !key || key.revoked_at) {
    if (keyError) console.error("TrackMCP API key lookup failed", { code: keyError.code, message: keyError.message });
    return NextResponse.json({ error: "Invalid or revoked API key." }, { status: 401 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("trackmcp_events")
    .select("event_id")
    .eq("workspace_id", key.workspace_id)
    .in("event_id", normalized.map((event) => event.event_id));
  if (existingError) {
    console.error("TrackMCP duplicate check failed", { code: existingError.code, message: existingError.message });
    return NextResponse.json({ error: "Could not store telemetry." }, { status: 500 });
  }
  const existingIds = new Set((existing || []).map((row: { event_id: string }) => row.event_id));
  const deduplicated = deduplicateEvents(normalized, existingIds);
  const rows = deduplicated.events.map((event) => {
    const payload = event.payload ? sanitizeIngestPayload(event.payload) : {};
    const payloadSize = event.payload ? new TextEncoder().encode(JSON.stringify(payload)).byteLength : event.payload_size_bytes ?? null;
    return {
    workspace_id: key.workspace_id,
    schema_version: event.schema_version,
    event_id: event.event_id,
    event_type: event.event_type,
    service: event.service,
    environment: event.environment,
    // server_id is UUID-typed in the existing schema; string resource IDs are intentionally not coerced into UUIDs.
    server_id: uuidOrNull(event.server_id),
    deployment_id: event.deployment_id || null,
    server_version: event.server_version || null,
    sdk_version: event.sdk_version || null,
    observation_source: event.observation_source || null,
    direction: event.direction || null,
    transport: event.transport || null,
    protocol_version: event.protocol_version || null,
    mcp_method: event.mcp_method || null,
    request_id: event.request_id || null,
    session_id: event.session_id || null,
    session_id_source: event.session_id_source || null,
    correlation_handle: event.correlation_handle || null,
    correlation_handle_source: event.correlation_handle_source || "missing",
    context: sanitizeIntentText(event.context) || null,
    intent_source: event.intent_source || "missing",
    missing_capability: sanitizeIntentText(event.missing_capability) || null,
    task_id: event.task_id || null,
    workflow_id: event.workflow_id || null,
    client_name: event.client_name || null,
    client_version: event.client_version || null,
    account_key: event.account_key || null,
    account_identity_source: event.account_identity_source || "unresolved",
    tool_name: event.tool_name || null,
    tool_description: event.tool_description || null,
    tool_description_hash: event.tool_description_hash || null,
    started_at: event.started_at,
    duration_ms: event.duration_ms ?? null,
    success: event.success ?? null,
    is_error: event.is_error ?? null,
    error_class: event.error_class || null,
    error_code: event.error_code ?? null,
    retry_number: event.retry_number ?? 0,
    result_type: event.result_type || null,
    interaction_id: event.interaction_id || null,
    interaction_link_source: event.interaction_link_source || "missing",
    retry_of_event_id: event.retry_of_event_id || null,
    request_state_hash: event.request_state_hash || null,
    input_request_count: event.input_request_count ?? null,
    input_response_count: event.input_response_count ?? null,
    resource_audience: event.resource_audience || null,
    resource_priority: event.resource_priority ?? null,
    schema_hash: event.schema_hash || null,
    catalog_kind: event.catalog_kind || null,
    catalog_item_count: event.catalog_item_count ?? null,
    catalog_item_name_hashes: event.catalog_item_name_hashes || [],
    catalog_item_uri_hashes: event.catalog_item_uri_hashes || [],
    payload_size_bytes: payloadSize,
    payload_policy: event.payload_policy || null,
    payload,
    };
  });

  if (rows.length) {
    const { error } = await supabase.from("trackmcp_events").upsert(rows, {
      onConflict: "workspace_id,event_id",
      ignoreDuplicates: true,
    });
    if (error) {
      console.error("TrackMCP ingest failed", { code: error.code, message: error.message });
      return NextResponse.json({ error: "Could not store telemetry." }, { status: 500 });
    }
    // Keep catalog refreshes referentially valid without making registry
    // availability a reason to reject otherwise accepted telemetry.
    await ensureServerRegistryRows(supabase, key.workspace_id, rows.map((row) => row.server_id));
  }

  // The derived fact table is opt-in until its reviewed migration is applied.
  // Fact persistence is best-effort and must never turn accepted telemetry into
  // a failed ingest response.
  if (rows.length && process.env.TRACKMCP_ENABLE_FACT_WRITES === "true") {
    const facts = deduplicated.events.map(projectTrackMCPFact);
    const factResult = await persistTrackMCPFacts(
      supabase,
      key.workspace_id,
      facts,
    );
    if (factResult.error) console.error("TrackMCP semantic fact persistence failed", { code: factResult.error.code, message: factResult.error.message });
    const queueResult = await persistTrackMCPActionQueue(supabase, evaluateTrackMCPActionQueue(key.workspace_id, facts));
    if (queueResult.error) console.error("TrackMCP action queue persistence failed", { code: queueResult.error.code, message: queueResult.error.message });
  }

  // Derived work is opt-in until the reviewed queue migration and external
  // worker are deployed. Never turn accepted telemetry into a failed ingest
  // response merely because a downstream projection is unavailable.
  if (rows.length && refreshJobsEnabled) {
    const queued = await enqueueTrackMCPRefreshJobs(supabase, key.workspace_id, new Date(), refreshBatchFingerprint(deduplicated.events.map((event) => event.event_id)));
    if (queued.error) console.error("TrackMCP derived refresh enqueue failed", { code: queued.error.code, message: queued.error.message });
  }

  if (rows.length) {
    const milestone = await recordFirstAcceptedIngest(supabase, key.workspace_id, key.id, rows[0]);
    if (milestone.error) console.error("TrackMCP activation milestone failed", { code: milestone.error.code, message: milestone.error.message });
  }

  return NextResponse.json({ accepted: rows.length, ignored_duplicates: deduplicated.ignored, rejected: 0 });
  };
}

export const POST = createIngestHandler();
