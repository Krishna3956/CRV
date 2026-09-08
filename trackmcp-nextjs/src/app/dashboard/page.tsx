"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { DashboardApp } from "@/components/dashboard/DashboardApp";
import { getSupabaseBrowser } from "@/lib/auth/supabase-browser";
import type { Analytics, ToolQualityResponse } from "@/lib/telemetry/analytics-types";
import { trackMarketingEvent, trackMarketingEventOnce } from "@/lib/marketing-analytics";

type Workspace = { id: string; name: string; slug: string };
type Key = { id: string; name: string; key_prefix: string; revoked_at: string | null; created_at: string };
type Account = { workspace: Workspace | null; keys: Key[] };
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
  const [keys, setKeys] = useState<Key[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [toolQuality, setToolQuality] = useState<ToolQualityResponse | null>(null);
  const [newKey, setNewKey] = useState("");
  const [loading, setLoading] = useState(!LOCAL_DASHBOARD_BYPASS);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const autoProvisionAttempted = useRef(false);

  const loadAccount = useCallback(async (): Promise<Account> => {
    const response = await fetch("/api/v1/account/workspace", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Could not load your workspace.");
    setWorkspace(body.workspace); setKeys(body.keys || []);
    return body;
  }, []);
  const loadAnalytics = useCallback(async (days = "30") => {
    const response = await fetch(`/api/v1/analytics?days=${days}`, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Could not load analytics.");
    setAnalytics(body);
    if (body.total_events > 0) trackMarketingEventOnce("first_telemetry_seen", { event_count: body.total_events });
  }, []);
  const loadToolQuality = useCallback(async (days = "30") => {
    const response = await fetch(`/api/v1/tool-quality?days=${days}`, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Could not load tool-quality analytics.");
    setToolQuality(body);
  }, []);
  const createWorkspace = useCallback(async () => {
    setWorking(true); setError("");
    try { const response = await fetch("/api/v1/account/workspace", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ create_key: false }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error || "Could not create your workspace."); trackMarketingEvent("workspace_created"); setNewKey(body.api_key || ""); const account = await loadAccount(); if (account.workspace) await Promise.all([loadAnalytics(), loadToolQuality()]); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not create your workspace."); }
    finally { setWorking(false); }
  }, [loadAccount, loadAnalytics, loadToolQuality]);
  const generateKey = async () => {
    setWorking(true); setError("");
    try { const response = await fetch("/api/v1/account/workspace", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key_name: `server-${keys.length + 1}` }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error || "Could not create an API key."); trackMarketingEvent("api_key_created"); setNewKey(body.api_key); await loadAccount(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not create an API key."); }
    finally { setWorking(false); }
  };
  const revokeKey = async (id: string) => {
    if (!window.confirm("Revoke this key? Any server using it will stop sending telemetry.")) return;
    const response = await fetch(`/api/v1/account/keys/${id}`, { method: "DELETE" });
    if (!response.ok) { const body = await response.json(); setError(body.error || "Could not revoke the key."); return; }
    await loadAccount();
  };

  useEffect(() => {
    if (LOCAL_DASHBOARD_BYPASS) {
      return;
    }
    void (async () => { const { data } = await getSupabaseBrowser().auth.getUser(); const user = data.user; setEmail(user?.email || null); setDisplayName(userDisplayName(user)); if (!user) { setLoading(false); return; } try { const account = await loadAccount(); if (!account.workspace && !autoProvisionAttempted.current) { autoProvisionAttempted.current = true; await createWorkspace(); } else if (account.workspace) { await Promise.all([loadAnalytics(), loadToolQuality()]); } } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load your account."); } finally { setLoading(false); } })();
  }, [createWorkspace, loadAccount, loadAnalytics, loadToolQuality]);

  if (loading) return <main className="mx-auto min-h-screen max-w-6xl px-6 py-20 text-sm text-muted">Loading your workspace…</main>;
  if (!email) return <main className="mx-auto min-h-screen max-w-xl px-6 py-24"><p className="text-xs font-semibold uppercase tracking-wide text-brand">TrackMCP</p><h1 className="mt-3 text-4xl font-medium tracking-tight text-ink">Your workspace is waiting.</h1><p className="mt-4 text-muted">Sign in to create an API key and see how your MCP server is being used.</p><Link href="/signin" className="mt-7 inline-flex rounded-lg bg-ink px-5 py-3 text-sm font-medium text-white">Sign in to continue</Link></main>;
  return <DashboardApp displayName={displayName || email} workspace={workspace} keys={keys} analytics={analytics} toolQuality={toolQuality} newKey={newKey} working={working} error={error} initialView={initialView} onGenerateKey={generateKey} onRevokeKey={revokeKey} onDismissKey={() => setNewKey("")} onRefresh={(days) => { if (!LOCAL_DASHBOARD_BYPASS) void Promise.all([loadAnalytics(days), loadToolQuality(days)]).catch((reason) => setError(reason instanceof Error ? reason.message : "Could not refresh analytics.")); }} onCreateWorkspace={createWorkspace} onSignOut={() => { if (LOCAL_DASHBOARD_BYPASS) window.location.href = "https://trackmcp.com"; else void getSupabaseBrowser().auth.signOut().then(() => { window.location.href = "https://trackmcp.com"; }); }} />;
}

export default function DashboardPage() {
  return <DashboardPageContent />;
}
