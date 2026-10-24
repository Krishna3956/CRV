"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { DashboardApp } from "@/components/dashboard/DashboardApp";
import { getSupabaseBrowser } from "@/lib/auth/supabase-browser";
import type { Analytics, ToolQualityResponse } from "@/lib/telemetry/analytics-types";
import { trackActivationEvent } from "@/lib/marketing-analytics";

type Workspace = { id: string; name: string; slug: string };
type Key = { id: string; name: string; key_prefix: string; revoked_at: string | null; created_at: string; service_scope?: string | null; environment_scope?: string | null };
type KeyCreationOptions = { serviceScope?: string; environmentScope?: string };
type Account = { workspace: Workspace | null; workspaces: Workspace[]; keys: Key[] };
const LOCAL_DASHBOARD_BYPASS = process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_LOCAL_DASHBOARD_BYPASS === "true";
function userDisplayName(user: { email?: string | null; user_metadata?: Record<string, unknown> } | null) {
  const metadata = user?.user_metadata || {};
  const fullName = typeof metadata.full_name === "string" ? metadata.full_name.trim() : "";
  const firstName = typeof metadata.first_name === "string" ? metadata.first_name.trim() : "";
  const lastName = typeof metadata.last_name === "string" ? metadata.last_name.trim() : "";
  return fullName || [firstName, lastName].filter(Boolean).join(" ") || user?.email || "";
}

export function DashboardPageContent({ initialView = "overview" }: { initialView?: "overview" | "traces" }) {
  const [email, setEmail] = useState<string | null>(LOCAL_DASHBOARD_BYPASS ? "demo@trackmcp.local" : null);
  const [displayName, setDisplayName] = useState(LOCAL_DASHBOARD_BYPASS ? "Demo user" : "");
  const [workspace, setWorkspace] = useState<Workspace | null>(LOCAL_DASHBOARD_BYPASS ? { id: "local-demo", name: "Local demo workspace", slug: "local-demo" } : null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>(LOCAL_DASHBOARD_BYPASS ? [{ id: "local-demo", name: "Local demo workspace", slug: "local-demo" }] : []);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(LOCAL_DASHBOARD_BYPASS ? "local-demo" : null);
  const [keys, setKeys] = useState<Key[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [toolQuality, setToolQuality] = useState<ToolQualityResponse | null>(null);
  const [newKey, setNewKey] = useState("");
  const [loading, setLoading] = useState(!LOCAL_DASHBOARD_BYPASS);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const autoProvisionAttempted = useRef(false);

  const loadAccount = useCallback(async (workspaceId?: string): Promise<Account> => {
    const query = workspaceId ? `?workspace_id=${encodeURIComponent(workspaceId)}` : "";
    const response = await fetch(`/api/v1/account/workspace${query}`, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) {
      const error = new Error(body.error || "Could not load your workspace.") as Error & { status?: number };
      error.status = response.status;
      throw error;
    }
    setWorkspace(body.workspace); setWorkspaces(Array.isArray(body.workspaces) ? body.workspaces : body.workspace ? [body.workspace] : []); setKeys(body.keys || []);
    return body;
  }, []);
  const loadAnalytics = useCallback(async (days = "30", workspaceId?: string) => {
    trackActivationEvent("first_event_check_started", { data_mode: "my" });
    const scope = workspaceId ? `&workspace_id=${encodeURIComponent(workspaceId)}` : "";
    const response = await fetch(`/api/v1/analytics?days=${days}${scope}`, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) {
      trackActivationEvent("first_event_check_result", {
        result: response.status === 401 || response.status === 403 ? "unauthorized" : "retryable_error",
      });
      throw new Error(body.error || "Could not load analytics.");
    }
    setAnalytics(body);
    trackActivationEvent("first_event_check_result", { result: body.total_events > 0 ? "event_found" : "no_event" });
    if (body.total_events > 0) trackActivationEvent("first_telemetry_seen", { event_count: body.total_events });
  }, []);
  const loadToolQuality = useCallback(async (days = "30", workspaceId?: string) => {
    const scope = workspaceId ? `&workspace_id=${encodeURIComponent(workspaceId)}` : "";
    const response = await fetch(`/api/v1/tool-quality?days=${days}${scope}`, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Could not load tool-quality analytics.");
    setToolQuality(body);
  }, []);
  const createWorkspace = useCallback(async () => {
    setWorking(true); setError("");
    try {
      const response = await fetch("/api/v1/account/workspace", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ create_key: false }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not create your workspace.");
      trackActivationEvent("workspace_created");
      setNewKey(body.api_key || "");

      // Hydrate from the successful write before doing the read-after-write
      // refresh. This prevents a brief replica/read lag from making a newly
      // created workspace appear to have disappeared.
      const createdWorkspace = body.workspace as Workspace | null | undefined;
      if (createdWorkspace?.id) {
        setWorkspace(createdWorkspace);
        setWorkspaces([createdWorkspace]);
        setSelectedWorkspaceId(createdWorkspace.id);
        window.localStorage.setItem("trackmcp.selected_workspace_id", createdWorkspace.id);
      }
      let account: Account | null = null;
      try {
        account = await loadAccount(createdWorkspace?.id);
      } catch (reason) {
        // The write response is authoritative for this request. Keep the
        // workspace visible if a read replica has not caught up yet.
        if (!createdWorkspace) throw reason;
      }
      const activeWorkspace = account?.workspace || createdWorkspace || null;
      if (activeWorkspace) await Promise.all([loadAnalytics("30", activeWorkspace.id), loadToolQuality("30", activeWorkspace.id)]);
    }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not create your workspace."); }
    finally { setWorking(false); }
  }, [loadAccount, loadAnalytics, loadToolQuality]);
  const generateKey = async (options?: KeyCreationOptions) => {
    setWorking(true); setError("");
    try { const workspaceId = selectedWorkspaceId || workspace?.id; if (!workspaceId) throw new Error("Select a workspace before creating a key."); const response = await fetch("/api/v1/account/workspace", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ workspace_id: workspaceId, key_name: `server-${keys.length + 1}`, service_scope: options?.serviceScope || undefined, environment_scope: options?.environmentScope || undefined }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error || "Could not create an API key."); trackActivationEvent("api_key_created", { key_name_category: "server" }); setNewKey(body.api_key); await loadAccount(workspaceId); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not create an API key."); }
    finally { setWorking(false); }
  };
  const revokeKey = async (id: string) => {
    if (!window.confirm("Revoke this key? Any server using it will stop sending telemetry.")) return;
    const workspaceId = selectedWorkspaceId || workspace?.id;
    if (!workspaceId) { setError("Select a workspace before revoking a key."); return; }
    const response = await fetch(`/api/v1/account/keys/${id}?workspace_id=${encodeURIComponent(workspaceId)}`, { method: "DELETE" });
    if (!response.ok) { const body = await response.json(); setError(body.error || "Could not revoke the key."); return; }
    await loadAccount();
  };
  const rotateKey = async (id: string) => {
    if (!window.confirm("Rotate this key? The old key will stop working immediately, so update the server with the replacement.")) return;
    const workspaceId = selectedWorkspaceId || workspace?.id;
    if (!workspaceId) { setError("Select a workspace before rotating a key."); return; }
    setWorking(true); setError("");
    try {
      const response = await fetch(`/api/v1/account/keys/${id}/rotate?workspace_id=${encodeURIComponent(workspaceId)}`, { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not rotate the key.");
      trackActivationEvent("api_key_rotated", { key_name_category: "server" });
      setNewKey(body.api_key || "");
      await loadAccount(workspaceId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not rotate the key.");
    } finally { setWorking(false); }
  };

  useEffect(() => {
    if (LOCAL_DASHBOARD_BYPASS) {
      return;
    }
    void (async () => { const { data } = await getSupabaseBrowser().auth.getUser(); const user = data.user; setEmail(user?.email || null); setDisplayName(userDisplayName(user)); if (!user) { setLoading(false); return; } try {
      const preferred = window.localStorage.getItem("trackmcp.selected_workspace_id") || undefined;
      let account: Account;
      try {
        account = await loadAccount(preferred);
      } catch (reason) {
        const status = reason instanceof Error ? (reason as Error & { status?: number }).status : undefined;
        if (!preferred || status !== 404) throw reason;
        // A deleted or inaccessible workspace can remain in localStorage after
        // membership changes. Recover from the user's current memberships.
        window.localStorage.removeItem("trackmcp.selected_workspace_id");
        account = await loadAccount();
      }
      const activeWorkspaceId = account.workspace?.id || null;
      if (activeWorkspaceId) { setSelectedWorkspaceId(activeWorkspaceId); window.localStorage.setItem("trackmcp.selected_workspace_id", activeWorkspaceId); }
      if (!account.workspace && !autoProvisionAttempted.current) { autoProvisionAttempted.current = true; await createWorkspace(); } else if (account.workspace) { await Promise.all([loadAnalytics("30", activeWorkspaceId || undefined), loadToolQuality("30", activeWorkspaceId || undefined)]); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load your account."); } finally { setLoading(false); } })();
  }, [createWorkspace, loadAccount, loadAnalytics, loadToolQuality]);

  if (loading) return <main className="mx-auto min-h-screen max-w-6xl px-6 py-20 text-sm text-muted">Loading your workspace…</main>;
  if (!email) return <main className="mx-auto min-h-screen max-w-xl px-6 py-24"><p className="text-xs font-semibold uppercase tracking-wide text-brand">TrackMCP</p><h1 className="mt-3 text-4xl font-medium tracking-tight text-ink">Your workspace is waiting.</h1><p className="mt-4 text-muted">Sign in to create an API key and see how your MCP server is being used.</p><Link href="/signin" className="mt-7 inline-flex rounded-lg bg-ink px-5 py-3 text-sm font-medium text-white">Sign in to continue</Link></main>;
  const selectWorkspace = async (workspaceId: string) => { if (!workspaceId || workspaceId === selectedWorkspaceId) return; setWorking(true); setError(""); setSelectedWorkspaceId(workspaceId); window.localStorage.setItem("trackmcp.selected_workspace_id", workspaceId); try { const account = await loadAccount(workspaceId); await Promise.all([loadAnalytics("30", account.workspace?.id || workspaceId), loadToolQuality("30", account.workspace?.id || workspaceId)]); } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not switch workspaces."); } finally { setWorking(false); } };
  return <DashboardApp displayName={displayName || email} workspace={workspace} workspaces={workspaces} keys={keys} analytics={analytics} toolQuality={toolQuality} newKey={newKey} working={working} error={error} initialView={initialView} onGenerateKey={generateKey} onRevokeKey={revokeKey} onRotateKey={rotateKey} onDismissKey={() => setNewKey("")} onSelectWorkspace={selectWorkspace} onRefresh={(days) => { if (!LOCAL_DASHBOARD_BYPASS) void Promise.all([loadAnalytics(days, selectedWorkspaceId || undefined), loadToolQuality(days, selectedWorkspaceId || undefined)]).catch((reason) => setError(reason instanceof Error ? reason.message : "Could not refresh analytics.")); }} onCreateWorkspace={createWorkspace} onSignOut={() => { if (LOCAL_DASHBOARD_BYPASS) window.location.href = "https://trackmcp.com"; else void getSupabaseBrowser().auth.signOut().then(() => { window.location.href = "https://trackmcp.com"; }); }} />;
}

export default function DashboardPage() {
  return <DashboardPageContent />;
}
