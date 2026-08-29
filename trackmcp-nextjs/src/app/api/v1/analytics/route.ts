import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/auth/supabase-server";
import { getSupabaseAdmin } from "@/lib/repository/supabase";
import { hashTrackMCPKey } from "@/lib/telemetry/keys";

type EventRow = {
  event_type: "protocol" | "tool_call" | "session" | "catalog" | "workflow" | "custom";
  service: string;
  environment: string;
  direction: string | null;
  transport: string | null;
  protocol_version: string | null;
  mcp_method: string | null;
  request_id: string | null;
  session_id: string | null;
  client_name: string | null;
  tool_name: string | null;
  duration_ms: number | null;
  success: boolean | null;
  is_error: boolean | null;
  error_class: string | null;
  error_code: number | null;
  retry_number: number | null;
  schema_hash: string | null;
  started_at: string;
  payload: Record<string, unknown> | null;
};

function failed(event: EventRow) { return event.is_error === true || event.success === false; }

export async function GET(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Analytics service is not configured." }, { status: 503 });
  const authorization = req.headers.get("authorization") || "";
  const apiKey = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  let workspaceId: string | undefined;
  if (apiKey) {
    const { data: key, error } = await supabase.from("trackmcp_api_keys").select("workspace_id, revoked_at").eq("key_hash", hashTrackMCPKey(apiKey)).maybeSingle();
    if (error) return NextResponse.json({ error: "Could not authenticate analytics request." }, { status: 500 });
    if (!key || key.revoked_at) return NextResponse.json({ error: "Invalid or revoked API key." }, { status: 401 });
    workspaceId = key.workspace_id;
  } else {
    const auth = await getSupabaseServer();
    const { data: userData } = await auth.auth.getUser();
    if (!userData.user) return NextResponse.json({ error: "Sign in or provide a workspace API key." }, { status: 401 });
    const { data: membership, error } = await supabase.from("trackmcp_workspace_members").select("workspace_id").eq("user_id", userData.user.id).limit(1).maybeSingle();
    if (error) return NextResponse.json({ error: "Could not authenticate dashboard request." }, { status: 500 });
    if (!membership) return NextResponse.json({ error: "Create a workspace first." }, { status: 404 });
    workspaceId = membership.workspace_id;
  }

  const url = new URL(req.url);
  const requestedDays = Number(url.searchParams.get("days") || 30);
  const days = Number.isFinite(requestedDays) ? Math.min(90, Math.max(1, Math.floor(requestedDays))) : 30;
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await supabase.from("trackmcp_events")
    .select("event_type, service, environment, direction, transport, protocol_version, mcp_method, request_id, session_id, task_id, workflow_id, client_name, tool_name, duration_ms, success, is_error, error_class, error_code, retry_number, schema_hash, started_at, payload")
    .eq("workspace_id", workspaceId).gte("started_at", since).order("started_at", { ascending: true }).limit(10000);
  if (error) return NextResponse.json({ error: "Could not load analytics." }, { status: 500 });

  const events = (data || []) as EventRow[];
  const calls = events.filter((event) => event.event_type === "tool_call");
  const sessions = new Map<string, EventRow[]>();
  for (const event of events) if (event.session_id) sessions.set(event.session_id, [...(sessions.get(event.session_id) || []), event]);
  const clients = new Map<string, number>();
  const tools = new Map<string, { calls: number; errors: number; durations: number[] }>();
  const discovered = new Set<string>();
  for (const event of events) {
    if ((event.event_type === "catalog" || event.event_type === "custom") && event.payload?.name === "tools_discovered") {
      const catalog: unknown[] = Array.isArray(event.payload.tools) ? event.payload.tools : event.payload.result && typeof event.payload.result === "object" && Array.isArray((event.payload.result as Record<string, unknown>).tools) ? (event.payload.result as Record<string, unknown>).tools as unknown[] : [];
      for (const tool of catalog) if (tool && typeof tool === "object" && typeof (tool as { name?: unknown }).name === "string") discovered.add((tool as { name: string }).name);
    }
  }
  for (const event of calls) {
    if (event.client_name) clients.set(event.client_name, (clients.get(event.client_name) || 0) + 1);
    if (!event.tool_name) continue;
    const tool = tools.get(event.tool_name) || { calls: 0, errors: 0, durations: [] };
    tool.calls += 1; if (failed(event)) tool.errors += 1;
    if (typeof event.duration_ms === "number") tool.durations.push(event.duration_ms);
    tools.set(event.tool_name, tool);
  }
  const toolRows = [...tools.entries()].map(([name, value]) => ({ name, calls: value.calls, errors: value.errors, error_rate: value.calls ? value.errors / value.calls : 0, avg_ms: value.durations.length ? Math.round(value.durations.reduce((a, b) => a + b, 0) / value.durations.length) : null, discovered: discovered.has(name) })).sort((a, b) => b.calls - a.calls);
  const unusedTools = [...discovered].filter((name) => !tools.has(name));
  const outcomeEvents = events.filter((event) => event.event_type === "custom" && event.payload?.name === "workflow" && typeof event.payload.workflow_name === "string" && typeof event.payload.status === "string");
  const outcomeNames = new Set(outcomeEvents.map((event) => event.payload?.workflow_name as string));
  const explicitOutcomes = [...outcomeNames].map((name) => { const matching = outcomeEvents.filter((event) => event.payload?.workflow_name === name); return { name, started: matching.filter((event) => event.payload?.status === "started").length, completed: matching.filter((event) => event.payload?.status === "completed").length, failed: matching.filter((event) => event.payload?.status === "failed").length }; });
  const workflowRows = [...sessions.entries()].map(([id, sessionEvents]) => {
    const sessionCalls = sessionEvents.filter((event) => event.event_type === "tool_call");
    const last = sessionCalls[sessionCalls.length - 1];
    return { session_id: id, client_name: sessionEvents.find((event) => event.client_name)?.client_name || "Unknown client", calls: sessionCalls.length, tools: sessionCalls.map((event) => event.tool_name).filter(Boolean), started_at: sessionEvents[0]?.started_at, duration_ms: sessionEvents.length > 1 ? Math.max(...sessionEvents.map((event) => new Date(event.started_at).getTime())) - new Date(sessionEvents[0].started_at).getTime() : 0, completed: Boolean(last && !failed(last)) };
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
  const transports = [...new Set(events.map((event) => event.transport).filter(Boolean))];
  const methods = [...new Set(events.map((event) => event.mcp_method).filter(Boolean))];
  const catalogs = events.filter((event) => event.event_type === "catalog").length;
  return NextResponse.json({ range_days: days, total_events: events.length, protocol_events: protocols.length, catalog_events: catalogs, protocol_versions: protocolVersions, transports, methods, tool_calls: calls.length, sessions: workflowRows.length, errors: calls.filter(failed).length, completion_rate: explicitStarted > 0 ? explicitCompleted / explicitStarted : workflowRows.length ? completed / workflowRows.length : null, funnel: { connections: events.filter((event) => event.event_type === "session").length, discovered_tools: discovered.size, tool_calls: calls.length, successful_calls: calls.filter((event) => !failed(event)).length }, timeline: [...timeline.entries()].map(([date, value]) => ({ date, ...value })), clients: [...clients.entries()].map(([name, count]) => ({ name, calls: count })).sort((a, b) => b.calls - a.calls), tools: toolRows, unused_tools: unusedTools, workflows: workflowRows, outcomes: explicitOutcomes, insights });
}
