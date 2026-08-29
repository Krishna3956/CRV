"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  LayoutGrid,
  Users,
  Wrench,
  GitBranch,
  Target,
  TriangleAlert,
  ArrowRight,
  Check,
  ChevronRight,
} from "lucide-react";
import { DotGrid } from "../DotGrid";
import { ClientMark, type ClientName } from "../ClientLogos";
import { TrackMCPAppIcon } from "../TrackMCPAppIcon";

/* "See who is using your MCP server" — one cohesive TrackMCP dashboard that
   walks through the full analytics story as a controlled product demo:
   Overview → Clients → Tools → Sessions → Outcomes → Reliability → (loop).
   Fixed outer frame, calm crossfades, black/white/gray + restrained green,
   amber only for failures. Pauses offscreen; static Overview under reduced
   motion. Representative data only. */

type ViewKey =
  | "overview"
  | "clients"
  | "tools"
  | "sessions"
  | "outcomes"
  | "reliability";

const VIEWS: { key: ViewKey; label: string; icon: typeof Users; dwell: number }[] = [
  { key: "overview", label: "Overview", icon: LayoutGrid, dwell: 2400 },
  { key: "clients", label: "Clients", icon: Users, dwell: 2300 },
  { key: "tools", label: "Tools", icon: Wrench, dwell: 2500 },
  { key: "sessions", label: "Sessions", icon: GitBranch, dwell: 2700 },
  { key: "outcomes", label: "Outcomes", icon: Target, dwell: 2500 },
  { key: "reliability", label: "Reliability", icon: TriangleAlert, dwell: 2900 },
];

const CLIENTS: { name: ClientName; label: string; sessions: number; share: number }[] = [
  { name: "Claude", label: "Claude", sessions: 642, share: 50 },
  { name: "Cursor", label: "Cursor", sessions: 388, share: 30 },
  { name: "ChatGPT", label: "ChatGPT", sessions: 176, share: 14 },
  { name: "Custom", label: "Custom agents", sessions: 78, share: 6 },
];

const TOOLS = [
  { name: "list_repos", calls: "5,210", share: 41, success: "99%", ok: true, top: true },
  { name: "get_customer", calls: "3,180", share: 25, success: "98%", ok: true },
  { name: "search_docs", calls: "2,940", share: 23, success: "97%", ok: true },
  { name: "send_email", calls: "412", share: 3, success: "6%", ok: false },
];

const FLOW = ["Find account", "get_customer", "check_plan", "send_email"];

export function ClientAdoptionScene() {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [i, setI] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      threshold: 0.2,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduce || !visible) return;
    const t = setTimeout(
      () => setI((v) => (v + 1) % VIEWS.length),
      VIEWS[i].dwell
    );
    return () => clearTimeout(t);
  }, [i, reduce, visible]);

  const view: ViewKey = reduce ? "overview" : VIEWS[i].key;
  const still = !!reduce;

  return (
    <div className="relative">
      <DotGrid className="scale-125" />

      <div
        ref={ref}
        className="relative w-full overflow-hidden rounded-2xl border border-line bg-white shadow-[0_28px_80px_-40px_rgba(10,10,10,0.28)]"
      >
        {/* header */}
        <div className="flex items-center gap-2.5 border-b border-line bg-paper px-3.5 py-2.5">
          <TrackMCPAppIcon size={20} />
          <span className="font-mono text-[11.5px] text-body">acme-mcp-server</span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2 py-0.5 text-[10.5px] font-medium text-muted">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-brand" /> Live
          </span>
          <span className="hidden font-mono text-[10.5px] text-faint sm:inline">
            Last 7 days
          </span>
        </div>

        {/* view strip (shows the analytics breadth, active view highlighted) */}
        <div className="flex items-center gap-0.5 border-b border-line bg-white px-2 py-1.5 sm:gap-1 sm:px-3">
          {VIEWS.map((v) => {
            const on = v.key === view;
            return (
              <span
                key={v.key}
                className={`inline-flex min-w-0 items-center gap-1 rounded-md px-1.5 py-1 text-[9.5px] font-medium transition-colors sm:text-[11px] ${
                  on ? "bg-brand-soft text-brand-strong" : "text-faint"
                }`}
              >
                <v.icon size={11} className="shrink-0" />
                <span className="truncate">{v.label}</span>
              </span>
            );
          })}
        </div>

        {/* content — fixed height so the frame never resizes */}
        <div className="relative h-[300px] sm:h-[304px]">
          <AnimatePresence initial={false}>
            <motion.div
              key={view}
              className="absolute inset-0 p-3.5 sm:p-4"
              initial={still ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {view === "overview" && <OverviewView still={still} />}
              {view === "clients" && <ClientsView still={still} />}
              {view === "tools" && <ToolsView still={still} />}
              {view === "sessions" && <SessionsView still={still} />}
              {view === "outcomes" && <OutcomesView still={still} />}
              {view === "reliability" && <ReliabilityView still={still} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ── shared bits ── */

function Bar({
  pct,
  tone = "ink",
  still,
  delay = 0,
}: {
  pct: number;
  tone?: "ink" | "brand" | "amber";
  still: boolean;
  delay?: number;
}) {
  const color =
    tone === "brand" ? "bg-brand" : tone === "amber" ? "bg-amber-500" : "bg-ink";
  return (
    <span className="relative block h-2 w-full overflow-hidden rounded-full bg-mist">
      <motion.span
        className={`absolute inset-y-0 left-0 rounded-full ${color}`}
        initial={still ? false : { width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }}
      />
    </span>
  );
}

function stagger(still: boolean, i: number) {
  return {
    initial: still ? false : { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: still ? 0 : 0.08 + i * 0.09, ease: [0.16, 1, 0.3, 1] as const },
  };
}

/* ── State 1 · Overview ── */
function OverviewView({ still }: { still: boolean }) {
  const metrics = [
    { label: "Active clients", value: "128", tone: "text-ink" },
    { label: "Sessions", value: "1,284", tone: "text-ink" },
    { label: "Completed workflows", value: "62%", tone: "text-brand-strong" },
    { label: "Needs attention", value: "1", tone: "text-amber-600" },
  ];
  const insights = [
    { dot: "bg-amber-500", text: "send_email needs attention — 94% failing" },
    { dot: "bg-ink", text: "Checkout workflow stops early — 38%" },
    { dot: "bg-brand", text: "Returning usage up 8% this week" },
  ];
  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            {...stagger(still, i)}
            className="rounded-xl border border-line bg-paper px-2.5 py-2.5"
          >
            <div className={`text-[20px] font-semibold leading-none ${m.tone}`}>
              {m.value}
            </div>
            <div className="mt-1.5 text-[10.5px] leading-tight text-muted">{m.label}</div>
          </motion.div>
        ))}
      </div>
      <div className="mt-3 flex-1 rounded-xl border border-line bg-white p-3">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-faint">
          What to look at
        </div>
        <div className="mt-2 flex flex-col gap-2">
          {insights.map((it, i) => (
            <motion.div
              key={it.text}
              {...stagger(still, i + 4)}
              className="flex items-center gap-2 text-[12.5px] text-body"
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${it.dot}`} />
              {it.text}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── State 2 · Clients ── */
function ClientsView({ still }: { still: boolean }) {
  return (
    <div className="flex h-full flex-col">
      <ViewTitle icon={Users} title="Who is using it" note="by sessions" />
      <div className="mt-2 flex flex-1 flex-col justify-center gap-2.5">
        {CLIENTS.map((c, i) => (
          <motion.div key={c.name} {...stagger(still, i)} className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-line bg-white text-slate-600">
              <ClientMark name={c.name} size={14} />
            </span>
            <span className="w-24 shrink-0 truncate text-[12.5px] text-ink">{c.label}</span>
            <Bar pct={c.share * 1.8} tone={i === 0 ? "brand" : "ink"} still={still} delay={0.1 + i * 0.09} />
            <span className="w-16 shrink-0 text-right font-mono text-[11.5px] text-muted">
              {c.sessions}
            </span>
          </motion.div>
        ))}
      </div>
      <motion.div
        {...stagger(still, 5)}
        className="mt-2 flex items-center justify-between rounded-lg border border-brand/30 bg-brand-soft/40 px-3 py-2"
      >
        <span className="text-[11.5px] font-medium text-ink">Total sessions</span>
        <span className="font-mono text-[13px] font-semibold text-brand-strong">1,284</span>
      </motion.div>
    </div>
  );
}

/* ── State 3 · Tools ── */
function ToolsView({ still }: { still: boolean }) {
  return (
    <div className="flex h-full flex-col">
      <ViewTitle icon={Wrench} title="Which tools they use" note="ranked by calls" />
      <div className="mt-2 grid grid-cols-[1.4fr_0.7fr_1fr_0.7fr] gap-2 px-1 text-[9.5px] font-semibold uppercase tracking-wide text-faint">
        <span>Tool</span>
        <span className="text-right">Calls</span>
        <span>Share</span>
        <span className="text-right">Success</span>
      </div>
      <div className="mt-1 flex flex-1 flex-col gap-1">
        {TOOLS.map((t, i) => (
          <motion.div
            key={t.name}
            {...stagger(still, i)}
            className={`grid grid-cols-[1.4fr_0.7fr_1fr_0.7fr] items-center gap-2 rounded-lg px-1.5 py-2 ${
              t.top ? "bg-brand-soft/50" : t.ok ? "" : "bg-amber-50"
            }`}
          >
            <span className="flex items-center gap-1.5 truncate font-mono text-[11.5px] text-ink">
              {!t.ok && <TriangleAlert size={11} className="shrink-0 text-amber-500" />}
              {t.name}
            </span>
            <span className="text-right font-mono text-[11px] text-muted">{t.calls}</span>
            <Bar pct={t.share * 2} tone={t.top ? "brand" : t.ok ? "ink" : "amber"} still={still} delay={0.12 + i * 0.09} />
            <span
              className={`text-right font-mono text-[11px] font-medium ${
                t.ok ? "text-muted" : "text-amber-600"
              }`}
            >
              {t.success}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── State 4 · Sessions ── */
function SessionsView({ still }: { still: boolean }) {
  return (
    <div className="flex h-full flex-col">
      <ViewTitle icon={GitBranch} title="How tools are used together" note="one workflow" />
      <div className="mt-3 flex flex-1 flex-col justify-center">
        <div className="flex flex-wrap items-center gap-1.5">
          {FLOW.map((step, i) => (
            <motion.div key={step} {...stagger(still, i)} className="flex items-center gap-1.5">
              <span
                className={`rounded-md border px-2 py-1 font-mono text-[11px] ${
                  step === "send_email"
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : "border-line bg-paper text-body"
                }`}
              >
                {step}
              </span>
              {i < FLOW.length - 1 && <ChevronRight size={12} className="text-faint" />}
            </motion.div>
          ))}
          <motion.span {...stagger(still, FLOW.length)} className="flex items-center gap-1">
            <ChevronRight size={12} className="text-faint" />
            <span className="inline-flex items-center gap-1 rounded-md bg-brand px-2 py-1 text-[11px] font-medium text-white">
              <Check size={11} /> Email sent
            </span>
          </motion.span>
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-body">Completed the workflow</span>
            <span className="font-mono font-medium text-brand-strong">62%</span>
          </div>
          <Bar pct={62} tone="brand" still={still} delay={0.3} />
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-body">Stopped before the last step</span>
            <span className="font-mono font-medium text-muted">38%</span>
          </div>
          <Bar pct={38} tone="ink" still={still} delay={0.4} />
        </div>
      </div>
    </div>
  );
}

/* ── State 5 · Outcomes ── */
function OutcomesView({ still }: { still: boolean }) {
  const rows = [
    { label: "Workflows completed", pct: 62, tone: "brand" as const },
    { label: "Sessions reaching a useful result", pct: 71, tone: "ink" as const },
    { label: "Returning usage", pct: 58, tone: "brand" as const },
  ];
  return (
    <div className="flex h-full flex-col">
      <ViewTitle icon={Target} title="Whether the work gets done" note="outcomes" />
      <div className="mt-2 flex flex-1 flex-col justify-center gap-3.5">
        {rows.map((r, i) => (
          <div key={r.label}>
            <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
              <span className="text-body">{r.label}</span>
              <span className="font-mono font-medium text-ink">{r.pct}%</span>
            </div>
            <Bar pct={r.pct} tone={r.tone} still={still} delay={0.12 + i * 0.12} />
          </div>
        ))}
      </div>
      <motion.div
        {...stagger(still, 4)}
        className="mt-1 flex items-center justify-between rounded-lg border border-line bg-paper px-3 py-2"
      >
        <span className="text-[11px] text-muted">Most common successful workflow</span>
        <span className="font-mono text-[11.5px] font-medium text-ink">checkout · 75%</span>
      </motion.div>
    </div>
  );
}

/* ── State 6 · Reliability ── */
function ReliabilityView({ still }: { still: boolean }) {
  return (
    <div className="flex h-full flex-col">
      <ViewTitle icon={TriangleAlert} title="Where the experience breaks" note="1 issue" />
      <motion.div
        {...stagger(still, 0)}
        className="mt-2 flex-1 rounded-xl border border-amber-200 bg-amber-50/60 p-3.5"
      >
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-100 text-amber-600">
            <TriangleAlert size={14} />
          </span>
          <span className="font-mono text-[13px] font-semibold text-ink">send_email</span>
          <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            94% failing
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { k: "Calls", v: "412" },
            { k: "Success", v: "6%" },
            { k: "Failing", v: "94%" },
          ].map((s, i) => (
            <motion.div
              key={s.k}
              {...stagger(still, i + 1)}
              className="rounded-lg border border-amber-200/70 bg-white px-2 py-1.5 text-center"
            >
              <div className="font-mono text-[14px] font-semibold text-ink">{s.v}</div>
              <div className="text-[9.5px] text-muted">{s.k}</div>
            </motion.div>
          ))}
        </div>
        <motion.p {...stagger(still, 4)} className="mt-3 text-[12px] leading-snug text-body">
          The schema expects an array, but most agents send a plain string.
        </motion.p>
        <motion.span
          {...stagger(still, 5)}
          className="mt-3 inline-flex items-center gap-1 rounded-md bg-ink px-2.5 py-1 text-[11px] font-medium text-white"
        >
          Inspect issue <ArrowRight size={11} />
        </motion.span>
      </motion.div>
    </div>
  );
}

function ViewTitle({
  icon: Icon,
  title,
  note,
}: {
  icon: typeof Users;
  title: string;
  note: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} className="text-brand-strong" />
      <span className="text-[12.5px] font-semibold text-ink">{title}</span>
      <span className="ml-auto font-mono text-[10px] text-faint">{note}</span>
    </div>
  );
}
