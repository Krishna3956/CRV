"use client";

import { ArrowRight } from "lucide-react";

export type SetupDetails = { first_name: string; last_name: string };

export function SetupModal({ initial, working, error, onSubmit }: { initial: SetupDetails; working: boolean; error: string; onSubmit: (details: SetupDetails) => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-5 backdrop-blur-sm"><section role="dialog" aria-modal="true" aria-labelledby="setup-title" className="w-full max-w-lg border border-line bg-white p-7 sm:p-9"><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-strong">Complete your account</p><h2 id="setup-title" className="mt-3 text-3xl font-medium tracking-[-0.035em] text-ink">Create your workspace.</h2><p className="mt-2 text-sm leading-relaxed text-muted">Your account details are already saved. Create a workspace to generate your first TrackMCP key. TrackMCP observes the MCP server boundary, redacts payloads locally, and stays fail-open if telemetry is unavailable.</p><p className="mt-3 text-xs text-muted">Review the <a href="/docs/reference#privacy" className="font-medium text-brand-strong underline">privacy defaults</a> before connecting.</p><form onSubmit={(event) => { event.preventDefault(); onSubmit(initial); }} className="mt-7 space-y-4">{error && <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<button disabled={working} className="inline-flex w-full items-center justify-center gap-2 bg-ink px-5 py-3 text-sm font-medium text-white disabled:opacity-60">{working ? "Creating your workspace..." : "Continue to connection"}<ArrowRight size={15} /></button></form></section></div>;
}
