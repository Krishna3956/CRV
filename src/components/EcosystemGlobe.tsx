import { ArrowDown } from "lucide-react";
import { ClientMark, type ClientName } from "./ClientLogos";

/* MCP ecosystem network: agents (left) send calls through the TrackMCP
   analytics layer (center) to tools (right). A faint dotted "globe" sits
   behind the center to read as an ecosystem, not a geographic map.
   Desktop = radial SVG; mobile = a simplified vertical flow. */

const agents: { label: string; y: number }[] = [
  { label: "Claude", y: 112 },
  { label: "Cursor", y: 230 },
  { label: "ChatGPT", y: 348 },
];

const tools: { label: string; y: number; warn?: boolean }[] = [
  { label: "search_docs", y: 120 },
  { label: "run_query", y: 196 },
  { label: "create_issue", y: 272 },
  { label: "send_email", y: 348, warn: true },
];

const CX = 360;
const CY = 230;

function SignalDot({
  path,
  color,
  dur,
  begin,
}: {
  path: string;
  color: string;
  dur: number;
  begin: number;
}) {
  return (
    <circle r="3.4" fill={color}>
      <animateMotion dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite">
        <mpath href={`#${path}`} />
      </animateMotion>
      <animate
        attributeName="opacity"
        values="0;1;1;0"
        keyTimes="0;0.08;0.9;1"
        dur={`${dur}s`}
        begin={`${begin}s`}
        repeatCount="indefinite"
      />
    </circle>
  );
}

export function EcosystemGlobe({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      {/* ── Desktop radial network ── */}
      <svg
        viewBox="0 0 720 460"
        className="hidden h-auto w-full md:block"
        role="img"
        aria-label="AI agents Claude, Cursor and ChatGPT send tool calls through the TrackMCP analytics layer to MCP tools; the send_email path is failing."
      >
        <defs>
          <filter id="eg-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.4" />
          </filter>
        </defs>

        {/* faint dotted globe behind the center */}
        <g fill="none" stroke="#e5e5e5">
          <circle cx={CX} cy={CY} r="168" strokeDasharray="2 7" />
          <ellipse cx={CX} cy={CY} rx="168" ry="66" strokeDasharray="2 7" />
          <ellipse cx={CX} cy={CY} rx="66" ry="168" strokeDasharray="2 7" />
          <circle cx={CX} cy={CY} r="110" strokeDasharray="2 8" opacity="0.7" />
        </g>
        <g className="animate-breathe" style={{ transformOrigin: `${CX}px ${CY}px` }}>
          <circle cx={CX} cy={CY} r="72" fill="none" stroke="#e5e5e5" strokeWidth="1.5" strokeDasharray="4 7">
            <animateTransform attributeName="transform" type="rotate" from={`0 ${CX} ${CY}`} to={`360 ${CX} ${CY}`} dur="30s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* connection wires */}
        {agents.map((a, i) => {
          const d = `M158,${a.y} C 240,${a.y} 280,${CY} ${CX},${CY}`;
          const active = i === 0;
          return (
            <path
              key={`aw${i}`}
              id={`ag-${i}`}
              d={d}
              fill="none"
              stroke={active ? "#bbf7d0" : "#e5e5e5"}
              strokeWidth="1.5"
            />
          );
        })}
        {tools.map((t, i) => {
          const d = `M${CX},${CY} C 440,${CY} 470,${t.y} 548,${t.y}`;
          return (
            <path
              key={`tw${i}`}
              id={`tl-${i}`}
              d={d}
              fill="none"
              stroke={t.warn ? "#fcd9a8" : i === 0 ? "#bbf7d0" : "#e5e5e5"}
              strokeWidth="1.5"
            />
          );
        })}

        {/* traveling signals on active paths */}
        <SignalDot path="ag-0" color="#16a34a" dur={2.6} begin={0} />
        <SignalDot path="tl-0" color="#16a34a" dur={2.4} begin={-0.6} />
        <SignalDot path="tl-3" color="#f59e0b" dur={2.9} begin={-1.2} />

        {/* agent pills (left) */}
        {agents.map((a) => (
          <g key={a.label}>
            <rect x="40" y={a.y - 15} width="118" height="30" rx="15" fill="#fff" stroke="#e5e5e5" strokeWidth="1.5" />
            <circle cx="58" cy={a.y} r="3.2" fill="#16a34a" />
            <text x="72" y={a.y + 4} className="font-mono" fontSize="11.5" fill="#171717">
              {a.label}
            </text>
          </g>
        ))}

        {/* center analytics layer */}
        <g>
          <circle cx={CX} cy={CY} r="40" fill="#0a0a0a" />
          <rect x={CX - 13} y={CY - 11} width="26" height="6" rx="3" fill="#fff" />
          <rect x={CX - 3} y={CY - 11} width="6" height="22" rx="3" fill="#fff" />
        </g>
        <text x={CX} y={CY + 62} textAnchor="middle" className="font-mono" fontSize="11" fill="#6b7280">
          TrackMCP
        </text>

        {/* tool pills (right) */}
        {tools.map((t) => (
          <g key={t.label}>
            <rect
              x="548"
              y={t.y - 15}
              width="132"
              height="30"
              rx="15"
              fill="#fff"
              stroke={t.warn ? "#f59e0b" : "#e5e5e5"}
              strokeWidth="1.5"
            />
            <circle cx="566" cy={t.y} r="3.2" fill={t.warn ? "#f59e0b" : "#22c55e"} />
            <text x="580" y={t.y + 4} className="font-mono" fontSize="11" fill="#171717">
              {t.label}
            </text>
          </g>
        ))}
      </svg>

      {/* ── Mobile vertical flow ── */}
      <div className="md:hidden">
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-wide text-faint">
            Agents
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {(["Claude", "Cursor", "ChatGPT", "Custom"] as ClientName[]).map((c, i) => (
              <span
                key={c}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] ${
                  i === 0
                    ? "border-brand/40 bg-brand-soft text-brand-strong"
                    : "border-line bg-paper text-slate-600"
                }`}
              >
                <ClientMark name={c} size={12} /> {c}
              </span>
            ))}
          </div>

          <div className="my-2 flex justify-center text-brand">
            <ArrowDown size={18} />
          </div>

          <div className="mx-auto flex w-fit items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-white">
            <span className="font-display text-[15px] font-bold lowercase tracking-[-0.04em]">
              trackmcp
            </span>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10.5px]">
              analytics layer
            </span>
          </div>

          <div className="my-2 flex justify-center text-brand">
            <ArrowDown size={18} />
          </div>

          <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-wide text-faint">
            Tools
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {tools.map((t) => (
              <span
                key={t.label}
                className={`rounded-full border px-2.5 py-1 font-mono text-[11.5px] ${
                  t.warn
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-line bg-paper text-body"
                }`}
              >
                {t.label}
              </span>
            ))}
          </div>

          <div className="my-2 flex justify-center text-brand">
            <ArrowDown size={18} />
          </div>

          <p className="text-center text-[13px] font-medium text-ink">
            Insights you can act on
          </p>
        </div>
      </div>
    </div>
  );
}
