"use client";

import { useState } from "react";
import { Check, Clipboard, ExternalLink, RefreshCw } from "lucide-react";

export function IntegrationChecklist({
  hasKey,
  working,
  onGenerateKey,
  onRefresh,
  onExplore,
  onSettings,
}: {
  hasKey: boolean;
  working: boolean;
  onGenerateKey: () => void;
  onRefresh: () => void;
  onExplore: () => void;
  onSettings: () => void;
}) {
  const [copied, setCopied] = useState("");
  const copy = async (value: string, label: string) => {
    await navigator.clipboard?.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1600);
  };
  const steps = [
    { done: hasKey, title: "Create your workspace key", body: hasKey ? "Your key is ready. Keep it private and use it only on your server." : "Generate a private key for the server you want to measure.", action: hasKey ? null : <button onClick={onGenerateKey} disabled={working} className="rounded-lg bg-ink px-3 py-2 text-xs font-medium text-white disabled:opacity-50">{working ? "Creating…" : "Generate key"}</button> },
    { done: false, title: "Install the SDK", body: "Add TrackMCP to the project that runs your MCP server.", action: <div className="flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2 font-mono text-xs text-body"><span>npm install @trackmcp/sdk</span><button onClick={() => void copy("npm install @trackmcp/sdk", "install")} aria-label="Copy install command" className="text-faint hover:text-ink">{copied === "install" ? <Check size={14} /> : <Clipboard size={14} />}</button></div> },
    { done: false, title: "Wrap your server", body: "Set TRACKMCP_KEY in your environment and add the wrapper around your existing server.", action: <button onClick={onSettings} className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-strong hover:underline">View integration snippet <ExternalLink size={12} /></button> },
    { done: false, title: "Send your first event", body: "Run your server and make one tool call. Then return here to verify the connection.", action: <button onClick={onRefresh} className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-2 text-xs font-medium text-ink hover:bg-paper"><RefreshCw size={13} /> Check for data</button> },
  ];
  return <section className="mb-7 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_12px_35px_-28px_rgba(10,10,10,0.45)]"><div className="grid gap-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]"><div className="bg-ink px-6 py-7 text-white sm:px-8"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">Your first connection</p><h2 className="mt-3 max-w-md text-2xl font-medium tracking-[-0.035em]">See the product before your server sends data.</h2><p className="mt-3 max-w-md text-sm leading-relaxed text-white/65">Explore the sample workspace, then follow the checklist to connect your own MCP server. Your live data will replace the sample automatically.</p><div className="mt-6 flex flex-wrap gap-2"><button onClick={onExplore} className="rounded-lg bg-white px-3.5 py-2.5 text-xs font-medium text-ink">Explore sample data</button><button onClick={onSettings} className="rounded-lg border border-white/20 px-3.5 py-2.5 text-xs font-medium text-white hover:bg-white/10">Open integration</button></div></div><div className="px-6 py-6 sm:px-8">{steps.map((step, index) => <div key={step.title} className="relative flex gap-3.5 pb-5 last:pb-0"><div className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line bg-white">{step.done ? <Check size={14} className="text-brand" /> : <span className="text-[11px] font-semibold text-muted">{index + 1}</span>}</div>{index < steps.length - 1 && <span className="absolute left-[13px] top-7 h-[calc(100%-12px)] w-px bg-line" /> }<div className="min-w-0 flex-1"><p className="text-sm font-medium text-ink">{step.title}</p><p className="mt-1 text-xs leading-relaxed text-muted">{step.body}</p><div className="mt-2">{step.action}</div></div></div>)}</div></div></section>;
}
