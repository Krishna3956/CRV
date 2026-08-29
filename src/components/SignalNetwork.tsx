/* TrackMCP signature graphic — "Signal"
   Agents emit signals that flow through the Hub to Tools and back.
   Pure SVG + SMIL (looping motion along exact paths) + CSS character motion. */

type Route = {
  id: string;
  d: string;
  color: "blue" | "amber";
  dur: number;
  begin: number;
};

const routes: Route[] = [
  { id: "r1", d: "M94,110 C 200,110 250,170 320,210 C 400,150 460,96 516,84", color: "blue", dur: 2.4, begin: 0 },
  { id: "r2", d: "M94,210 C 190,210 250,210 320,210 C 420,222 470,240 516,244", color: "blue", dur: 2.6, begin: -0.9 },
  { id: "r3", d: "M94,310 C 200,310 250,250 320,210 C 420,192 470,168 516,164", color: "blue", dur: 2.5, begin: -1.7 },
  { id: "r4", d: "M94,110 C 200,110 250,170 320,210 C 420,262 470,306 516,320", color: "amber", dur: 2.7, begin: -0.4 },
  { id: "r5", d: "M94,310 C 200,310 250,250 320,210 C 400,150 460,96 516,84", color: "blue", dur: 2.9, begin: -2.1 },
  { id: "r6", d: "M94,210 C 190,210 250,210 320,210 C 420,192 470,168 516,164", color: "blue", dur: 3.1, begin: -1.2 },
];

const agents = [
  { y: 110, label: "Claude" },
  { y: 210, label: "Cursor" },
  { y: 310, label: "ChatGPT" },
];

const staticWires = [
  "M94,110 C 200,110 250,170 320,210",
  "M94,210 C 190,210 250,210 320,210",
  "M94,310 C 200,310 250,250 320,210",
  "M320,210 C 400,150 460,96 516,84",
  "M320,210 C 420,192 470,168 516,164",
  "M320,210 C 420,222 470,240 516,244",
  "M320,210 C 420,262 470,306 516,320",
];

const tools = [
  { y: 84, label: "search_docs", error: false },
  { y: 164, label: "create_issue", error: false },
  { y: 244, label: "run_query", error: false },
  { y: 320, label: "send_email", error: true },
];

function Signal({ id, color, dur, begin }: Omit<Route, "d">) {
  const core = color === "amber" ? "#f59e0b" : "#16a34a";
  const halo = color === "amber" ? "#f59e0b" : "#16a34a";
  return (
    <g>
      <circle r="9" fill={halo} opacity="0.18" filter="url(#soft)">
        <animateMotion dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" rotate="auto">
          <mpath href={`#${id}`} />
        </animateMotion>
        <animate attributeName="opacity" values="0;0.18;0.18;0" keyTimes="0;0.1;0.85;1" dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
      </circle>
      <circle r="3.6" fill={core}>
        <animateMotion dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite">
          <mpath href={`#${id}`} />
        </animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.9;1" dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
      </circle>
    </g>
  );
}

export function SignalNetwork({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 50 640 320"
      className={`h-auto w-full ${className}`}
      role="img"
      aria-label="AI agents sending tool-call signals through TrackMCP to your MCP server tools"
    >
      <defs>
        <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* hidden pulse routes */}
      <g fill="none" stroke="none">
        {routes.map((r) => (
          <path key={r.id} id={r.id} d={r.d} />
        ))}
      </g>

      {/* static wires + flowing dash overlay */}
      {staticWires.map((d, i) => (
        <path key={`w${i}`} d={d} fill="none" stroke="#e5e5e5" strokeWidth="1.5" />
      ))}
      {staticWires.map((d, i) => (
        <path
          key={`f${i}`}
          d={d}
          fill="none"
          stroke="#bbf7d0"
          strokeWidth="1.5"
          className="wire-flow"
          style={{ animationDelay: `${i * -1.6}s` }}
        />
      ))}

      {/* signals */}
      {routes.map((r) => (
        <Signal key={r.id} id={r.id} color={r.color} dur={r.dur} begin={r.begin} />
      ))}

      {/* HUB */}
      <g className="animate-breathe" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
        <circle cx="320" cy="210" r="48" fill="none" stroke="#e5e5e5" strokeWidth="1.5" strokeDasharray="4 7">
          <animateTransform attributeName="transform" type="rotate" from="0 320 210" to="360 320 210" dur="24s" repeatCount="indefinite" />
        </circle>
        <circle cx="320" cy="210" r="34" fill="#0a0a0a" />
        {/* brand mark — network node */}
        <g transform="translate(302.1 192.1) scale(1.12)">
          <g stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M16 16 Q20.5 10 25 7" />
            <path d="M16 16 Q10 20.5 7 25" />
            <path d="M16 16 Q22.5 20 25 25" />
          </g>
          <g fill="#fff">
            <circle cx="7" cy="7" r="3.7" />
            <circle cx="25" cy="7" r="3.3" />
            <circle cx="7" cy="25" r="3.3" />
            <circle cx="25" cy="25" r="3.3" />
          </g>
          <circle cx="16" cy="16" r="3.9" fill="#4ade80" />
        </g>
      </g>

      {/* AGENTS */}
      {agents.map((a, i) => (
        <g key={a.label}>
          <g className="animate-bob" style={{ animationDelay: `${i * -1.3}s`, transformBox: "fill-box", transformOrigin: "center" }}>
            <rect x="48" y={a.y - 24} width="48" height="48" rx="13" fill="#fff" stroke="#e5e5e5" strokeWidth="1.5" />
            <g className="animate-blink" style={{ animationDelay: `${i * -0.7}s`, transformBox: "fill-box", transformOrigin: "center" }}>
              <circle cx="65" cy={a.y - 3} r="3" fill="#0a0a0a" />
              <circle cx="79" cy={a.y - 3} r="3" fill="#0a0a0a" />
            </g>
            <path d={`M64 ${a.y + 8} Q72 ${a.y + 13} 80 ${a.y + 8}`} stroke="#9ca3af" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </g>
          <text x="72" y={a.y + 40} textAnchor="middle" className="font-mono" fontSize="11" fill="#6b7280">
            {a.label}
          </text>
        </g>
      ))}

      {/* TOOLS */}
      {tools.map((t) => {
        const stroke = t.error ? "#f59e0b" : "#e5e5e5";
        const dot = t.error ? "#f59e0b" : "#22c55e";
        return (
          <g
            key={t.label}
            className={t.error ? "animate-wiggle" : undefined}
            style={t.error ? { transformBox: "fill-box", transformOrigin: "center" } : undefined}
          >
            <rect x="520" y={t.y - 15} width="104" height="30" rx="15" fill="#fff" stroke={stroke} strokeWidth="1.5" />
            <circle cx="536" cy={t.y} r="3.5" fill={dot}>
              {!t.error && (
                <animate attributeName="opacity" values="0.4;1;0.4" dur="2.4s" repeatCount="indefinite" />
              )}
            </circle>
            <text x="549" y={t.y + 4} className="font-mono" fontSize="10.5" fill="#171717">
              {t.label}
            </text>
            {t.error && (
              <g>
                <circle cx="618" cy={t.y - 14} r="8" fill="#f59e0b">
                  <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.55;0.62;0.9;1" dur="2.7s" repeatCount="indefinite" />
                </circle>
                <text x="618" y={t.y - 10} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">
                  !
                  <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.55;0.62;0.9;1" dur="2.7s" repeatCount="indefinite" />
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
