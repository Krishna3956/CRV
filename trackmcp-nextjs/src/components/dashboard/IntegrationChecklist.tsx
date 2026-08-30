"use client";

import { Check, Clipboard, ExternalLink, RefreshCw, X } from "lucide-react";
import { useState } from "react";

export function IntegrationChecklist({ hasKey, working, onGenerateKey, onRefresh, onExplore, onSettings, onDismiss, checking, checkStatus }: {
  hasKey: boolean; working: boolean; onGenerateKey: () => void; onRefresh: () => void; onExplore: () => void; onSettings: () => void; onDismiss: () => void; checking: boolean; checkStatus: "idle" | "checking" | "waiting";
}) {
  const [copied, setCopied] = useState(false);
  const copyInstall = async () => {
    await navigator.clipboard.writeText("npm install @trackmcp/sdk");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return <section className="mb-7 border border-[#dfe7e2] bg-white">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e7ebe8] px-5 py-4 sm:px-6">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#14956f]">First connection</p><h2 className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-[#202020]">Connect your MCP server</h2><p className="mt-1 text-[13px] text-[#707570]">Generate a key, install the SDK, and send one event to start observing your server.</p></div>
      <div className="flex items-center gap-2"><button onClick={onExplore} className="border border-[#d8e0db] px-3 py-2 text-[12px] font-medium text-[#444] hover:bg-[#f6f8f6]">Explore sample</button><button onClick={onDismiss} aria-label="Dismiss connection guide" className="rounded-md p-1.5 text-[#999] hover:bg-[#f2f4f2] hover:text-[#333]"><X size={16} /></button></div>
    </div>
    <div className="grid gap-0 divide-y border-b border-[#e7ebe8] md:grid-cols-4 md:divide-x md:divide-y-0">
      <Step number="01" title="Create an API key" done={hasKey}>{hasKey ? <span className="text-[12px] text-[#5f7568]">Key created and ready to use.</span> : <button onClick={onGenerateKey} disabled={working} className="mt-2 bg-[#151515] px-3 py-2 text-[12px] font-medium text-white disabled:opacity-50">{working ? "Creating…" : "Generate key"}</button>}</Step>
      <Step number="02" title="Install the SDK" done={false}><div className="mt-2 flex items-center gap-2"><code className="font-mono text-[11px] text-[#4c5550]">npm install @trackmcp/sdk</code><button onClick={() => void copyInstall()} aria-label="Copy SDK install command" className="text-[#777] hover:text-[#14956f]">{copied ? <Check size={14} /> : <Clipboard size={14} />}</button></div></Step>
      <Step number="03" title="Wrap your server" done={false}><button onClick={onSettings} className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-[#168c69] hover:underline">View integration guide <ExternalLink size={12} /></button></Step>
      <Step number="04" title="Verify an event" done={false}><p className="mt-1 text-[12px] leading-relaxed text-[#707570]">{checkStatus === "waiting" ? "No event yet. Make a tool call and check again." : "Make one tool call, then verify it here."}</p><button onClick={onRefresh} disabled={checking} className="mt-2 inline-flex items-center gap-1.5 border border-[#d8e0db] px-3 py-2 text-[12px] font-medium text-[#444] hover:bg-[#f6f8f6] disabled:opacity-50"><RefreshCw size={13} className={checking ? "animate-spin" : ""} />{checking ? "Checking…" : "Check data"}</button></Step>
    </div>
  </section>;
}

function Step({ number, title, done, children }: { number: string; title: string; done: boolean; children: React.ReactNode }) {
  return <div className="px-5 py-4 sm:px-6"><div className="flex items-center gap-2"><span className="font-mono text-[10px] text-[#9ba49e]">{number}</span><h3 className="text-[13px] font-semibold text-[#333]">{title}</h3>{done && <Check size={14} className="text-[#14956f]" />}</div>{children}</div>;
}
