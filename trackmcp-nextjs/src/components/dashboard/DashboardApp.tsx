"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Blocks,
  CalendarDays,
  Check,
  ChevronRight,
  Clipboard,
  ExternalLink,
  FileWarning,
  Gauge,
  Info,
  KeyRound,
  LayoutGrid,
  ListChecks,
  LogOut,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
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
import type { AlertIncident } from "@/lib/alerts/types";
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
type AlertLoadState =
  | "idle"
  | "loading"
  | "ready"
  | "unavailable"
  | "unauthorized"
  | "error";
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
  { id: "journeys", label: "Journeys", icon: Route },
  { id: "capabilities", label: "Capabilities", icon: Blocks },
  { id: "quality", label: "Quality", icon: ShieldCheck },
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

const EXAMPLE_SERVER = {
  name: "QuickBooks Finance MCP",
  description:
    "An illustrative finance server for looking up invoices, running reports, and exporting data.",
};

const EXAMPLE_EVIDENCE_STEPS = [
  { time: "10:42:00", action: "Session started", detail: "Claude connected", status: "Observed" },
  { time: "10:42:01", action: "find_invoice", detail: "Invoice #1048 found", status: "Success" },
  { time: "10:42:03", action: "create_report", detail: "A/R summary requested", status: "Success" },
  { time: "10:42:04", action: "Workflow completed", detail: "Explicit outcome reported", status: "Completed" },
];

const EXAMPLE_ALERT_INCIDENTS: AlertIncident[] = [
  {
    id: "example-incident-latency",
    workspace_id: "example-workspace",
    alert_id: "example-alert-latency",
    identity: "example-latency-regression",
    metric: "p95_latency_regression",
    state: "firing",
    severity: "warning",
    scope: { tool_name: "run_query", environment: "production" },
    data_status: "sufficient",
    baseline: {
      numerator: 420,
      denominator: 1200,
      value: 0.35,
      window: { start: "2026-08-30T00:00:00.000Z", end: "2026-09-06T00:00:00.000Z" },
    },
    comparison: {
      numerator: 180,
      denominator: 300,
      value: 0.6,
      window: { start: "2026-09-06T00:00:00.000Z", end: "2026-09-07T00:00:00.000Z" },
    },
    threshold: { warning_delta: 0.1, critical_delta: 0.2 },
    reasons: [],
    evidence: { baseline_p95_ms: 420, comparison_p95_ms: 1400 },
    first_seen_at: "2026-09-06T11:30:00.000Z",
    last_seen_at: "2026-09-07T10:42:00.000Z",
    acknowledged_at: null,
    resolved_at: null,
    suppressed_reason: null,
    recovery: null,
    last_delivered_at: null,
    revision: 1,
  },
  {
    id: "example-incident-errors",
    workspace_id: "example-workspace",
    alert_id: "example-alert-errors",
    identity: "example-error-regression",
    metric: "tool_error_rate_spike",
    state: "resolved",
    severity: "critical",
    scope: { tool_name: "create_report", environment: "production" },
    data_status: "sufficient",
    baseline: {
      numerator: 4,
      denominator: 160,
      value: 0.025,
      window: { start: "2026-08-30T00:00:00.000Z", end: "2026-09-06T00:00:00.000Z" },
    },
    comparison: {
      numerator: 11,
      denominator: 60,
      value: 0.183,
      window: { start: "2026-09-06T00:00:00.000Z", end: "2026-09-07T00:00:00.000Z" },
    },
    threshold: { critical_delta: 0.2 },
    reasons: [],
    evidence: { recovery_confirmed: true },
    first_seen_at: "2026-09-05T08:15:00.000Z",
    last_seen_at: "2026-09-06T16:20:00.000Z",
    acknowledged_at: null,
    resolved_at: "2026-09-06T17:00:00.000Z",
    suppressed_reason: null,
    recovery: { recovered_at: "2026-09-06T17:00:00.000Z", value: 0.03 },
    last_delivered_at: "2026-09-05T08:20:00.000Z",
    revision: 2,
  },
  {
    id: "example-incident-volume",
    workspace_id: "example-workspace",
    alert_id: "example-alert-volume",
    identity: "example-volume-insufficient",
    metric: "workflow_completion_drop",
    state: "insufficient_data",
    severity: null,
    scope: { tool_name: "export_report", environment: "production" },
    data_status: "insufficient_data",
    baseline: null,
    comparison: null,
    threshold: { minimum_workflow_starts: 20 },
    reasons: ["below_minimum_volume"],
    evidence: { workflow_starts: 8 },
    first_seen_at: "2026-09-07T09:10:00.000Z",
    last_seen_at: "2026-09-07T09:10:00.000Z",
    acknowledged_at: null,
    resolved_at: null,
    suppressed_reason: null,
    recovery: null,
    revision: 1,
  },
  {
    id: "example-incident-suppressed",
    workspace_id: "example-workspace",
    alert_id: "example-alert-suppressed",
    identity: "example-suppressed-retry",
    metric: "retry_loop_spike",
    state: "suppressed",
    severity: "warning",
    scope: { tool_name: "find_invoice", environment: "production" },
    data_status: "sufficient",
    baseline: {
      numerator: 6,
      denominator: 220,
      value: 0.027,
      window: { start: "2026-08-30T00:00:00.000Z", end: "2026-09-06T00:00:00.000Z" },
    },
    comparison: {
      numerator: 13,
      denominator: 180,
      value: 0.072,
      window: { start: "2026-09-06T00:00:00.000Z", end: "2026-09-07T00:00:00.000Z" },
    },
    threshold: { warning_delta: 0.1 },
    reasons: [],
    evidence: { cooldown_hours: 6 },
    first_seen_at: "2026-09-06T12:00:00.000Z",
    last_seen_at: "2026-09-06T12:00:00.000Z",
    acknowledged_at: null,
    resolved_at: null,
    suppressed_reason: "Cooldown active after a recent notification",
    recovery: null,
    revision: 1,
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function parseAlertIncidents(value: unknown): AlertIncident[] {
  if (!isRecord(value) || !Array.isArray(value.data)) return [];
  return value.data.filter(isRecord).slice(0, 100) as AlertIncident[];
}

function incidentStateLabel(state: AlertIncident["state"]): string {
  switch (state) {
    case "firing":
      return "Firing regression";
    case "resolved":
      return "Resolved";
    case "insufficient_data":
      return "Insufficient evidence";
    case "invalid_configuration":
      return "Configuration needs attention";
    case "suppressed":
      return "Suppressed";
    default:
      return "Awaiting confirmation";
  }
}

function metricLabel(metric: AlertIncident["metric"]): string {
  return metric
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function summaryLabel(summary: AlertIncident["comparison"]): string {
  if (!summary) return "Unavailable";
  const value = summary.value === null ? "N/A" : percent(summary.value);
  return `${summary.numerator}/${summary.denominator} (${value})`;
}

function thresholdLabel(threshold: AlertIncident["threshold"]): string {
  const entries = Object.entries(threshold).slice(0, 4);
  return entries.length
    ? entries.map(([key, value]) => `${key.replaceAll("_", " ")}: ${value}`).join(" · ")
    : "Not provided";
}

function incidentVolumeLabel(incident: AlertIncident): string {
  const denominator = incident.comparison?.denominator;
  return typeof denominator === "number"
    ? `${fmt(denominator)} eligible comparison volume`
    : "Not provided by the API";
}

function incidentDateLabel(value: string | null): string {
  if (!value) return "Unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unavailable"
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

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
    (dataMode === "my" || dataMode === "example") &&
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
    incidentId:
      dataMode === "my" && view === "evidence"
        ? params.get("incident_id")
        : null,
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
  incidentId: string | null = null,
) {
  const params = new URLSearchParams();
  if (sessionId || correlationHandle) {
    params.set("view", "trace");
    if (sessionId) params.set("session_id", sessionId);
    if (correlationHandle) params.set("correlation_handle", correlationHandle);
    if (origin !== "evidence") params.set("origin", origin);
  } else if (incidentId && view === "evidence" && dataMode === "my") {
    params.set("view", "evidence");
    params.set("incident_id", incidentId);
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
  total_events: 1620,
  protocol_events: 290,
  catalog_events: 42,
  protocol_versions: ["2025-11-25"],
  transports: ["streamable_http"],
  methods: ["tools/list", "tools/call"],
  tool_calls: 1293,
  sessions: 96,
  errors: 61,
  completion_rate: 0.74,
  completion_source: "workflow_events",
  correlation_quality: "session_id",
  correlation_handle_source: "issued",
  funnel: {
    connections: 96,
    discovered_tools: 8,
    tool_calls: 1293,
    successful_calls: 1232,
  },
  intent_sources: {
    context_parameter: 48,
    external_callback: 18,
    fallback: 7,
    missing: 11,
  },
  missing_capabilities: [
    { name: "bulk_export", reports: 12 },
    { name: "sync_vendor_payments", reports: 5 },
  ],
  timeline: Array.from({ length: 20 }, (_, i) => ({
    date: "2026-08-" + String(i + 1).padStart(2, "0"),
    events: 84 + i * 7 + (i % 4) * 8,
    calls: 62 + i * 9 + (i % 3) * 6,
    errors: i === 8 || i === 16 ? 10 : 2 + (i % 4),
  })),
  clients: [
    { name: "Claude", calls: 520 },
    { name: "Cursor", calls: 344 },
    { name: "ChatGPT", calls: 210 },
    { name: "Gemini", calls: 130 },
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
    {
      name: "get_customer_balance",
      calls: 236,
      errors: 9,
      error_rate: 0.038,
      avg_ms: 280,
      p50_ms: 230,
      p95_ms: 650,
      latency_sample_count: 236,
      discovered: true,
    },
    {
      name: "list_accounts",
      calls: 124,
      errors: 6,
      error_rate: 0.048,
      avg_ms: 190,
      p50_ms: 150,
      p95_ms: 390,
      latency_sample_count: 124,
      discovered: true,
    },
  ],
  catalog_tools: [],
  unused_tools: ["bulk_export", "sync_vendor_payments"],
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
    {
      session_id: "example-session-4",
      client_name: "Gemini",
      calls: 9,
      tools: ["get_customer_balance", "list_accounts"],
      started_at: "2026-08-27T13:08:00Z",
      duration_ms: 5120,
      completed: true,
      completion_source: "workflow_events",
      correlation_quality: "session_id",
    },
    {
      session_id: "example-session-5",
      client_name: "Claude",
      calls: 14,
      tools: ["run_query", "create_report", "export_csv"],
      started_at: "2026-08-26T09:24:00Z",
      duration_ms: 11800,
      completed: true,
      completion_source: "workflow_events",
      correlation_quality: "session_id",
    },
    {
      session_id: "example-session-6",
      client_name: "ChatGPT",
      calls: 5,
      tools: ["find_invoice", "get_customer_balance"],
      started_at: "2026-08-25T15:40:00Z",
      duration_ms: 2890,
      completed: false,
      completion_source: "workflow_events",
      correlation_quality: "session_id",
    },
  ],
  outcomes: [
    { name: "invoice_lookup", started: 18, completed: 12, failed: 6 },
    { name: "report_creation", started: 10, completed: 8, failed: 2 },
    { name: "account_balance", started: 14, completed: 11, failed: 3 },
    { name: "finance_export", started: 8, completed: 6, failed: 2 },
  ],
  insights: [
    {
      level: "warn",
      title: "run_query is slower than its observed range",
      detail:
        "Review returned errors and latency before deciding what to change.",
      metric: "p95 1.4s",
    },
    {
      level: "warn",
      title: "create_report has an elevated error rate",
      detail:
        "11 of 196 observed report requests returned an error. Compare the failed sessions with the report inputs before changing the tool.",
      metric: "error rate 5.6%",
    },
    {
      level: "info",
      title: "bulk_export is advertised but not observed",
      detail:
        "The catalog exposes this capability, but no calls were observed in the selected period. Ask whether users know it exists or need it.",
      metric: "12 reported gaps",
    },
    {
      level: "info",
      title: "Invoice lookup is the most common business task",
      detail:
        "Invoice lookup appears in the largest number of explicit workflow starts. Use Evidence to inspect how those sessions complete.",
      metric: "18 workflow starts",
    },
  ],
};

const EXAMPLE_QUALITY: ToolQualityResponse = {
  range_days: 30,
  source_event_count: 1620,
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
      tool_call_share: tool.calls / 1293,
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
  displayName,
  workspace,
  keys,
  analytics,
  toolQuality,
  newKey,
  working,
  error,
  initialView = "overview",
  onGenerateKey,
  onRevokeKey,
  onDismissKey,
  onRefresh,
  onCreateWorkspace,
  onSignOut,
}: {
  displayName: string;
  workspace: Workspace | null;
  keys: Key[];
  analytics: Analytics | null;
  toolQuality: ToolQualityResponse | null;
  newKey: string;
  working: boolean;
  error: string;
  initialView?: "overview" | "traces";
  onGenerateKey: () => void;
  onRevokeKey: (id: string) => void;
  onDismissKey: () => void;
  onRefresh: (days?: string) => void;
  onCreateWorkspace: () => void;
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
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [alertIncidents, setAlertIncidents] = useState<AlertIncident[]>([]);
  const [alertLoadState, setAlertLoadState] =
    useState<AlertLoadState>("idle");
  const [alertError, setAlertError] = useState("");
  const [alertLoadedKey, setAlertLoadedKey] = useState<string | null>(null);
  const [alertReloadToken, setAlertReloadToken] = useState(0);
  const [copied, setCopied] = useState(false);
  const hasActiveKey = keys.some((key) => !key.revoked_at);
  const isExample = dataMode === "example";
  const displayedAnalytics = isExample
    ? exampleAnalytics(Number(range))
    : analytics;
  const displayedQuality = isExample
    ? exampleQuality(Number(range))
    : toolQuality;
  const workspaceId = workspace?.id || null;
  const alertScopeKey = `${dataMode}:${workspaceId || "none"}:${hasActiveKey}:${alertReloadToken}`;
  const alertsAvailable = dataMode === "my" && workspaceId !== null && hasActiveKey;
  const alertScopeLoaded = alertsAvailable && alertLoadedKey === alertScopeKey;
  const visibleAlertIncidents = isExample
    ? EXAMPLE_ALERT_INCIDENTS
    : alertScopeLoaded
      ? alertIncidents
      : [];
  const visibleAlertLoadState: AlertLoadState = isExample
    ? "ready"
    : !alertsAvailable
      ? "unavailable"
      : alertScopeLoaded
        ? alertLoadState
        : "loading";
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
      setIncidentId(state.incidentId);
    };
    const timer = window.setTimeout(applyRoute, 0);
    window.addEventListener("popstate", applyRoute);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("popstate", applyRoute);
    };
  }, [initialView]);

  useEffect(() => {
    const controller = new AbortController();
    if (dataMode === "example" || workspaceId === null || !hasActiveKey) {
      return () => controller.abort();
    }

    fetch("/api/v1/alert-incidents?limit=50", {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) {
          setAlertIncidents([]);
          setAlertLoadedKey(alertScopeKey);
          setAlertLoadState("unauthorized");
          return;
        }
        if (!response.ok) {
          throw new Error("Could not load regression incidents.");
        }
        const payload: unknown = await response.json();
        setAlertIncidents(parseAlertIncidents(payload));
        setAlertLoadedKey(alertScopeKey);
        setAlertLoadState("ready");
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setAlertIncidents([]);
        setAlertError(
          reason instanceof Error
            ? reason.message
            : "Could not load regression incidents.",
        );
        setAlertLoadedKey(alertScopeKey);
        setAlertLoadState("error");
      });

    return () => controller.abort();
  }, [alertReloadToken, alertScopeKey, dataMode, hasActiveKey, workspaceId]);

  const setDataMode = (next: DataMode) => {
    setDataModeState(next);
    setTraceSessionId(null);
    setTraceCorrelationHandle(null);
    setTraceOrigin("evidence");
    setIncidentId(null);
    writeRouteState(view, range, next, null, null, "evidence");
  };
  const goTo = (next: View) => {
    setView(next);
    setTraceSessionId(null);
    setTraceCorrelationHandle(null);
    setIncidentId(null);
    writeRouteState(next, range, dataMode);
  };
  const openTrace = (sessionId: string, correlationHandle?: string | null) => {
    const origin = view;
    setTraceSessionId(sessionId);
    setTraceCorrelationHandle(correlationHandle || null);
    setTraceOrigin(origin);
    setIncidentId(null);
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
    setIncidentId(null);
    setView(traceOrigin);
    writeRouteState(traceOrigin, range, dataMode);
  };
  const selectRange = (next: string) => {
    setRange(next);
    if (dataMode === "my") onRefresh(next);
    writeRouteState(view, next, dataMode);
  };
  const openIncidentEvidence = (nextIncidentId: string) => {
    setIncidentId(nextIncidentId);
    setTraceSessionId(null);
    setTraceCorrelationHandle(null);
    setTraceOrigin("issues");
    setView("evidence");
    writeRouteState(
      "evidence",
      range,
      dataMode,
      null,
      null,
      "issues",
      false,
      nextIncidentId,
    );
  };
  const refreshAll = () => {
    setAlertReloadToken((value) => value + 1);
    onRefresh(range);
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

  const pageControls =
    view === "issues" ? null : (
      <PageControls
        range={range}
        onRangeChange={selectRange}
        onRefresh={refreshAll}
      />
    );

  return (
    <div className="dashboard-shell min-h-screen bg-[#f7f8f7] font-sans text-ink">
      <aside className="fixed bottom-0 left-0 top-[52px] z-30 hidden w-[248px] border-r border-line bg-[#fbfcfb] lg:flex lg:flex-col">
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
              {displayName.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 truncate text-[11.5px] text-muted">
              {displayName}
            </span>
          </div>
        </div>
      </aside>
      <div className="pt-[52px] lg:pl-[248px]">
        <header className="fixed left-0 right-0 top-0 z-40 flex h-[52px] items-center justify-between gap-3 border-b border-line bg-white px-5 backdrop-blur sm:px-8">
          <TrackMCPLogo asLink={false} mark size="footer" variant="mono" />
          <DataModeToggle dataMode={dataMode} onChange={setDataMode} />
        </header>
        <div className="border-b border-line bg-white px-4 py-2.5 lg:hidden">
          <div className="flex gap-1 overflow-x-auto" role="navigation" aria-label="Dashboard navigation">
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
                <NavItemLabel item={item} />
              </button>
            ))}
          </div>
        </div>
        <main className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8 sm:py-8">
          {error && (
            <ErrorBanner message={error} onRetry={refreshAll} />
          )}
          {newKey && (
            <div className="mb-6 flex flex-wrap items-center gap-3 border border-brand/30 bg-brand-soft/35 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-strong">
                  Connection key created
                </p>
                <p className="mt-1 text-xs text-muted">
                  Copy it now. The complete secret will not be shown again.
                </p>
              </div>
              <code className="max-w-full break-all overflow-x-auto rounded-md bg-ink px-3 py-2 font-mono text-xs text-white">
                {newKey}
              </code>
              <button
                type="button"
                onClick={() => void copyKey()}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-line-strong bg-white px-3 py-2 text-xs font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {copied ? (
                  <Check size={13} className="text-brand-strong" aria-hidden="true" />
                ) : (
                  <Clipboard size={13} aria-hidden="true" />
                )}
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
          {view === "setup" ? (
            <SetupView
              keys={keys}
              working={working}
              onGenerateKey={onGenerateKey}
              onRevokeKey={onRevokeKey}
            />
          ) : !isExample && (!workspace || !hasActiveKey || zeroEventState) ? (
            <ServerConnectionState
              view={view}
              state={!workspace ? "workspace" : !hasActiveKey ? "key" : "events"}
              working={working}
              onPrimary={
                !workspace
                  ? onCreateWorkspace
                  : !hasActiveKey
                    ? () => goTo("setup")
                    : () => onRefresh(range)
              }
              onUseExample={() => setDataMode("example")}
              pageControls={pageControls}
            />
          ) : traceSessionId || traceCorrelationHandle ? (
            <TraceExplorer
              key={
                (traceSessionId || "") + ":" + (traceCorrelationHandle || "")
              }
              sessionId={traceSessionId}
              correlationHandle={traceCorrelationHandle}
              sampleMode={dataMode === "example"}
              originLabel={viewLabels[traceOrigin]}
              onBack={closeTrace}
            />
          ) : !displayedAnalytics ? (
            <LiveDataState
              message={
                error
                  ? "Live data could not be loaded"
                  : "No live data available for this period."
              }
              onRetry={refreshAll}
              permission={/authoriz|permission/i.test(error)}
            />
          ) : (
            <ViewContent
              view={view}
              analytics={displayedAnalytics}
              toolQuality={displayedQuality}
              dataMode={dataMode}
              onViewChange={goTo}
              onViewTrace={openTrace}
              onViewIncidentEvidence={openIncidentEvidence}
              incident={
                incidentId
                  ? visibleAlertIncidents.find((item) => item.id === incidentId) ||
                    null
                  : null
              }
              alertIncidents={visibleAlertIncidents}
              alertLoadState={visibleAlertLoadState}
              alertError={alertError}
              onRefresh={refreshAll}
              pageControls={pageControls}
              hasMyData={Boolean(analytics && analytics.total_events > 0)}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function NavItemLabel({ item }: { item: NavItem }) {
  return <span className="truncate">{item.label}</span>;
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
          <NavItemLabel item={item} />
        </button>
      ))}
    </nav>
  );
}

function DataModeToggle({
  dataMode,
  onChange,
}: {
  dataMode: DataMode;
  onChange: (dataMode: DataMode) => void;
}) {
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Data source">
      <span className="hidden text-[11px] font-semibold text-faint sm:inline">Data</span>
      <div className="inline-flex rounded-lg border border-line bg-white p-0.5">
        <button
          type="button"
          aria-pressed={dataMode === "my"}
          aria-label="Show my data"
          title="Show my server data"
          onClick={() => onChange("my")}
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
          aria-label="Show example data"
          title="Show illustrative example data"
          onClick={() => onChange("example")}
          className={
            "cursor-pointer rounded-md px-3 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand " +
            (dataMode === "example"
              ? "bg-ink text-white"
              : "text-muted hover:bg-paper hover:text-ink")
          }
        >
          Example data
        </button>
      </div>
    </div>
  );
}

function DateRange({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const options = [
    { value: "7", label: "Last 7 days" },
    { value: "30", label: "Last 30 days" },
    { value: "90", label: "Last 90 days" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Activity date range">
      <span className="sr-only">Activity date range</span>
      <div className="inline-flex rounded-lg border border-line bg-white p-0.5">
        {options.map((option) => (
          <button
            type="button"
            key={option.value}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={
              "cursor-pointer rounded-md px-2.5 py-2 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand " +
              (value === option.value
                ? "bg-ink text-white"
                : "text-muted hover:bg-paper hover:text-ink")
            }
          >
            {option.label}
          </button>
        ))}
      </div>
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

function PageControls({
  range,
  onRangeChange,
  onRefresh,
}: {
  range: string;
  onRangeChange: (range: string) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <DateRange value={range} onChange={onRangeChange} />
      <button
        type="button"
        onClick={onRefresh}
        aria-label="Refresh dashboard data"
        title="Refresh data"
        className="grid h-9 w-9 cursor-pointer place-items-center rounded-md border border-line text-muted hover:bg-paper hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <RefreshCw size={15} />
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

const emptyPageCopy: Record<
  View,
  {
    description: string;
    preview: Array<{ label: string; detail: string }>;
  }
> = {
  overview: {
    description:
      "See activity, explicit work outcomes, and what deserves attention next.",
    preview: [
      { label: "AI clients", detail: "Which assistants are using your MCP." },
      { label: "Activity", detail: "Calls, sessions, errors, and activity over time." },
      { label: "Work completed", detail: "Explicit outcomes reported by your application." },
      { label: "Needs attention", detail: "Signals that are worth investigating next." },
    ],
  },
  journeys: {
    description:
      "Understand what work is being attempted and where it stops.",
    preview: [
      { label: "Work attempted", detail: "The business tasks users start, such as invoice lookup." },
      { label: "Completed", detail: "Tasks with an explicit successful outcome." },
      { label: "Failed", detail: "Tasks that stop, error, or lack a reported outcome." },
      { label: "Sessions", detail: "The client, steps, timing, and trace behind each task." },
    ],
  },
  capabilities: {
    description:
      "See what the server offers and which capabilities are observed in use.",
    preview: [
      { label: "Capabilities observed", detail: "What your MCP advertises versus what users call." },
      { label: "Activity", detail: "Call volume and usage share for each capability." },
      { label: "Errors", detail: "Returned errors and error rates by capability." },
      { label: "Evidence", detail: "A trace to inspect when a capability needs context." },
    ],
  },
  quality: {
    description:
      "Review observed capability quality without turning insufficient data into a failure.",
    preview: [
      { label: "Success", detail: "Observed completion and success signals." },
      { label: "Errors", detail: "Error and retry rates for each capability." },
      { label: "Latency", detail: "p95 timing over the selected activity period." },
      { label: "Insufficient data", detail: "A clear reason when a metric is not trustworthy yet." },
    ],
  },
  issues: {
    description:
      "Review what deserves attention next, ordered by evidence strength and affected volume.",
    preview: [
      { label: "Issue", detail: "A regression or signal identified from observed data." },
      { label: "Severity", detail: "The current state, such as firing, resolved, or suppressed." },
      { label: "Affected volume", detail: "Eligible comparison volume behind the signal." },
      { label: "Evidence", detail: "The baseline, comparison, threshold, and recovery context." },
    ],
  },
  clients: {
    description: "See which AI clients are using the connected server.",
    preview: [
      { label: "AI clients", detail: "The assistants observed at your server boundary." },
      { label: "Activity", detail: "Calls and sessions attributed to each client." },
      { label: "Sessions", detail: "How client activity unfolds over time." },
      { label: "Evidence", detail: "A trace for the activity you want to understand." },
    ],
  },
  evidence: {
    description: "Open technical evidence when a business signal needs detail.",
    preview: [
      { label: "Sessions", detail: "A selected task or interaction to investigate." },
      { label: "Timeline", detail: "The ordered steps, timing, and status of the trace." },
      { label: "Correlation", detail: "The handle that connects related server events." },
      { label: "Bounded events", detail: "Redacted event detail without unbounded payloads." },
    ],
  },
  setup: {
    description: "Connect a server and manage the key for this workspace.",
    preview: [
      { label: "Connection key", detail: "The credential your server uses to send telemetry." },
      { label: "SDK setup", detail: "Install the TypeScript or Python SDK." },
      { label: "First event", detail: "Send one real tool call to confirm the connection." },
      { label: "Data flow", detail: "See what is redacted, bounded, and never requested." },
    ],
  },
};

function ServerConnectionState({
  view,
  state,
  working,
  onPrimary,
  onUseExample,
  pageControls,
}: {
  view: View;
  state: "workspace" | "key" | "events";
  working: boolean;
  onPrimary: () => void;
  onUseExample: () => void;
  pageControls: ReactNode;
}) {
  const copy = emptyPageCopy[view];
  const title = viewLabels[view];
  const primaryLabel =
    state === "workspace"
      ? "Complete setup"
      : state === "key"
        ? "Complete setup"
        : "Check for server activity";
  const message =
    state === "events"
      ? "Your MCP server has not sent its first event yet."
      : "Your MCP server is not connected yet.";
  const detail =
    state === "workspace"
      ? "Create a workspace, then connect your server with a connection key."
      : state === "key"
        ? "Create a connection key, add it to your server, and send one real event."
        : "A key exists, but no events have arrived in the selected period. TrackMCP cannot verify server reachability from this screen.";

  return (
    <div>
      <PageIntro title={title} description={copy.description} actions={pageControls} />
      <section className="border border-line bg-white p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-paper text-muted">
            <Info size={19} />
          </span>
          <div className="min-w-0">
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-ink">
              {message}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              {detail}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={working}
                onClick={onPrimary}
                className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {working ? "Working…" : primaryLabel}
                <ArrowRight size={15} />
              </button>
              <button
                type="button"
                onClick={onUseExample}
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-line-strong bg-white px-4 py-2.5 text-sm font-semibold text-body hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                See Example data
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="mt-6 border border-line bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">
              What you will see here
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              This is a structure preview, not fabricated workspace data.
              Connect a server or choose Example data to populate it.
            </p>
          </div>
          <span className="rounded-full border border-line bg-paper px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-faint">
            Preview
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {copy.preview.map((item) => (
            <div key={item.label} className="border border-dashed border-line-strong bg-paper p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-faint">
                {item.label}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                {item.detail}
              </p>
              <p className="mt-3 text-[11px] font-medium text-faint">
                Populates after connection
              </p>
            </div>
          ))}
        </div>
      </section>
      <p className="mt-4 text-xs text-faint">
        No Example data is substituted into My data. The selected activity range
        stays in place when you connect the server or switch data sources.
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
  incident,
  alertIncidents,
  alertLoadState,
  alertError,
  onViewChange,
  onViewTrace,
  onViewIncidentEvidence,
  onRefresh,
  pageControls,
  hasMyData,
}: {
  view: View;
  analytics: Analytics;
  toolQuality: ToolQualityResponse | null;
  dataMode: DataMode;
  incident: AlertIncident | null;
  alertIncidents: AlertIncident[];
  alertLoadState: AlertLoadState;
  alertError: string;
  onViewChange: (view: View) => void;
  onViewTrace: (sessionId: string, correlationHandle?: string | null) => void;
  onViewIncidentEvidence: (incidentId: string) => void;
  onRefresh: () => void;
  pageControls: ReactNode;
  hasMyData: boolean;
}) {
  if (view === "journeys")
    return (
      <JourneysView
        analytics={analytics}
        dataMode={dataMode}
        hasMyData={hasMyData}
        pageControls={pageControls}
        onViewChange={onViewChange}
        onViewTrace={onViewTrace}
      />
    );
  if (view === "capabilities")
    return (
      <CapabilitiesView
        analytics={analytics}
        dataMode={dataMode}
        hasMyData={hasMyData}
        pageControls={pageControls}
        onViewTrace={onViewTrace}
      />
    );
  if (view === "quality")
    return (
      <QualityView
        data={toolQuality}
        dataMode={dataMode}
        hasMyData={hasMyData}
        pageControls={pageControls}
        onViewTrace={onViewTrace}
        onRefresh={onRefresh}
      />
    );
  if (view === "issues")
    return (
      <IssuesView
        analytics={analytics}
        toolQuality={toolQuality}
        dataMode={dataMode}
        hasMyData={hasMyData}
        incidents={alertIncidents}
        alertLoadState={alertLoadState}
        alertError={alertError}
        onViewChange={onViewChange}
        onViewIncidentEvidence={onViewIncidentEvidence}
        onRefresh={onRefresh}
      />
    );
  if (view === "clients") return <ClientsView analytics={analytics} dataMode={dataMode} hasMyData={hasMyData} pageControls={pageControls} />;
  if (view === "evidence")
    return (
      <EvidenceView
        analytics={analytics}
        dataMode={dataMode}
        hasMyData={hasMyData}
        pageControls={pageControls}
        incident={incident}
        onViewTrace={onViewTrace}
        onViewChange={onViewChange}
      />
    );
  return (
    <Overview
      analytics={analytics}
      dataMode={dataMode}
      hasMyData={hasMyData}
      pageControls={pageControls}
      onViewChange={onViewChange}
      onViewTrace={onViewTrace}
    />
  );
}

function PageIntro({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="dashboard-page-title tracking-[-0.035em] text-ink">
          {title}
        </h2>
        <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted">
          {description}
        </p>
      </div>
      {actions && <div className="shrink-0 pt-1">{actions}</div>}
    </div>
  );
}
function ExampleEvidencePreview({
  onViewTrace,
}: {
  onViewTrace: (sessionId: string, correlationHandle?: string | null) => void;
}) {
  return (
    <Panel
      title="Example session timeline"
      subtitle={`${EXAMPLE_SERVER.name} · Claude · invoice lookup · illustrative only`}
      action={{
        label: "View sample trace",
        onClick: () => onViewTrace("example-session-1", "example-correlation-1"),
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="border-b border-line text-[10px] font-semibold uppercase tracking-[0.08em] text-faint">
            <tr>
              <th className="pb-3">Time</th>
              <th className="pb-3">Step</th>
              <th className="pb-3">What happened</th>
              <th className="pb-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {EXAMPLE_EVIDENCE_STEPS.map((step) => (
              <tr key={step.time + step.action}>
                <td className="py-3 font-mono text-xs text-muted">{step.time}</td>
                <td className="py-3 font-medium text-ink">{step.action}</td>
                <td className="py-3 text-muted">{step.detail}</td>
                <td className="py-3 text-xs font-semibold text-brand-strong">{step.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function DataSourceStrip({
  dataMode,
  hasMyData,
  view,
}: {
  dataMode: DataMode;
  hasMyData: boolean;
  view: View;
}) {
  const canViewMyData = dataMode === "example" && hasMyData;
  return (
    <section
      className="mb-6 flex flex-wrap items-center gap-3 border border-line bg-[#f3f5f3] px-4 py-3.5"
      aria-label="Data source state"
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-muted">
        <Info size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">
          {dataMode === "example"
            ? "Example data selected"
            : "My data selected"}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {dataMode === "example"
            ? `${EXAMPLE_SERVER.description} This is a guided example, not workspace telemetry.`
            : "Server-observed events are shown here. This is a data-source state, not a product-health signal."}
        </p>
      </div>
      {dataMode === "example" && (
        <a
          href={
            canViewMyData
              ? `/dashboard?view=${view}&data=my`
              : "/dashboard?view=setup&data=my"
          }
          className="ml-auto inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-ink px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#24332b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          {canViewMyData ? "View my data" : "Connect your MCP"}
          <ArrowRight size={13} />
        </a>
      )}
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
  action?: { label: string; onClick?: () => void; href?: string };
}) {
  return (
    <section className="border border-line bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="dashboard-section-title text-ink">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {subtitle}
            </p>
          )}
        </div>
        {action?.href ? (
          <a
            href={action.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-brand-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {action.label}
            <ExternalLink size={13} />
          </a>
        ) : action ? (
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-brand-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {action.label}
            <ChevronRight size={13} />
          </button>
        ) : null}
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
        <span className="dashboard-label text-faint">
          {label}
        </span>
        <Icon size={16} className="text-brand-strong" />
      </div>
      <p className="dashboard-metric mt-3 tracking-[-0.04em] text-ink">
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
  hasMyData,
  pageControls,
  onViewChange,
  onViewTrace,
}: {
  analytics: Analytics;
  dataMode: DataMode;
  hasMyData: boolean;
  pageControls: ReactNode;
  onViewChange: (view: View) => void;
  onViewTrace: (sessionId: string, correlationHandle?: string | null) => void;
}) {
  const totals = explicitOutcomeTotals(analytics);
  return (
    <div>
      <PageIntro
        title="Overview"
        description="See activity, explicit work outcomes, and what deserves attention next."
        actions={pageControls}
      />
      <DataSourceStrip dataMode={dataMode} hasMyData={hasMyData} view="overview" />
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
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(310px,.8fr)]">
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
            label: "View traces",
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
                  Open trace <ChevronRight size={13} />
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
      <div className="flex min-h-[320px] max-h-[320px] flex-col">
        <div
          className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2"
          aria-label="Needs attention signals"
        >
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
        </div>
        <div className="mt-3 shrink-0">
          <ActionButton
            label={analytics.insights.length ? "Review Issues" : "See Journeys"}
            icon={analytics.insights.length ? AlertTriangle : ListChecks}
            onClick={() =>
              onViewChange(analytics.insights.length ? "issues" : "journeys")
            }
          />
        </div>
      </div>
    </Panel>
  );
}

function JourneysView({
  analytics,
  dataMode,
  hasMyData,
  pageControls,
  onViewChange,
  onViewTrace,
}: {
  analytics: Analytics;
  dataMode: DataMode;
  hasMyData: boolean;
  pageControls: ReactNode;
  onViewChange: (view: View) => void;
  onViewTrace: (sessionId: string, correlationHandle?: string | null) => void;
}) {
  const totals = explicitOutcomeTotals(analytics);
  return (
    <div>
      <PageIntro
        title="Journeys"
        description="Understand what work is being attempted and where it stops. Completion uses explicit workflow outcomes only."
        actions={pageControls}
      />
      <DataSourceStrip dataMode={dataMode} hasMyData={hasMyData} view="journeys" />
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
  dataMode,
  hasMyData,
  pageControls,
  onViewTrace,
}: {
  analytics: Analytics;
  dataMode: DataMode;
  hasMyData: boolean;
  pageControls: ReactNode;
  onViewTrace: (sessionId: string, correlationHandle?: string | null) => void;
}) {
  return (
    <div>
      <PageIntro
        title="Capabilities"
        description="See what the server offers and which capabilities are observed in use."
        actions={pageControls}
      />
      <DataSourceStrip dataMode={dataMode} hasMyData={hasMyData} view="capabilities" />
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
  hasMyData,
  pageControls,
  onViewTrace,
  onRefresh,
}: {
  data: ToolQualityResponse | null;
  dataMode: DataMode;
  hasMyData: boolean;
  pageControls: ReactNode;
  onViewTrace: (sessionId: string, correlationHandle?: string | null) => void;
  onRefresh: () => void;
}) {
  if (!data)
    return (
      <div>
        <PageIntro
          title="Quality"
          description="Review observed capability quality without turning insufficient data into a failure."
          actions={pageControls}
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
        actions={pageControls}
      />
      <DataSourceStrip dataMode={dataMode} hasMyData={hasMyData} view="quality" />
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
                    {!tool.trace_session_ids.length && dataMode !== "example" ? (
                      <span className="text-xs text-faint">
                        Not available
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onViewTrace(tool.trace_session_ids[0])}
                        className="cursor-pointer text-xs font-semibold text-brand-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      >
                        {dataMode === "example" ? "View sample trace" : "Open Evidence"}
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
  dataMode,
  hasMyData,
  incidents,
  alertLoadState,
  alertError,
  onViewChange,
  onViewIncidentEvidence,
  onRefresh,
}: {
  analytics: Analytics;
  toolQuality: ToolQualityResponse | null;
  dataMode: DataMode;
  hasMyData: boolean;
  incidents: AlertIncident[];
  alertLoadState: AlertLoadState;
  alertError: string;
  onViewChange: (view: View) => void;
  onViewIncidentEvidence: (incidentId: string) => void;
  onRefresh: () => void;
}) {
  const insufficient = toolQuality
    ? toolQuality.tools.filter((tool) => tool.insufficient_data.length)
    : [];
  const orderedIncidents = [...incidents].sort((left, right) => {
    const rank = (state: AlertIncident["state"]) =>
      state === "firing"
        ? 0
        : state === "pending"
          ? 1
          : state === "resolved"
            ? 2
            : state === "suppressed"
              ? 3
              : state === "invalid_configuration"
                ? 4
                : 5;
    return rank(left.state) - rank(right.state);
  });
  return (
    <div>
      <PageIntro
        title="Issues"
        description="Review what deserves attention next, ordered by evidence strength and affected volume."
      />
      <DataSourceStrip dataMode={dataMode} hasMyData={hasMyData} view="issues" />
      <Panel
        title="Regression incidents"
        subtitle={
          dataMode === "example"
            ? "Illustrative alert lifecycle examples with bounded evidence"
            : "Workspace-scoped alert results with bounded evidence"
        }
      >
        {dataMode === "example" && (
          <div className="mb-3 border border-blue-200 bg-blue-50/60 p-3 text-xs leading-relaxed text-blue-900">
            These are illustrative examples so you can understand how firing,
            resolved, insufficient-data, and suppressed incidents appear. They
            are not alert history from your workspace.
          </div>
        )}
        {alertLoadState === "idle" || alertLoadState === "loading" ? (
          <div className="flex items-center gap-2 border border-line bg-paper p-4 text-sm text-muted" role="status">
            <RefreshCw size={15} className="animate-spin" />
            Loading regression incidents…
          </div>
        ) : alertLoadState === "unauthorized" ? (
          <div className="border border-line bg-paper p-4 text-sm text-muted" role="status">
            You do not have permission to view regression incidents for this
            workspace.
          </div>
        ) : alertLoadState === "error" ? (
          <div className="flex flex-wrap items-center gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
            <AlertTriangle size={16} />
            <span className="min-w-0 flex-1">{alertError || "Regression incidents could not be loaded."}</span>
            <button
              type="button"
              onClick={onRefresh}
              className="cursor-pointer font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            >
              Retry
            </button>
          </div>
        ) : alertLoadState === "ready" && !orderedIncidents.length ? (
          <div className="border border-line bg-paper p-4 text-sm text-muted">
            No regression incidents were returned for this workspace.
          </div>
        ) : (
          <div className="space-y-3">
            {orderedIncidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                onViewEvidence={() =>
                  dataMode === "example"
                    ? onViewChange("evidence")
                    : onViewIncidentEvidence(incident.id)
                }
                example={dataMode === "example"}
              />
            ))}
          </div>
        )}
      </Panel>
      <Panel
        title="Needs attention"
        subtitle="Observed signals and regression incidents remain separate evidence types"
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

function IncidentCard({
  incident,
  onViewEvidence,
  example = false,
}: {
  incident: AlertIncident;
  onViewEvidence: () => void;
  example?: boolean;
}) {
  const isInsufficient =
    incident.state === "insufficient_data" ||
    incident.data_status !== "sufficient";
  const stateTone =
    incident.state === "firing"
      ? "border-amber-200 bg-amber-50/60"
      : incident.state === "resolved"
        ? "border-line bg-paper"
        : "border-line bg-white";
  return (
    <article className={`border p-4 ${stateTone}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              {incidentStateLabel(incident.state)}
            </span>
            {incident.severity && (
              <span className="rounded-full border border-line-strong px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
                {incident.severity}
              </span>
            )}
            {isInsufficient && (
              <span className="text-[10px] font-semibold text-amber-800">
                Not a confirmed failure
              </span>
            )}
          </div>
          <h3 className="mt-2 text-sm font-semibold text-ink">
            {metricLabel(incident.metric)}
          </h3>
        </div>
        <button
          type="button"
          onClick={onViewEvidence}
          className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-brand-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          {example ? "View sample evidence" : "Open Evidence"} <ChevronRight size={13} />
        </button>
      </div>
      <div className="mt-4 grid gap-3 text-xs text-muted sm:grid-cols-2 lg:grid-cols-3">
        <p>
          <span className="font-semibold text-ink">Scope:</span>{" "}
          {incident.scope.tool_name || "All capabilities"}
          {incident.scope.environment
            ? ` · ${incident.scope.environment}`
            : " · all environments"}
        </p>
        <p>
          <span className="font-semibold text-ink">Affected volume:</span>{" "}
          {incidentVolumeLabel(incident)}
        </p>
        <p>
          <span className="font-semibold text-ink">Threshold:</span>{" "}
          {thresholdLabel(incident.threshold)}
        </p>
        <p>
          <span className="font-semibold text-ink">Baseline:</span>{" "}
          {summaryLabel(incident.baseline)}
        </p>
        <p>
          <span className="font-semibold text-ink">Comparison:</span>{" "}
          {summaryLabel(incident.comparison)}
        </p>
        <p>
          <span className="font-semibold text-ink">Last seen:</span>{" "}
          {incidentDateLabel(incident.last_seen_at)}
          {incident.recovery?.recovered_at
            ? ` · recovered ${incidentDateLabel(incident.recovery.recovered_at)}`
            : incident.resolved_at
              ? ` · resolved ${incidentDateLabel(incident.resolved_at)}`
              : ""}
        </p>
      </div>
      <div className="mt-3 border-t border-line/80 pt-3 text-[11px] text-muted">
        <p>
          <span className="font-semibold text-ink">Evidence basis:</span>{" "}
          {incident.data_status === "sufficient"
            ? "Regression policy evaluation"
            : `Data status: ${incident.data_status.replaceAll("_", " ")}`}
          {incident.reasons.length
            ? ` · ${incident.reasons.slice(0, 3).join(", ").replaceAll("_", " ")}`
            : ""}
        </p>
        <p className="mt-1">
          <span className="font-semibold text-ink">Notification status:</span>{" "}
          {incident.state === "invalid_configuration"
            ? "Configuration invalid; delivery was not confirmed."
            : incident.last_delivered_at
              ? `Delivered ${incidentDateLabel(incident.last_delivered_at)}.`
              : "Not included in this response."}
        </p>
      </div>
    </article>
  );
}

function ClientsView({
  analytics,
  dataMode,
  hasMyData,
  pageControls,
}: {
  analytics: Analytics;
  dataMode: DataMode;
  hasMyData: boolean;
  pageControls: ReactNode;
}) {
  return (
    <div>
      <PageIntro
        title="AI clients"
        description="See which AI client applications were observed at the server boundary. This is not a count of users or customers."
        actions={pageControls}
      />
      <DataSourceStrip dataMode={dataMode} hasMyData={hasMyData} view="clients" />
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
  hasMyData,
  pageControls,
  incident,
  onViewTrace,
  onViewChange,
}: {
  analytics: Analytics;
  dataMode: DataMode;
  hasMyData: boolean;
  pageControls: ReactNode;
  incident: AlertIncident | null;
  onViewTrace: (sessionId: string, correlationHandle?: string | null) => void;
  onViewChange: (view: View) => void;
}) {
  return (
    <div>
      <PageIntro
        title="Evidence"
        description="Inspect bounded, redacted records only when the business question needs technical detail."
        actions={pageControls}
      />
      <DataSourceStrip dataMode={dataMode} hasMyData={hasMyData} view="evidence" />
      {incident && (
        <IncidentEvidence incident={incident} onBack={() => onViewChange("issues")} />
      )}
      <Panel
        title="Observed sessions"
        subtitle={
          dataMode === "example"
            ? "Choose an illustrative session to inspect its sample trace and see where a business task succeeded or failed."
            : "Choose a session to open Trace Explorer with bounded, redacted technical evidence."
        }
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
                      {dataMode === "example" ? "View sample trace" : "Open Trace Explorer"}
                    </button>
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
      {dataMode === "example" && (
        <ExampleEvidencePreview onViewTrace={onViewTrace} />
      )}
    </div>
  );
}

function IncidentEvidence({
  incident,
  onBack,
}: {
  incident: AlertIncident;
  onBack: () => void;
}) {
  return (
    <Panel
      title="Incident evidence"
      subtitle="Bounded regression evidence from the workspace alert contract"
      action={{ label: "Back to Issues", onClick: onBack }}
    >
      <div className="grid gap-3 text-xs text-muted sm:grid-cols-2 lg:grid-cols-3">
        <p>
          <span className="font-semibold text-ink">State:</span>{" "}
          {incidentStateLabel(incident.state)}
        </p>
        <p>
          <span className="font-semibold text-ink">Metric:</span>{" "}
          {metricLabel(incident.metric)}
        </p>
        <p>
          <span className="font-semibold text-ink">Severity:</span>{" "}
          {incident.severity || "Not provided"}
        </p>
        <p>
          <span className="font-semibold text-ink">Scope:</span>{" "}
          {incident.scope.tool_name || "All capabilities"}
          {incident.scope.environment
            ? ` · ${incident.scope.environment}`
            : " · all environments"}
        </p>
        <p>
          <span className="font-semibold text-ink">Baseline:</span>{" "}
          {summaryLabel(incident.baseline)}
        </p>
        <p>
          <span className="font-semibold text-ink">Comparison:</span>{" "}
          {summaryLabel(incident.comparison)}
        </p>
        <p>
          <span className="font-semibold text-ink">Threshold:</span>{" "}
          {thresholdLabel(incident.threshold)}
        </p>
        <p>
          <span className="font-semibold text-ink">Data status:</span>{" "}
          {incident.data_status.replaceAll("_", " ")}
        </p>
        <p>
          <span className="font-semibold text-ink">Last seen:</span>{" "}
          {incidentDateLabel(incident.last_seen_at)}
        </p>
      </div>
      {incident.reasons.length > 0 && (
        <p className="mt-4 border border-line bg-paper p-3 text-xs text-muted">
          <span className="font-semibold text-ink">Review notes:</span>{" "}
          {incident.reasons.slice(0, 8).join(", ").replaceAll("_", " ")}.
        </p>
      )}
      <p className="mt-4 text-[11px] text-faint">
        Webhook secrets, raw delivery payloads, private telemetry, and
        unbounded JSON are not displayed. Notification delivery is shown only
        when the incident response provides it.
      </p>
    </Panel>
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
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
        <Panel
          title="Connect the server"
          subtitle="Keep the key in your server environment; never commit it"
          action={{
            label: "Read documentation",
            href: "https://trackmcp.com/docs",
          }}
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
            {copied ? (
              <Check size={13} className="text-brand-strong" aria-hidden="true" />
            ) : (
              <Clipboard size={13} aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy setup"}
          </button>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            Telemetry is fail-open. Payloads remain subject to the existing
            privacy and redaction policy.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            After creating a key, set <code className="font-mono text-ink">TRACKMCP_KEY</code> in your server environment, restart the server, and make one real tool call. Your data appears after the first telemetry flush.
          </p>
        </Panel>
        <Panel
          title="Connection keys"
          subtitle="Full secrets are shown only at creation"
        >
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
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
      <section
        className="mt-6 border border-line bg-white p-5 sm:p-6"
        aria-labelledby="setup-data-flow"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper text-muted">
            <Info size={17} />
          </span>
          <div className="min-w-0">
            <h2 id="setup-data-flow" className="text-[15px] font-semibold text-ink">
              Know what you are sharing
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              TrackMCP receives bounded telemetry to explain how your MCP is
              used, where work succeeds, and where it needs attention.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="border border-line bg-paper p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-faint">
              How it flows
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Your server SDK observes events, redacts and bounds them locally,
              then sends telemetry over HTTPS to TrackMCP.
            </p>
          </div>
          <div className="border border-line bg-paper p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-faint">
              What we can show
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Clients, sessions, tool names, timing, status, errors, correlation,
              and explicit workflow outcomes. Payload fields are bounded and
              redacted.
            </p>
          </div>
          <div className="border border-line bg-paper p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-faint">
              What is protected
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Recognized passwords, tokens, emails, credential text, and private
              keys are redacted locally. We do not request source code,
              repositories, or files. Use Metadata mode to omit tool arguments
              and results entirely.
            </p>
          </div>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-faint">
          No proxying or tool execution is involved. You can revoke the key at
          any time; your server controls which optional context it reports.
          Never put secrets in custom telemetry fields.
        </p>
      </section>
    </div>
  );
}

// Kept as an inert compatibility artifact for old worktree references; no route renders it.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
                {newKey}
              </code>
              <button
                type="button"
                onClick={() => void copy()}
                className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-brand-strong"
              >
                {copied ? (
                  <Check size={13} className="text-brand-strong" aria-hidden="true" />
                ) : (
                  <Clipboard size={13} aria-hidden="true" />
                )}
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!timeline.length)
    return (
      <div className="grid h-[250px] place-items-center text-sm text-muted">
        No activity in the selected period.
      </div>
    );
  const width = Math.max(820, 48 * timeline.length + 60),
    height = 320,
    left = 48,
    right = 24,
    top = 24,
    bottom = 84,
    plotWidth = width - left - right,
    plotHeight = height - top - bottom;
  const max = Math.max(1, ...timeline.map((day) => day.calls));
  const bandWidth = plotWidth / timeline.length;
  const barWidth = Math.max(16, Math.min(30, bandWidth - 12));
  const x = (index: number) =>
    left + index * bandWidth + (bandWidth - barWidth) / 2;
  const y = (value: number) => top + plotHeight - (value / max) * plotHeight;
  const dateLabel = (value: string) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isNaN(parsed.getTime())
      ? value
      : parsed.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        });
  };
  const hoveredDay = hoveredIndex === null ? null : timeline[hoveredIndex];
  const tooltipWidth = 176;
  const tooltipHeight = 82;
  const tooltipX =
    hoveredIndex === null
      ? 0
      : Math.max(
          left,
          Math.min(
            x(hoveredIndex) + barWidth / 2 - tooltipWidth / 2,
            width - right - tooltipWidth,
          ),
        );
  const tooltipY =
    hoveredIndex === null
      ? 0
      : Math.max(8, y(timeline[hoveredIndex].calls) - tooltipHeight - 12);
  return (
    <div className="mt-5 overflow-x-auto pb-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="min-w-[820px]"
        role="img"
        aria-label="Observed tool calls per day over the selected period. Hover or focus a bar for events, calls, and errors."
      >
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const value = Math.round(max * fraction);
          const lineY = y(value);
          return (
            <g key={fraction}>
              <line
                x1={left}
                y1={lineY}
                x2={width - right}
                y2={lineY}
                stroke={fraction === 0 ? "#cbd6cf" : "#edf1ee"}
              />
              <text
                x={left - 9}
                y={lineY + 4}
                textAnchor="end"
                fontSize="10"
                fill="#8b958f"
              >
                {value}
              </text>
            </g>
          );
        })}
        <line
          x1={left}
          y1={height - bottom}
          x2={width - right}
          y2={height - bottom}
          stroke="#dfe6e1"
        />
        {timeline.map((day, index) => (
          <rect
            key={day.date}
            x={x(index)}
            y={y(day.calls)}
            width={barWidth}
            height={Math.max(1, height - bottom - y(day.calls))}
            rx="3"
            fill={hoveredIndex === index ? "#0c7657" : "#159b73"}
            tabIndex={0}
            role="img"
            aria-label={`${dateLabel(day.date)}: ${day.events} events, ${day.calls} calls, ${day.errors} errors`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onFocus={() => setHoveredIndex(index)}
            onBlur={() => setHoveredIndex(null)}
          />
        ))}
        {timeline.map((day, index) => (
          <text
            key={day.date + "-label"}
            x={x(index) + barWidth / 2}
            y={height - bottom + 18}
            textAnchor="end"
            fontSize="10"
            fill="#64706a"
            transform={`rotate(-45 ${x(index) + barWidth / 2} ${height - bottom + 18})`}
          >
            {dateLabel(day.date)}
          </text>
        ))}
        <text x={left} y={14} fontSize="11" fill="#64706a">
          Daily tool calls
        </text>
        {hoveredDay && hoveredIndex !== null && (
          <g pointerEvents="none">
            <rect
              x={tooltipX}
              y={tooltipY}
              width={tooltipWidth}
              height={tooltipHeight}
              rx="6"
              fill="#101713"
              opacity="0.97"
            />
            <text x={tooltipX + 12} y={tooltipY + 19} fontSize="11" fontWeight="600" fill="#ffffff">
              {dateLabel(hoveredDay.date)}
            </text>
            <text x={tooltipX + 12} y={tooltipY + 38} fontSize="10" fill="#d7e5db">
              Events: {fmt(hoveredDay.events)}
            </text>
            <text x={tooltipX + 12} y={tooltipY + 54} fontSize="10" fill="#d7e5db">
              Calls: {fmt(hoveredDay.calls)}
            </text>
            <text x={tooltipX + 12} y={tooltipY + 70} fontSize="10" fill="#f2c4a8">
              Errors: {fmt(hoveredDay.errors)}
            </text>
          </g>
        )}
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
