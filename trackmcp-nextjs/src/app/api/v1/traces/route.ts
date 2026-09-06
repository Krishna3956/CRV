import { NextResponse } from "next/server.js";
import { getSupabaseServer } from "../../../../lib/auth/supabase-server.ts";
import { getSupabaseAdmin } from "../../../../lib/repository/supabase.ts";
import { hashTrackMCPKey } from "../../../../lib/telemetry/keys.ts";
import type { TraceResponse } from "../../../../lib/telemetry/analytics-types.ts";
import { traceResponse, traceScope } from "../../../../lib/telemetry/trace.ts";

export const DEFAULT_TRACE_LIMIT = 200;
export const MAX_TRACE_LIMIT = 1000;

type AdminClient = NonNullable<ReturnType<typeof getSupabaseAdmin>>;
type ServerClient = Awaited<ReturnType<typeof getSupabaseServer>>;

async function workspaceFor(request: Request, getAdmin: () => AdminClient | null, getServer: () => Promise<ServerClient>) {
  const admin = getAdmin();
  if (!admin) return { admin: null, workspaceId: null, status: 503 } as const;
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (token) {
    const result = await admin.from("trackmcp_api_keys").select("workspace_id, revoked_at").eq("key_hash", hashTrackMCPKey(token)).maybeSingle();
    if (result.error) return { admin, workspaceId: null, status: 500 } as const;
    return { admin, workspaceId: result.data && !result.data.revoked_at ? result.data.workspace_id : null, status: result.data && !result.data.revoked_at ? 200 : 401 } as const;
  }
  const auth = await getServer();
  const { data } = await auth.auth.getUser();
  if (!data.user) return { admin, workspaceId: null, status: 401 } as const;
  const membership = await admin.from("trackmcp_workspace_members").select("workspace_id").eq("user_id", data.user.id).limit(1).maybeSingle();
  if (membership.error) return { admin, workspaceId: null, status: 500 } as const;
  return { admin, workspaceId: membership.data?.workspace_id || null, status: membership.data ? 200 : 404 } as const;
}

function parseLimit(url: URL): number | null {
  const raw = url.searchParams.get("limit");
  if (raw === null || raw === "") return DEFAULT_TRACE_LIMIT;
  if (!/^\d+$/.test(raw)) return null;
  const limit = Number(raw);
  return Number.isSafeInteger(limit) && limit > 0 && limit <= MAX_TRACE_LIMIT ? limit : null;
}

export function createTraceHandler(
  getAdmin: () => AdminClient | null = getSupabaseAdmin,
  getServer: () => Promise<ServerClient> = getSupabaseServer,
) {
  return async function GET(request: Request) {
    const auth = await workspaceFor(request, getAdmin, getServer);
    if (!auth.admin || !auth.workspaceId) return NextResponse.json({ error: "Sign in or provide a valid workspace API key." }, { status: auth.status });
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("session_id")?.trim() || null;
    const correlationHandle = url.searchParams.get("correlation_handle")?.trim() || null;
    if (!sessionId && !correlationHandle) return NextResponse.json({ error: "session_id or correlation_handle is required." }, { status: 400 });
    const limit = parseLimit(url);
    if (limit === null) return NextResponse.json({ error: `limit must be an integer from 1 to ${MAX_TRACE_LIMIT}.` }, { status: 400 });
    const scope = traceScope(auth.workspaceId, sessionId || "");
    let query = auth.admin.from("trackmcp_events").select("schema_version, event_id, event_type, service, environment, server_id, deployment_id, server_version, sdk_version, observation_source, direction, transport, protocol_version, mcp_method, request_id, session_id, session_id_source, correlation_handle, correlation_handle_source, context, intent_source, missing_capability, task_id, workflow_id, client_name, client_version, tool_name, tool_description, tool_description_hash, started_at, duration_ms, success, is_error, error_class, error_code, retry_number, schema_hash, payload_size_bytes, payload_policy, payload").eq("workspace_id", scope.workspaceId);
    if (sessionId) query = query.eq("session_id", sessionId);
    if (correlationHandle) query = query.eq("correlation_handle", correlationHandle);
    const { data, error } = await query.order("started_at", { ascending: true }).limit(limit + 1);
    if (error) return NextResponse.json({ error: "Could not load trace." }, { status: 500 });
    const rows = (data || []) as TraceResponse["events"];
    const events = rows.slice(0, limit);
    return NextResponse.json(traceResponse(sessionId, events, { correlationHandle, truncated: rows.length > limit }));
  };
}

export const GET = createTraceHandler();
