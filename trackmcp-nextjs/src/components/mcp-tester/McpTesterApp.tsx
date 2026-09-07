"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, ChevronDown, CircleHelp, Copy, LoaderCircle, LockKeyhole, Play, RotateCcw, ShieldCheck, Square, X } from "lucide-react";
import { EarlyAccessButton } from "@/components/EarlyAccessButton";
import { DEFAULT_MCP_TESTER_LIMITS, runMcpTester, serializeMcpTesterReport, validateMcpEndpoint, validateMcpHeaders } from "@/lib/mcp-tester";
import type { HealthDimensionName, McpTesterPhase, McpTesterProgressStatus, McpTesterReport, McpTesterVerdict } from "@/lib/mcp-tester";

type TesterMode = "tester" | "health" | "inspector";
type RunState = "idle" | "running" | "complete";
type HeaderRow = { id: number; name: string; value: string };

const EMPTY_HEADERS: HeaderRow[] = [{ id: 1, name: "", value: "" }];
const PROGRESS: Array<{ phase: McpTesterPhase; label: string }> = [
  { phase: "validate_endpoint", label: "Validate endpoint" },
  { phase: "validate_headers", label: "Validate request headers" },
  { phase: "initialize", label: "Negotiate MCP protocol" },
  { phase: "initialized_notification", label: "Confirm initialized session" },
  { phase: "tools_list", label: "Discover tools catalog" },
  { phase: "resources_list", label: "Discover resources catalog when advertised" },
  { phase: "prompts_list", label: "Discover prompts catalog when advertised" },
  { phase: "catalog_quality", label: "Check catalog quality" },
  { phase: "finalize", label: "Assemble bounded health report" },
];
const DIMENSIONS: HealthDimensionName[] = [
  "reachability", "protocol_negotiation", "server_identity", "capability_discovery", "pagination", "latency", "catalog_quality", "browser_compatibility", "authentication",
];
const DIMENSION_LABELS: Record<HealthDimensionName, string> = {
  reachability: "Reachability",
  protocol_negotiation: "Protocol negotiation",
  server_identity: "Server identity",
  capability_discovery: "Capability discovery",
  pagination: "Pagination",
  latency: "Latency",
  catalog_quality: "Catalog quality",
  browser_compatibility: "Browser compatibility",
  authentication: "Authentication",
};
const VERDICT_LABELS: Record<McpTesterVerdict, string> = {
  healthy_now: "Healthy now",
  degraded: "Degraded",
  unreachable: "Unreachable",
  protocol_error: "Protocol error",
  auth_required: "Authentication required",
  browser_blocked: "Browser or CORS blocked",
  unsupported: "Unsupported",
  incomplete: "Incomplete",
};
const VERDICT_STYLES: Record<McpTesterVerdict, string> = {
  healthy_now: "border-brand/25 bg-brand-soft text-brand-strong",
  degraded: "border-amber-200 bg-amber-50 text-amber-800",
  unreachable: "border-red-200 bg-red-50 text-red-800",
  protocol_error: "border-red-200 bg-red-50 text-red-800",
  auth_required: "border-violet-200 bg-violet-50 text-violet-800",
  browser_blocked: "border-sky-200 bg-sky-50 text-sky-800",
  unsupported: "border-line-strong bg-mist text-muted",
  incomplete: "border-amber-200 bg-amber-50 text-amber-800",
};

function text(value: unknown, fallback = "Not reported"): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function modeCopy(mode: TesterMode) {
  if (mode === "health") return {
    eyebrow: "MCP health check",
    title: "Check whether your MCP server is reachable and speaking MCP",
    body: "Run a bounded, browser-direct health check for protocol negotiation, capabilities, catalogs, latency, and browser compatibility.",
  };
  if (mode === "inspector") return {
    eyebrow: "MCP inspector",
    title: "Inspect your MCP server without executing a tool",
    body: "See the server identity, negotiated protocol, capabilities, and read-only catalogs returned by an HTTPS Streamable HTTP endpoint.",
  };
  return {
    eyebrow: "MCP server tester",
    title: "Test and health-check your MCP server",
    body: "A safe, browser-direct probe for HTTPS Streamable HTTP MCP endpoints. It negotiates, inspects, and reports without executing tools or reading content.",
  };
}

function phaseState(report: McpTesterReport | null, progress: Partial<Record<McpTesterPhase, McpTesterProgressStatus>>, phase: McpTesterPhase): "done" | "active" | "pending" | "failed" {
  const reportPhase = report?.phases.find((item) => item.phase === phase);
  if (reportPhase?.outcome === "failed" || reportPhase?.outcome === "blocked" || reportPhase?.outcome === "auth_required") return "failed";
  if (reportPhase?.outcome === "passed" || reportPhase?.outcome === "skipped") return "done";
  if (reportPhase?.outcome === "incomplete") return "failed";
  const progressStatus = progress[phase];
  if (progressStatus === "started") return "active";
  if (progressStatus === "failed" || progressStatus === "blocked" || progressStatus === "auth_required" || progressStatus === "incomplete") return "failed";
  if (progressStatus === "passed" || progressStatus === "skipped") return "done";
  return "pending";
}

function phaseStatusLabel(status: McpTesterProgressStatus | undefined): string {
  switch (status) {
    case "started": return "waiting for response";
    case "passed": return "completed";
    case "skipped": return "skipped by capability";
    case "blocked": return "blocked by browser/CORS";
    case "auth_required": return "authentication required";
    case "incomplete": return "incomplete due to timeout or bound";
    case "failed": return "failed";
    default: return "";
  }
}

function phaseDetail(report: McpTesterReport | null, phase: McpTesterPhase, status: McpTesterProgressStatus | undefined): string {
  const finding = report?.findings.find((item) => item.phase === phase);
  if (finding) return finding.message;
  switch (status) {
    case "started": return "Waiting for the browser-visible response from this endpoint.";
    case "blocked": return "The browser could not expose a usable response. This may be CORS or browser network policy, not server downtime.";
    case "auth_required": return "The endpoint required authentication; the tester did not store or retry credentials.";
    case "incomplete": return "The bounded test stopped before this phase completed.";
    case "failed": return "The endpoint returned invalid or unusable MCP data in this phase.";
    default: return "";
  }
}

function formatElapsed(ms: number): string {
  return ms < 1000 ? `${Math.max(0, Math.round(ms))} ms` : `${(ms / 1000).toFixed(1)} s`;
}

function Catalog({ title, count, pages, complete, truncated, children }: { title: string; count: number; pages: number; complete: boolean; truncated: boolean; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-line bg-white" open={count > 0}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2 text-[14px] font-semibold text-ink"><ChevronDown size={15} className="transition-transform group-open:rotate-180" /> {title}</span>
        <span className="font-mono text-[12px] text-muted">{count} item{count === 1 ? "" : "s"}</span>
      </summary>
      <div className="border-t border-line px-4 py-3.5">
        <div className="flex flex-wrap gap-2 text-[11px] text-muted">
          <span className="rounded-full border border-line bg-paper px-2.5 py-1">{pages} page{pages === 1 ? "" : "s"}</span>
          <span className={`rounded-full border px-2.5 py-1 ${complete ? "border-brand/20 bg-brand-soft text-brand-strong" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{complete ? "Complete" : "Incomplete"}</span>
          {truncated && <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-800">Truncated by bounds</span>}
        </div>
        {count > 0 ? <div className="mt-3 divide-y divide-line">{children}</div> : <p className="mt-3 text-[13px] text-muted">No catalog items were returned.</p>}
      </div>
    </details>
  );
}

export function McpTesterApp({ initialMode = "tester" }: { initialMode?: TesterMode }) {
  const copy = modeCopy(initialMode);
  const [endpoint, setEndpoint] = useState("");
  const [headers, setHeaders] = useState<HeaderRow[]>(EMPTY_HEADERS);
  const [showHeaders, setShowHeaders] = useState(false);
  const [runState, setRunState] = useState<RunState>("idle");
  const [report, setReport] = useState<McpTesterReport | null>(null);
  const [inputError, setInputError] = useState("");
  const [copyState, setCopyState] = useState(false);
  const [phaseProgress, setPhaseProgress] = useState<Partial<Record<McpTesterPhase, McpTesterProgressStatus>>>({});
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);
  const endpointRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (runState !== "running" || runStartedAt === null) return;
    const updateElapsed = () => setElapsedMs(Math.max(0, Date.now() - runStartedAt));
    updateElapsed();
    const timer = window.setInterval(updateElapsed, 250);
    return () => window.clearInterval(timer);
  }, [runState, runStartedAt]);

  const updateHeader = (id: number, field: "name" | "value", value: string) => {
    setHeaders((current) => current.map((row) => row.id === id ? { ...row, [field]: value } : row));
  };

  const addHeader = () => {
    setHeaders((current) => [...current, { id: Math.max(0, ...current.map((row) => row.id)) + 1, name: "", value: "" }]);
  };

  const removeHeader = (id: number) => {
    setHeaders((current) => {
      const next = current.filter((row) => row.id !== id);
      return next.length > 0 ? next : EMPTY_HEADERS;
    });
  };

  const reset = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setEndpoint("");
    setHeaders(EMPTY_HEADERS);
    setReport(null);
    setInputError("");
    setRunState("idle");
    setPhaseProgress({});
    setRunStartedAt(null);
    setElapsedMs(0);
    setCopyState(false);
    endpointRef.current?.focus();
  };

  const run = async () => {
    setInputError("");
    const endpointValidation = validateMcpEndpoint(endpoint.trim(), DEFAULT_MCP_TESTER_LIMITS);
    if (!endpointValidation.ok) {
      setInputError(endpointValidation.message);
      endpointRef.current?.focus();
      return;
    }
    const suppliedHeaders = Object.fromEntries(headers.filter((row) => row.name.trim() || row.value).map((row) => [row.name.trim(), row.value]));
    const headerValidation = validateMcpHeaders(suppliedHeaders, DEFAULT_MCP_TESTER_LIMITS);
    if (!headerValidation.ok) {
      setInputError(headerValidation.message);
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    setReport(null);
    setRunState("running");
    setPhaseProgress({});
    setRunStartedAt(Date.now());
    setElapsedMs(0);
    try {
      const nextReport = await runMcpTester({
        endpoint: endpoint.trim(),
        headers: suppliedHeaders,
        fetch: window.fetch.bind(window),
        signal: controller.signal,
        onProgress: (update) => setPhaseProgress((current) => ({ ...current, [update.phase]: update.status })),
      });
      setReport(nextReport);
    } catch {
      setInputError("The browser could not complete the bounded probe. Run it again or inspect the browser network policy.");
    } finally {
      controllerRef.current = null;
      setHeaders(EMPTY_HEADERS);
      setRunState("complete");
      setRunStartedAt(null);
    }
  };

  const cancel = () => controllerRef.current?.abort();

  const copyReport = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(serializeMcpTesterReport(report));
      setCopyState(true);
      window.setTimeout(() => setCopyState(false), 1500);
    } catch {
      setInputError("The report could not be copied in this browser.");
    }
  };

  return (
    <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-12 sm:pt-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-brand">{copy.eyebrow}</p>
        <h1 className="mx-auto mt-4 max-w-[18ch] text-balance text-[38px] font-medium leading-[1.05] tracking-[-0.04em] text-ink sm:text-[56px]">{copy.title}</h1>
        <p className="mx-auto mt-5 max-w-[62ch] text-[16px] leading-[1.6] text-muted sm:text-[18px]">{copy.body}</p>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <section aria-labelledby="tester-form-title" className="rounded-2xl border border-line bg-white p-5 shadow-[0_24px_70px_-46px_rgba(10,10,10,0.35)] sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div><p className="font-mono text-[11px] uppercase tracking-[0.08em] text-faint">Browser-direct probe</p><h2 id="tester-form-title" className="mt-2 text-[22px] font-medium tracking-[-0.025em]">Enter an MCP endpoint</h2></div>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong"><ShieldCheck size={18} /></span>
          </div>
          <label htmlFor="mcp-endpoint" className="mt-7 block text-[13px] font-medium text-body">HTTPS Streamable HTTP endpoint</label>
          <input ref={endpointRef} id="mcp-endpoint" value={endpoint} onChange={(event) => setEndpoint(event.target.value)} placeholder="https://your-server.example/mcp" spellCheck={false} autoComplete="url" className="mt-2 w-full rounded-lg border border-line-strong bg-paper px-3.5 py-3 font-mono text-[13px] text-ink placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15" />
          <p className="mt-2 text-[12px] leading-[1.5] text-muted">Only HTTPS endpoints are accepted. Local, private IP, link-local, metadata, credential-bearing, and non-HTTP targets are rejected.</p>

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
            <div className="flex gap-2.5"><LockKeyhole size={17} className="mt-0.5 shrink-0 text-amber-700" /><div><p className="text-[13px] font-semibold text-amber-900">Privacy warning for custom headers</p><p className="mt-1 text-[12px] leading-[1.5] text-amber-900/80">Use a short-lived test credential only. Headers stay in memory for this run, are sent directly by your browser, then cleared. They are never persisted or included in the report.</p></div></div>
          </div>

          <button type="button" onClick={() => setShowHeaders((value) => !value)} aria-expanded={showHeaders} className="mt-5 flex w-full items-center justify-between border-b border-line pb-3 text-left text-[13px] font-medium text-body"><span className="flex items-center gap-2"><ChevronDown size={15} className={`transition-transform ${showHeaders ? "rotate-180" : ""}`} /> Optional custom headers</span><span className="font-mono text-[11px] text-faint">max 16</span></button>
          {showHeaders && <div className="mt-4 space-y-2.5">
            {headers.map((row) => <div key={row.id} className="flex gap-2">
              <input aria-label="Header name" value={row.name} onChange={(event) => updateHeader(row.id, "name", event.target.value)} placeholder="Header name" autoComplete="off" className="min-w-0 flex-1 rounded-lg border border-line-strong bg-paper px-3 py-2.5 font-mono text-[12px] focus:border-brand focus:outline-none" />
              <input aria-label="Header value" value={row.value} onChange={(event) => updateHeader(row.id, "value", event.target.value)} placeholder="Value" type={row.name.toLowerCase().includes("authorization") || row.name.toLowerCase().includes("token") ? "password" : "text"} autoComplete="off" className="min-w-0 flex-[1.4] rounded-lg border border-line-strong bg-paper px-3 py-2.5 font-mono text-[12px] focus:border-brand focus:outline-none" />
              <button type="button" aria-label="Remove header" onClick={() => removeHeader(row.id)} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line text-muted hover:border-line-strong hover:text-ink"><X size={15} /></button>
            </div>)}
            <button type="button" onClick={addHeader} className="text-[12px] font-medium text-brand-strong hover:underline">+ Add header</button>
          </div>}
          {inputError && <p role="alert" className="mt-4 flex gap-2 text-[12px] leading-[1.5] text-red-700"><AlertTriangle size={15} className="mt-0.5 shrink-0" />{inputError}</p>}
          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
            {runState === "running" ? <button type="button" onClick={cancel} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-[14px] font-medium text-white hover:bg-black"><Square size={15} /> Cancel test</button> : <button type="button" onClick={run} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-[14px] font-medium text-white hover:bg-brand-strong"><Play size={15} /> Run read-only test</button>}
            <button type="button" onClick={reset} className="inline-flex items-center justify-center gap-2 rounded-lg border border-line-strong bg-white px-4 py-3 text-[14px] font-medium text-body hover:bg-paper"><RotateCcw size={15} /> Reset</button>
          </div>
          <div className="mt-5 flex gap-2 text-[11px] leading-[1.5] text-faint"><CircleHelp size={14} className="mt-0.5 shrink-0" /><span>No tools are executed. Resources and prompts are catalogued only. The tester never calls resources/read or prompts/get.</span></div>
        </section>

        <section aria-labelledby="progress-title" className="rounded-2xl border border-line bg-paper p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4"><div><p className="font-mono text-[11px] uppercase tracking-[0.08em] text-faint">Live progress</p><h2 id="progress-title" className="mt-2 text-[22px] font-medium tracking-[-0.025em]">Read-only inspection timeline</h2></div>{runState === "running" && <LoaderCircle size={19} className="animate-spin text-brand" />}</div>
          <div className="mt-5 rounded-xl border border-line bg-white p-3.5 text-[12px] leading-[1.55] text-muted" role="status" aria-live="polite">
            {runState === "running" ? <><span className="font-medium text-body">Working for {formatElapsed(elapsedMs)}.</span> The browser-direct probe has a 30-second maximum and is currently reporting each phase as it starts and finishes.</> : report ? <><span className="font-medium text-body">Probe finished.</span> The phase marked failed or blocked below identifies where evidence stopped. Read its detail and the findings in the report.</> : <><span className="font-medium text-body">Ready.</span> Run a bounded browser-direct probe to see each phase outcome.</>}
          </div>
          <ol className="mt-7 space-y-3">
            {PROGRESS.map((item, index) => { const state = phaseState(report, phaseProgress, item.phase); const status = report?.phases.find((phase) => phase.phase === item.phase)?.outcome ?? phaseProgress[item.phase]; const detail = phaseDetail(report, item.phase, status); return <li key={item.phase} className="flex items-start gap-3 text-[13px]">
              <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border ${state === "done" ? "border-brand bg-brand text-white" : state === "active" ? "border-brand bg-brand-soft text-brand-strong" : state === "failed" ? "border-red-200 bg-red-50 text-red-700" : "border-line-strong bg-white text-faint"}`}>{state === "done" ? <Check size={14} /> : state === "active" ? <LoaderCircle size={14} className="animate-spin" /> : state === "failed" ? <X size={14} /> : <span className="font-mono text-[11px]">{index + 1}</span>}</span>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className={state === "pending" ? "text-muted" : "text-body"}>{item.label}</span>{status && <span className={`font-mono text-[10px] uppercase tracking-wide ${state === "failed" ? "text-red-700" : state === "active" ? "text-brand-strong" : "text-faint"}`}>{phaseStatusLabel(status)}</span>}</div>{detail && <p className={`mt-1 text-[11px] leading-[1.45] ${state === "failed" ? "text-red-700" : "text-muted"}`}>{detail}</p>}</div>
            </li>; })}
          </ol>
          <div className="mt-7 rounded-xl border border-line bg-white p-3.5 text-[12px] leading-[1.55] text-muted"><span className="font-medium text-body">Safety boundary:</span> browser-direct HTTPS only, with bounded response bodies, JSON, timeline events, pagination, and total duration.</div>
        </section>
      </div>

      {report && <ReportView report={report} onCopy={copyReport} copyState={copyState} onReset={reset} />}
    </div>
  );
}

function ReportView({ report, onCopy, copyState, onReset }: { report: McpTesterReport; onCopy: () => void; copyState: boolean; onReset: () => void }) {
  const redaction = report.limitations.some((item) => item.toLowerCase().includes("redact") || item.toLowerCase().includes("credential"));
  const bounded = report.timelineTruncated || report.findings.some((finding) => finding.category === "limit") || report.limitations.some((item) => item.toLowerCase().includes("bound"));
  const observedAt = formatObservedAt(report.observedAt);
  const responseBytes = report.timeline.reduce((total, event) => total + (typeof event.details?.body_bytes === "number" ? event.details.body_bytes : 0), 0);
  const initializeMs = timingFor(report, "initialize");
  const discoveryMs = ["tools_list", "resources_list", "prompts_list"].reduce((total, phase) => total + (timingFor(report, phase as McpTesterPhase) ?? 0), 0);
  return <section aria-labelledby="report-title" className="mx-auto mt-8 max-w-5xl rounded-2xl border border-line bg-white p-5 shadow-[0_24px_70px_-46px_rgba(10,10,10,0.35)] sm:p-7">
    <div className="flex flex-col justify-between gap-4 border-b border-line pb-5 sm:flex-row sm:items-start"><div><p className="font-mono text-[11px] uppercase tracking-[0.08em] text-faint">Test result</p><div className="mt-2 flex flex-wrap items-center gap-3"><h2 id="report-title" className="text-[26px] font-medium tracking-[-0.03em]">Health verdict</h2><span className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${VERDICT_STYLES[report.verdict]}`}>{VERDICT_LABELS[report.verdict]}</span></div><p className="mt-2 max-w-[70ch] text-[14px] leading-[1.55] text-muted">{report.verdictMessage}</p><p className="mt-2 text-[11px] text-faint">Observed during this test at {observedAt}</p></div><div className="flex flex-col items-stretch gap-2 sm:items-end"><button type="button" onClick={onCopy} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-line-strong px-3.5 py-2.5 text-[13px] font-medium text-body hover:bg-paper"><Copy size={15} /> {copyState ? "Copied" : "Copy bounded report"}</button><EarlyAccessButton label="Monitor continuously with TrackMCP" variant="brand" size="sm" /></div></div>
    <div className="mt-5 grid gap-2 sm:grid-cols-3"><Indicator label="Browser-direct" value={report.transport.browserDirect ? "Yes" : "No"} good /><Indicator label="Transport" value="HTTPS Streamable HTTP" /><Indicator label="Protocol" value={report.protocol?.negotiatedVersion ?? "Not negotiated"} /></div>
    <div className="mt-3 grid gap-2 sm:grid-cols-3"><Indicator label="Total duration" value={`${report.durationMs} ms`} /><Indicator label="Initialize" value={initializeMs === undefined ? "Not measured" : `${initializeMs} ms`} /><Indicator label="Response data" value={formatBytes(responseBytes)} /></div>
    <p className="mt-2 text-[11px] text-faint">Discovery phases: {discoveryMs ? `${discoveryMs} ms observed` : "not completed"}. Response data is the bounded body-byte total exposed by the protocol timeline.</p>
    <div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full border border-line bg-paper px-2.5 py-1 text-[11px] text-muted">{redaction ? "Sensitive values redacted" : "No credentials reported"}</span><span className="rounded-full border border-line bg-paper px-2.5 py-1 text-[11px] text-muted">{bounded ? "Bounds applied or result incomplete" : "Bounded output"}</span>{report.verdict === "incomplete" && <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] text-amber-800">Evidence is incomplete</span>}</div>

    <div className="mt-7 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <div><h3 className="text-[16px] font-semibold text-ink">Health dimensions</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{DIMENSIONS.map((name) => { const dimension = report.healthDimensions[name]; return <div key={name} className="rounded-lg border border-line bg-paper px-3 py-2.5"><div className="flex items-center justify-between gap-2"><span className="text-[12px] font-medium text-body">{DIMENSION_LABELS[name]}</span><span className={`font-mono text-[10px] uppercase ${dimension?.status === "pass" ? "text-brand-strong" : dimension?.status === "fail" ? "text-red-700" : dimension?.status === "blocked" ? "text-sky-700" : "text-amber-700"}`}>{text(dimension?.status, "not_checked")}</span></div><p className="mt-1 text-[11px] leading-[1.45] text-muted">{text(dimension?.summary)}</p></div>; })}</div></div>
      <div><h3 className="text-[16px] font-semibold text-ink">Server and protocol</h3><dl className="mt-3 divide-y divide-line rounded-xl border border-line bg-paper px-3"><Row label="Endpoint" value={`${report.endpoint.origin}${report.endpoint.pathname}`} /><Row label="Server" value={report.server ? `${text(report.server.name)} ${report.server.version ? `v${text(report.server.version)}` : ""}` : "Not reported"} /><Row label="Protocol" value={report.protocol?.negotiatedVersion ?? "Not negotiated"} /><Row label="Session ID" value={report.protocol?.sessionIdPresent ? "Present and not exposed" : "Not reported"} /><Row label="Capabilities" value={[report.capabilities.tools && "tools", report.capabilities.resources && "resources", report.capabilities.prompts && "prompts"].filter(Boolean).join(", ") || "None advertised"} /></dl></div>
    </div>

    <div className="mt-7"><h3 className="text-[16px] font-semibold text-ink">Catalog summary</h3><div className="mt-3 space-y-2.5"><Catalog title="Tools" {...report.tools}>{report.tools.items.map((item, index) => <div key={index} className="py-3"><p className="font-mono text-[12px] text-ink">{item.name}</p>{item.description && <p className="mt-1 text-[12px] leading-[1.45] text-muted">{item.description}</p>}<p className="mt-1 text-[11px] text-faint">Schema: {item.inputSchemaKind ?? "not reported"}{item.inputSchemaPropertyCount === undefined ? "" : `, ${item.inputSchemaPropertyCount} properties`}</p></div>)}</Catalog><Catalog title="Resources" {...report.resources}>{report.resources.items.map((item, index) => <div key={index} className="py-3"><p className="font-mono text-[12px] text-ink">{item.name}</p>{item.description && <p className="mt-1 text-[12px] leading-[1.45] text-muted">{item.description}</p>}{item.uri && <p className="mt-1 break-all font-mono text-[11px] text-faint">URI: {item.uri}</p>}</div>)}</Catalog><Catalog title="Prompts" {...report.prompts}>{report.prompts.items.map((item, index) => <div key={index} className="py-3"><p className="font-mono text-[12px] text-ink">{item.name}</p>{item.description && <p className="mt-1 text-[12px] leading-[1.45] text-muted">{item.description}</p>}<p className="mt-1 text-[11px] text-faint">Arguments: {item.argumentCount ?? "not reported"}</p></div>)}</Catalog></div></div>

    <div className="mt-7 grid gap-5 lg:grid-cols-2"><div><h3 className="text-[16px] font-semibold text-ink">Findings</h3><div className="mt-3 space-y-2">{report.findings.length === 0 ? <p className="rounded-lg border border-brand/20 bg-brand-soft/40 px-3 py-3 text-[12px] text-brand-strong">No findings were raised by the bounded probe.</p> : report.findings.map((finding, index) => <div key={index} className="rounded-lg border border-line bg-paper px-3 py-3"><div className="flex flex-wrap items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${finding.severity === "error" ? "bg-red-500" : finding.severity === "warning" ? "bg-amber-500" : "bg-sky-500"}`} /><span className="font-mono text-[11px] text-body">{finding.code}</span><span className="text-[10px] uppercase tracking-wide text-faint">{finding.category}</span></div><p className="mt-1.5 text-[12px] leading-[1.5] text-muted">{finding.message}</p></div>)}</div></div><div><h3 className="text-[16px] font-semibold text-ink">Protocol timeline</h3><div className="mt-3 max-h-[360px] overflow-auto rounded-lg border border-line bg-code-bg p-3">{report.timeline.length === 0 ? <p className="font-mono text-[11px] text-code-dim">No events recorded.</p> : report.timeline.map((event, index) => <div key={index} className="border-b border-code-line py-2 last:border-0"><div className="flex gap-2 font-mono text-[10px] text-code-dim"><span>{event.atMs}ms</span><span>{event.phase}</span><span>{event.kind}</span></div>{event.details && <p className="mt-1 break-words font-mono text-[10px] text-code-text">{Object.entries(event.details).map(([key, value]) => `${key}: ${text(value)}`).join(" | ")}</p>}</div>)}</div></div></div>
    <div className="mt-7 rounded-xl border border-sky-200 bg-sky-50/70 p-4"><p className="text-[13px] font-semibold text-sky-900">Browser limitation</p><p className="mt-1 text-[12px] leading-[1.55] text-sky-900/80">Hostname checks reduce obvious private-target risk, but browser-side validation cannot guarantee the IP address resolved at request time. Test only endpoints you trust. This tool uses no server-side proxy.</p></div>
    <div className="mt-6 flex flex-col justify-between gap-3 border-t border-line pt-5 sm:flex-row sm:items-center"><p className="text-[12px] text-muted">This is a one-time observation, not uptime monitoring or a production-readiness claim.</p><button type="button" onClick={onReset} className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-[13px] font-medium text-white hover:bg-black">Test another server <RotateCcw size={14} /></button></div>
  </section>;
}

function Indicator({ label, value, good = false }: { label: string; value: string; good?: boolean }) { return <div className="rounded-lg border border-line bg-paper px-3 py-2.5"><p className="text-[11px] text-faint">{label}</p><p className={`mt-1 font-mono text-[12px] ${good ? "text-brand-strong" : "text-body"}`}>{value}</p></div>; }
function Row({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-4 py-3"><dt className="text-[11px] text-faint">{label}</dt><dd className="max-w-[65%] break-words text-right font-mono text-[11px] text-body">{value}</dd></div>; }

function timingFor(report: McpTesterReport, phase: McpTesterPhase): number | undefined {
  return report.timings.find((timing) => timing.phase === phase)?.durationMs;
}

function formatObservedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "time unavailable" : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
