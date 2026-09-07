"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  Clipboard,
  FileWarning,
  Gauge,
  Info,
  KeyRound,
  LayoutGrid,
  ListChecks,
  LogOut,
  RefreshCw,
  Search,
  Settings2,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  Analytics,
  ToolQualityInsufficientReason,
  ToolQualityResponse,
} from "@/lib/telemetry/analytics-types";
import { TrackMCPLogo } from "@/components/TrackMCPLogo";
import { TraceExplorer } from "@/components/dashboard/TraceExplorer";
import {
  TOOL_QUALITY_MIN_CATALOG_CALLS,
  TOOL_QUALITY_MIN_SEGMENT_CALLS,
  TOOL_QUALITY_MIN_TOOL_CALLS,
  TOOL_QUALITY_MIN_WORKFLOW_TERMINALS,
} from "@/lib/telemetry/tool-quality";

type Workspace = { id: string; name: string; slug: string };
type Key = {
  id: string;
  name: string;
  key_prefix: string;
  revoked_at: string | null;
  created_at: string;
};
type SetupDetails = { first_name: string; last_name: string };
type DataMode = "my" | "example";
export type View =
  | "overview"
  | "journeys"
  | "capabilities"
  | "quality"
  | "issues"
  | "clients"
  | "evidence"
  | "setup";

type NavItem = { id: View; label: string; icon: LucideIcon };
const primaryNav: NavItem[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "journeys", label: "Journeys", icon: ListChecks },
  { id: "capabilities", label: "Capabilities", icon: LayoutGrid },
  { id: "quality", label: "Quality", icon: Gauge },
  { id: "issues", label: "Issues", icon: AlertTriangle },
];
const moreNav: NavItem[] = [
  { id: "clients", label: "AI clients", icon: Users },
  { id: "evidence", label: "Evidence", icon: Search },
  { id: "setup", label: "Setup", icon: Settings2 },
];
const allNav = primaryNav.concat(moreNav);
const viewLabels: Record<View, string> = Object.fromEntries(
  allNav.map((item) => [item.id, item.label]),
) as Record<View, string>;
const legacyViewMap: Record<string, View> = {
  workflows: "journeys",
  outcomes: "journeys",
  tools: "capabilities",
  catalog: "capabilities",
  "tool-quality": "quality",
  reliability: "quality",
  intent: "issues",
  clients: "clients",
  traces: "evidence",
  trace: "evidence",
  settings: "setup",
  releases: "setup",
};
const validViews = new Set<View>(allNav.map((item) => item.id));
const fmt = (value: number) => value.toLocaleString();
const percent = (value: number | null) =>
  value === null ? "N/A" : Math.round(value * 100) + "%";

function normalizeView(
  value: string | null,
  fallback: View = "overview",
): View {
  const mapped = value && legacyViewMap[value] ? legacyViewMap[value] : value;
  return mapped && validViews.has(mapped as View) ? (mapped as View) : fallback;
}

function readRouteState(preferred: View = "overview") {
  const params = new URLSearchParams(window.location.search);
  const legacyTrace = params.get("view") === "trace";
  const rawView = legacyTrace
    ? "evidence"
    : params.get("view") ||
      (window.location.pathname === "/dashboard/traces"
        ? "evidence"
        : preferred);
  const rawData = params.get("data");
  const dataMode: DataMode =
    rawData === "example" || rawData === "sample" ? "example" : "my";
  const view = normalizeView(rawView, preferred);
  const origin = normalizeView(params.get("origin"), "evidence");
  const selected =
    dataMode === "my" &&
    (legacyTrace || view === "evidence") &&
    Boolean(params.get("session_id") || params.get("correlation_handle"));
  return {
    view,
    range: ["7", "30", "90"].includes(params.get("range") || "")
      ? params.get("range") || "30"
      : "30",
    dataMode,
    sessionId: selected ? params.get("session_id") : null,
    correlationHandle: selected ? params.get("correlation_handle") : null,
    origin,
  };
}

function writeRouteState(
  view: View,
  range: string,
  dataMode: DataMode,
  sessionId: string | null = null,
  correlationHandle: string | null = null,
  origin: View = "evidence",
  replace = false,
) {
  const params = new URLSearchParams();
  if (sessionId || correlationHandle) {
    params.set("view", "trace");
    if (sessionId) params.set("session_id", sessionId);
    if (correlationHandle) params.set("correlation_handle", correlationHandle);
    if (origin !== "evidence") params.set("origin", origin);
  } else if (view !== "overview") {
    params.set("view", view);
  }
  if (range !== "30") params.set("range", range);
  params.set("data", dataMode);
  const path =
    view === "evidence" && !sessionId && !correlationHandle
      ? "/dashboard/traces"
      : "/dashboard";
  const query = params.toString();
  window.history[replace ? "replaceState" : "pushState"](
    {},
    "",
    path + (query ? "?" + query : ""),
  );
}

const EXAMPLE_ANALYTICS: Analytics = {
  range_days: 30,
  total_events: 1428,
  protocol_events: 290,
  catalog_events: 42,
  protocol_versions: ["2025-11-25"],
  transports: ["streamable_http"],
  methods: ["tools/list", "tools/call"],
  tool_calls: 1124,
  sessions: 84,
  errors: 46,
  completion_rate: 0.667,
  completion_source: "workflow_events",
  correlation_quality: "session_id",
  correlation_handle_source: "issued",
  funnel: {
    connections: 84,
    discovered_tools: 12,
    tool_calls: 1124,
    successful_calls: 1078,
  },
  intent_sources: {
    context_parameter: 48,
    external_callback: 18,
    fallback: 7,
    missing: 11,
  },
  missing_capabilities: [{ name: "bulk_export", reports: 12 }],
  timeline: Array.from({ length: 14 }, (_, i) => ({
    date: "2026-08-" + String(i + 15).padStart(2, "0"),
    events: 72 + i * 6,
    calls: 54 + i * 5,
    errors: i === 8 ? 9 : 2 + (i % 3),
  })),
  clients: [
    { name: "Claude", calls: 520 },
    { name: "Cursor", calls: 344 },
    { name: "ChatGPT", calls: 210 },
    { name: "Other observed", calls: 50 },
  ],
  tools: [
    {
      name: "run_query",
      calls: 412,
      errors: 28,
      error_rate: 0.068,
      avg_ms: 640,
      p50_ms: 520,
      p95_ms: 1420,
      latency_sample_count: 412,
      discovered: true,
    },
    {
      name: "find_invoice",
      calls: 318,
      errors: 7,
      error_rate: 0.022,
      avg_ms: 220,
      p50_ms: 180,
      p95_ms: 480,
      latency_sample_count: 318,
      discovered: true,
    },
    {
      name: "create_report",
      calls: 196,
      errors: 11,
      error_rate: 0.056,
      avg_ms: 420,
      p50_ms: 360,
      p95_ms: 920,
      latency_sample_count: 196,
      discovered: true,
    },
    {
      name: "export_csv",
      calls: 7,
      errors: 0,
      error_rate: 0,
      avg_ms: 300,
      p50_ms: 260,
      p95_ms: 610,
      latency_sample_count: 7,
      discovered: true,
    },
  ],
  catalog_tools: [],
  unused_tools: ["bulk_export"],
  workflows: [
    {
      session_id: "example-session-1",
      client_name: "Claude",
      calls: 8,
      tools: ["find_invoice", "create_report"],
      started_at: "2026-08-28T10:42:00Z",
      duration_ms: 3680,
      completed: true,
      completion_source: "workflow_events",
      correlation_quality: "session_id",
    },
    {
      session_id: "example-session-2",
      client_name: "Cursor",
      calls: 6,
      tools: ["run_query", "export_csv"],
      started_at: "2026-08-28T10:18:00Z",
      duration_ms: 9200,
      completed: false,
      completion_source: "workflow_events",
      correlation_quality: "session_id",
    },
    {
      session_id: "example-session-3",
      client_name: "ChatGPT",
      calls: 11,
      tools: ["find_invoice", "create_report"],
      started_at: "2026-08-27T16:12:00Z",
      duration_ms: 6410,
      completed: true,
      completion_source: "workflow_events",
      correlation_quality: "session_id",
    },
  ],
  outcomes: [
    { name: "invoice_lookup", started: 18, completed: 12, failed: 6 },
    { name: "report_creation", started: 10, completed: 8, failed: 2 },
  ],
  insights: [
    {
      level: "warn",
      title: "run_query is slower than its observed range",
      detail:
        "Review returned errors and latency before deciding what to change.",
      metric: "p95 1.4s",
    },
  ],
};

const EXAMPLE_QUALITY: ToolQualityResponse = {
  range_days: 30,
  source_event_count: 1428,
  truncated: false,
  tool_paths: [],
  advertised_but_unused: [],
  catalog_comparisons: [],
  insights: [],
  tools: EXAMPLE_ANALYTICS.tools.map((tool) => ({
    name: tool.name,
    observed: {
      call_count: tool.calls,
      successful_call_count: tool.calls - tool.errors,
      failed_call_count: tool.errors,
      known_outcome_call_count: tool.calls,
      inspectable_successful_result_count: tool.calls - tool.errors,
      empty_result_count: 8,
      known_retry_call_count: tool.calls,
      retry_call_count: 4,
      non_retry_call_count: tool.calls - 4,
      observed_repeat_call_count: 12,
      session_count: 30,
      associated_workflow_call_count: 28,
    },
    metrics: {
      tool_call_share: tool.calls / 1124,
      error_rate: tool.error_rate,
      observable_empty_result_rate: 0.04,
      retry_rate: 0.02,
      observed_repeat_call_rate: 0.05,
    },
    catalog_snapshots: [],
    trace_session_ids: ["example-session-1"],
    completion_association: {
      explicit_workflow_count: 12,
      terminal_workflow_count: 12,
      explicitly_started_count: 18,
      explicitly_completed_count: 12,
      completion_rate: 0.667,
      status: tool.name === "export_csv" ? "insufficient_data" : "not_flagged",
      insufficient_data: tool.name === "export_csv" ? ["tool_volume"] : [],
    },
    breakdowns: { clients: [], intent_sources: [] },
    insufficient_data: tool.name === "export_csv" ? ["tool_volume"] : [],
  })),
};

function exampleAnalytics(days: number): Analytics {
  const ratio = days / 30;
  const scale = (value: number) => Math.max(0, Math.round(value * ratio));
  return {
    ...EXAMPLE_ANALYTICS,
    range_days: days,
    total_events: scale(EXAMPLE_ANALYTICS.total_events),
    tool_calls: scale(EXAMPLE_ANALYTICS.tool_calls),
    sessions: scale(EXAMPLE_ANALYTICS.sessions),
    errors: scale(EXAMPLE_ANALYTICS.errors),
    clients: EXAMPLE_ANALYTICS.clients.map((item) => ({
      ...item,
      calls: scale(item.calls),
    })),
    tools: EXAMPLE_ANALYTICS.tools.map((item) => ({
      ...item,
      calls: scale(item.calls),
      errors: scale(item.errors),
    })),
    timeline: EXAMPLE_ANALYTICS.timeline.slice(
      -Math.min(days, EXAMPLE_ANALYTICS.timeline.length),
    ),
    outcomes: EXAMPLE_ANALYTICS.outcomes.map((item) => ({
      ...item,
      started: scale(item.started),
      completed: scale(item.completed),
      failed: scale(item.failed),
    })),
  };
}
function exampleQuality(days: number): ToolQualityResponse {
  return {
    ...EXAMPLE_QUALITY,
    range_days: days,
    source_event_count: Math.round(
      (EXAMPLE_QUALITY.source_event_count * days) / 30,
    ),
  };
}

export function DashboardApp({
  email,
  workspace,
  keys,
  analytics,
  toolQuality,
  newKey,
  working,
  error,
  onboardingMode = false,
  initialView = "overview",
  onGenerateKey,
  onRevokeKey,
  onDismissKey,
  onRefresh,
  onCreateWorkspace,
  onSignOut,
}: {
  email: string;
  workspace: Workspace | null;
  keys: Key[];
  analytics: Analytics | null;
  toolQuality: ToolQualityResponse | null;
  newKey: string;
  working: boolean;
  error: string;
  setupRequired: boolean;
  setupDetails: SetupDetails;
  onboardingMode?: boolean;
  initialView?: "overview" | "traces";
  onGenerateKey: () => void;
  onRevokeKey: (id: string) => void;
  onDismissKey: () => void;
  onRefresh: (days?: string) => void;
  onCreateWorkspace: (details?: SetupDetails) => void;
  onSignOut: () => void;
}) {
  const [view, setView] = useState<View>(
    initialView === "traces" ? "evidence" : "overview",
  );
  const [range, setRange] = useState("30");
  const [dataMode, setDataModeState] = useState<DataMode>("my");
  const [traceSessionId, setTraceSessionId] = useState<string | null>(null);
  const [traceCorrelationHandle, setTraceCorrelationHandle] = useState<
    string | null
  >(null);
  const [traceOrigin, setTraceOrigin] = useState<View>("evidence");
  const [copied, setCopied] = useState(false);
  const hasActiveKey = keys.some((key) => !key.revoked_at);
  const isExample = dataMode === "example";
  const displayedAnalytics = isExample
    ? exampleAnalytics(Number(range))
    : analytics;
  const displayedQuality = isExample
    ? exampleQuality(Number(range))
    : toolQuality;
  const explicitSetupRoute = onboardingMode && (!workspace || !hasActiveKey);
  const zeroEventState = Boolean(
    workspace &&
    hasActiveKey &&
    !isExample &&
    analytics &&
    analytics.total_events === 0,
  );

  useEffect(() => {
    const applyRoute = () => {
      const state = readRouteState(
        initialView === "traces" ? "evidence" : "overview",
      );
      setView(state.view);
      setRange(state.range);
      setDataModeState(state.dataMode);
      setTraceSessionId(state.sessionId);
      setTraceCorrelationHandle(state.correlationHandle);
      setTraceOrigin(state.origin);
    };
    const timer = window.setTimeout(applyRoute, 0);
    window.addEventListener("popstate", applyRoute);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("popstate", applyRoute);
    };
  }, [initialView]);

  const setDataMode = (next: DataMode) => {
    setDataModeState(next);
    setTraceSessionId(null);
    setTraceCorrelationHandle(null);
    setTraceOrigin("evidence");
    writeRouteState(view, range, next, null, null, "evidence");
  };
  const goTo = (next: View) => {
    setView(next);
    setTraceSessionId(null);
    setTraceCorrelationHandle(null);
    writeRouteState(next, range, dataMode);
  };
  const openTrace = (sessionId: string, correlationHandle?: string | null) => {
    const origin = view === "evidence" ? "journeys" : view;
    setTraceSessionId(sessionId);
    setTraceCorrelationHandle(correlationHandle || null);
    setTraceOrigin(origin);
    setView("evidence");
    writeRouteState(
      "evidence",
      range,
      dataMode,
      sessionId,
      correlationHandle || null,
      origin,
    );
  };
  const closeTrace = () => {
    setTraceSessionId(null);
    setTraceCorrelationHandle(null);
    setView(traceOrigin);
    writeRouteState(traceOrigin, range, dataMode);
  };
  const selectRange = (next: string) => {
    setRange(next);
    if (dataMode === "my") onRefresh(next);
    writeRouteState(view, next, dataMode);
  };
  const copyKey = async () => {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8f7] font-display text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-line bg-[#fbfcfb] lg:flex lg:flex-col">
        <div className="flex h-[68px] items-center border-b border-line px-5">
          <TrackMCPLogo asLink={false} mark size="footer" variant="mono" />
        </div>
        <div className="mx-4 mt-5 flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-brand text-xs font-bold text-white">
            {(workspace?.name || "W").slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-semibold text-ink">
              {workspace?.name || "Workspace"}
            </span>
            <span className="block text-[11px] text-faint">
              Current environment
            </span>
          </span>
        </div>
        <DashboardNav
          view={view}
          items={primaryNav}
          onNavigate={goTo}
          label="Primary navigation"
          groupLabel=""
        />
        <DashboardNav
          view={view}
          items={moreNav}
          onNavigate={goTo}
          label="More dashboard navigation"
          groupLabel="More"
        />
        <div className="mt-auto border-t border-line p-3">
          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-muted hover:bg-paper hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <LogOut size={16} />
            Sign out
          </button>
          <div className="mt-3 flex items-center gap-2 border-t border-line px-2 pt-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#d7e5db] text-[10px] font-bold text-brand-strong">
              {email.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 truncate text-[11.5px] text-muted">
              {email}
            </span>
          </div>
        </div>
      </aside>
      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex min-h-[68px] flex-wrap items-center justify-between gap-3 border-b border-line bg-white/95 px-5 py-3 backdrop-blur sm:px-8">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
              {workspace?.name || "TrackMCP"}
            </p>
            <h1 className="mt-0.5 truncate text-[20px] font-semibold tracking-[-0.025em] text-ink">
              {viewLabels[view]}
            </h1>
          </div>
          <div className="flex max-w-full shrink-0 flex-wrap items-center justify-end gap-2">
            <DateRange value={range} onChange={selectRange} />
            <div
              className="inline-flex rounded-lg border border-line bg-white p-0.5"
              role="group"
              aria-label="Data source"
            >
              <button
                type="button"
                aria-pressed={dataMode === "my"}
                onClick={() => setDataMode("my")}
                className={
                  "cursor-pointer rounded-md px-3 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand " +
                  (dataMode === "my"
                    ? "bg-ink text-white"
                    : "text-muted hover:bg-paper hover:text-ink")
                }
              >
                My data
              </button>
              <button
                type="button"
                aria-pressed={dataMode === "example"}
                onClick={() => setDataMode("example")}
                className={
                  "cursor-pointer rounded-md px-3 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand " +
                  (dataMode === "example"
                    ? "bg-[#edf3ff] text-[#4169a5]"
                    : "text-muted hover:bg-paper hover:text-ink")
                }
              >
                Example data
              </button>
            </div>
            <button
              type="button"
              onClick={() => onRefresh(range)}
              aria-label="Refresh dashboard data"
              title="Refresh data"
              className="grid h-9 w-9 cursor-pointer place-items-center rounded-md border border-line text-muted hover:bg-paper hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </header>
        <div className="border-b border-line bg-white px-4 py-2.5 lg:hidden">
          <div
            className="flex gap-1 overflow-x-auto"
            role="navigation"
            aria-label="Dashboard navigation"
          >
            {allNav.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-current={view === item.id ? "page" : undefined}
                onClick={() => goTo(item.id)}
                className={
                  "shrink-0 cursor-pointer rounded-md px-3 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand " +
                  (view === item.id
                    ? "bg-ink text-white"
                    : "text-muted hover:bg-paper hover:text-ink")
                }
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <main className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8 sm:py-8">
          {error && (
            <ErrorBanner message={error} onRetry={() => onRefresh(range)} />
          )}
          {newKey && view === "setup" && (
            <div className="mb-6 flex flex-wrap items-center gap-3 border border-brand/30 bg-brand-soft/35 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-strong">
                  Connection key created
                </p>
                <p className="mt-1 text-xs text-muted">
                  Copy it now. The complete secret will not be shown again.
                </p>
              </div>
              <code className="max-w-full overflow-x-auto rounded-md bg-ink px-3 py-2 font-mono text-xs text-white">
                {newKey.slice(0, 10)}••••••••••••
              </code>
              <button
                type="button"
                onClick={() => void copyKey()}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-line-strong bg-white px-3 py-2 text-xs font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <Clipboard size={13} />
                {copied ? "Copied" : "Copy key"}
              </button>
              <button
                type="button"
                onClick={onDismissKey}
                aria-label="Dismiss connection key notice"
                className="cursor-pointer rounded-md p-2 text-muted hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <X size={15} />
              </button>
            </div>
          )}
          {explicitSetupRoute ? (
            <DashboardOnboarding
              workspace={workspace}
              working={working}
              error={error}
              hasKey={hasActiveKey}
              newKey={newKey}
              onCreateWorkspace={onCreateWorkspace}
              onGenerateKey={onGenerateKey}
              onOpenDashboard={() => {
                setView("overview");
                window.history.pushState({}, "", "/dashboard?data=my");
              }}
            />
          ) : !workspace && !isExample ? (
            <ActivationPanel
              state="workspace"
              working={working}
              onPrimary={onCreateWorkspace}
              onOpenSetup={() => goTo("setup")}
            />
          ) : !hasActiveKey && !isExample ? (
            <ActivationPanel
              state="key"
              working={working}
              onPrimary={onGenerateKey}
              onOpenSetup={() => goTo("setup")}
            />
          ) : (traceSessionId || traceCorrelationHandle) &&
            dataMode === "my" ? (
            <TraceExplorer
              key={
                (traceSessionId || "") + ":" + (traceCorrelationHandle || "")
              }
              sessionId={traceSessionId}
              correlationHandle={traceCorrelationHandle}
              sampleMode={false}
              originLabel={viewLabels[traceOrigin]}
              onBack={closeTrace}
            />
          ) : zeroEventState ? (
            <OverviewSetupPanel
              onCheck={() => onRefresh(range)}
              onOpenSetup={() => goTo("setup")}
            />
          ) : !displayedAnalytics ? (
            <LiveDataState
              message={
                error
                  ? "Live data could not be loaded"
                  : "No live data available for this period."
              }
              onRetry={() => onRefresh(range)}
              permission={/authoriz|permission/i.test(error)}
            />
          ) : view === "setup" ? (
            <SetupView
              keys={keys}
              working={working}
              onGenerateKey={onGenerateKey}
              onRevokeKey={onRevokeKey}
            />
          ) : (
            <ViewContent
              view={view}
              analytics={displayedAnalytics}
              toolQuality={displayedQuality}
              dataMode={dataMode}
              onViewChange={goTo}
              onViewTrace={openTrace}
              onRefresh={() => onRefresh(range)}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function DashboardNav({
  view,
  items,
  onNavigate,
  label,
  groupLabel,
}: {
  view: View;
  items: NavItem[];
  onNavigate: (view: View) => void;
  label: string;
  groupLabel: string;
}) {
  return (
    <nav aria-label={label} className={groupLabel ? "mt-6 px-3" : "mt-7 px-3"}>
      {groupLabel && (
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
          {groupLabel}
        </p>
      )}
      {items.map((item) => (
        <button
          type="button"
          key={item.id}
          aria-current={view === item.id ? "page" : undefined}
          onClick={() => onNavigate(item.id)}
          className={
            "mb-1 flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand " +
            (view === item.id
              ? "bg-ink text-white"
              : "text-muted hover:bg-paper hover:text-ink")
          }
        >
          <item.icon size={16} strokeWidth={view === item.id ? 2.2 : 1.8} />
          {item.label}
        </button>
      ))}
    </nav>
  );
}

function DateRange({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <label className="sr-only" htmlFor="dashboard-range">
        Activity date range
      </label>
      <select
        id="dashboard-range"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 cursor-pointer rounded-md border border-line bg-white px-2.5 text-[12px] font-semibold text-body outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <option value="7">Last 7 days</option>
        <option value="30">Last 30 days</option>
        <option value="90">Last 90 days</option>
      </select>
      <button
        type="button"
        disabled
        title="Custom date ranges require exact bounded-range API support"
        className="hidden h-9 cursor-not-allowed items-center gap-1 rounded-md border border-line px-2.5 text-[11px] font-semibold text-faint sm:inline-flex"
      >
        <CalendarDays size={13} />
        Custom
      </button>
    </div>
  );
}

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="mb-6 flex flex-wrap items-center gap-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      role="alert"
    >
      <AlertTriangle size={16} />
      <span className="min-w-0 flex-1">{message}</span>
      <button
        type="button"
        onClick={onRetry}
        className="cursor-pointer font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
      >
        Retry
      </button>
    </div>
  );
}

function ActivationPanel({
  state,
  working,
  onPrimary,
  onOpenSetup,
}: {
  state: "workspace" | "key";
  working: boolean;
  onPrimary: () => void;
  onOpenSetup: () => void;
}) {
  const noWorkspace = state === "workspace";
  return (
    <section className="mx-auto max-w-3xl border border-line bg-white p-6 shadow-[0_12px_40px_-35px_rgba(23,25,23,.4)] sm:p-8">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-paper text-muted">
          {noWorkspace ? <KeyRound size={19} /> : <Settings2 size={19} />}
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-strong">
            Activate / setup
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">
            {noWorkspace ? "Create a workspace" : "Create a connection key"}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            {noWorkspace
              ? "Create a workspace to connect your server, or explore clearly labeled Example data from the top bar."
              : "The connection key authenticates server telemetry to this workspace. Keep it in the server environment."}
          </p>
        </div>
      </div>
      <div className="mt-7 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={working}
          onClick={onPrimary}
          className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          {working
            ? "Working…"
            : noWorkspace
              ? "Create workspace"
              : "Create connection key"}
          <ArrowRight size={15} />
        </button>
        <button
          type="button"
          onClick={onOpenSetup}
          className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-line-strong bg-white px-4 py-2.5 text-sm font-semibold text-body hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          Open Setup
        </button>
      </div>
    </section>
  );
}

function OverviewSetupPanel({
  onCheck,
  onOpenSetup,
}: {
  onCheck: () => void;
  onOpenSetup: () => void;
}) {
  return (
    <div>
      <PageIntro
        title="Overview"
        description="See activity, explicit work outcomes, and what deserves attention next."
      />
      <section className="border border-line bg-white p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-paper text-muted">
            <Info size={19} />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-strong">
              My data selected
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-ink">
              Your server has not sent its first event yet.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Install the SDK, make one real tool call, then check again. The
              selected activity range stays in place, and no Example data is
              substituted.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onCheck}
                className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <RefreshCw size={15} />
                Check for first event
              </button>
              <button
                type="button"
                onClick={onOpenSetup}
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-line-strong bg-white px-4 py-2.5 text-sm font-semibold text-body hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                View installation instructions
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="mt-6 border border-line bg-white p-5">
        <h2 className="text-[15px] font-semibold text-ink">Needs attention</h2>
        <p className="mt-2 text-sm font-semibold text-ink">Insufficient data to identify an issue</p>
        <p className="mt-1 text-xs text-muted">No actionable signals yet. This is a neutral data-availability state, not confirmed healthy status.</p>
      </section>
      <p className="mt-4 text-xs text-faint">
        Source: workspace, active key, and analytics event count. TrackMCP
        cannot verify SDK installation or server reachability from the current
        API.
      </p>
    </div>
  );
}

function LiveDataState({
  message,
  onRetry,
  permission,
}: {
  message: string;
  onRetry: () => void;
  permission: boolean;
}) {
  return (
    <section className="grid min-h-[420px] place-items-center border border-line bg-white p-8 text-center">
      <div className="max-w-lg">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-paper text-muted">
          <AlertTriangle size={22} />
        </span>
        <h2 className="mt-4 text-xl font-semibold text-ink">
          {permission ? "You cannot view this workspace" : message}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {permission
            ? "Request access or return to your workspace. No other data source was substituted."
            : "My data could not be shown for this request. Try again or narrow the selected period."}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <RefreshCw size={15} />
          Retry
        </button>
      </div>
    </section>
  );
}

function ViewContent({
  view,
  analytics,
  toolQuality,
  dataMode,
  onViewChange,
  onViewTrace,
  onRefresh,
}: {
  view: View;
  analytics: Analytics;
  toolQuality: ToolQualityResponse | null;
  dataMode: DataMode;
  onViewChange: (view: View) => void;
  onViewTrace: (sessionId: string, correlationHandle?: string | null) => void;
  onRefresh: () => void;
}) {
  if (view === "journeys")
    return (
      <JourneysView
        analytics={analytics}
        dataMode={dataMode}
        onViewChange={onViewChange}
        onViewTrace={onViewTrace}
      />
    );
  if (view === "capabilities")
    return <CapabilitiesView analytics={analytics} onViewTrace={onViewTrace} />;
  if (view === "quality")
    return (
      <QualityView
        data={toolQuality}
        dataMode={dataMode}
        onViewTrace={onViewTrace}
        onRefresh={onRefresh}
      />
    );
  if (view === "issues")
    return (
      <IssuesView
        analytics={analytics}
        toolQuality={toolQuality}
        onViewChange={onViewChange}
      />
    );
  if (view === "clients") return <ClientsView analytics={analytics} />;
  if (view === "evidence")
    return (
      <EvidenceView
        analytics={analytics}
        dataMode={dataMode}
        onViewTrace={onViewTrace}
        onViewChange={onViewChange}
      />
    );
  return (
    <Overview
      analytics={analytics}
      dataMode={dataMode}
      onViewChange={onViewChange}
      onViewTrace={onViewTrace}
    />
  );
}

function PageIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-[26px] font-semibold tracking-[-0.035em] text-ink">
        {title}
      </h2>
      <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted">
        {description}
      </p>
      <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-faint">
        <CalendarDays size={13} />
        Activity range: 7, 30, or 90-day presets · comparison windows remain
        separate
      </p>
    </div>
  );
}
function DataSourceStrip({ dataMode }: { dataMode: DataMode }) {
  return (
    <section
      className="mb-6 flex flex-wrap items-center gap-3 border border-line bg-[#f3f5f3] px-4 py-3.5"
      aria-label="Data source state"
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-muted">
        <Info size={16} />
      </span>
      <div>
        <p className="text-sm font-semibold text-ink">
          {dataMode === "example"
            ? "Example data selected"
            : "My data selected"}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {dataMode === "example"
            ? "Illustrative records are shown by explicit selection; they are not workspace telemetry."
            : "Server-observed events are shown here. This is a data-source state, not a product-health signal."}
        </p>
      </div>
    </section>
  );
}
function Panel({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <section className="border border-line bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-brand-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {action.label}
            <ChevronRight size={13} />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
function Kpi({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
}) {
  return (
    <div className="border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-faint">
          {label}
        </span>
        <Icon size={16} className="text-brand-strong" />
      </div>
      <p className="mt-3 text-[28px] font-semibold tracking-[-0.04em] text-ink">
        {value}
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-muted">{helper}</p>
    </div>
  );
}
function ActionButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-line-strong bg-white px-3 py-2 text-xs font-semibold text-body hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
function StateNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-line bg-white p-4">
      <p className="text-xs font-semibold text-ink">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function Overview({
  analytics,
  dataMode,
  onViewChange,
  onViewTrace,
}: {
  analytics: Analytics;
  dataMode: DataMode;
  onViewChange: (view: View) => void;
  onViewTrace: (sessionId: string, correlationHandle?: string | null) => void;
}) {
  const totals = explicitOutcomeTotals(analytics);
  return (
    <div>
      <PageIntro
        title="Overview"
        description="See activity, explicit work outcomes, and what deserves attention next."
      />
      <DataSourceStrip dataMode={dataMode} />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="AI clients"
          value={
            analytics.clients.length ? fmt(analytics.clients.length) : "N/A"
          }
          icon={Users}
          helper="Observed at the server boundary"
        />
        <Kpi
          label="Activity"
          value={fmt(analytics.tool_calls)}
          icon={Activity}
          helper="Observed calls in selected period"
        />
        <Kpi
          label="Work completed"
          value={
            totals.started
              ? fmt(totals.completed) + " / " + fmt(totals.started)
              : "N/A"
          }
          icon={Check}
          helper={
            totals.started
              ? "Explicit outcomes · " +
                percent(totals.completed / totals.started)
              : "No explicit workflow outcome data"
          }
        />
        <Kpi
          label="Needs attention"
          value={fmt(analytics.insights.length)}
          icon={AlertTriangle}
          helper={
            analytics.insights.length
              ? "Observed signals · confidence not provided"
              : analytics.total_events === 0
                ? "Insufficient data to identify an issue"
                : "No actionable signals yet"
          }
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(310px,.8fr)]">
        <Panel
          title="Activity over time"
          subtitle="Server-observed tool calls in the selected period"
        >
          <UsageChart timeline={analytics.timeline} />
        </Panel>
        <AttentionPanel analytics={analytics} onViewChange={onViewChange} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(310px,.7fr)]">
        <Panel
          title="Sessions in selected period"
          subtitle="Observed sessions; open one trace when technical evidence is needed"
          action={{
            label: "View Evidence",
            onClick: () => onViewChange("evidence"),
          }}
        >
          <div className="divide-y divide-line">
            {analytics.workflows.slice(0, 5).map((workflow) => (
              <div
                key={workflow.session_id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-ink">
                    {workflow.session_id}
                  </p>
                  <p className="mt-1 text-[11px] text-muted">
                    {workflow.client_name} · {workflow.calls} calls ·{" "}
                    {correlationLabel(workflow.correlation_quality)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onViewTrace(
                      workflow.session_id,
                      workflow.correlation_handle,
                    )
                  }
                  className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-brand-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  Open Evidence <ChevronRight size={13} />
                </button>
              </div>
            ))}
            {!analytics.workflows.length && (
              <p className="py-7 text-sm text-muted">
                No sessions have been observed in this period.
              </p>
            )}
          </div>
        </Panel>
        <Panel
          title="Work completed"
          subtitle="Explicit workflow outcome events only"
        >
          <div className="py-3">
            <p className="text-3xl font-semibold tracking-[-0.04em] text-ink">
              {totals.started ? fmt(totals.completed) : "N/A"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {totals.started
                ? "of " + fmt(totals.started) + " explicit started outcomes"
                : "No explicit workflow outcome data"}
            </p>
            <p className="mt-4 text-xs text-muted">
              Source: workflow outcome events. No session-based inference.
            </p>
          </div>
        </Panel>
      </div>
      <div className="mt-6 border border-line bg-white p-5">
        <p className="text-sm font-semibold text-ink">
          Choose the next question
        </p>
        <p className="mt-1 text-xs text-muted">
          Start with the business signal; technical Evidence stays one click
          away.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <ActionButton
            label="See Journeys"
            icon={ListChecks}
            onClick={() => onViewChange("journeys")}
          />
          <ActionButton
            label="Review Issues"
            icon={AlertTriangle}
            onClick={() => onViewChange("issues")}
          />
          <ActionButton
            label="Open Evidence"
            icon={Search}
            onClick={() => onViewChange("evidence")}
          />
        </div>
      </div>
    </div>
  );
}

function AttentionPanel({
  analytics,
  onViewChange,
}: {
  analytics: Analytics;
  onViewChange: (view: View) => void;
}) {
  const insufficient =
    analytics.total_events === 0 || analytics.tool_calls === 0;
  return (
    <Panel
      title="Needs attention"
      subtitle="Neutral signals are separated from confirmed evidence"
    >
      <div className="space-y-3">
        {analytics.insights.length ? (
          analytics.insights.map((insight) => (
            <div
              key={insight.title}
              className="border border-amber-200 bg-amber-50/70 p-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={17}
                  className="mt-0.5 shrink-0 text-amber-700"
                />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-800">
                    Observed signal
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {insight.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    {insight.detail}
                  </p>
                  <p className="mt-2 text-[11px] text-muted">
                    Evidence basis: API insight · threshold: not provided ·
                    eligible volume: not provided · confidence: not provided ·{" "}
                    {insight.metric}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="border border-line bg-paper p-4">
            <p className="text-sm font-semibold text-ink">
              {insufficient
                ? "Insufficient data to identify an issue"
                : "No actionable signals yet."}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {insufficient
                ? "More observed activity may be required. This is not a confirmed healthy state."
                : "No insight was returned for the selected period. This is not a freshness or health claim."}
            </p>
          </div>
        )}
        <ActionButton
          label={analytics.insights.length ? "Review Issues" : "See Journeys"}
          icon={analytics.insights.length ? AlertTriangle : ListChecks}
          onClick={() =>
            onViewChange(analytics.insights.length ? "issues" : "journeys")
          }
        />
      </div>
    </Panel>
  );
}

function JourneysView({
  analytics,
  dataMode,
  onViewChange,
  onViewTrace,
}: {
  analytics: Analytics;
  dataMode: DataMode;
  onViewChange: (view: View) => void;
  onViewTrace: (sessionId: string, correlationHandle?: string | null) => void;
}) {
  const totals = explicitOutcomeTotals(analytics);
  return (
    <div>
      <PageIntro
        title="Journeys"
        description="Understand what work is being attempted and where it stops. Completion uses explicit workflow outcomes only."
      />
      <DataSourceStrip dataMode={dataMode} />
      <Panel
        title="Explicit workflow outcomes"
        subtitle={
          totals.started
            ? fmt(totals.completed) +
              " completed of " +
              fmt(totals.started) +
              " started · source: workflow outcome events"
            : "No explicit workflow outcome data"
        }
        action={{
          label: "Open Evidence",
          onClick: () => onViewChange("evidence"),
        }}
      >
        <div
          className="overflow-x-auto"
          role="region"
          aria-label="Scrollable table"
        >
          <p className="mb-3 text-[11px] text-faint">
            Scroll horizontally to inspect all columns.
          </p>
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-line text-[10px] font-semibold uppercase tracking-[0.08em] text-faint">
              <tr>
                <th className="pb-3">Journey</th>
                <th className="pb-3">Started</th>
                <th className="pb-3">Completed</th>
                <th className="pb-3">Failed</th>
                <th className="pb-3">Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {analytics.outcomes.map((outcome) => (
                <tr key={outcome.name}>
                  <td className="py-4 font-mono text-xs text-ink">
                    {outcome.name}
                  </td>
                  <td className="py-4 text-muted">{fmt(outcome.started)}</td>
                  <td className="py-4 text-muted">{fmt(outcome.completed)}</td>
                  <td className="py-4 text-muted">{fmt(outcome.failed)}</td>
                  <td className="py-4 text-muted">
                    {outcome.started
                      ? percent(outcome.completed / outcome.started)
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!analytics.outcomes.length && (
            <p className="py-8 text-sm text-muted">
              No explicit workflow outcome data. Sessions are not completion
              evidence.
            </p>
          )}
        </div>
      </Panel>
      <div className="mt-6">
        <Panel
          title="Observed work in selected period"
          subtitle="A session list is not an active-connection count"
        >
          <div className="divide-y divide-line">
            {analytics.workflows.map((workflow) => (
              <div
                key={workflow.session_id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-mono text-xs text-ink">
                    {workflow.session_id}
                  </p>
                  <p className="mt-1 text-[11px] text-muted">
                    {workflow.client_name} · {workflow.calls} calls ·{" "}
                    {correlationLabel(workflow.correlation_quality)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onViewTrace(
                      workflow.session_id,
                      workflow.correlation_handle,
                    )
                  }
                  className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-brand-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  Open Evidence <ChevronRight size={13} />
                </button>
              </div>
            ))}
            {!analytics.workflows.length && (
              <p className="py-8 text-sm text-muted">
                No observed sessions in this period.
              </p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function CapabilitiesView({
  analytics,
  onViewTrace,
}: {
  analytics: Analytics;
  onViewTrace: (sessionId: string, correlationHandle?: string | null) => void;
}) {
  return (
    <div>
      <PageIntro
        title="Capabilities"
        description="See what the server offers and which capabilities are observed in use."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi
          label="Capabilities observed"
          value={fmt(analytics.tools.length)}
          icon={LayoutGrid}
          helper="Observed tool names"
        />
        <Kpi
          label="Activity"
          value={fmt(analytics.tool_calls)}
          icon={Activity}
          helper="Observed calls"
        />
        <Kpi
          label="Unused advertised"
          value={fmt(analytics.unused_tools.length)}
          icon={Info}
          helper="Catalog comparison"
        />
      </div>
      <div className="mt-6">
        <Panel
          title="Capability activity"
          subtitle="Technical names stay in the detail table; interpretations remain neutral"
        >
          <div
            className="overflow-x-auto"
            role="region"
            aria-label="Scrollable table"
          >
            <p className="mb-3 text-[11px] text-faint">
              Scroll horizontally to inspect all columns.
            </p>
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="border-b border-line text-[10px] font-semibold uppercase tracking-[0.08em] text-faint">
                <tr>
                  <th className="pb-3">Capability</th>
                  <th className="pb-3">Calls</th>
                  <th className="pb-3">Errors</th>
                  <th className="pb-3">Latency</th>
                  <th className="pb-3">Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {analytics.tools.map((tool) => (
                  <tr key={tool.name}>
                    <td className="py-4 font-mono text-xs text-ink">
                      {tool.name}
                    </td>
                    <td className="py-4 text-muted">{fmt(tool.calls)}</td>
                    <td className="py-4 text-muted">
                      {fmt(tool.errors)} · {Math.round(tool.error_rate * 100)}%
                    </td>
                    <td className="py-4 text-muted">
                      {tool.p95_ms == null
                        ? "Not reported"
                        : "p95 " + tool.p95_ms + "ms"}
                    </td>
                    <td className="py-4">
                      {analytics.workflows[0] ? (
                        <button
                          type="button"
                          onClick={() =>
                            onViewTrace(analytics.workflows[0].session_id)
                          }
                          className="cursor-pointer text-xs font-semibold text-brand-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        >
                          Open Evidence
                        </button>
                      ) : (
                        <span className="text-xs text-faint">
                          Not available
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!analytics.tools.length && (
              <p className="py-8 text-sm text-muted">
                No capabilities have been observed in this period.
              </p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function QualityView({
  data,
  dataMode,
  onViewTrace,
  onRefresh,
}: {
  data: ToolQualityResponse | null;
  dataMode: DataMode;
  onViewTrace: (sessionId: string, correlationHandle?: string | null) => void;
  onRefresh: () => void;
}) {
  if (!data)
    return (
      <div>
        <PageIntro
          title="Quality"
          description="Review observed capability quality without turning insufficient data into a failure."
        />
        <LiveDataState
          message="Quality data could not be loaded"
          onRetry={onRefresh}
          permission={false}
        />
      </div>
    );
  return (
    <div>
      <PageIntro
        title="Quality"
        description="Review observed capability quality without turning insufficient data into a failure."
      />
      <DataSourceStrip dataMode={dataMode} />
      <Panel
        title="Tool Quality"
        subtitle={
          fmt(data.source_event_count) +
          " observed source events · selected period" +
          (data.truncated ? " · bounded result" : "")
        }
      >
        <div
          className="overflow-x-auto"
          role="region"
          aria-label="Scrollable table"
        >
          <p className="mb-3 text-[11px] text-faint">
            Scroll horizontally to inspect all columns.
          </p>
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-line text-[10px] font-semibold uppercase tracking-[0.08em] text-faint">
              <tr>
                <th className="pb-3">Capability</th>
                <th className="pb-3">Call share</th>
                <th className="pb-3">Error rate</th>
                <th className="pb-3">Retry rate</th>
                <th className="pb-3">Work completed</th>
                <th className="pb-3">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.tools.map((tool) => (
                <tr key={tool.name}>
                  <td className="py-4 font-mono text-xs text-ink">
                    {tool.name}
                    <span className="mt-1 block font-sans text-[10px] text-faint">
                      {fmt(tool.observed.call_count)} calls ·{" "}
                      {fmt(tool.observed.session_count)} observed sessions
                    </span>
                    {tool.insufficient_data.length > 0 && (
                      <span className="mt-2 block max-w-[260px] font-sans text-[10px] leading-relaxed text-amber-700">
                        {insufficientReasons(tool.insufficient_data)}
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-muted">
                    {metricValue(tool.metrics.tool_call_share)}
                  </td>
                  <td className="py-4 text-muted">
                    {metricValue(tool.metrics.error_rate)}
                  </td>
                  <td className="py-4 text-muted">
                    {metricValue(tool.metrics.retry_rate)}
                  </td>
                  <td className="py-4 text-muted">
                    {tool.completion_association.insufficient_data.length
                      ? "Insufficient data · " +
                        insufficientReasons(
                          tool.completion_association.insufficient_data,
                        )
                      : metricValue(
                          tool.completion_association.completion_rate,
                        )}
                  </td>
                  <td className="py-4">
                    {dataMode === "example" ||
                    !tool.trace_session_ids.length ? (
                      <span className="text-xs text-faint">
                        {dataMode === "example"
                          ? "Example only"
                          : "Not available"}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onViewTrace(tool.trace_session_ids[0])}
                        className="cursor-pointer text-xs font-semibold text-brand-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      >
                        Open Evidence
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.truncated && (
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-700">
              <FileWarning size={13} />
              Showing a bounded result. Some events may be omitted because the
              source scan is capped. Narrow the time range or scope to inspect
              more precisely.
            </p>
          )}
          {!data.tools.length && (
            <p className="py-8 text-sm text-muted">
              No quality observations in this period.
            </p>
          )}
        </div>
      </Panel>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StateNote
          title="Minimum volume"
          body={
            "Tool calls need at least " +
            TOOL_QUALITY_MIN_TOOL_CALLS +
            " observed calls before call-level metrics are trusted."
          }
        />
        <StateNote
          title="Explicit outcomes"
          body={
            "Workflow associations need at least " +
            TOOL_QUALITY_MIN_WORKFLOW_TERMINALS +
            " terminal outcomes before completion is shown."
          }
        />
        <StateNote
          title="Neutral interpretation"
          body="An association is an investigation signal, not evidence of cause or product health."
        />
      </div>
    </div>
  );
}

function IssuesView({
  analytics,
  toolQuality,
  onViewChange,
}: {
  analytics: Analytics;
  toolQuality: ToolQualityResponse | null;
  onViewChange: (view: View) => void;
}) {
  const insufficient = toolQuality
    ? toolQuality.tools.filter((tool) => tool.insufficient_data.length)
    : [];
  return (
    <div>
      <PageIntro
        title="Issues"
        description="Review what deserves attention next, ordered by evidence strength and affected volume."
      />
      <Panel
        title="Needs attention"
        subtitle="The current API does not provide firing alerts or confidence metadata"
      >
        <div className="space-y-3">
          {analytics.insights.map((insight) => (
            <div
              key={insight.title}
              className="border border-amber-200 bg-amber-50/70 p-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-800">
                Observed signal
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {insight.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {insight.detail}
              </p>
              <p className="mt-3 text-[11px] text-muted">
                Evidence basis: API insight · threshold: not provided · affected
                volume: not provided · confidence: not provided · metric:{" "}
                {insight.metric}
              </p>
            </div>
          ))}
          {insufficient.map((tool) => (
            <div
              key={"insufficient-" + tool.name}
              className="border border-line bg-paper p-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
                Insufficient evidence
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">{tool.name}</p>
              <p className="mt-1 text-xs text-muted">
                Specific reason: {insufficientReasons(tool.insufficient_data)}.
                This is not a confirmed failure.
              </p>
            </div>
          ))}
          {!analytics.insights.length && !insufficient.length && (
            <div className="border border-line bg-paper p-4">
              <p className="text-sm font-semibold text-ink">
                {analytics.total_events === 0
                  ? "Insufficient data to identify an issue"
                  : "No actionable signals yet."}
              </p>
              <p className="mt-1 text-xs text-muted">
                No confirmed issue can be ranked from the current API response.
              </p>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <ActionButton
            label="Open Evidence"
            icon={Search}
            onClick={() => onViewChange("evidence")}
          />
          <ActionButton
            label="Review Quality"
            icon={Gauge}
            onClick={() => onViewChange("quality")}
          />
        </div>
      </Panel>
    </div>
  );
}

function ClientsView({ analytics }: { analytics: Analytics }) {
  return (
    <div>
      <PageIntro
        title="AI clients"
        description="See which AI client applications were observed at the server boundary. This is not a count of users or customers."
      />
      <Panel
        title="AI clients observed"
        subtitle="Activity is grouped by observed client name"
      >
        <div
          className="overflow-x-auto"
          role="region"
          aria-label="Scrollable table"
        >
          <p className="mb-3 text-[11px] text-faint">
            Scroll horizontally to inspect all columns.
          </p>
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-line text-[10px] font-semibold uppercase tracking-[0.08em] text-faint">
              <tr>
                <th className="pb-3">AI client</th>
                <th className="pb-3">Observed calls</th>
                <th className="pb-3">Share of calls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {analytics.clients.map((client) => (
                <tr key={client.name}>
                  <td className="py-4 font-medium text-ink">{client.name}</td>
                  <td className="py-4 text-muted">{fmt(client.calls)}</td>
                  <td className="py-4 text-muted">
                    {analytics.tool_calls
                      ? percent(client.calls / analytics.tool_calls)
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!analytics.clients.length && (
            <p className="py-8 text-sm text-muted">
              No AI clients were observed in the selected period.
            </p>
          )}
        </div>
      </Panel>
    </div>
  );
}

function EvidenceView({
  analytics,
  dataMode,
  onViewTrace,
  onViewChange,
}: {
  analytics: Analytics;
  dataMode: DataMode;
  onViewTrace: (sessionId: string, correlationHandle?: string | null) => void;
  onViewChange: (view: View) => void;
}) {
  return (
    <div>
      <PageIntro
        title="Evidence"
        description="Inspect bounded, redacted records only when the business question needs technical detail."
      />
      <DataSourceStrip dataMode={dataMode} />
      <Panel
        title="Observed sessions"
        subtitle="Choose a session to open Trace Explorer. Example data cannot open an authenticated trace."
        action={{
          label: "Back to Overview",
          onClick: () => onViewChange("overview"),
        }}
      >
        <div
          className="overflow-x-auto"
          role="region"
          aria-label="Scrollable table"
        >
          <p className="mb-3 text-[11px] text-faint">
            Scroll horizontally to inspect all columns.
          </p>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-[10px] font-semibold uppercase tracking-[0.08em] text-faint">
              <tr>
                <th className="pb-3">Session</th>
                <th className="pb-3">AI client</th>
                <th className="pb-3">Calls</th>
                <th className="pb-3">Correlation</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {analytics.workflows.map((workflow) => (
                <tr key={workflow.session_id}>
                  <td className="py-4 font-mono text-xs text-ink">
                    {workflow.session_id}
                  </td>
                  <td className="py-4 text-muted">{workflow.client_name}</td>
                  <td className="py-4 text-muted">{fmt(workflow.calls)}</td>
                  <td className="py-4 text-muted">
                    {correlationLabel(workflow.correlation_quality)}
                  </td>
                  <td className="py-4">
                    {dataMode === "example" ? (
                      <span className="text-xs text-faint">Example only</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          onViewTrace(
                            workflow.session_id,
                            workflow.correlation_handle,
                          )
                        }
                        className="cursor-pointer text-xs font-semibold text-brand-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      >
                        Open Trace Explorer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!analytics.workflows.length && (
            <p className="py-8 text-sm text-muted">
              No observed sessions match the selected period.
            </p>
          )}
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted">
          <FileWarning size={13} />
          Results are bounded by the API. Some events may be omitted when the
          response is capped.
        </p>
      </Panel>
    </div>
  );
}

function SetupView({
  keys,
  working,
  onGenerateKey,
  onRevokeKey,
}: {
  keys: Key[];
  working: boolean;
  onGenerateKey: () => void;
  onRevokeKey: (id: string) => void;
}) {
  const [language, setLanguage] = useState<"TypeScript" | "Python">(
    "TypeScript",
  );
  const [copied, setCopied] = useState(false);

  const snippets = {
    TypeScript: `npm install @trackmcp/sdk\n\nimport { withTrackMCP } from "@trackmcp/sdk";\nexport default withTrackMCP(server, { apiKey: process.env.TRACKMCP_KEY! });`,
    Python: `python3 -m pip install trackmcp\n\nfrom trackmcp import with_trackmcp\napp = with_trackmcp(server, api_key=os.environ["TRACKMCP_KEY"])`,
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippets[language]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div>
      <PageIntro
        title="Setup"
        description="Connect your server and manage the key that authenticates telemetry to this workspace."
      />
      <section className="mb-6 flex items-start gap-3 border border-line bg-[#f3f5f3] p-4">
        <Info size={17} className="mt-0.5 text-muted" />
        <div>
          <p className="text-sm font-semibold text-ink">Connection state</p>
          <p className="mt-1 text-xs text-muted">
            A connection key authenticates server telemetry. This state does not
            claim product health, freshness, installation, or reachability.
          </p>
        </div>
      </section>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
        <Panel
          title="Connect the server"
          subtitle="Keep the key in your server environment; never commit it"
        >
          <div className="mt-4 flex gap-1 border-b border-line pb-2">
            {(["TypeScript", "Python"] as const).map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setLanguage(item)}
                className={
                  "cursor-pointer px-3 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand " +
                  (language === item
                    ? "border-b-2 border-brand text-brand-strong"
                    : "text-muted hover:text-ink")
                }
              >
                {item}
              </button>
            ))}
          </div>
          <pre className="mt-4 overflow-x-auto rounded-md bg-[#101713] p-5 font-mono text-xs leading-relaxed text-white">
            <code>{snippets[language]}</code>
          </pre>
          <button
            type="button"
            onClick={() => void copy()}
            className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-line-strong bg-white px-3 py-2 text-xs font-semibold text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Clipboard size={13} />
            {copied ? "Copied" : "Copy setup"}
          </button>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            Telemetry is fail-open. Payloads remain subject to the existing
            privacy and redaction policy.
          </p>
        </Panel>
        <Panel
          title="Connection keys"
          subtitle="Full secrets are shown only at creation"
        >
          <div className="space-y-2">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between gap-3 border border-line bg-paper px-3.5 py-3"
              >
                <div>
                  <p className="font-mono text-xs text-ink">
                    {key.key_prefix}••••••
                  </p>
                  <p className="mt-1 text-[11px] text-muted">
                    {key.name} · {key.revoked_at ? "Revoked" : "Active"}
                  </p>
                </div>
                {!key.revoked_at && (
                  <button
                    type="button"
                    onClick={() => onRevokeKey(key.id)}
                    className="cursor-pointer text-xs font-semibold text-red-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
            {!keys.length && (
              <p className="py-4 text-sm text-muted">
                No connection key exists yet.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onGenerateKey}
            disabled={working}
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <KeyRound size={15} />
            {working ? "Creating…" : "Create connection key"}
          </button>
        </Panel>
      </div>
    </div>
  );
}

function DashboardOnboarding({
  workspace,
  working,
  error,
  hasKey,
  newKey,
  onCreateWorkspace,
  onGenerateKey,
  onOpenDashboard,
}: {
  workspace: Workspace | null;
  working: boolean;
  error: string;
  hasKey: boolean;
  newKey: string;
  onCreateWorkspace: (details?: SetupDetails) => void;
  onGenerateKey: () => void;
  onOpenDashboard: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };
  return (
    <section className="mx-auto max-w-3xl border border-line bg-white p-6 sm:p-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-strong">
        Activate / setup
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">
        {workspace ? "Create a connection key" : "Create your workspace"}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        This route is for a missing workspace or API key. Returning users with
        an active key open Overview directly.
      </p>
      <div className="mt-7 space-y-4">
        <div className="border border-line bg-paper p-4">
          <p className="text-sm font-semibold text-ink">
            {workspace ? "Connection key" : "Workspace"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {workspace
              ? "The key authenticates telemetry from the server environment to this workspace."
              : "Create a workspace without asking for first or last name again; signup already collected account details."}
          </p>
          {hasKey && newKey ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code className="rounded-md bg-ink px-3 py-2 font-mono text-xs text-white">
                {newKey.slice(0, 10)}••••••••••••
              </code>
              <button
                type="button"
                onClick={() => void copy()}
                className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-brand-strong"
              >
                <Clipboard size={13} />
                {copied ? "Copied" : "Copy key"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                workspace ? onGenerateKey() : onCreateWorkspace()
              }
              disabled={working}
              className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {working
                ? "Working…"
                : workspace
                  ? "Create connection key"
                  : "Create workspace"}
              <ArrowRight size={15} />
            </button>
          )}
        </div>
        <div className="border border-line p-4">
          <p className="text-sm font-semibold text-ink">Next step</p>
          <p className="mt-1 text-xs text-muted">
            Install the SDK, make one real tool call, then return to /dashboard
            to see the first-event setup panel.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="/docs/typescript"
              target="_blank"
              rel="noreferrer"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-line-strong bg-white px-3 py-2 text-xs font-semibold text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              View SDK guide <ArrowRight size={13} />
            </a>
            <button
              type="button"
              onClick={onOpenDashboard}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-ink px-3 py-2 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Open Overview <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
      {error && (
        <p
          className="mt-5 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      )}
    </section>
  );
}

function UsageChart({ timeline }: { timeline: Analytics["timeline"] }) {
  if (!timeline.length)
    return (
      <div className="grid h-[250px] place-items-center text-sm text-muted">
        No activity in the selected period.
      </div>
    );
  const width = 760,
    height = 250,
    left = 46,
    right = 14,
    top = 18,
    bottom = 42,
    plotWidth = width - left - right,
    plotHeight = height - top - bottom;
  const max = Math.max(1, ...timeline.map((day) => day.calls));
  const x = (index: number) =>
    left +
    (timeline.length === 1
      ? plotWidth / 2
      : (index / (timeline.length - 1)) * plotWidth);
  const y = (value: number) => top + plotHeight - (value / max) * plotHeight;
  const points = timeline
    .map((day, index) => x(index) + "," + y(day.calls))
    .join(" ");
  return (
    <div className="mt-5 overflow-x-auto">
      <svg
        viewBox={"0 0 " + width + " " + height}
        className="min-w-[620px]"
        role="img"
        aria-label="Observed tool calls over time"
      >
        <line
          x1={left}
          y1={height - bottom}
          x2={width - right}
          y2={height - bottom}
          stroke="#dfe6e1"
        />
        <polyline
          fill="none"
          stroke="#159b73"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {timeline.map((day, index) => (
          <circle
            key={day.date}
            cx={x(index)}
            cy={y(day.calls)}
            r="3.5"
            fill="#159b73"
          />
        ))}
        <text x={left} y={height - 12} fontSize="11" fill="#8b958f">
          {timeline[0].date}
        </text>
        <text
          x={width - right}
          y={height - 12}
          textAnchor="end"
          fontSize="11"
          fill="#8b958f"
        >
          {timeline[timeline.length - 1].date}
        </text>
        <text x={left} y={14} fontSize="11" fill="#64706a">
          Tool calls
        </text>
      </svg>
    </div>
  );
}

function explicitOutcomeTotals(analytics: Analytics) {
  return analytics.outcomes.reduce(
    (total, outcome) => ({
      started: total.started + outcome.started,
      completed: total.completed + outcome.completed,
      failed: total.failed + outcome.failed,
    }),
    { started: 0, completed: 0, failed: 0 },
  );
}
function metricValue(value: number | null | undefined) {
  return value === null || value === undefined
    ? "N/A"
    : Math.round(value * 100) + "%";
}
function correlationLabel(
  value: Analytics["workflows"][number]["correlation_quality"],
): string {
  if (value === "session_id") return "Session ID";
  if (value === "transport_generated") return "Transport-generated";
  if (value === "external") return "External handle";
  if (value === "issued") return "Issued handle";
  if (value === "mixed") return "Mixed correlation";
  return "Legacy/Unknown";
}
function insufficientReason(reason: ToolQualityInsufficientReason) {
  const labels: Record<ToolQualityInsufficientReason, string> = {
    tool_volume: "Minimum " + TOOL_QUALITY_MIN_TOOL_CALLS + " tool calls",
    segment_volume:
      "Minimum " + TOOL_QUALITY_MIN_SEGMENT_CALLS + " segment calls",
    workflow_volume:
      "Minimum " + TOOL_QUALITY_MIN_WORKFLOW_TERMINALS + " terminal workflows",
    catalog_volume:
      "Minimum " + TOOL_QUALITY_MIN_CATALOG_CALLS + " catalog calls",
    missing_grouping: "Required grouping is unavailable",
    uninspectable_result: "Successful result is not inspectable",
    bounded_source_scan: "Source scan is bounded",
  };
  return labels[reason];
}
function insufficientReasons(reasons: ToolQualityInsufficientReason[]) {
  return reasons.map(insufficientReason).join(" · ");
}
