"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, Clock3, Copy, EyeOff, FileWarning, Info, XCircle } from "lucide-react";
import type { TraceEvent, TraceResponse } from "@/lib/telemetry/analytics-types";

const qualityLabels = {
  session_id: "Session ID",
  transport_generated: "Transport-generated",
  external: "External handle",
  issued: "Issued handle",
  missing: "Missing/degraded",
  mixed: "Mixed correlation",
} as const;

const completionLabels = {
  workflow_events: "Explicit workflow events",
  session_heuristic: "Session heuristic",
  none: "No completion signal",
} as const;

function hasTruncation(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if ((value as Record<string, unknown>).__trackmcp_truncated === true) return true;
  return Object.values(value as Record<string, unknown>).some(hasTruncation);
}

function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warn" | "good" }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-medium ${tone === "warn" ? "border-amber-200 bg-amber-50 text-amber-800" : tone === "good" ? "border-brand/20 bg-brand-soft text-brand-strong" : "border-line bg-paper text-muted"}`}>{children}</span>;
}

function eventLabel(event: TraceEvent): string {
  return event.mcp_method || event.tool_name || event.event_type;
}

function eventStatus(event: TraceEvent): { label: string; tone: "good" | "warn" | "neutral" } {
  if (event.is_error === true || event.success === false) return { label: "Error", tone: "warn" };
  if (event.success === true) return { label: "Success", tone: "good" };
  return { label: "Observed", tone: "neutral" };
}

function observationLabel(event: TraceEvent): string {
  return event.observation_source === "client" ? "Client observed" : event.observation_source === "server" ? "Server observed" : "Observation source unavailable";
}

function correlationSourceLabel(source: TraceEvent["correlation_handle_source"]): string {
  if (source === "external") return "External handle";
  if (source === "issued") return "Issued handle";
  return "Correlation source unavailable";
}

function EventCard({ event, index }: { event: TraceEvent; index: number }) {
  const status = eventStatus(event);
  const redacted = event.payload_policy === "redacted";
  const truncated = hasTruncation(event.payload);
  return <article className="relative border-l-2 border-line-strong pb-6 pl-6 last:pb-0">
    <span className="absolute -left-[7px] top-0 h-3 w-3 rounded-full border-2 border-white bg-brand" />
    <div className="rounded-xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(31,43,36,0.03)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="font-mono text-xs text-faint">#{index + 1} · {event.event_type}</p><h3 className="mt-1 text-sm font-semibold text-ink">{eventLabel(event)}</h3></div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
        <span className="inline-flex items-center gap-1"><Clock3 size={13} />{event.duration_ms === null ? "Duration unavailable" : `${event.duration_ms}ms`}</span>
        {event.retry_number !== null && <span>Retry {event.retry_number}</span>}
        {event.transport && <span>{event.transport}</span>}
        {event.direction && <span>{event.direction}</span>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone={event.observation_source === "server" ? "good" : "neutral"}>{observationLabel(event)}</Badge>
        {event.correlation_handle_source && <Badge>{correlationSourceLabel(event.correlation_handle_source)}</Badge>}
        {redacted && <Badge><EyeOff size={11} className="mr-1" />Redacted payload</Badge>}
        {truncated && <Badge tone="warn"><FileWarning size={11} className="mr-1" />Payload truncated</Badge>}
        {event.payload_policy === "metadata" && <Badge>Metadata only</Badge>}
        {event.payload_policy === "full" && <Badge tone="warn">Full mode</Badge>}
        {!event.payload && event.payload_policy !== "metadata" && <Badge>Payload not captured</Badge>}
      </div>
      <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
        {event.client_name && <div><dt className="text-faint">Client</dt><dd className="mt-0.5 text-body">{event.client_name}{event.client_version ? ` ${event.client_version}` : ""}</dd></div>}
        {event.server_id && <div><dt className="text-faint">Server boundary</dt><dd className="mt-0.5 text-body">{event.server_id}{event.server_version ? ` · ${event.server_version}` : ""}</dd></div>}
        {event.request_id && <div><dt className="text-faint">Request</dt><dd className="mt-0.5 truncate font-mono text-body">{event.request_id}</dd></div>}
        {event.workflow_id && <div><dt className="text-faint">Workflow</dt><dd className="mt-0.5 font-mono text-body">{event.workflow_id}</dd></div>}
      </dl>
      {event.payload && <details className="mt-4 border-t border-line pt-3"><summary className="cursor-pointer text-xs font-medium text-muted">View bounded payload</summary><pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-[#101713] p-3 font-mono text-[11px] leading-relaxed text-white/85">{JSON.stringify(event.payload, null, 2)}</pre></details>}
    </div>
  </article>;
}

export function TraceExplorer({ sessionId, correlationHandle, sampleMode, onBack, originLabel = "sessions" }: { sessionId: string | null; correlationHandle: string | null; sampleMode: boolean; onBack: () => void; originLabel?: string }) {
  const [response, setResponse] = useState<TraceResponse | null>(null);
  const [loading, setLoading] = useState(!sampleMode);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const resolvedOriginLabel = typeof window === "undefined"
    ? originLabel
    : new URLSearchParams(window.location.search).get("origin")?.replaceAll("-", " ") || originLabel;

  useEffect(() => {
    if (sampleMode) return;
    const controller = new AbortController();
    const query = sessionId ? `session_id=${encodeURIComponent(sessionId)}` : `correlation_handle=${encodeURIComponent(correlationHandle || "")}`;
    void fetch(`/api/v1/traces?${query}&limit=200`, { cache: "no-store", credentials: "include", signal: controller.signal })
      .then(async (result) => {
        const body = await result.json() as TraceResponse & { error?: string };
        if (!result.ok) throw new Error(body.error || "Could not load this trace.");
        setResponse(body);
      })
      .catch((reason: unknown) => { if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(reason instanceof Error ? reason.message : "Could not load this trace."); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [sampleMode, sessionId, correlationHandle]);

  const copySession = async () => {
    try { await navigator.clipboard.writeText(sessionId || correlationHandle || ""); setCopied(true); window.setTimeout(() => setCopied(false), 1500); } catch { setCopied(false); }
  };

  return <div>
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4"><div><button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink"><ArrowLeft size={14} />Back to {resolvedOriginLabel.toLowerCase()}</button><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">{sampleMode ? "Sample / Trace Explorer" : `${resolvedOriginLabel} / Trace Explorer`}</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-ink">Trace Explorer</h2><p className="mt-2 max-w-2xl text-sm text-muted">One bounded event at a time, in observed order. Payload details remain subject to the capture policy.</p></div><Badge tone={sampleMode ? "neutral" : "good"}>{sampleMode ? "Sample data" : "Live trace"}</Badge></div>
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white px-4 py-3"><div className="min-w-0 flex-1"><p className="text-[10px] uppercase tracking-[0.12em] text-faint">{sessionId ? "Session ID" : "Correlation handle"}</p><p className="mt-1 truncate font-mono text-xs text-body">{sessionId || correlationHandle}</p></div><button onClick={() => void copySession()} className="inline-flex items-center gap-1.5 border border-line-strong px-3 py-2 text-xs font-medium text-body"><Copy size={13} />{copied ? "Copied" : "Copy ID"}</button></div>
    {sampleMode ? <div className="grid min-h-[280px] place-items-center rounded-xl border border-dashed border-line-strong bg-white p-8 text-center"><div><p className="text-sm font-semibold text-ink">Trace details are live-data only</p><p className="mt-2 max-w-md text-sm leading-relaxed text-muted">This session came from the sample dashboard. Switch the dashboard to My data to inspect an authenticated trace from your workspace.</p></div></div> : loading ? <div className="grid min-h-[280px] place-items-center rounded-xl border border-line bg-white text-sm text-muted">Loading trace…</div> : error ? <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700"><AlertTriangle size={16} />{error}</div> : !response?.events.length ? <div className="grid min-h-[280px] place-items-center rounded-xl border border-dashed border-line-strong bg-white p-8 text-center"><div><XCircle size={24} className="mx-auto text-faint" /><p className="mt-3 text-sm font-semibold text-ink">No events found for this session</p><p className="mt-2 text-sm text-muted">The session may have expired, or it may belong to another workspace.</p></div></div> : <>
      <div className="mb-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-line bg-white p-4"><p className="text-xs text-muted">Events returned</p><p className="mt-1 text-lg font-semibold text-ink">{response.event_count}{response.truncated ? "+" : ""}</p><p className="mt-1 text-[11px] text-muted">{response.truncated ? "Bounded result; timeline is incomplete" : "Within the trace limit"}</p></div><div className="rounded-xl border border-line bg-white p-4"><p className="text-xs text-muted">Correlation</p><p className="mt-1 text-sm font-semibold text-ink">{qualityLabels[response.correlation_quality]}</p><p className="mt-1 text-[11px] text-muted">{response.correlation_handle_source ? correlationSourceLabel(response.correlation_handle_source) : "Source unavailable"}</p></div><div className="rounded-xl border border-line bg-white p-4"><p className="text-xs text-muted">Completion signal</p><p className="mt-1 text-sm font-semibold text-ink">{completionLabels[response.completion_source]}</p><p className="mt-1 text-[11px] text-muted">{response.completion_source === "workflow_events" ? "Application-defined evidence" : response.completion_source === "session_heuristic" ? "Not a workflow completion" : "No completion signal"}</p></div></div>
      {(response.correlation_quality === "missing" || response.correlation_quality === "mixed") && <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800"><Info size={15} className="mt-0.5 shrink-0" /><span>This trace has degraded or mixed correlation. A request ID alone does not establish a reliable relationship between events.</span></div>}
      {response.truncated && <div className="mb-5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800"><FileWarning size={15} />This trace is capped at 200 events. Narrowing controls will be added in a later iteration.</div>}
      <div className="mb-4 flex flex-wrap gap-2"><Badge>{qualityLabels[response.correlation_quality]}</Badge><Badge>{completionLabels[response.completion_source]}</Badge>{response.events.some((event) => event.payload_policy === "redacted") && <Badge><EyeOff size={11} className="mr-1" />Redacted content present</Badge>}{response.events.some((event) => hasTruncation(event.payload)) && <Badge tone="warn"><FileWarning size={11} className="mr-1" />Truncation present</Badge>}</div>
      <div>{response.events.map((event, index) => <EventCard key={`${event.event_id}-${index}`} event={event} index={index} />)}</div>
    </>}
  </div>;
}
