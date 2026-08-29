"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { DotGrid } from "../DotGrid";

/* Outcomes scene: a completion funnel (started → reached a tool → completed a
   workflow) beside returning usage and the most-completed workflow. A guided
   sequence fills the funnel, counts up the numbers once, then reveals returning
   usage and walks the workflow to a green result. Black/gray + restrained green,
   amber only for drop-off. Pauses offscreen; static final state under reduced
   motion. Representative data only. */

const FUNNEL = [
  { step: "Sessions started", value: 1284, pct: 100, phase: 1 },
  { step: "Reached a tool", value: 1042, pct: 81, phase: 2 },
  { step: "Completed a workflow", value: 968, pct: 75, phase: 3 },
];

const WF = ["search_docs", "run_query", "create_issue"];

// phase map: 0 idle · 1-3 funnel bars · 4 badge · 5 returning · 6-8 wf steps ·
// 9 wf completed · 10 hold → loop
const DWELL = [400, 900, 900, 900, 700, 900, 500, 450, 450, 500, 2400];

export function OutcomeScene() {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState(0);
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
    const t = setTimeout(() => setPhase((p) => (p + 1) % DWELL.length), DWELL[phase]);
    return () => clearTimeout(t);
  }, [phase, reduce, visible]);

  const still = !!reduce;
  const p = still ? 99 : phase;

  return (
    <div className="relative">
      <DotGrid className="scale-125" />

      <div
        ref={ref}
        className="relative grid gap-5 rounded-2xl border border-line bg-white p-5 shadow-[0_28px_80px_-40px_rgba(10,10,10,0.28)] sm:grid-cols-[1.35fr_1fr] sm:p-6"
      >
        {/* completion funnel */}
        <div className="min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-ink">Sessions to result</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full bg-mint px-2 py-0.5 text-[11px] font-medium text-mint-ink transition-opacity duration-500 ${
                p >= 4 ? "opacity-100" : "opacity-0"
              }`}
            >
              75% completed
            </span>
          </div>

          <div className="mt-5 flex flex-col">
            {FUNNEL.map((f, i) => {
              const filled = p >= f.phase;
              const last = i === FUNNEL.length - 1;
              const drop =
                i === 0 ? 0 : Math.round((1 - f.value / FUNNEL[i - 1].value) * 100);
              return (
                <div key={f.step}>
                  {i > 0 && <Flow active={p === f.phase} tone="green" />}
                  <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
                    <span className="text-body">{f.step}</span>
                    <span className="font-mono text-muted">
                      <CountUp to={f.value} run={filled} still={still} />
                      {drop > 0 && (
                        <span
                          className={`ml-2 text-amber-600 transition-opacity duration-500 ${
                            filled ? "opacity-100" : "opacity-0"
                          }`}
                        >
                          -{drop}%
                        </span>
                      )}
                    </span>
                  </div>
                  <span
                    className={`relative block h-7 overflow-hidden rounded-md bg-mist ${
                      last && p >= 3 ? "ring-1 ring-brand/30" : ""
                    }`}
                  >
                    <motion.span
                      className={`absolute inset-y-0 left-0 rounded-md ${
                        last ? "bg-brand" : i === 0 ? "bg-brand/40" : "bg-brand/65"
                      }`}
                      initial={false}
                      animate={{ width: filled ? `${f.pct}%` : "0%" }}
                      transition={{ duration: still ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* returning usage + most-completed workflow */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-line bg-paper p-4">
            <div className="text-[11px] font-medium uppercase tracking-wide text-faint">
              Returning clients
            </div>
            <div className="mt-1.5 font-mono text-[26px] font-semibold leading-none text-ink">
              <CountUp to={62} run={p >= 5} still={still} percent />
            </div>
            <div className="mt-1.5 text-[12.5px] text-muted">come back within 7 days</div>
            <span className="mt-3 block h-1.5 w-full overflow-hidden rounded-full bg-mist">
              <motion.span
                className="block h-full rounded-full bg-brand"
                initial={false}
                animate={{ width: p >= 5 ? "62%" : "0%" }}
                transition={{ duration: still ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
              />
            </span>
          </div>

          <div className="rounded-xl border border-line p-4">
            <div className="text-[13px] font-semibold text-ink">Most completed workflow</div>
            <div className="mt-3 flex flex-wrap items-center gap-y-2 font-mono text-[11.5px]">
              {WF.map((label, i) => {
                const on = p >= 6 + i;
                return (
                  <span key={label} className="flex items-center">
                    <span
                      className={`rounded-md border px-2 py-1 transition-colors duration-300 ${
                        on ? "border-brand/40 bg-brand-soft/60 text-ink" : "border-line bg-paper text-muted"
                      }`}
                    >
                      {label}
                    </span>
                    {i < WF.length - 1 && (
                      <WfConnector on={p >= 7 + i} moving={!still && p === 7 + i} />
                    )}
                  </span>
                );
              })}
              <motion.span
                className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white"
                initial={false}
                animate={{ opacity: p >= 9 ? 1 : 0.25, scale: p >= 9 ? 1 : 0.9 }}
                transition={{ duration: still ? 0 : 0.3 }}
              >
                <Check size={12} />
              </motion.span>
            </div>
          </div>
        </div>

        {/* supporting insight — inline, spans the card */}
        <div
          className={`border-t border-line pt-4 text-[12.5px] leading-snug transition-opacity duration-500 sm:col-span-2 ${
            p >= 9 ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="font-medium text-ink">Most returning clients</span>{" "}
          <span className="text-muted">use more than one tool.</span>
        </div>
      </div>
    </div>
  );
}

/* count up to a value once when `run` becomes true */
function CountUp({
  to,
  run,
  still,
  percent = false,
}: {
  to: number;
  run: boolean;
  still: boolean;
  percent?: boolean;
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (still || !run) return;
    let raf = 0;
    const start = performance.now();
    const dur = 600;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setN(Math.round(eased * to));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, to, still]);
  const shown = still ? to : run ? n : 0;
  return <>{percent ? `${shown}%` : shown.toLocaleString()}</>;
}

/* short vertical flow indicator between funnel stages */
function Flow({ active, tone }: { active: boolean; tone: "green" | "neutral" }) {
  const color = tone === "green" ? "var(--color-brand)" : "var(--color-ink)";
  return (
    <div className="relative my-1 ml-1 h-3 w-[2px] rounded-full bg-line">
      {active && (
        <motion.span
          className="absolute -left-[3px] h-2 w-2 rounded-full"
          style={{ background: color }}
          initial={{ top: -4, opacity: 0 }}
          animate={{ top: [-4, 14], opacity: [0, 1, 0] }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}

/* small green connector inside the workflow path */
function WfConnector({ on, moving }: { on: boolean; moving: boolean }) {
  return (
    <span className="relative mx-1 inline-flex h-3 w-5 shrink-0 items-center" aria-hidden>
      <span className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-line" />
      <motion.span
        className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-brand"
        initial={false}
        animate={{ width: on ? "100%" : "0%" }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      />
      {moving && (
        <motion.span
          className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-brand"
          initial={{ left: "0%", opacity: 0 }}
          animate={{ left: ["0%", "100%"], opacity: [0, 1, 0] }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
        />
      )}
    </span>
  );
}
