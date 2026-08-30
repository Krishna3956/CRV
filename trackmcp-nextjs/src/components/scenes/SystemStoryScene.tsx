"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Server,
  Users,
  Wrench,
  Activity,
  TriangleAlert,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { ClientMark, type ClientName } from "../ClientLogos";
import { TrackMCPMark } from "../TrackMCPMark";
import { TrackMCPLogo } from "../TrackMCPLogo";

/* "What happens after one line of code" — a top-to-bottom layered diagram of the
   real architecture, not an ETL funnel:

     Layer 1  Clients        (Claude, Cursor, ChatGPT, Custom make tool calls)
        ↓     tool calls
     Layer 2  Your MCP server (wrapped with withTrackMCP, one line)
        ↓     captured
     Layer 3  TrackMCP        (the analytics layer — captures + synthesizes)
        ↓     delivered
     Layer 4  Outcomes        (who's using it, tools, sessions, silent failures)
              + the plain-English answer

   Continuous downward current (seamless marching dashes). Respects reduced
   motion, pauses offscreen. Representative data only. */

type Client = { name: ClientName; label: string; calls: string };

const CLIENTS: Client[] = [
  { name: "Claude", label: "Claude", calls: "1,204" },
  { name: "Cursor", label: "Cursor", calls: "812" },
  { name: "ChatGPT", label: "ChatGPT", calls: "470" },
  { name: "Custom", label: "Custom", calls: "132" },
];

const TOOLS = ["search_docs", "run_query", "create_issue", "send_email"];

const OUTCOMES = [
  { key: "clients", label: "Who's using it", value: "4 clients", icon: Users, tile: "bg-sky-100 text-sky-600" },
  { key: "tools", label: "Tools", value: "12 active", icon: Wrench, tile: "bg-violet-100 text-violet-600" },
  { key: "sessions", label: "Sessions", value: "3,120", icon: Activity, tile: "bg-brand-soft text-brand-strong" },
  { key: "failures", label: "Silent failures", value: "1 found", icon: TriangleAlert, tile: "bg-rose-100 text-rose-600" },
];

export function SystemStoryScene() {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      threshold: 0.1,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const flowing = !reduce && visible;

  return (
    <div
      ref={ref}
      className="relative mx-auto w-full max-w-[640px] rounded-2xl border border-line bg-white p-5 shadow-[0_28px_80px_-44px_rgba(10,10,10,0.3)] sm:p-7"
    >
      <div className="bg-grid pointer-events-none absolute inset-0 rounded-2xl opacity-[0.04]" />

      <div className="relative">
        {/* ── Layer 1 · Clients ── */}
        <LayerLabel index="1" text="AI clients make tool calls" />
        <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
          {CLIENTS.map((c) => (
            <div
              key={c.name}
              className="flex flex-col items-center gap-1 rounded-xl border border-line bg-paper px-1.5 py-2.5 text-center"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-white text-slate-600">
                <ClientMark name={c.name} size={15} />
              </span>
              <span className="truncate text-[11.5px] font-medium leading-tight text-ink">
                {c.label}
              </span>
              <span className="font-mono text-[10px] leading-tight text-brand-strong">
                {c.calls} calls
              </span>
            </div>
          ))}
        </div>

        <Connector flowing={flowing} label="tool calls" />

        {/* ── Layer 2 · Your MCP server ── */}
        <LayerLabel index="2" text="Flow through your MCP server" />
        <div className="rounded-xl border border-line bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink text-white">
              <Server size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[13.5px] font-semibold text-ink">Your MCP server</span>
                <span className="rounded-full bg-brand-soft px-1.5 py-0.5 font-mono text-[9.5px] font-medium text-brand-strong">
                  + 1 line
                </span>
              </div>
              <div className="mt-0.5 truncate font-mono text-[10.5px] text-muted">
                withTrackMCP(server)
              </div>
            </div>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {TOOLS.map((t) => (
              <span
                key={t}
                className="rounded-md border border-line bg-paper px-1.5 py-0.5 font-mono text-[10px] text-body"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <Connector flowing={flowing} label="captures every call" tone="brand" />

        {/* ── Layer 3 · TrackMCP ── */}
        <LayerLabel index="3" text="TrackMCP captures and synthesizes" />
        <div className="relative overflow-hidden rounded-xl border border-brand/40 bg-brand-soft/40 p-3 shadow-[0_16px_40px_-24px_rgba(22,163,74,0.5)]">
          {flowing && (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/50 to-transparent"
              initial={{ x: "-30%" }}
              animate={{ x: "160%" }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <div className="relative flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white ring-1 ring-brand/30">
              <TrackMCPMark size={18} className="text-ink" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <TrackMCPLogo asLink={false} size="footer" variant="mono" className="text-[13.5px]" />
                <span className="rounded-full bg-white px-1.5 py-0.5 text-[9.5px] font-medium text-brand-strong ring-1 ring-brand/20">
                  analytics layer
                </span>
              </div>
              <div className="mt-0.5 text-[11px] leading-tight text-body">
                Groups calls into sessions, attributes clients, finds failures
              </div>
            </div>
            <span className="hidden shrink-0 items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-brand-strong ring-1 ring-brand/20 sm:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-brand" /> Live
            </span>
          </div>
        </div>

        <Connector flowing={flowing} label="delivers" tone="brand" />

        {/* ── Layer 4 · Outcomes ── */}
        <LayerLabel index="4" text="You get the outcomes" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
          {OUTCOMES.map((o) => (
            <div
              key={o.key}
              className="flex flex-col gap-1.5 rounded-xl border border-line bg-white px-2.5 py-2.5 shadow-sm"
            >
              <span className={`grid h-7 w-7 place-items-center rounded-lg ${o.tile}`}>
                <o.icon size={14} />
              </span>
              <span className="text-[11.5px] font-medium leading-tight text-ink">{o.label}</span>
              <span className="font-mono text-[11px] leading-tight text-muted">{o.value}</span>
            </div>
          ))}
        </div>

        {/* the plain-English answer — the real deliverable */}
        <div className="mt-2.5 rounded-xl border border-line bg-paper p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-brand-strong">
            <Sparkles size={12} /> The answer, in plain English
          </div>
          <p className="mt-1.5 text-[12.5px] leading-snug text-ink">
            <span className="font-mono font-medium">send_email</span> fails{" "}
            <span className="font-semibold text-rose-600">94%</span> of the time — agents send a
            string, your schema wants an array.
          </p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-ink px-2 py-1 text-[11px] font-medium text-white">
            Fix the schema <ArrowRight size={11} />
          </span>
        </div>
      </div>
    </div>
  );
}

function LayerLabel({ index, text }: { index: string; text: string }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="grid h-4 w-4 place-items-center rounded-full bg-ink text-[9px] font-bold text-white">
        {index}
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
        {text}
      </span>
    </div>
  );
}

/* A vertical flowing connector: four downward currents aligned to the 4 columns,
   with a centered label chip. Seamless marching dashes (no snap). */
function Connector({
  flowing,
  label,
  tone = "neutral",
}: {
  flowing: boolean;
  label: string;
  tone?: "neutral" | "brand";
}) {
  const H = 46;
  const xs = [125, 375, 625, 875];
  const stroke = tone === "brand" ? "var(--color-brand)" : "var(--color-line-strong)";
  return (
    <div className="relative my-2.5" style={{ height: H }}>
      <svg
        viewBox={`0 0 1000 ${H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        {xs.map((x, i) => (
          <g key={x}>
            <line x1={x} y1={0} x2={x} y2={H} stroke="var(--color-line)" strokeWidth="1.5" />
            {flowing && (
              <motion.line
                x1={x}
                y1={0}
                x2={x}
                y2={H}
                stroke={stroke}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="3 13"
                initial={false}
                animate={{ strokeDashoffset: [0, -16] }}
                transition={{ duration: 0.9 + i * 0.05, repeat: Infinity, ease: "linear" }}
              />
            )}
          </g>
        ))}
      </svg>
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-line bg-white px-2 py-0.5 text-[9.5px] font-medium uppercase tracking-wide text-muted shadow-sm">
        {label}
      </span>
    </div>
  );
}
