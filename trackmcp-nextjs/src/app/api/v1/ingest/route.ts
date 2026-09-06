import { NextResponse } from "next/server.js";
import { getSupabaseAdmin } from "../../../../lib/repository/supabase.ts";
import { hashTrackMCPKey } from "../../../../lib/telemetry/keys.ts";
import type { CanonicalTrackMCPEvent } from "../../../../lib/telemetry/types.ts";
import { deduplicateEvents, MAX_BATCH_EVENTS, MAX_REQUEST_BYTES, normalizeTrackMCPEvent, sanitizeIngestPayload, sanitizeIntentText } from "../../../../lib/telemetry/validation.ts";

function responseBody(error?: string, rejected = 0) {
  return { accepted: 0, ignored_duplicates: 0, rejected, ...(error ? { error } : {}) };
}

function uuidOrNull(value: string | undefined): string | null {
  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

function invalidBatchResponse(reason: string, rejected: number, status = 400) {
  return NextResponse.json(responseBody(reason, rejected), { status });
}

export function createIngestHandler(getAdmin: typeof getSupabaseAdmin = getSupabaseAdmin) {
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
    .select("workspace_id, revoked_at")
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
    schema_hash: event.schema_hash || null,
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
  }

  return NextResponse.json({ accepted: rows.length, ignored_duplicates: deduplicated.ignored, rejected: 0 });
  };
}

export const POST = createIngestHandler();
