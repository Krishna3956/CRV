import { NextResponse } from "next/server.js";
import { getSupabaseServer } from "../../../../lib/auth/supabase-server.ts";
import { getSupabaseAdmin } from "../../../../lib/repository/supabase.ts";
import { lookupCliKey } from "../../../../lib/cli/key-status.ts";
import { withTrackMCPV2Envelope } from "../../../../lib/api/v2-envelope.ts";
import { accountResolverObservation, setupConnectionState, setupScopeMatch } from "./setup-state.ts";

const boundedDays = (request: Request) => {
  const raw = Number(new URL(request.url).searchParams.get("days") || 30);
  return Number.isFinite(raw) ? Math.min(90, Math.max(1, Math.floor(raw))) : 30;
};

async function workspaceForRequest(request: Request, admin: ReturnType<typeof getSupabaseAdmin>) {
  if (!admin) return { response: NextResponse.json({ error: "Setup service is not configured." }, { status: 503 }) } as const;
  const authorization = request.headers.get("authorization") || "";
  const bearer = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  const requested = new URL(request.url).searchParams.get("workspace_id")?.trim() || "";
  if (bearer) {
    const result = await lookupCliKey(admin, `Bearer ${bearer}`);
    if (result.error === "lookup_failed") return { response: NextResponse.json({ error: "Could not authenticate setup request." }, { status: 500 }) } as const;
    if (!result.key || result.key.revoked_at) return { response: NextResponse.json({ error: "Invalid or revoked connection key." }, { status: 401 }) } as const;
    return { workspaceId: String(result.key.workspace_id) } as const;
  }
  const auth = await getSupabaseServer();
  const user = await auth.auth.getUser();
  if (user.error || !user.data.user) return { response: NextResponse.json({ error: "Sign in or provide a workspace API key." }, { status: 401 }) } as const;
  if (!requested || requested.length > 128) return { response: NextResponse.json({ error: "workspace_id is required." }, { status: 400 }) } as const;
  const membership = await admin.from("trackmcp_workspace_members").select("workspace_id").eq("user_id", user.data.user.id).eq("workspace_id", requested).maybeSingle();
  if (membership.error) return { response: NextResponse.json({ error: "Could not authenticate setup request." }, { status: 500 }) } as const;
  if (!membership.data) return { response: NextResponse.json({ error: "You do not have access to that workspace." }, { status: 404 }) } as const;
  return { workspaceId: requested } as const;
}

export function createSetupHandler(getAdmin: typeof getSupabaseAdmin = getSupabaseAdmin) {
  return async function GET(request: Request) {
    const admin = getAdmin();
    const scope = await workspaceForRequest(request, admin);
    if ("response" in scope) return scope.response;
    const days = boundedDays(request);
    const since = new Date(Date.now() - days * 86_400_000).toISOString();
    const [keyResult, eventResult] = await Promise.all([
      admin!.from("trackmcp_api_keys").select("id, service_scope, environment_scope").eq("workspace_id", scope.workspaceId).is("revoked_at", null).order("created_at", { ascending: false }).limit(1),
      admin!.from("trackmcp_events").select("event_id, started_at, event_type, service, environment, mcp_method, transport, payload_policy, deployment_id, account_identity_source, account_key").eq("workspace_id", scope.workspaceId).gte("started_at", since).order("started_at", { ascending: false }).limit(1),
    ]);
    if (keyResult.error || eventResult.error) return NextResponse.json({ error: "Could not load setup status." }, { status: 500 });
    const hasKey = Boolean(keyResult.data?.length);
    const activeKey = keyResult.data?.[0] as { service_scope?: unknown; environment_scope?: unknown } | undefined;
    const keyScope = hasKey ? {
      service: typeof activeKey?.service_scope === "string" ? activeKey.service_scope.slice(0, 100) : null,
      environment: typeof activeKey?.environment_scope === "string" ? activeKey.environment_scope.slice(0, 64) : null,
    } : null;
    const latest = eventResult.data?.[0] as { event_id?: unknown; started_at?: unknown; event_type?: unknown; service?: unknown; environment?: unknown; mcp_method?: unknown; transport?: unknown; payload_policy?: unknown; deployment_id?: unknown; account_identity_source?: unknown; account_key?: unknown } | undefined;
    const hasEvent = Boolean(latest);
    const scopeMatch = setupScopeMatch({ key: keyScope, event: latest });
    const mcpMethodObserved = hasEvent && typeof latest?.mcp_method === "string";
    const transportObserved = hasEvent && typeof latest?.transport === "string";
    const privacyPolicyApplied = hasEvent && typeof latest?.payload_policy === "string";
    const state = setupConnectionState({ hasKey, hasEvent, mcpMethodObserved, transportObserved, privacyPolicyApplied });
    const requiredChecks = [hasKey, hasEvent, mcpMethodObserved, transportObserved, privacyPolicyApplied];
    const requiredCompleted = requiredChecks.filter(Boolean).length;
    const accountIdentity = accountResolverObservation(latest?.account_identity_source);
    const nextSteps = !hasKey
      ? ["Create a workspace connection key.", "Keep the key in your server environment; never commit it."]
      : !hasEvent
        ? ["Set TRACKMCP_KEY in the running server process.", "Restart the server and make one real MCP tool call.", "Confirm the process can reach the TrackMCP ingest URL over HTTPS, then refresh this check."]
        : state === "connected_limited_coverage"
          ? ["TrackMCP received an event but its integration metadata is incomplete.", "Use a supported native SDK and explicitly configure transport when your runtime knows it.", "Make another real MCP tool call, then refresh this check."]
        : ["Open Overview to inspect observed tools, clients, errors, and evidence.", "Treat a received event as ingestion evidence, not proof of business-workflow completion."];
    const response = {
      setup: {
        state,
        workspace_id: scope.workspaceId,
        connection_key: keyScope,
        scope_match: scopeMatch,
        checks: {
          connection_key_ready: hasKey,
          sdk_event_recognized: hasEvent,
          mcp_method_observed: mcpMethodObserved,
          transport_observed: transportObserved,
          event_persisted: hasEvent,
          privacy_policy_applied: privacyPolicyApplied,
          // Missing legacy fields are unknown; an explicit unresolved source
          // is a truthful negative rather than a missing-data guess.
          account_resolver_observed: accountResolverObservation(latest?.account_identity_source),
          deployment_linked: typeof latest?.deployment_id === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(latest.deployment_id),
        },
        readiness: {
          required_completed: requiredCompleted,
          required_total: requiredChecks.length,
          required_percentage: Math.round((requiredCompleted / requiredChecks.length) * 100),
          optional_identity: accountIdentity,
          // Identity resolution is an optional signal and must not block a
          // customer from reaching a connected state.
          identity_required: false,
        },
        first_event: hasEvent ? {
          event_id_present: typeof latest?.event_id === "string",
          observed_at: typeof latest?.started_at === "string" ? latest.started_at : null,
          event_type: typeof latest?.event_type === "string" ? latest.event_type : null,
          service: typeof latest?.service === "string" ? latest.service.slice(0, 100) : null,
          environment: typeof latest?.environment === "string" ? latest.environment.slice(0, 64) : null,
          ingestion_lag_seconds: typeof latest?.started_at === "string" && Number.isFinite(Date.parse(latest.started_at))
            ? Math.min(7_776_000, Math.max(0, Math.floor((Date.now() - Date.parse(latest.started_at)) / 1000)))
            : null,
        } : null,
        caveat: hasEvent
          ? "A received event proves ingestion, not business-workflow completion."
          : "No event was observed in the selected window; absence is not proof that the server is broken.",
        next_steps: nextSteps,
      },
      range_days: days,
      generated_at: new Date().toISOString(),
    };
    return NextResponse.json(withTrackMCPV2Envelope(response, request), { headers: { "cache-control": "no-store" } });
  };
}

export const GET = createSetupHandler();
