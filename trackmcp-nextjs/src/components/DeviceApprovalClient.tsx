"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, KeyRound, ShieldCheck, XCircle } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/auth/supabase-browser";
import { trackActivationEvent } from "@/lib/marketing-analytics";
import { TrackMCPLogo } from "@/components/TrackMCPLogo";
import {
  normalizeDeviceUserCode,
  createDeviceAuthAdapter,
  type DeviceAuthAdapter,
  type DeviceSessionState,
} from "@/lib/device-auth";

type Workspace = { id: string; name: string; slug: string };

function authLink(userCode: string, mode: "signin" | "signup") {
  const next = `/device?user_code=${encodeURIComponent(userCode)}`;
  return `/${mode}?next=${encodeURIComponent(next)}&source=device_auth`;
}

export function DeviceApprovalClient({
  userCode,
  adapter = createDeviceAuthAdapter(),
}: {
  userCode: string | null;
  adapter?: DeviceAuthAdapter;
}) {
  const normalizedCode = useMemo(() => normalizeDeviceUserCode(userCode), [userCode]);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [workspaceState, setWorkspaceState] = useState<"loading" | "ready" | "none" | "select" | "error">("loading");
  const [status, setStatus] = useState<DeviceSessionState>(normalizedCode ? "ready" : "invalid");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const loadWorkspace = useCallback(async () => {
    setWorkspaceState("loading");
    setWorkspaces([]);
    try {
      const response = await fetch("/api/v1/account/workspaces", { cache: "no-store" });
      if (response.status === 401) {
        setSignedIn(false);
        setWorkspaceState("none");
        return;
      }
      if (!response.ok) {
        setWorkspaceState("error");
        return;
      }
      const body = await response.json() as { workspaces?: Workspace[] };
      const nextWorkspaces = Array.isArray(body.workspaces) ? body.workspaces : [];
      setWorkspaces(nextWorkspaces);
      setSelectedWorkspaceId((current) => nextWorkspaces.some((workspace) => workspace.id === current)
        ? current
        : nextWorkspaces.length === 1 ? nextWorkspaces[0].id : "");
      if (nextWorkspaces.length === 0) {
        setWorkspaceState("none");
      } else if (nextWorkspaces.length === 1) {
        setWorkspaceState("ready");
      } else {
        setWorkspaceState("select");
      }
    } catch {
      setWorkspaceState("error");
    }
  }, []);

  useEffect(() => {
    if (!normalizedCode) return;
    const supabase = getSupabaseBrowser();
    void supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      if (!data.user) {
        setSignedIn(false);
        setWorkspaceState("none");
        return;
      }
      setSignedIn(true);
      void loadWorkspace();
    }).catch(() => {
      setSignedIn(false);
      setWorkspaceState("none");
    });
  }, [loadWorkspace, normalizedCode]);

  const approve = async () => {
    const workspace = workspaces.find((item) => item.id === selectedWorkspaceId);
    if (!normalizedCode || !signedIn || !workspace) return;
    setWorking(true);
    setError("");
    trackActivationEvent("cli_device_auth_attempted", { client_version: "browser" });
    const result = await adapter.approve({
      userCode: normalizedCode,
      workspaceId: workspace.id,
    });
    if (result.status === "approved") {
      trackActivationEvent("cli_device_auth_approved", { client_version: "browser" });
      setStatus("approved");
    } else if (result.status === "expired") {
      trackActivationEvent("cli_device_auth_expired", { client_version: "browser" });
      setStatus("expired");
    } else if (result.status === "already_redeemed") {
      trackActivationEvent("cli_device_auth_already_redeemed", { client_version: "browser" });
      setStatus("already_redeemed");
    } else if (result.status === "already_approved") {
      trackActivationEvent("cli_device_auth_already_approved", { client_version: "browser" });
      setStatus("already_approved");
    } else if (result.status === "invalid") {
      trackActivationEvent("cli_device_auth_invalid", { client_version: "browser" });
      setStatus("invalid");
    } else if (result.status === "unauthenticated") {
      trackActivationEvent("cli_device_auth_unauthenticated", { client_version: "browser" });
      setStatus("unauthenticated");
    } else {
      const eventName = result.reason_category === "unavailable" ? "cli_device_auth_unavailable" : "cli_device_auth_denied";
      trackActivationEvent(eventName, { client_version: "browser", reason_category: result.reason_category });
      setStatus("denied");
      if (result.reason_category === "unavailable") setError("The device authorization service is temporarily unavailable. Please try again shortly.");
    }
    setWorking(false);
  };

  const createWorkspace = async () => {
    setWorking(true);
    setError("");
    setWorkspaceState("loading");
    try {
      const response = await fetch("/api/v1/account/workspace", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ create_key: false }),
      });
      const body = await response.json() as { workspace?: Workspace | null; error?: string };
      if (response.status === 401) {
        setSignedIn(false);
        setWorkspaceState("none");
        setStatus("unauthenticated");
      } else if (!response.ok || !body.workspace) {
        setError(body.error || "Could not create your workspace. Please try again.");
        setWorkspaceState("error");
      } else {
        setWorkspaces([body.workspace]);
        setSelectedWorkspaceId(body.workspace.id);
        setWorkspaceState("ready");
        trackActivationEvent("workspace_created");
      }
    } catch {
      setError("The workspace service is temporarily unavailable. Please try again.");
      setWorkspaceState("error");
    }
    setWorking(false);
  };

  if (status === "invalid") return <DeviceState icon={<XCircle />} title="That device code is not valid" detail="Use the complete code printed by npx @trackmcp/cli init. It should look like F7KQ-2M9D." />;
  if (status === "expired") return <DeviceState icon={<Clock3 />} title="This device session expired" detail="Start npx @trackmcp/cli init again to get a new code." />;
  if (status === "unauthenticated") return <AuthRequiredState userCode={normalizedCode} />;
  if (status === "denied") return <DeviceState icon={<XCircle />} title="Device access was not approved" detail={error || "No key was created. You can safely close this page and restart the CLI when ready."} />;
  if (status === "already_redeemed") return <DeviceState icon={<CheckCircle2 />} title="This device session was already used" detail="Start a new CLI session if you need to connect another project." />;
  if (status === "already_approved") return <DeviceState icon={<CheckCircle2 />} title="This device session is already approved" detail="Return to your terminal so it can redeem the one-time result." />;
  if (status === "approved") return <DeviceState icon={<CheckCircle2 />} title="Device approved" detail="Return to your terminal. The CLI can now finish the one-time setup." />;

  return (
    <main className="min-h-screen bg-canvas px-6 py-8 text-body sm:py-12">
      <div className="mx-auto mb-8 flex max-w-xl items-center justify-between">
        <TrackMCPLogo mark size="nav" />
        <span className="text-[11px] font-medium text-muted">Secure CLI connection</span>
      </div>
      <section className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-9">
        <h1 className="mt-3 text-3xl font-medium tracking-[-0.03em] text-ink">Approve this CLI connection</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">The TrackMCP CLI is asking to connect this project to your workspace. Approving lets the CLI finish setup; your connection key is never shown in this browser.</p>
        <div className="mt-6 rounded-xl border border-line bg-paper p-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">One-time code</p>
          <p className="mt-2 font-mono text-2xl tracking-[0.16em] text-ink">{normalizedCode}</p>
        </div>
        {signedIn === false && <div className="mt-6 rounded-xl border border-brand/25 bg-brand-soft/35 p-4"><p className="text-sm font-medium text-ink">Sign in before approving</p><p className="mt-1 text-xs leading-relaxed text-muted">Your existing signup, email verification, SSO, and MFA flow remains in control of identity.</p><div className="mt-3 flex flex-wrap gap-2"><Link href={authLink(normalizedCode!, "signin")} className="inline-flex items-center gap-2 rounded-md bg-ink px-3 py-2 text-xs font-semibold text-white">Sign in <ArrowRight size={13} /></Link><Link href={authLink(normalizedCode!, "signup")} className="inline-flex items-center gap-2 rounded-md border border-line-strong bg-white px-3 py-2 text-xs font-semibold text-body">Create account</Link></div></div>}
        {signedIn && <div className="mt-6 rounded-xl border border-line bg-paper p-4">{workspaceState === "loading" && <p className="text-sm text-muted">Loading your workspaces…</p>}{workspaceState === "error" && <><p className="text-sm font-medium text-ink">Workspace service unavailable</p><p className="mt-1 text-xs leading-relaxed text-muted">We could not load your workspaces. No key was created.</p><button type="button" onClick={() => void loadWorkspace()} disabled={working} className="mt-4 inline-flex items-center gap-2 rounded-md border border-line-strong bg-white px-4 py-2.5 text-sm font-semibold text-body disabled:opacity-60">Try again <ArrowRight size={13} /></button></>}{workspaceState === "none" && <><p className="text-sm font-medium text-ink">Workspace setup required</p><p className="mt-1 text-xs leading-relaxed text-muted">Create a workspace first. No connection key is created by this step.</p><button type="button" onClick={() => void createWorkspace()} disabled={working} className="mt-4 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{working ? "Creating workspace…" : "Create workspace to continue"}<ArrowRight size={13} /></button></>}{workspaceState === "select" && <><label htmlFor="device-workspace" className="text-sm font-medium text-ink">Choose a workspace</label><p className="mt-1 text-xs leading-relaxed text-muted">Select where this CLI connection should send telemetry.</p><select id="device-workspace" value={selectedWorkspaceId} onChange={(event) => setSelectedWorkspaceId(event.target.value)} className="mt-4 w-full rounded-md border border-line-strong bg-white px-3 py-2.5 text-sm text-body"><option value="">Select a workspace…</option>{workspaces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button type="button" onClick={() => void approve()} disabled={working || !selectedWorkspaceId} className="mt-4 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><KeyRound size={15} />{working ? "Approving…" : "Approve CLI connection"}</button></>}{workspaceState === "ready" && workspaces[0] && <><p className="text-sm font-medium text-ink">Workspace: {workspaces[0].name}</p><p className="mt-1 text-xs leading-relaxed text-muted">Approval authorizes the CLI session. The CLI redeems the one-time key.</p><button type="button" onClick={() => void approve()} disabled={working} className="mt-4 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><KeyRound size={15} />{working ? "Approving…" : "Approve CLI connection"}</button></>}{error && <p className="mt-3 text-xs text-amber-700">{error}</p>}</div>}
        {signedIn === null && <p className="mt-6 text-sm text-muted">Checking your TrackMCP session…</p>}
      </section>
    </main>
  );
}

function DeviceState({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return <main className="grid min-h-screen place-items-center bg-canvas px-6 text-center text-body"><section className="max-w-md rounded-2xl border border-line bg-white p-8"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand-strong">{icon}</span><h1 className="mt-5 text-2xl font-medium text-ink">{title}</h1><p className="mt-3 text-sm leading-relaxed text-muted">{detail}</p><Link href="/" className="mt-6 inline-flex rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white">Back to TrackMCP</Link></section></main>;
}

function AuthRequiredState({ userCode }: { userCode: string | null }) {
  if (!userCode) return <DeviceState icon={<XCircle />} title="Sign in required" detail="Sign in and restart the device setup from your terminal." />;
  return <main className="grid min-h-screen place-items-center bg-canvas px-6 text-center text-body"><section className="max-w-md rounded-2xl border border-line bg-white p-8"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand-strong"><ShieldCheck /></span><h1 className="mt-5 text-2xl font-medium text-ink">Sign in to approve this device</h1><p className="mt-3 text-sm leading-relaxed text-muted">Your device code will be preserved while you authenticate.</p><div className="mt-6 flex flex-wrap justify-center gap-2"><Link href={authLink(userCode, "signin")} className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white">Sign in <ArrowRight size={13} /></Link><Link href={authLink(userCode, "signup")} className="inline-flex items-center gap-2 rounded-md border border-line-strong bg-white px-4 py-2.5 text-sm font-semibold text-body">Create account</Link></div></section></main>;
}
