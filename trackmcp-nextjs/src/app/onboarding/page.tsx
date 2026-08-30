"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, ChevronDown, CircleHelp, Copy, ExternalLink, KeyRound, Lock, Terminal } from "lucide-react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/auth/supabase-browser";

type SetupDetails = { first_name?: string; last_name?: string; company_name?: string };

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [email, setEmail] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [details, setDetails] = useState<SetupDetails>({});
  const [apiKey, setApiKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const supabase = getSupabaseBrowser();
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.replace("/signin"); return; }
      const userDetails = data.user.user_metadata || {};
      const localName = data.user.email?.split("@")[0] || "your workspace";
      setEmail(data.user.email || "");
      setDetails({ first_name: userDetails.first_name, last_name: userDetails.last_name, company_name: userDetails.company_name });
      setWorkspaceName(userDetails.company_name || `${localName} workspace`);
      const account = await fetch("/api/v1/account/workspace", { cache: "no-store" });
      const body = await account.json();
      if (account.ok && body.workspace) router.replace("/dashboard");
      else setLoading(false);
    })();
  }, [router]);

  const createKey = async () => {
    if (working) return;
    setWorking(true); setError("");
    try {
      const response = await fetch("/api/v1/account/workspace", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...details, name: workspaceName, key_name: "default" }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not create your API key.");
      setApiKey(body.api_key || "");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create your API key.");
    } finally { setWorking(false); }
  };

  const copyKey = async () => {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (loading) return <main className="grid min-h-screen place-items-center text-sm text-muted">Preparing your workspace…</main>;

  return (
    <main className="min-h-screen bg-white text-[#262626]">
      <aside className="fixed inset-y-0 left-0 hidden w-[248px] border-r border-[#e7e7e7] bg-[#fcfcfc] md:flex md:flex-col">
        <div className="flex h-[58px] items-center justify-between border-b border-[#e7e7e7] px-5"><div className="flex min-w-0 items-center gap-2.5"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-gradient-to-br from-[#172b36] to-[#0f9f7b] text-[11px] font-semibold text-white">K</span><span className="truncate text-[13px] font-semibold text-[#444]">{workspaceName}</span></div><ChevronDown size={14} className="text-[#666]" /></div>
        <div className="flex-1 px-3 py-5"><p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#aaa]">Workspace</p><div className="space-y-1 text-[14px] text-[#555]">{["Overview", "Servers", "Sessions", "Tools", "Catalogs"].map((item, index) => <div key={item} className={`flex items-center gap-3 rounded-md px-3 py-2 ${index === 0 ? "bg-[#f0f3f1] font-medium text-[#222]" : "text-[#999]"}`}><span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />{item}{index > 0 && <Lock size={12} className="ml-auto text-[#c7c7c7]" />}</div>)}</div></div>
        <div className="border-t border-[#e7e7e7] px-5 py-4"><p className="truncate text-[12px] text-[#777]">{email}</p></div>
      </aside>

      <section className="min-h-screen md:ml-[248px]"><header className="flex h-[58px] items-center justify-end border-b border-[#e7e7e7] px-6 sm:px-10"><Link href="https://trackmcp.com/docs" className="flex items-center gap-1.5 text-[13px] text-[#555] hover:text-[#111]">Docs <ExternalLink size={13} /></Link></header>
        <div className="mx-auto max-w-[980px] px-6 py-12 sm:px-10 sm:py-16"><div className="max-w-[650px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#14956f]">Workspace setup</p><h1 className="mt-3 text-[32px] font-semibold tracking-[-0.035em] text-[#202020] sm:text-[38px]">Connect your first MCP server</h1><p className="mt-3 text-[15px] leading-relaxed text-[#686868]">Follow these steps to start seeing how your MCP server is used. Your dashboard will unlock as soon as the connection is ready.</p></div>
          <div className="relative mt-12 max-w-[820px]"><div className="absolute bottom-10 left-[9px] top-10 w-px bg-[#d9dfdc]" /><StepDot complete={Boolean(apiKey)} active={!apiKey} /><section className="relative ml-8 border-b border-[#e7e7e7] pb-9"><p className="text-[12px] font-medium text-[#888]">Step 1</p><h2 className="mt-1 text-[21px] font-semibold tracking-[-0.02em]">Add an API key {apiKey && <Check size={18} className="ml-1 inline text-[#159b73]" />}</h2><p className="mt-1 text-[14px] text-[#666]">Use this generated key to authenticate telemetry from your MCP server.</p>{apiKey ? <div className="mt-5 max-w-[720px] rounded-xl border border-[#8bd5b5] bg-[#f1fbf5] p-4"><div className="flex items-center justify-between gap-3"><span className="text-[12px] font-medium text-[#32815f]">Your secret API key</span><span className="text-[11px] text-[#6b9b84]">Shown once</span></div><div className="mt-3 flex items-center gap-2 rounded-lg border border-[#c9ddd2] bg-white px-3 py-2.5"><code className="min-w-0 flex-1 overflow-x-auto font-mono text-[12px] text-[#333]">{apiKey}</code><button onClick={copyKey} className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[#d6ded9] px-2.5 py-1.5 text-[12px] font-medium text-[#333] hover:bg-[#f5f7f6]"><Copy size={13} />{copied ? "Copied" : "Copy key"}</button></div></div> : <button onClick={createKey} disabled={working} className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#151515] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-black disabled:cursor-wait disabled:opacity-60"><KeyRound size={15} />{working ? "Creating key…" : "Add API key"}</button>}{error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}</section>
            <StepDot complete={false} active={Boolean(apiKey)} /><section className={`relative ml-8 border-b border-[#e7e7e7] py-9 ${apiKey ? "" : "opacity-45"}`}><p className="text-[12px] font-medium text-[#888]">Step 2</p><h2 className="mt-1 text-[21px] font-semibold tracking-[-0.02em]">Install the SDK {apiKey ? <Check size={18} className="ml-1 inline text-[#159b73]" /> : <Lock size={16} className="ml-1 inline text-[#aaa]" />}</h2><p className="mt-1 text-[14px] text-[#666]">Add TrackMCP to your existing server and start capturing protocol activity.</p><div className="mt-5 flex max-w-[720px] items-center gap-3 rounded-lg border border-[#e2e5e3] bg-[#fafbfa] px-4 py-3"><Terminal size={16} className="text-[#777]" /><code className="font-mono text-[13px] text-[#444]">npm install @trackmcp/sdk</code><Copy size={14} className="ml-auto text-[#aaa]" /></div></section>
            <StepDot complete={false} active={false} /><section className="relative ml-8 pt-9 opacity-45"><p className="text-[12px] font-medium text-[#888]">Step 3</p><h2 className="mt-1 text-[21px] font-semibold tracking-[-0.02em]">Send your first event <Lock size={16} className="ml-1 inline text-[#aaa]" /></h2><p className="mt-1 text-[14px] text-[#666]">Once your server sends traffic, TrackMCP will begin building your session and tool insights.</p></section>
          </div>
          <div className="mt-14 border-t border-[#e7e7e7] pt-8"><div className="flex items-center gap-2 text-[17px] font-semibold text-[#888]"><CircleHelp size={17} /> Explore more</div><p className="mt-1 text-[13px] text-[#aaa]">Your analytics workspace unlocks after the first connection.</p><div className="mt-5 grid gap-4 sm:grid-cols-3">{[{ title: "Session traces", body: "See every request, tool call, error, and handoff." }, { title: "Tool adoption", body: "Understand which capabilities teams actually use." }, { title: "Workflow health", body: "Find the steps where agents stop or slow down." }].map((item) => <div key={item.title} className="border border-[#e8e8e8] p-4"><h3 className="text-[14px] font-medium text-[#888]">{item.title}</h3><p className="mt-2 text-[12px] leading-relaxed text-[#aaa]">{item.body}</p></div>)}</div></div>
        </div>
      </section>
    </main>
  );
}

function StepDot({ complete, active }: { complete: boolean; active: boolean }) { return <span className={`relative z-10 grid h-[19px] w-[19px] place-items-center rounded-full border-2 bg-white ${complete || active ? "border-[#14956f]" : "border-[#aaa]"}`}>{complete ? <Check size={11} className="text-[#14956f]" /> : active ? <span className="h-1.5 w-1.5 rounded-full bg-[#14956f]" /> : null}</span>; }
