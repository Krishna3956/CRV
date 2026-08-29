"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Play,
  Pause,
  Check,
  Sparkles,
  Zap,
  ArrowRight,
  Activity,
  BarChart3,
  Users,
  TriangleAlert,
} from "lucide-react";
import { ClientMark } from "./ClientLogos";

/* Animated product explanation: shows what happens after one line of install —
   an agent request is Captured, Analyzed across the dashboard, and Explained as
   a plain-English insight. Auto-loops, can be paused / stepped, and degrades to
   a fully readable static state when motion is reduced. Representative data. */

const STEPS = [
  { key: "request", label: "Request", desc: "An AI client calls a tool" },
  { key: "capture", label: "Capture", desc: "TrackMCP records the call and result" },
  { key: "analyze", label: "Understand", desc: "The dashboard updates live" },
  { key: "explain", label: "Improve", desc: "You get a plain-English insight" },
] as const;

function StepHeading({
  children,
  sub,
}: {
  children: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h3 className="text-[15px] font-medium text-ink">{children}</h3>
      {sub && <span className="text-[12px] text-faint">{sub}</span>}
    </div>
  );
}

function RequestStep() {
  return (
    <div>
      <StepHeading sub="tools/call">Agent sends a request</StepHeading>
      <div className="rounded-lg border border-line bg-white p-3.5 font-mono text-[12.5px] leading-relaxed">
        <div className="flex items-center gap-2 text-muted">
          <span className="grid h-5 w-5 place-items-center rounded border border-line text-slate-500">
            <ClientMark name="Claude" size={12} />
          </span>
          Claude
          <ArrowRight size={12} className="text-faint" />
          <span className="text-ink">your MCP server</span>
        </div>
        <div className="mt-3 text-muted">POST tools/call</div>
        <div className="text-body">
          {"{ name: "}
          <span className="text-brand-strong">&quot;search_docs&quot;</span>
          {", args: { query: "}
          <span className="text-brand-strong">&quot;pricing&quot;</span>
          {" } }"}
        </div>
      </div>
    </div>
  );
}

function CaptureStep() {
  const rows: { k: string; v: string; ok?: boolean }[] = [
    { k: "client", v: "Claude" },
    { k: "tool", v: "search_docs" },
    { k: "timestamp", v: "12:04:22" },
    { k: "latency", v: "96ms" },
    { k: "status", v: "200 OK", ok: true },
    { k: "result", v: "captured", ok: true },
  ];
  return (
    <div>
      <StepHeading sub="no manual tagging">
        TrackMCP captures the signal
      </StepHeading>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {rows.map((r) => (
          <div
            key={r.k}
            className="rounded-lg border border-line bg-white px-3 py-2"
          >
            <div className="text-[10.5px] font-medium uppercase tracking-wide text-faint">
              {r.k}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[12.5px] text-ink">
              {r.ok && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
              {r.v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyzeStep() {
  const tiles = [
    { icon: BarChart3, label: "Tool analytics", note: "search_docs +1" },
    { icon: Activity, label: "Session timeline", note: "step appended" },
    { icon: Users, label: "Client breakdown", note: "Claude ▲" },
    { icon: TriangleAlert, label: "Error rate", note: "0.4%" },
  ];
  return (
    <div>
      <StepHeading sub="real time">Dashboards update everywhere</StepHeading>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-lg border border-line bg-white p-3"
          >
            <t.icon size={15} className="text-brand" />
            <div className="mt-2 text-[12.5px] font-medium text-ink">
              {t.label}
            </div>
            <div className="mt-0.5 font-mono text-[11px] text-muted">
              {t.note}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExplainStep() {
  return (
    <div>
      <StepHeading sub="weekly">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles size={14} className="text-brand" /> TrackMCP explains it
        </span>
      </StepHeading>
      <div className="rounded-lg border border-line bg-white p-4">
        <p className="text-[13.5px] leading-relaxed text-body">
          <span className="font-mono text-ink">send_email</span> failed on most
          calls this week. The request format was not accepted, so agents retried
          and then stopped.
        </p>
        <div className="mt-3 flex items-start gap-2 rounded-md border border-line bg-mint/50 p-2.5">
          <Zap size={14} className="mt-0.5 shrink-0 text-brand-strong" />
          <span className="text-[12.5px] text-body">
            Accept the simpler format. That recovers about 2,100 calls a week.
          </span>
        </div>
      </div>
    </div>
  );
}

const PANELS = [RequestStep, CaptureStep, AnalyzeStep, ExplainStep];

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

export function HowItWorksFlow() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!playing || reducedMotion) return;
    const id = setInterval(
      () => setActive((a) => (a + 1) % STEPS.length),
      2800
    );
    return () => clearInterval(id);
  }, [playing, reducedMotion]);

  const Panel = PANELS[active];

  return (
    <div className="relative mx-auto max-w-3xl rounded-2xl border border-line bg-white p-4 shadow-[0_40px_120px_-55px_rgba(10,10,10,0.4)] sm:p-6">
      {/* stepper rail */}
      <ol className="relative grid grid-cols-4 gap-2">
        <span
          aria-hidden
          className="absolute left-0 right-0 top-[13px] h-px bg-line"
        />
        <span
          aria-hidden
          className="absolute left-0 right-0 top-[13px] h-px origin-left bg-brand transition-transform duration-500 ease-out"
          style={{ transform: `scaleX(${active / (STEPS.length - 1)})` }}
        />
        {STEPS.map((s, i) => {
          const done = i < active;
          const cur = i === active;
          return (
            <li key={s.key} className="relative">
              <button
                onClick={() => setActive(i)}
                aria-current={cur ? "step" : undefined}
                className="flex w-full flex-col items-center rounded-lg text-center"
              >
                <span
                  className={`relative z-10 grid h-7 w-7 place-items-center rounded-full border-2 bg-white transition-colors ${
                    cur || done ? "border-brand" : "border-line-strong"
                  }`}
                >
                  {done ? (
                    <Check size={13} className="text-brand" />
                  ) : (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        cur ? "bg-brand" : "bg-line-strong"
                      }`}
                    />
                  )}
                </span>
                <span
                  className={`mt-2 text-[12.5px] font-medium ${
                    cur || done ? "text-ink" : "text-muted"
                  }`}
                >
                  {s.label}
                </span>
                <span className="mt-0.5 hidden text-[11.5px] leading-tight text-faint sm:block">
                  {s.desc}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* stage */}
      <div className="relative mt-6 min-h-[220px] overflow-hidden rounded-xl border border-line bg-paper p-4 sm:min-h-[236px] sm:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: reducedMotion ? 0 : 0.35, ease: "easeOut" }}
          >
            <Panel />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* controls */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[12.5px] font-medium text-body transition-colors hover:border-line-strong"
        >
          {playing ? (
            <>
              <Pause size={13} /> Pause
            </>
          ) : (
            <>
              <Play size={13} /> Play
            </>
          )}
        </button>
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              aria-label={`Go to ${s.label}`}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-5 bg-brand" : "w-1.5 bg-line-strong hover:bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
