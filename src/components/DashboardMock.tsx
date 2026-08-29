"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  LayoutGrid,
  Wrench,
  Activity,
  Workflow,
  Users,
  Target,
  Settings,
  Search,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Server,
  Check,
  TriangleAlert,
} from "lucide-react";
import { TrackMCPAppIcon } from "./TrackMCPAppIcon";

/* ─────────────────────────── data ─────────────────────────── */

const NAV = [
  { key: "overview", label: "Overview", icon: LayoutGrid, tile: "bg-slate-100 text-slate-600" },
  { key: "tools", label: "Tools", icon: Wrench, tile: "bg-violet-100 text-violet-600" },
  { key: "sessions", label: "Sessions", icon: Activity, tile: "bg-sky-100 text-sky-600" },
  { key: "workflows", label: "Workflows", icon: Workflow, tile: "bg-brand-soft text-brand-strong" },
  { key: "clients", label: "Clients", icon: Users, tile: "bg-amber-100 text-amber-600" },
  { key: "outcomes", label: "Outcomes", icon: Target, tile: "bg-teal-100 text-teal-600" },
  { key: "reliability", label: "Reliability", icon: TriangleAlert, tile: "bg-rose-100 text-rose-600" },
] as const;
type View = (typeof NAV)[number]["key"];

const RANGES = {
  "24h": {
    label: "Last 24 hours",
    prev: "yesterday",
    mult: 0.16,
    points: [180, 150, 240, 210, 300, 280, 360, 330, 420],
    x: ["00:00", "06:00", "12:00", "18:00", "now"],
  },
  "7d": {
    label: "Last 7 days",
    prev: "last week",
    mult: 1,
    points: [3120, 4210, 3680, 5020, 4460, 6010, 7020],
    x: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  "30d": {
    label: "Last 30 days",
    prev: "last month",
    mult: 4.2,
    points: [18200, 22400, 20100, 24600, 26800],
    x: ["May 1", "May 8", "May 15", "May 22", "May 29"],
  },
} as const;
type RangeKey = keyof typeof RANGES;

const ENVS = ["Production", "Staging"] as const;
type Env = (typeof ENVS)[number];

const TOOLS = [
  { name: "search_docs", calls: 14208, success: 99.8, latency: 96, status: "healthy" },
  { name: "create_issue", calls: 9841, success: 98.9, latency: 210, status: "healthy" },
  { name: "run_query", calls: 6502, success: 96.6, latency: 340, status: "slow" },
  { name: "get_user", calls: 4120, success: 99.6, latency: 88, status: "healthy" },
  { name: "list_repos", calls: 2918, success: 99.1, latency: 124, status: "healthy" },
  { name: "send_email", calls: 412, success: 6.0, latency: 1240, status: "failing" },
  { name: "deploy_service", calls: 0, success: 0, latency: 0, status: "unused" },
  { name: "get_customer", calls: 0, success: 0, latency: 0, status: "unused" },
] as const;

const STATUS: Record<string, { label: string; text: string; dot: string }> = {
  healthy: { label: "Healthy", text: "text-muted", dot: "bg-ink/25" },
  slow: { label: "Slow", text: "text-amber-600", dot: "bg-amber-400" },
  failing: { label: "Failing", text: "text-amber-600", dot: "bg-amber-400" },
  unused: { label: "Unused", text: "text-faint", dot: "bg-line-strong" },
};

const CLIENTS = [
  { name: "Claude", share: 46, calls: 17528, delta: 12 },
  { name: "Cursor", share: 31, calls: 11812, delta: 28 },
  { name: "ChatGPT", share: 18, calls: 6859, delta: 9 },
  { name: "Custom agent", share: 5, calls: 1905, delta: 3 },
] as const;

const FUNNEL = [
  { step: "Connected", sub: "initialize", value: 1284 },
  { step: "Discovered tools", sub: "tools/list", value: 1190 },
  { step: "Called a tool", sub: "tools/call", value: 1042 },
  { step: "Finished with no error", sub: "success", value: 968 },
] as const;

const SESSIONS = [
  { client: "Claude", calls: 12, dur: "3m 52s", ok: true },
  { client: "Cursor", calls: 3, dur: "41s", ok: false },
  { client: "ChatGPT", calls: 5, dur: "1m 06s", ok: true },
  { client: "Claude", calls: 8, dur: "2m 14s", ok: true },
  { client: "Custom agent", calls: 2, dur: "18s", ok: false },
  { client: "Cursor", calls: 6, dur: "1m 33s", ok: true },
] as const;

const INSIGHTS = [
  {
    level: "error",
    title: "send_email is failing 94% of calls",
    detail:
      "The schema expects `to` as an array, but most agents send a plain string. Agents retry twice, then give up.",
    impact: "~2,100 calls lost this week",
    action: "See the fix",
  },
  {
    level: "warn",
    title: "run_query is your slowest tool",
    detail: "Median 340ms, p95 1.2s. Sessions that hit it are 3x more likely to stall.",
    impact: "12% of sessions slow here",
    action: "Investigate",
  },
  {
    level: "info",
    title: "2 tools are never called",
    detail: "deploy_service and get_customer got zero calls in 30 days. Remove them or rewrite their descriptions.",
    impact: "Dead code and schema clutter",
    action: "Review",
  },
] as const;

const nfmt = (n: number) => n.toLocaleString();

/* ─────────────────────────── helpers ─────────────────────────── */

function AreaChart({ points, labels, heightClass = "h-40" }: { points: readonly number[]; labels: readonly string[]; heightClass?: string }) {
  const w = 640;
  const h = 180;
  const max = Math.max(...points) * 1.18;
  const stepX = w / (points.length - 1);
  const xy = points.map((p, i) => [i * stepX, h - (p / max) * h] as const);
  const line = xy.map((c, i) => `${i ? "L" : "M"}${c[0].toFixed(1)} ${c[1].toFixed(1)}`).join(" ");
  const area = `${line} L ${w} ${h} L 0 ${h} Z`;
  const last = xy[xy.length - 1];
  return (
    <div>
      <div className="relative">
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={`${heightClass} w-full`} aria-hidden>
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1={0} x2={w} y1={h * g} y2={h * g} stroke="var(--color-line)" strokeWidth={1} />
          ))}
          <motion.path
            d={area}
            fill="var(--color-ink)"
            fillOpacity={0.05}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          />
          <motion.path
            d={line}
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <span
          className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink ring-2 ring-white"
          style={{ left: `${(last[0] / w) * 100}%`, top: `${(last[1] / h) * 100}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-faint">
        {labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  good,
  arrow,
  prev,
}: {
  label: string;
  value: string;
  delta: string;
  good: boolean;
  arrow: "up" | "down";
  prev: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-faint">{label}</div>
      <div className="mt-2 text-[24px] font-semibold leading-none text-ink">{value}</div>
      <div
        className={`mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium ${
          good ? "text-mint-ink" : "text-amber-600"
        }`}
      >
        {arrow === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {delta}
        <span className="ml-1 font-normal text-faint">vs {prev}</span>
      </div>
    </div>
  );
}

function Sparkline({ points, tone = "ink" }: { points: number[]; tone?: "ink" | "brand" }) {
  const w = 100;
  const h = 26;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const rng = max - min || 1;
  const stepX = w / (points.length - 1);
  const xy = points.map((p, i) => [i * stepX, h - ((p - min) / rng) * (h - 5) - 3] as const);
  const line = xy.map((c, i) => `${i ? "L" : "M"}${c[0].toFixed(1)} ${c[1].toFixed(1)}`).join(" ");
  const area = `${line} L ${w} ${h} L 0 ${h} Z`;
  const stroke = tone === "brand" ? "var(--color-brand)" : "var(--color-ink)";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-6 w-full" aria-hidden>
      <path d={area} fill={stroke} fillOpacity={0.08} />
      <path d={line} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function KpiCard({ label, value, delta, spark, tone = "ink" }: { label: string; value: string; delta: string; spark: number[]; tone?: "ink" | "brand" }) {
  return (
    <div className="rounded-xl border border-line bg-white p-3 transition-colors hover:border-line-strong">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[10.5px] font-medium uppercase tracking-wide text-faint">{label}</span>
        <span className="inline-flex shrink-0 items-center gap-0.5 text-[10.5px] font-medium text-mint-ink">
          <ArrowUpRight size={11} />
          {delta}
        </span>
      </div>
      <div className="mt-1.5 text-[24px] font-semibold leading-none text-ink">{value}</div>
      <div className="mt-2">
        <Sparkline points={spark} tone={tone} />
      </div>
    </div>
  );
}

function MiniBar({ label, value, pct, tone = "ink" }: { label: string; value: string; pct: number; tone?: "ink" | "brand" }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-24 shrink-0 truncate text-[12px] text-body">{label}</span>
      <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-mist">
        <motion.span
          className={`absolute inset-y-0 left-0 rounded-full ${tone === "brand" ? "bg-brand" : "bg-ink"}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
      </span>
      <span className="w-11 shrink-0 text-right font-mono text-[11px] text-muted">{value}</span>
    </div>
  );
}

function Dropdown({
  display,
  items,
  current,
  onSelect,
  open,
  onToggle,
  demo,
}: {
  display: string;
  items: readonly { key: string; label: string }[];
  current: string;
  onSelect: (key: string) => void;
  open: boolean;
  onToggle: () => void;
  demo?: string;
}) {
  return (
    <div className="relative">
      <button
        data-demo={demo}
        onClick={onToggle}
        className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12px] font-medium text-body transition-colors hover:border-line-strong"
      >
        {display} <ChevronDown size={12} className="text-faint" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1.5 min-w-[160px] rounded-lg border border-line bg-white p-1 shadow-[0_16px_40px_-16px_rgba(10,10,10,0.3)]">
          {items.map((it) => (
            <button
              key={it.key}
              data-demo={`opt-${it.key}`}
              onClick={() => onSelect(it.key)}
              className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[12.5px] text-body transition-colors hover:bg-mist"
            >
              {it.label}
              {it.key === current && <Check size={13} className="text-brand" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── component ─────────────────────────── */

export function DashboardMock() {
  const [view, setView] = useState<View>("overview");
  const [range, setRange] = useState<RangeKey>("7d");
  const [env, setEnv] = useState<Env>("Production");
  const [menu, setMenu] = useState<null | "range" | "env">(null);
  const [selectedTool, setSelectedTool] = useState("send_email");
  const [toolFilter, setToolFilter] = useState<"all" | "attention" | "unused">("all");

  const r = RANGES[range];
  const em = env === "Staging" ? 0.08 : 1;

  const kpis = useMemo(
    () => ({
      calls: Math.round(38104 * r.mult * em),
      sessions: Math.round(1284 * r.mult * em),
      success: env === "Staging" ? 95.2 : 97.6,
      latency: env === "Staging" ? 168 : 142,
      clients: env === "Staging" ? 2 : 4,
      connections: Math.round(1284 * r.mult * em),
      completed: Math.round(968 * r.mult * em),
      completion: env === "Staging" ? 71 : 75,
    }),
    [r, em, env]
  );

  const chartPoints = useMemo(() => r.points.map((p) => Math.round(p * em)), [r, em]);

  const viewLabel = NAV.find((n) => n.key === view)!.label;
  const closeMenu = () => setMenu(null);

  const filteredTools = TOOLS.filter((t) =>
    toolFilter === "all" ? true : toolFilter === "unused" ? t.status === "unused" : t.status !== "healthy"
  );
  const active = TOOLS.find((t) => t.name === selectedTool) ?? TOOLS[0];
  const primary = INSIGHTS[0];

  /* Calm auto-demo: cycle tabs every few seconds so the dashboard feels live.
     Pauses on hover, stops once the visitor takes control, and stays still
     when the visitor prefers reduced motion. */
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [locked, setLocked] = useState(false);
  const [visible, setVisible] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [clicking, setClicking] = useState(false);

  // Only run the demo while on screen — avoids offscreen repaints that would
  // jank other animations further down the page.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const demoActive = !reduce && !paused && !locked && visible;

  /* Guided auto-demo: the pointer walks a real path across the whole product —
     switching tabs on the left, opening the date range up top, and clicking a
     row inside a table — like a person actually exploring. Each target is found
     live by a data-demo selector so it works with whatever is on screen. Stops
     the moment the visitor hovers or takes control. */
  useEffect(() => {
    if (!demoActive) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (fn: () => void, ms: number) => {
      const t = setTimeout(() => !cancelled && fn(), ms);
      timers.push(t);
    };

    const steps: { sel: string; run: () => void; dwell: number }[] = [
      // 1. Land on Overview
      { sel: '[data-demo="nav-overview"]', run: () => setView("overview"), dwell: 2200 },
      // 2. Click "View all" on Top tools → jump into the Tools page
      { sel: '[data-demo="view-all-tools"]', run: () => setView("tools"), dwell: 1900 },
      // 3. Filter to Needs attention
      { sel: '[data-demo="filter-attention"]', run: () => setToolFilter("attention"), dwell: 1700 },
      // 4. Filter to Unused
      { sel: '[data-demo="filter-unused"]', run: () => setToolFilter("unused"), dwell: 1700 },
      // 5. Quick tap on Inspect calls
      { sel: '[data-demo="inspect"]', run: () => setToolFilter("all"), dwell: 1500 },
      // 6. Peek at Sessions
      { sel: '[data-demo="nav-sessions"]', run: () => setView("sessions"), dwell: 2200 },
      // 7. Move to Workflows
      { sel: '[data-demo="nav-workflows"]', run: () => setView("workflows"), dwell: 2200 },
      // 8. Toggle the date range to Last 24 hours, read the data
      { sel: '[data-demo="range"]', run: () => setMenu("range"), dwell: 900 },
      { sel: '[data-demo="opt-24h"]', run: () => { setRange("24h"); setMenu(null); }, dwell: 2400 },
      // 9. Client Outcomes, then Reliability
      { sel: '[data-demo="nav-outcomes"]', run: () => setView("outcomes"), dwell: 2200 },
      { sel: '[data-demo="nav-reliability"]', run: () => setView("reliability"), dwell: 2600 },
    ];

    const runStep = (idx: number) => {
      if (cancelled) return;
      const step = steps[idx];
      const root = rootRef.current;
      const el = root?.querySelector<HTMLElement>(step.sel) ?? null;
      if (el && root) {
        const er = el.getBoundingClientRect();
        const rr = root.getBoundingClientRect();
        setCursor({
          x: er.left - rr.left + er.width / 2,
          y: er.top - rr.top + er.height / 2,
        });
      }
      wait(() => {
        if (el) {
          setClicking(true);
          wait(() => setClicking(false), 200);
          step.run();
        }
        wait(() => runStep((idx + 1) % steps.length), step.dwell);
      }, 620);
    };

    wait(() => runStep(0), 700);
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [demoActive]);

  const pickView = (v: View) => {
    setLocked(true);
    setView(v);
  };

  return (
    <div
      ref={rootRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_40px_120px_-40px_rgba(10,10,10,0.28)]"
    >
      {/* browser chrome */}
      <div className="flex items-center gap-3 border-b border-line bg-paper px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        </div>
        <div className="mx-auto flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-1 font-mono text-[11px] text-faint">
          <Server size={11} /> app.trackmcp.com/{view}
        </div>
      </div>

      <div className="flex h-auto lg:h-[620px]">
        {/* ── sidebar ── */}
        <aside className="hidden w-56 shrink-0 flex-col border-r border-line bg-paper lg:flex">
          <div className="flex items-center gap-2.5 border-b border-line px-4 py-3.5">
            <TrackMCPAppIcon size={24} />
            <span className="font-display text-[15px] font-medium lowercase tracking-[-0.045em]">
              <span className="text-ink">track</span>
              <span className="text-brand">mcp</span>
            </span>
          </div>

          <button className="mx-3 mt-3 flex items-center justify-between rounded-lg border border-line bg-white px-2.5 py-2 text-left transition-colors hover:border-line-strong">
            <span className="flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded bg-ink text-[10px] font-bold text-white">A</span>
              <span className="text-[12.5px] font-medium text-body">acme-corp</span>
            </span>
            <ChevronDown size={13} className="text-faint" />
          </button>

          <nav className="mt-4 flex flex-col gap-0.5 px-3">
            <span className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-faint">
              Analytics
            </span>
            {NAV.map((n) => (
              <NavItem
                key={n.key}
                demo={`nav-${n.key}`}
                label={n.label}
                icon={n.icon}
                tile={n.tile}
                active={view === n.key}
                onClick={() => pickView(n.key)}
              />
            ))}
          </nav>

          <div className="mt-auto border-t border-line p-3">
            <button className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-mist">
              <span className="h-7 w-7 shrink-0 overflow-hidden rounded-full">
                <svg viewBox="0 0 64 64" className="h-full w-full" role="img" aria-label="Krishna Goyal">
                  <rect width="64" height="64" rx="32" fill="#16a34a" />
                  <circle cx="32" cy="26" r="10" fill="#ffffff" />
                  <path d="M16 52a16 16 0 0 1 32 0z" fill="#ffffff" />
                </svg>
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-[12.5px] font-medium text-body">Krishna Goyal</span>
                <span className="block truncate text-[11px] text-faint">Owner</span>
              </span>
              <Settings size={14} className="text-faint" />
            </button>
          </div>
        </aside>

        {/* ── main ── */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          {menu && (
            <button
              aria-hidden
              tabIndex={-1}
              className="fixed inset-0 z-10 cursor-default"
              onClick={closeMenu}
            />
          )}

          {/* topbar */}
          <div className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-ink">{viewLabel}</h3>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-2 py-0.5 text-[10.5px] font-medium text-mint-ink">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-mint-ink" /> Live
              </span>
            </div>
            <div className="relative z-20 ml-auto flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-lg border border-line bg-paper px-2.5 py-1.5 md:flex">
                <Search size={13} className="text-faint" />
                <span className="text-[12px] text-faint">Search</span>
                <span className="rounded border border-line bg-white px-1 font-mono text-[10px] text-faint">⌘K</span>
              </div>
              <Dropdown
                demo="range"
                display={r.label}
                current={range}
                items={[
                  { key: "24h", label: "Last 24 hours" },
                  { key: "7d", label: "Last 7 days" },
                  { key: "30d", label: "Last 30 days" },
                ]}
                open={menu === "range"}
                onToggle={() => setMenu(menu === "range" ? null : "range")}
                onSelect={(k) => {
                  setRange(k as RangeKey);
                  closeMenu();
                }}
              />
              <div className="hidden sm:block">
                <Dropdown
                  display={env}
                  current={env}
                  items={ENVS.map((e) => ({ key: e, label: e }))}
                  open={menu === "env"}
                  onToggle={() => setMenu(menu === "env" ? null : "env")}
                  onSelect={(k) => {
                    setEnv(k as Env);
                    closeMenu();
                  }}
                />
              </div>
            </div>
          </div>

          {/* body — fixed frame on desktop, fits every tab with no scroll */}
          <div className="min-h-0 flex-1 overflow-hidden p-4 sm:p-5">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.4, ease: "easeOut" }}
              className="flex flex-col gap-3"
            >
            {view === "overview" && (
              <>
                <button className="flex w-full items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-left transition-colors hover:border-amber-300">
                  <TriangleAlert size={14} className="shrink-0 text-amber-600" />
                  <span className="truncate text-[12px] leading-snug text-amber-900">
                    <span className="font-semibold">send_email needs attention</span>
                    <span className="hidden text-amber-800 sm:inline">, failing 94% of calls this week</span>
                  </span>
                  <span className="ml-auto flex shrink-0 items-center gap-1 text-[11.5px] font-medium text-amber-700">
                    See the fix <ArrowUpRight size={12} />
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                  <KpiCard label="Active clients" value={`${kpis.clients}`} delta="+1" tone="brand" spark={[2, 2, 3, 3, 3, 4, 4]} />
                  <KpiCard label="New connections" value={nfmt(kpis.connections)} delta="+18%" spark={[210, 260, 240, 300, 330, 360, 420]} />
                  <KpiCard label="Completed" value={nfmt(kpis.completed)} delta="+24%" tone="brand" spark={[520, 560, 610, 640, 720, 810, 968]} />
                  <KpiCard label="Completion rate" value={`${kpis.completion}%`} delta="+3.1pt" spark={[68, 70, 69, 72, 73, 74, 75]} />
                </div>

                <div className="grid gap-2.5 lg:grid-cols-[1.7fr_1fr]">
                  <div className="rounded-xl border border-line p-3.5">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <div className="text-[12.5px] font-semibold text-ink">Completed workflows</div>
                        <div className="font-mono text-[10.5px] text-faint">
                          {nfmt(kpis.completed)} · {r.label.toLowerCase()}
                        </div>
                      </div>
                      <div className="hidden items-center gap-3 text-[10.5px] text-muted sm:flex">
                        <span className="flex items-center gap-1.5"><span className="h-1.5 w-3 rounded-full bg-ink" /> This period</span>
                        <span className="flex items-center gap-1.5"><span className="h-1.5 w-3 rounded-full bg-line-strong" /> Previous</span>
                      </div>
                    </div>
                    <AreaChart key={`${range}-${env}`} points={chartPoints} labels={r.x} heightClass="h-28" />
                  </div>

                  <div className="rounded-xl border border-line p-3.5">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[12.5px] font-semibold text-ink">Traffic by client</span>
                      <button onClick={() => pickView("clients")} className="text-[11px] font-medium text-brand">
                        View all
                      </button>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {CLIENTS.map((c, i) => (
                        <MiniBar key={c.name} label={c.name} value={`${c.share}%`} pct={c.share} tone={i === 0 ? "brand" : "ink"} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-line">
                  <div className="flex items-center justify-between border-b border-line bg-paper px-3.5 py-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-faint">Top tools</span>
                    <button data-demo="view-all-tools" onClick={() => pickView("tools")} className="text-[11px] font-medium text-brand">
                      View all
                    </button>
                  </div>
                  <div className="grid grid-cols-[1.6fr_0.8fr_1.1fr_0.8fr] gap-2 border-b border-line px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-faint">
                    <span>Tool</span>
                    <span className="text-right">Calls</span>
                    <span>Adoption</span>
                    <span className="text-right">Status</span>
                  </div>
                  {TOOLS.filter((t) => t.calls > 0)
                    .slice(0, 4)
                    .map((t) => {
                      const s = STATUS[t.status];
                      const adopt = Math.round((t.calls / 14208) * 100);
                      return (
                        <div
                          key={t.name}
                          className="grid grid-cols-[1.6fr_0.8fr_1.1fr_0.8fr] items-center gap-2 border-b border-line px-3.5 py-[7px] last:border-0"
                        >
                          <span className="flex items-center gap-2 truncate font-mono text-[11.5px] text-body">
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
                            {t.name}
                          </span>
                          <span className="text-right font-mono text-[11.5px] text-body">{nfmt(t.calls)}</span>
                          <span className="relative h-1.5 overflow-hidden rounded-full bg-mist">
                            <span className="absolute inset-y-0 left-0 rounded-full bg-ink" style={{ width: `${adopt}%` }} />
                          </span>
                          <span className={`text-right text-[11.5px] font-medium ${s.text}`}>{s.label}</span>
                        </div>
                      );
                    })}
                </div>
              </>
            )}

            {view === "tools" && (
              <>
                <div className="flex items-center gap-1.5">
                  {(
                    [
                      { key: "all", label: "All tools" },
                      { key: "attention", label: "Needs attention" },
                      { key: "unused", label: "Unused" },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.key}
                      data-demo={`filter-${f.key}`}
                      onClick={() => setToolFilter(f.key)}
                      className={`rounded-lg border px-2.5 py-1 text-[12px] font-medium transition-colors ${
                        toolFilter === f.key
                          ? "border-ink bg-ink text-white"
                          : "border-line bg-white text-muted hover:border-line-strong"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="overflow-hidden rounded-xl border border-line">
                  <div className="grid grid-cols-[1.6fr_0.8fr_0.9fr_0.9fr_0.9fr] gap-2 border-b border-line bg-paper px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-faint">
                    <span>Tool</span>
                    <span className="text-right">Calls</span>
                    <span className="text-right">Success</span>
                    <span className="text-right">Latency</span>
                    <span className="text-right">Status</span>
                  </div>
                  {filteredTools.map((t) => {
                    const s = STATUS[t.status];
                    return (
                      <button
                        key={t.name}
                        data-demo={`tool-${t.name}`}
                        onClick={() => setSelectedTool(t.name)}
                        className={`grid w-full grid-cols-[1.6fr_0.8fr_0.9fr_0.9fr_0.9fr] items-center gap-2 border-b border-line px-4 py-2 text-left transition-colors last:border-0 ${
                          selectedTool === t.name ? "bg-brand-soft/50" : "hover:bg-mist"
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate font-mono text-[12px] text-body">
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
                          {t.name}
                        </span>
                        <span className="text-right font-mono text-[12px] text-body">{t.calls ? nfmt(t.calls) : "--"}</span>
                        <span className="text-right font-mono text-[12px] text-muted">{t.calls ? `${t.success}%` : "--"}</span>
                        <span className="text-right font-mono text-[12px] text-muted">{t.calls ? `${t.latency}ms` : "--"}</span>
                        <span className={`text-right text-[12px] font-medium ${s.text}`}>{s.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-xl border border-line bg-paper p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] font-semibold text-ink">{active.name}</span>
                    <span className={`text-[11px] font-medium ${STATUS[active.status].text}`}>{STATUS[active.status].label}</span>
                    <button data-demo="inspect" className="ml-auto flex items-center gap-1 text-[12px] font-medium text-brand">
                      Inspect calls <ArrowUpRight size={12} />
                    </button>
                  </div>
                  {active.status === "failing" ? (
                    <p className="mt-2 text-[12.5px] leading-relaxed text-body">{primary.detail}</p>
                  ) : active.calls === 0 ? (
                    <p className="mt-2 text-[12.5px] leading-relaxed text-body">
                      No calls in {r.label.toLowerCase()}. Consider removing this tool or rewriting its description so
                      agents know when to reach for it.
                    </p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11.5px] text-muted">
                      <span>{nfmt(active.calls)} calls</span>
                      <span>{active.success}% success</span>
                      <span>{active.latency}ms median</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {view === "sessions" && (
              <>
                <div className="rounded-xl border border-line p-4">
                  <div className="mb-4 text-[13px] font-semibold text-ink">Session funnel</div>
                  <div className="flex flex-col gap-3">
                    {FUNNEL.map((f, i) => {
                      const pct = (f.value / FUNNEL[0].value) * 100;
                      const drop = i === 0 ? 0 : Math.round((1 - f.value / FUNNEL[i - 1].value) * 100);
                      return (
                        <div key={f.step} className="flex items-center gap-3">
                          <span className="w-40 shrink-0">
                            <span className="block text-[12.5px] text-body">{f.step}</span>
                            <span className="block font-mono text-[10.5px] text-faint">{f.sub}</span>
                          </span>
                          <span className="relative h-6 flex-1 overflow-hidden rounded-md bg-mist">
                            <motion.span
                              className={`absolute inset-y-0 left-0 rounded-md ${
                                i === FUNNEL.length - 1 ? "bg-brand" : "bg-ink"
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                            />
                          </span>
                          <span className="w-24 shrink-0 text-right">
                            <span className="font-mono text-[12px] text-body">{nfmt(f.value)}</span>
                            {drop > 0 && <span className="ml-1.5 font-mono text-[11px] text-amber-600">-{drop}%</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-line">
                  <div className="border-b border-line bg-paper px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-faint">
                    Recent sessions
                  </div>
                  {SESSIONS.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 border-b border-line px-4 py-2 text-[12.5px] last:border-0"
                    >
                      <span className="h-6 w-6 shrink-0 rounded-full bg-mist" />
                      <span className="text-body">{s.client}</span>
                      <span className="font-mono text-faint">{s.calls} calls</span>
                      <span className="font-mono text-faint">{s.dur}</span>
                      <span
                        className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          s.ok ? "bg-mint text-mint-ink" : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {s.ok ? "Completed" : "Failed"}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {view === "workflows" && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <StatCard label="Workflows" value="6" delta="+2" good arrow="up" prev={r.prev} />
                  <StatCard label="Completion rate" value="75%" delta="+3.1pt" good arrow="up" prev={r.prev} />
                  <StatCard label="Avg steps" value="3.2" delta="+0.2" good arrow="up" prev={r.prev} />
                </div>

                <div className="overflow-hidden rounded-xl border border-line">
                  <div className="flex items-center justify-between border-b border-line bg-paper px-4 py-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-faint">Top workflows</span>
                    <span className="font-mono text-[10.5px] text-faint">Last 7 days</span>
                  </div>
                  {[
                    { steps: ["search_docs", "run_query", "create_issue"], count: 412, rate: 82, ok: true },
                    { steps: ["get_user", "run_query", "create_issue"], count: 96, rate: 78, ok: true },
                    { steps: ["search_docs", "send_email"], count: 168, rate: 41, ok: false },
                  ].map((wf, idx) => (
                    <div key={idx} className="border-b border-line px-4 py-2.5 last:border-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5 font-mono text-[11.5px] text-body">
                          {wf.steps.map((s, i) => (
                            <span key={s} className="flex items-center gap-1.5">
                              {i > 0 && <span className="text-faint">→</span>}
                              <span className="rounded border border-line bg-paper px-1.5 py-0.5">{s}</span>
                            </span>
                          ))}
                          <span className="text-faint">→</span>
                          <span
                            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${
                              wf.ok ? "bg-brand text-white" : "border border-amber-300 bg-amber-50 text-amber-700"
                            }`}
                          >
                            {wf.ok ? <Check size={11} /> : <TriangleAlert size={11} />}
                            {wf.ok ? "Completed" : "Stops"}
                          </span>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            wf.ok ? "bg-mint text-mint-ink" : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {wf.rate}% done
                        </span>
                      </div>
                      <div className="mt-1.5 font-mono text-[10.5px] text-faint">{wf.count} sessions</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {view === "clients" && (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <StatCard label="Active clients" value="4" delta="+1" good arrow="up" prev={r.prev} />
                  <StatCard label="Tool calls" value={nfmt(kpis.calls)} delta="+32%" good arrow="up" prev={r.prev} />
                  <StatCard label="New this period" value="Custom" delta="1 client" good arrow="up" prev={r.prev} />
                  <StatCard label="Top client" value="Claude" delta="46% share" good arrow="up" prev={r.prev} />
                </div>
                <div className="overflow-hidden rounded-xl border border-line">
                  <div className="grid grid-cols-[1.4fr_1.6fr_0.8fr_0.8fr] gap-2 border-b border-line bg-paper px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-faint">
                    <span>Client</span>
                    <span>Share of calls</span>
                    <span className="text-right">Calls</span>
                    <span className="text-right">Growth</span>
                  </div>
                  {CLIENTS.map((c, i) => (
                    <div
                      key={c.name}
                      className="grid grid-cols-[1.4fr_1.6fr_0.8fr_0.8fr] items-center gap-2 border-b border-line px-4 py-3 last:border-0"
                    >
                      <span className="text-[12.5px] font-medium text-body">{c.name}</span>
                      <span className="flex items-center gap-2">
                        <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-mist">
                          <motion.span
                            className={`absolute inset-y-0 left-0 rounded-full ${i === 0 ? "bg-brand" : "bg-ink"}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${c.share}%` }}
                            transition={{ duration: 0.7, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </span>
                        <span className="w-8 shrink-0 text-right font-mono text-[11px] text-faint">{c.share}%</span>
                      </span>
                      <span className="text-right font-mono text-[12px] text-body">{nfmt(c.calls)}</span>
                      <span className="flex items-center justify-end gap-0.5 text-right text-[12px] font-medium text-mint-ink">
                        <ArrowUpRight size={12} />
                        {c.delta}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {view === "outcomes" && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <StatCard label="Completion rate" value={`${kpis.completion}%`} delta="+3.1pt" good arrow="up" prev={r.prev} />
                  <StatCard label="Returning clients" value="62%" delta="+4pt" good arrow="up" prev={r.prev} />
                  <StatCard label="Completed workflows" value={nfmt(kpis.completed)} delta="+24%" good arrow="up" prev={r.prev} />
                </div>

                <div className="rounded-xl border border-line p-4">
                  <div className="mb-3 text-[13px] font-semibold text-ink">Sessions to result</div>
                  <div className="flex flex-col gap-3">
                    {[
                      { step: "Sessions started", value: 1284, pct: 100, brand: false },
                      { step: "Reached a tool", value: 1042, pct: 81, brand: false },
                      { step: "Completed a workflow", value: 968, pct: 75, brand: true },
                    ].map((f) => (
                      <div key={f.step} className="flex items-center gap-3">
                        <span className="w-40 shrink-0 text-[12.5px] text-body">{f.step}</span>
                        <span className="relative h-6 flex-1 overflow-hidden rounded-md bg-mist">
                          <span
                            className={`absolute inset-y-0 left-0 rounded-md ${f.brand ? "bg-brand" : "bg-ink"}`}
                            style={{ width: `${f.pct}%` }}
                          />
                        </span>
                        <span className="w-14 shrink-0 text-right font-mono text-[12px] text-body">{nfmt(f.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 rounded-xl border border-line bg-paper p-3 font-mono text-[11.5px] text-body">
                  <span className="text-faint">Most completed</span>
                  <span className="rounded border border-line bg-white px-1.5 py-0.5">search_docs</span>
                  <span className="text-faint">→</span>
                  <span className="rounded border border-line bg-white px-1.5 py-0.5">run_query</span>
                  <span className="text-faint">→</span>
                  <span className="rounded border border-line bg-white px-1.5 py-0.5">create_issue</span>
                  <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand text-white">
                    <Check size={11} />
                  </span>
                </div>
              </>
            )}

            {view === "reliability" && (
              <>
                <button className="flex w-full items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left">
                  <TriangleAlert size={16} className="mt-0.5 shrink-0 text-amber-600" />
                  <span className="text-[12.5px] leading-snug text-amber-900">
                    <span className="font-semibold">send_email needs attention.</span>{" "}
                    It failed on 94% of calls this week. Clients retried, then
                    stopped.
                  </span>
                  <span className="ml-auto flex shrink-0 items-center gap-1 text-[12px] font-medium text-amber-700">
                    See the fix <ArrowUpRight size={13} />
                  </span>
                </button>

                <div className="grid grid-cols-3 gap-3">
                  <StatCard label="Error rate" value="3.1%" delta="-0.4pt" good arrow="down" prev={r.prev} />
                  <StatCard label="Failed calls" value="1,942" delta="-12%" good arrow="down" prev={r.prev} />
                  <StatCard label="Tools affected" value="2" delta="stable" good arrow="down" prev={r.prev} />
                </div>

                <div className="overflow-hidden rounded-xl border border-line">
                  <div className="grid grid-cols-[1.6fr_0.9fr_0.9fr_0.9fr] gap-2 border-b border-line bg-paper px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-faint">
                    <span>Tool</span>
                    <span className="text-right">Errors</span>
                    <span className="text-right">Error rate</span>
                    <span className="text-right">Status</span>
                  </div>
                  {[
                    { name: "send_email", errs: "1,842", rate: "94%", status: "failing" },
                    { name: "run_query", errs: "221", rate: "3.4%", status: "slow" },
                    { name: "create_issue", errs: "108", rate: "1.1%", status: "healthy" },
                  ].map((e) => {
                    const s = STATUS[e.status];
                    return (
                      <div
                        key={e.name}
                        className="grid grid-cols-[1.6fr_0.9fr_0.9fr_0.9fr] items-center gap-2 border-b border-line px-4 py-2.5 last:border-0"
                      >
                        <span className="flex items-center gap-2 font-mono text-[12px] text-body">
                          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                          {e.name}
                        </span>
                        <span className="text-right font-mono text-[12px] text-body">{e.errs}</span>
                        <span className="text-right font-mono text-[12px] text-muted">{e.rate}</span>
                        <span className={`text-right text-[12px] font-medium ${s.text}`}>{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* guided demo cursor */}
      {demoActive && cursor && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-40 hidden lg:block"
          initial={false}
          animate={{ x: cursor.x, y: cursor.y, scale: clicking ? 0.82 : 1 }}
          transition={{ type: "spring", stiffness: 130, damping: 18, mass: 0.6 }}
        >
          <span className="relative block">
            {clicking && (
              <span className="absolute -left-2 -top-2 h-9 w-9 animate-ping rounded-full bg-brand/30" />
            )}
            <svg
              width="20"
              height="22"
              viewBox="0 0 18 22"
              fill="none"
              className="drop-shadow-[0_2px_5px_rgba(10,10,10,0.4)]"
            >
              <path
                d="M3 2 L3 18 L7 14 L10 20.5 L12.6 19.3 L9.6 13 L15 13 Z"
                fill="#0a0a0a"
                stroke="#ffffff"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </motion.div>
      )}
    </div>
  );
}

function NavItem({
  label,
  icon: Icon,
  active,
  onClick,
  demo,
  tile,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  active: boolean;
  onClick: () => void;
  demo?: string;
  tile?: string;
}) {
  return (
    <button
      data-demo={demo}
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] font-medium transition-all ${
        active
          ? "bg-white text-ink shadow-sm ring-1 ring-black/5"
          : "text-muted hover:bg-mist hover:text-body"
      }`}
    >
      <span
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-md transition-colors ${
          tile ?? "bg-mist text-faint"
        } ${active ? "" : "opacity-90 group-hover:opacity-100"}`}
      >
        <Icon size={13} />
      </span>
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
}
