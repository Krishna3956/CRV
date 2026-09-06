import { NextResponse } from "next/server.js";
import { getSupabaseServer } from "../../../../lib/auth/supabase-server.ts";
import { getSupabaseAdmin } from "../../../../lib/repository/supabase.ts";
import { hashTrackMCPKey } from "../../../../lib/telemetry/keys.ts";
import { analyzeToolQuality, type ToolQualityEvent } from "../../../../lib/telemetry/tool-quality.ts";

const MAX_SOURCE_EVENTS = 10000;
const DEFAULT_DAYS = 30;

function parseDays(request: Request): number | null {
  const raw = new URL(request.url).searchParams.get("days");
  if (raw === null || raw === "") return DEFAULT_DAYS;
  if (!/^\d+$/.test(raw)) return null;
  const days = Number(raw);
  return Number.isSafeInteger(days) && days >= 1 && days <= 90 ? days : null;
}

export function createToolQualityHandler(
  getAdmin: typeof getSupabaseAdmin = getSupabaseAdmin,
  getServer: typeof getSupabaseServer = getSupabaseServer,
) {
  return async function GET(request: Request) {
    const supabase = getAdmin();
    if (!supabase) return NextResponse.json({ error: "Analytics service is not configured." }, { status: 503 });

    const authorization = request.headers.get("authorization") || "";
    const apiKey = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    let workspaceId: string | undefined;
    if (apiKey) {
      const { data: key, error } = await supabase.from("trackmcp_api_keys").select("workspace_id, revoked_at").eq("key_hash", hashTrackMCPKey(apiKey)).maybeSingle();
      if (error) return NextResponse.json({ error: "Could not authenticate tool-quality request." }, { status: 500 });
      if (!key || key.revoked_at) return NextResponse.json({ error: "Invalid or revoked API key." }, { status: 401 });
      workspaceId = key.workspace_id;
    } else {
      const auth = await getServer();
      const { data: userData } = await auth.auth.getUser();
      if (!userData.user) return NextResponse.json({ error: "Sign in or provide a workspace API key." }, { status: 401 });
      const { data: membership, error } = await supabase.from("trackmcp_workspace_members").select("workspace_id").eq("user_id", userData.user.id).limit(1).maybeSingle();
      if (error) return NextResponse.json({ error: "Could not authenticate dashboard request." }, { status: 500 });
      if (!membership) return NextResponse.json({ error: "Create a workspace first." }, { status: 404 });
      workspaceId = membership.workspace_id;
    }

    const days = parseDays(request);
    if (days === null) return NextResponse.json({ error: "days must be an integer from 1 through 90." }, { status: 400 });
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const { data, error } = await supabase.from("trackmcp_events")
      .select("event_type, service, environment, server_id, deployment_id, observation_source, session_id, correlation_handle, workflow_id, client_name, intent_source, tool_name, tool_description_hash, schema_hash, started_at, success, is_error, retry_number, payload_policy, payload")
      .eq("workspace_id", workspaceId)
      .gte("started_at", since)
      .order("started_at", { ascending: true })
      .limit(MAX_SOURCE_EVENTS + 1);
    if (error) return NextResponse.json({ error: "Could not load tool-quality analytics." }, { status: 500 });

    const rows = (data || []) as ToolQualityEvent[];
    const truncated = rows.length > MAX_SOURCE_EVENTS;
    return NextResponse.json(analyzeToolQuality(rows.slice(0, MAX_SOURCE_EVENTS), { rangeDays: days, truncated }));
  };
}

export const GET = createToolQualityHandler();
