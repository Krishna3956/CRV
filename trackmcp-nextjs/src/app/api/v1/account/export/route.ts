import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/auth/supabase-server";
import { getSupabaseAdmin } from "@/lib/repository/supabase";
import {
  clampExportLimit,
  PRIVACY_EXPORT_VERSION,
  projectAction,
  projectActivationMilestone,
  projectCatalogVersion,
  projectCatalogEntityRead,
  projectEvent,
  projectFact,
} from "@/lib/account/privacy-export";

async function getUser() {
  const auth = await getSupabaseServer();
  const { data, error } = await auth.auth.getUser();
  return error ? null : data.user;
}

/** Read-only, bounded, secret-free account export. */
export async function GET(request: Request) {
  const user = await getUser();
  const admin = getSupabaseAdmin();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!admin) return NextResponse.json({ error: "Account service is not configured." }, { status: 503 });

  const url = new URL(request.url);
  const requestedWorkspace = url.searchParams.get("workspace_id");
  const limit = clampExportLimit(url.searchParams.get("limit"));

  const memberships = await admin
    .from("trackmcp_workspace_members")
    .select("workspace_id, role, trackmcp_workspaces(id, name, slug)")
    .eq("user_id", user.id);
  if (memberships.error) return NextResponse.json({ error: "Could not load workspace access." }, { status: 500 });
  const allowed = (memberships.data || []).filter((membership) =>
    !requestedWorkspace || membership.workspace_id === requestedWorkspace,
  );
  if (requestedWorkspace && allowed.length === 0) return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  const workspaceIds = allowed.map((membership) => membership.workspace_id);

  const profile = await admin
    .from("trackmcp_profiles")
    .select("full_name, company_name, role, use_case, onboarding_completed_at, created_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profile.error) return NextResponse.json({ error: "Could not load account profile." }, { status: 500 });

  if (workspaceIds.length === 0) {
    return NextResponse.json({
      export_version: PRIVACY_EXPORT_VERSION,
      generated_at: new Date().toISOString(),
      account: { user_id: user.id, email: user.email || null, profile: profile.data || null },
      workspaces: [], events: [], facts: [], action_queue: [], catalog_versions: [], catalog_entity_reads: [], activation_milestones: [],
      pagination: { limit, truncated: false },
      caveats: ["No workspace membership was found.", "Raw telemetry payloads, API keys, and device-code material are never included."],
    }, { headers: { "cache-control": "no-store" } });
  }

  const [events, facts, actions, catalogVersions, catalogEntityReads, activationMilestones] = await Promise.all([
    admin.from("trackmcp_events").select("id,event_id,event_type,service,environment,session_id,client_name,tool_name,started_at,duration_ms,success,is_error,received_at,account_identity_source").in("workspace_id", workspaceIds).order("started_at", { ascending: false }).limit(limit),
    admin.from("trackmcp_semantic_facts").select("source_event_id,fact_version,fact_type,event_type,service,environment,observed_at,semantic,dimensions,measures,error").in("workspace_id", workspaceIds).order("observed_at", { ascending: false }).limit(limit),
    admin.from("trackmcp_action_queue").select("id,fingerprint,rule_key,status,severity,title,evidence,first_seen_at,last_seen_at,resolved_at").in("workspace_id", workspaceIds).order("last_seen_at", { ascending: false }).limit(limit),
    admin.from("trackmcp_catalog_versions").select("id,workspace_id,server_id,environment_id,session_id,protocol_version,catalog_kind,item_count,item_name_hashes,item_uri_hashes,snapshot_hash,previous_snapshot_id,complete,truncated,observation_source,diff,discovered_at").in("workspace_id", workspaceIds).order("discovered_at", { ascending: false }).limit(limit),
    admin.from("trackmcp_catalog_entity_reads").select("source_event_id,server_id,environment,catalog_kind,entity_hash,observed_at,success,is_error,result_type").in("workspace_id", workspaceIds).order("observed_at", { ascending: false }).limit(limit),
    admin.from("trackmcp_activation_milestones").select("id,workspace_id,first_accepted_at,sdk_version,service,environment,event_type,observation_source,created_at").in("workspace_id", workspaceIds).order("first_accepted_at", { ascending: false }).limit(limit),
  ]);
  if (events.error || facts.error || actions.error || catalogVersions.error || activationMilestones.error) return NextResponse.json({ error: "Could not build the account export." }, { status: 500 });

  // The entity-read projection is additive and may not exist until its
  // separately reviewed migration is applied. Keep the core account export
  // available while making that coverage gap explicit to the caller.
  const catalogEntityReadsAvailable = !catalogEntityReads.error;

  return NextResponse.json({
    export_version: PRIVACY_EXPORT_VERSION,
    generated_at: new Date().toISOString(),
    account: { user_id: user.id, email: user.email || null, profile: profile.data || null },
    workspaces: allowed.map((membership) => ({ workspace: membership.trackmcp_workspaces, role: membership.role })),
    events: (events.data || []).map((row) => projectEvent(row as unknown as Record<string, unknown>)),
    facts: (facts.data || []).map((row) => projectFact(row as unknown as Record<string, unknown>)),
    action_queue: (actions.data || []).map((row) => projectAction(row as unknown as Record<string, unknown>)),
    catalog_versions: (catalogVersions.data || []).map((row) => projectCatalogVersion(row as unknown as Record<string, unknown>)),
    catalog_entity_reads: catalogEntityReadsAvailable
      ? (catalogEntityReads.data || []).map((row) => projectCatalogEntityRead(row as unknown as Record<string, unknown>))
      : [],
    activation_milestones: (activationMilestones.data || []).map((row) => projectActivationMilestone(row as unknown as Record<string, unknown>)),
    pagination: {
      limit,
      truncated: (events.data?.length || 0) >= limit || (facts.data?.length || 0) >= limit || (actions.data?.length || 0) >= limit || (catalogVersions.data?.length || 0) >= limit || (catalogEntityReads.data?.length || 0) >= limit || (activationMilestones.data?.length || 0) >= limit,
    },
    caveats: [
      "This export is bounded to the requested limit per dataset; request a larger export through support for a complete historical archive.",
      "Raw telemetry payloads, API keys, account_key values, device-code material, and auth tokens are never included.",
      "Derived facts and action-queue evidence are product interpretations, not verified outcomes.",
      ...(catalogEntityReadsAvailable ? [] : ["Catalog entity-read export is unavailable until the optional catalog entity-read schema is applied; no raw resource or prompt identity is exported." ]),
    ],
  }, { headers: { "cache-control": "no-store" } });
}
