import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/repository/supabase";
import { hashTrackMCPKey } from "@/lib/telemetry/keys";
import type { TrackMCPBatch, TrackMCPEvent } from "@/lib/telemetry/types";

const MAX_EVENTS = 100;

function isEvent(value: unknown): value is TrackMCPEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<TrackMCPEvent>;
  return (
    typeof event.event_id === "string" &&
    typeof event.event_type === "string" &&
    ["protocol", "tool_call", "session", "catalog", "workflow", "custom"].includes(event.event_type) &&
    typeof event.service === "string" &&
    typeof event.environment === "string" &&
    typeof event.started_at === "string"
  );
}

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Ingest service is not configured." }, { status: 503 });
  }

  const authorization = req.headers.get("authorization") || "";
  const apiKey = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!apiKey) return NextResponse.json({ error: "Missing API key." }, { status: 401 });

  let body: TrackMCPBatch;
  try {
    body = (await req.json()) as TrackMCPBatch;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!Array.isArray(body.events) || body.events.length === 0 || body.events.length > MAX_EVENTS) {
    return NextResponse.json({ error: `events must contain 1-${MAX_EVENTS} items.` }, { status: 400 });
  }
  if (!body.events.every(isEvent)) {
    return NextResponse.json({ error: "One or more events are invalid." }, { status: 400 });
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

  const rows = body.events.map((event) => ({
    workspace_id: key.workspace_id,
    event_id: event.event_id,
    event_type: event.event_type,
    service: event.service,
    environment: event.environment,
    server_id: event.server_id || null,
    deployment_id: event.deployment_id || null,
    server_version: event.server_version || null,
    sdk_version: event.sdk_version || null,
    direction: event.direction || null,
    transport: event.transport || null,
    protocol_version: event.protocol_version || null,
    mcp_method: event.mcp_method || null,
    request_id: event.request_id || null,
    session_id: event.session_id || null,
    task_id: event.task_id || null,
    workflow_id: event.workflow_id || null,
    client_name: event.client_name || null,
    tool_name: event.tool_name || null,
    started_at: event.started_at,
    duration_ms: event.duration_ms ?? null,
    success: event.success ?? null,
    is_error: event.is_error ?? null,
    error_class: event.error_class || null,
    error_code: event.error_code ?? null,
    retry_number: event.retry_number ?? 0,
    schema_hash: event.schema_hash || null,
    payload_size_bytes: event.payload_size_bytes ?? null,
    payload: event.payload || {},
  }));

  const { error } = await supabase.from("trackmcp_events").upsert(rows, {
    onConflict: "workspace_id,event_id",
    ignoreDuplicates: true,
  });
  if (error) {
    console.error("TrackMCP ingest failed", { code: error.code, message: error.message });
    return NextResponse.json({ error: "Could not store telemetry." }, { status: 500 });
  }

  return NextResponse.json({ accepted: rows.length });
}
