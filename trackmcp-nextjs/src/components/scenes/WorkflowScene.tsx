"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, RotateCcw } from "lucide-react";
import { DotGrid } from "../DotGrid";
import { ClientMark, type ClientName } from "../ClientLogos";

/* Workflows scene: two horizontal paths from first request to result. A guided
   sequence lights the completed path left-to-right (green progress + a small
   traveling indicator), then the stopped path halts at an amber point. Same
   card, thin borders, black/gray + green success + amber warning. Pauses
   offscreen; shows both final states under reduced motion. Representative data. */

type Frame = { c: number; s: number; cc: boolean; cs: boolean; msg: boolean; d: number };

// c: completed-path progress (1 search_docs, 2 run_query, 3 create_issue, 4 done)
// s: stopped-path progress (1 search_docs, 2 run_query, 3 stopped)
const FRAMES: Frame[] = [
  { c: 0, s: 0, cc: false, cs: false, msg: false, d: 600 },
  { c: 0, s: 0, cc: true, cs: false, msg: false, d: 600 },
  { c: 1, s: 0, cc: true, cs: false, msg: false, d: 600 },
  { c: 2, s: 0, cc: true, cs: false, msg: false, d: 600 },
  { c: 3, s: 0, cc: true, cs: false, msg: false, d: 600 },
  { c: 4, s: 0, cc: true, cs: false, msg: false, d: 900 },
  { c: 4, s: 0, cc: true, cs: true, msg: false, d: 600 },
  { c: 4, s: 1, cc: true, cs: true, msg: false, d: 600 },
  { c: 4, s: 2, cc: true, cs: true, msg: false, d: 600 },
  { c: 4, s: 3, cc: true, cs: true, msg: false, d: 700 },
  { c: 4, s: 3, cc: true, cs: true, msg: true, d: 2000 },
];

const FINAL: Frame = { c: 4, s: 3, cc: true, cs: true, msg: true, d: 0 };

export function WorkflowScene() {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [frame, setFrame] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      threshold: 0.25,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduce || !visible) return;
    const t = setTimeout(() => setFrame((f) => (f + 1) % FRAMES.length), FRAMES[frame].d);
    return () => clearTimeout(t);
  }, [frame, reduce, visible]);

  const still = !!reduce;
  const cur = still ? FINAL : FRAMES[frame];

  return (
    <div className="relative">
      <DotGrid className="scale-125" />

      <div
        ref={ref}
        className="relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-[0_28px_80px_-40px_rgba(10,10,10,0.28)] sm:p-6"
      >
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-ink">Most common workflow</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2 py-0.5 text-[11px] font-medium text-mint-ink">
            412 sessions
          </span>
        </div>

        {/* completed path */}
        <div className="mt-5">
          <ClientRow name="Claude" active state="completed" reached />
          <div className="mt-2.5 flex flex-wrap items-center gap-y-2">
            <Node label="search_docs" on tone="green" />
            <Connector tone="green" on moving={!still && cur.c === 2} />
            <Node label="run_query" on tone="green" />
            <Connector tone="green" on moving={!still && cur.c === 3} />
            <Node label="create_issue" on tone="green" />
            <Connector tone="green" on moving={!still && cur.c === 4} />
            <EndPill kind="completed" on still={still} />
          </div>
        </div>

        {/* stopped path */}
        <div className="mt-5 border-t border-line pt-5">
          <ClientRow name="Cursor" active state="stopped" reached />
          <div className="mt-2.5 flex flex-wrap items-center gap-y-2">
            <Node label="search_docs" on tone="neutral" />
            <Connector tone="neutral" on moving={!still && cur.s === 2} />
            <Node label="run_query" on tone="neutral" />
            <Connector tone="amber" on moving={!still && cur.s === 3} />
            <EndPill kind="stopped" on still={still} />
          </div>
        </div>

        {/* supporting message */}
        <div className="mt-5 border-t border-line pt-4 text-[12.5px] leading-snug">
          <span className="font-medium text-ink">4 in 5 sessions</span>{" "}
          <span className="text-muted">reach a useful result.</span>
        </div>
      </div>
    </div>
  );
}

function ClientRow({
  name,
  active,
  state,
  reached,
}: {
  name: ClientName;
  active: boolean;
  state: "completed" | "stopped";
  reached: boolean;
}) {
  const stateWord =
    state === "completed"
      ? reached
        ? "text-mint-ink"
        : "text-faint"
      : reached
        ? "text-amber-600"
        : "text-faint";
  return (
    <div
      className={`flex items-center gap-2 text-[11.5px] transition-opacity duration-300 ${
        active ? "opacity-100" : "opacity-55"
      }`}
    >
      <span
        className={`grid h-5 w-5 place-items-center rounded border bg-paper text-slate-600 transition-colors duration-300 ${
          active ? "border-line-strong" : "border-line"
        }`}
      >
        <ClientMark name={name} size={11} />
      </span>
      <span className="text-muted">{name}</span>
      <span className="text-faint">·</span>
      <span className={`font-medium transition-colors duration-300 ${stateWord}`}>
        {state}
      </span>
    </div>
  );
}

function Node({
  label,
  on,
  tone,
}: {
  label: string;
  on: boolean;
  tone: "green" | "neutral";
}) {
  const cls = !on
    ? "border-line bg-paper text-muted"
    : tone === "green"
      ? "border-brand/40 bg-brand-soft/60 text-ink"
      : "border-line-strong bg-white text-ink";
  return (
    <span
      className={`shrink-0 rounded-lg border px-3 py-2 font-mono text-[12px] transition-colors duration-300 ${cls}`}
    >
      {label}
    </span>
  );
}

function Connector({
  tone,
  on,
  moving,
}: {
  tone: "green" | "neutral" | "amber";
  on: boolean;
  moving: boolean;
}) {
  const color =
    tone === "green"
      ? "var(--color-brand)"
      : tone === "amber"
        ? "#f59e0b"
        : "var(--color-ink)";
  return (
    <span className="relative mx-1 inline-flex h-3 w-7 shrink-0 items-center" aria-hidden>
      <span className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-line" />
      <motion.span
        className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full"
        style={{ background: color }}
        initial={false}
        animate={{ width: on ? "100%" : "0%" }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
      />
      {moving && (
        <motion.span
          className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full"
          style={{ background: color }}
          initial={{ left: "0%", opacity: 0 }}
          animate={{ left: ["0%", "100%"], opacity: [0, 1, 0] }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      )}
    </span>
  );
}

function EndPill({
  kind,
  on,
  still,
}: {
  kind: "completed" | "stopped";
  on: boolean;
  still: boolean;
}) {
  if (kind === "completed") {
    return (
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium transition-colors duration-300 ${
          on ? "bg-brand text-white" : "border border-line bg-paper text-muted"
        }`}
      >
        <Check size={13} className={on ? "opacity-100" : "opacity-40"} /> Completed
      </span>
    );
  }
  return (
    <span
      className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium transition-colors duration-300 ${
        on ? "border border-amber-300 bg-amber-50 text-amber-700" : "border border-line bg-paper text-muted"
      }`}
    >
      <RotateCcw size={13} className={on ? "opacity-100" : "opacity-40"} /> Stopped here
      {on && !still && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-amber-300"
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      )}
    </span>
  );
}
