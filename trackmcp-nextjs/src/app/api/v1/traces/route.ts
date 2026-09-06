import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/auth/supabase-server";
import { getSupabaseAdmin } from "@/lib/repository/supabase";
import { hashTrackMCPKey } from "@/lib/telemetry/keys";
import type { TraceResponse } from "@/lib/telemetry/analytics-types";
import { traceResponse, traceScope } from "@/lib/telemetry/trace";

async function workspaceFor(request: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) return { admin: null, workspaceId: null, status: 503 } as const;
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (token) {
    const result = await admin.from("trackmcp_api_keys").select("workspace_id, revoked_at").eq("key_hash", hashTrackMCPKey(token)).maybeSingle();
    if (result.error) return { admin, workspaceId: null, status: 500 } as const;
    return { admin, workspaceId: result.data && !result.data.revoked_at ? result.data.workspace_id : null, status: result.data && !result.data.revoked_at ? 200 : 401 } as const;
  }
  const auth = await getSupabaseServer();
  const { data } = await auth.auth.getUser();
  if (!data.user) return { admin, workspaceId: null, status: 401 } as const;
  const membership = await admin.from("trackmcp_workspace_members").select("workspace_id").eq("user_id", data.user.id).limit(1).maybeSingle();
  return { admin, workspaceId: membership.data?.workspace_id || null, status: membership.data ? 200 : 404 } as const;
}

export async function GET(request: Request) {
  const auth = await workspaceFor(request);
  if (!auth.admin || !auth.workspaceId) return NextResponse.json({ error: "Sign in or provide a valid workspace API key." }, { status: auth.status });
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "session_id is required." }, { status: 400 });
  const scope = traceScope(auth.workspaceId, sessionId);
  const { data, error } = await auth.admin.from("trackmcp_events").select("schema_version, event_id, event_type, service, environment, server_id, deployment_id, server_version, sdk_version, direction, transport, protocol_version, mcp_method, request_id, session_id, session_id_source, task_id, workflow_id, client_name, client_version, tool_name, tool_description, tool_description_hash, started_at, duration_ms, success, is_error, error_class, error_code, retry_number, schema_hash, payload_size_bytes, payload_policy, payload").eq("workspace_id", scope.workspaceId).eq("session_id", scope.sessionId).order("started_at", { ascending: true }).limit(1000);
  if (error) return NextResponse.json({ error: "Could not load trace." }, { status: 500 });
  const response: TraceResponse = traceResponse(sessionId, (data || []) as TraceResponse["events"]);
  return NextResponse.json(response);
}
