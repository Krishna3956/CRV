"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardApp } from "@/components/dashboard/DashboardApp";
import { getSupabaseBrowser } from "@/lib/auth/supabase-browser";
import type { Analytics } from "@/lib/telemetry/analytics-types";

type Workspace = { id: string; name: string; slug: string };
type Key = { id: string; name: string; key_prefix: string; revoked_at: string | null; created_at: string };
type Account = { workspace: Workspace | null; keys: Key[] };
type SetupDetails = { first_name: string; last_name: string; company_name: string };

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [keys, setKeys] = useState<Key[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [newKey, setNewKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [setupDetails, setSetupDetails] = useState<SetupDetails>({ first_name: "", last_name: "", company_name: "" });

  const loadAccount = async (): Promise<Account> => {
    const response = await fetch("/api/v1/account/workspace", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Could not load your workspace.");
    setWorkspace(body.workspace); setKeys(body.keys || []);
    return body;
  };
  const loadAnalytics = async (days = "30") => {
    const response = await fetch(`/api/v1/analytics?days=${days}`, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Could not load analytics.");
    setAnalytics(body);
  };
  const createWorkspace = async (details?: SetupDetails) => {
    setWorking(true); setError("");
    try { const response = await fetch("/api/v1/account/workspace", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(details || {}) }); const body = await response.json(); if (!response.ok) throw new Error(body.error || "Could not create your workspace."); setNewKey(body.api_key); const account = await loadAccount(); if (account.workspace) await loadAnalytics(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not create your workspace."); }
    finally { setWorking(false); }
  };
  const generateKey = async () => {
    setWorking(true); setError("");
    try { const response = await fetch("/api/v1/account/workspace", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key_name: `server-${keys.length + 1}` }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error || "Could not create an API key."); setNewKey(body.api_key); await loadAccount(); }
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
    void (async () => { const { data } = await getSupabaseBrowser().auth.getUser(); const user = data.user; setEmail(user?.email || null); if (!user) { setLoading(false); return; } setSetupDetails({ first_name: user.user_metadata?.first_name || "", last_name: user.user_metadata?.last_name || "", company_name: user.user_metadata?.company_name || "" }); try { const account = await loadAccount(); if (account.workspace) await loadAnalytics(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load your account."); } finally { setLoading(false); } })();
  }, []);

  if (loading) return <main className="mx-auto min-h-screen max-w-6xl px-6 py-20 text-sm text-muted">Loading your workspace…</main>;
  if (!email) return <main className="mx-auto min-h-screen max-w-xl px-6 py-24"><p className="text-xs font-semibold uppercase tracking-wide text-brand">TrackMCP</p><h1 className="mt-3 text-4xl font-medium tracking-tight text-ink">Your workspace is waiting.</h1><p className="mt-4 text-muted">Sign in to create an API key and see how your MCP server is being used.</p><Link href="/signin" className="mt-7 inline-flex rounded-lg bg-ink px-5 py-3 text-sm font-medium text-white">Sign in to continue</Link></main>;
  return <DashboardApp email={email} workspace={workspace} keys={keys} analytics={analytics} newKey={newKey} working={working} error={error} setupRequired={!workspace} setupDetails={setupDetails} onGenerateKey={generateKey} onRevokeKey={revokeKey} onRefresh={(days) => void loadAnalytics(days).catch((reason) => setError(reason instanceof Error ? reason.message : "Could not refresh analytics."))} onCreateWorkspace={createWorkspace} onSignOut={() => void getSupabaseBrowser().auth.signOut().then(() => window.location.reload())} />;
}
