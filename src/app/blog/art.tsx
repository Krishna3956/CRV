/* On-brand SVG illustrations for blog covers and inline figures. No external
   images — every scene is a small, meaningful diagram drawn from the product's
   own visual language (ink + brand green on a soft gridded card). */

export type ArtKey =
  | "protocol"
  | "errors"
  | "bars"
  | "funnel"
  | "clients"
  | "latency"
  | "schema"
  | "default";

const C = {
  ink: "#171717",
  body: "#3f3f46",
  muted: "#71717a",
  faint: "#a1a1aa",
  line: "#e4e4e7",
  paper: "#fafafa",
  mist: "#f4f4f5",
  brand: "#16a34a",
  brandStrong: "#15803d",
  brandSoft: "#dcfce7",
  red: "#dc2626",
  redSoft: "#fee2e2",
  white: "#ffffff",
};

function Bg() {
  return (
    <>
      <rect x="0" y="0" width="480" height="240" fill={C.paper} />
      <g stroke={C.line} strokeWidth="1" opacity="0.7">
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 48} y1="0" x2={i * 48} y2="240" />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 48} x2="480" y2={i * 48} />
        ))}
      </g>
    </>
  );
}

function Protocol() {
  return (
    <>
      <Bg />
      {/* dashed wrapper */}
      <rect x="56" y="52" width="368" height="136" rx="18" fill="none" stroke={C.brand} strokeWidth="2" strokeDasharray="6 6" />
      <rect x="70" y="36" width="120" height="22" rx="11" fill={C.brand} />
      <text x="130" y="51" textAnchor="middle" fontFamily="monospace" fontSize="12" fill={C.white}>trackmcp</text>
      {/* server box */}
      <rect x="96" y="82" width="288" height="78" rx="12" fill={C.white} stroke={C.line} strokeWidth="1.5" />
      <circle cx="116" cy="102" r="4" fill={C.brand} />
      <text x="130" y="106" fontFamily="monospace" fontSize="12" fill={C.ink}>mcp-server</text>
      {/* tool chips */}
      {["search", "query", "email"].map((t, i) => (
        <g key={t}>
          <rect x={118 + i * 88} y="122" width="76" height="24" rx="6" fill={C.mist} stroke={C.line} />
          <text x={156 + i * 88} y="138" textAnchor="middle" fontFamily="monospace" fontSize="11" fill={C.muted}>{t}</text>
        </g>
      ))}
      {/* flow arrow */}
      <line x1="20" y1="120" x2="52" y2="120" stroke={C.faint} strokeWidth="2" />
      <path d="M52 120 l-8 -4 v8 z" fill={C.faint} />
      <line x1="428" y1="120" x2="460" y2="120" stroke={C.faint} strokeWidth="2" />
      <path d="M460 120 l-8 -4 v8 z" fill={C.faint} />
    </>
  );
}

function Errors() {
  return (
    <>
      <Bg />
      <rect x="70" y="58" width="340" height="124" rx="14" fill={C.white} stroke={C.line} strokeWidth="1.5" />
      {/* 200 OK badge */}
      <rect x="90" y="80" width="96" height="30" rx="8" fill={C.brandSoft} />
      <circle cx="108" cy="95" r="4" fill={C.brand} />
      <text x="120" y="99" fontFamily="monospace" fontSize="13" fill={C.brandStrong}>200 OK</text>
      {/* hidden error */}
      <rect x="90" y="122" width="300" height="40" rx="8" fill={C.redSoft} />
      <text x="104" y="139" fontFamily="monospace" fontSize="11" fill={C.red}>&quot;isError&quot;: true</text>
      <text x="104" y="153" fontFamily="monospace" fontSize="10" fill={C.muted}>to: expected array, got string</text>
      <text x="360" y="99" textAnchor="end" fontFamily="monospace" fontSize="11" fill={C.faint}>124ms</text>
    </>
  );
}

function Bars() {
  const data = [92, 64, 40, 22, 10, 3, 0, 0];
  return (
    <>
      <Bg />
      <line x1="56" y1="180" x2="424" y2="180" stroke={C.line} strokeWidth="1.5" />
      {data.map((v, i) => {
        const h = (v / 100) * 120;
        const x = 62 + i * 46;
        const dead = v === 0;
        return (
          <g key={i}>
            <rect
              x={x}
              y={180 - h}
              width="30"
              height={dead ? 3 : h}
              rx="4"
              fill={dead ? C.line : i === 0 ? C.brand : C.ink}
              opacity={dead ? 1 : i === 0 ? 1 : 0.85 - i * 0.06}
            />
          </g>
        );
      })}
      <rect x="286" y="150" width="128" height="24" rx="6" fill={C.white} stroke={C.line} />
      <text x="350" y="166" textAnchor="middle" fontFamily="monospace" fontSize="11" fill={C.muted}>dead tools</text>
    </>
  );
}

function Funnel() {
  const rows = [
    { label: "Connected", w: 320, v: "8,240" },
    { label: "Reached a tool", w: 250, v: "6,010" },
    { label: "Completed", w: 150, v: "3,120" },
  ];
  return (
    <>
      <Bg />
      {rows.map((r, i) => (
        <g key={r.label}>
          <rect x="80" y={62 + i * 46} width={r.w} height="32" rx="8" fill={i === 2 ? C.brand : C.ink} opacity={i === 2 ? 1 : 0.9 - i * 0.15} />
          <text x="92" y={83 + i * 46} fontFamily="system-ui" fontSize="12" fill={C.white}>{r.label}</text>
          <text x={80 + r.w + 12} y={83 + i * 46} fontFamily="monospace" fontSize="12" fill={C.muted}>{r.v}</text>
        </g>
      ))}
      {/* drop markers */}
      <text x="360" y="130" fontFamily="monospace" fontSize="11" fill={C.red}>-27%</text>
      <text x="270" y="176" fontFamily="monospace" fontSize="11" fill={C.red}>-48%</text>
    </>
  );
}

function Clients() {
  const segs = [
    { w: 168, c: C.brand, label: "Claude" },
    { w: 120, c: C.ink, label: "Cursor" },
    { w: 64, c: C.muted, label: "ChatGPT" },
    { w: 32, c: C.faint, label: "Custom" },
  ];
  let x = 80;
  return (
    <>
      <Bg />
      <text x="80" y="70" fontFamily="system-ui" fontSize="12" fill={C.muted}>Client mix</text>
      <g>
        {segs.map((s) => {
          const el = <rect key={s.label} x={x} y="84" width={s.w - 4} height="34" rx="6" fill={s.c} />;
          x += s.w;
          return el;
        })}
      </g>
      <g>
        {segs.map((s, i) => (
          <g key={s.label}>
            <rect x={80 + i * 92} y="146" width="10" height="10" rx="2" fill={s.c} />
            <text x={96 + i * 92} y="155" fontFamily="system-ui" fontSize="11" fill={C.body}>{s.label}</text>
          </g>
        ))}
      </g>
    </>
  );
}

function Latency() {
  const pts = [
    [64, 150], [110, 140], [156, 146], [202, 132], [248, 138], [294, 96], [340, 150], [386, 60], [416, 128],
  ];
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]} ${p[1]}`).join(" ");
  const area = `${line} L416 180 L64 180 Z`;
  return (
    <>
      <Bg />
      <path d={area} fill={C.brandSoft} opacity="0.6" />
      <path d={line} fill="none" stroke={C.brand} strokeWidth="2.5" />
      {/* p95 dashed */}
      <line x1="56" y1="70" x2="424" y2="70" stroke={C.red} strokeWidth="1.5" strokeDasharray="5 5" />
      <text x="424" y="66" textAnchor="end" fontFamily="monospace" fontSize="11" fill={C.red}>p95</text>
      <circle cx="386" cy="60" r="5" fill={C.red} stroke={C.white} strokeWidth="2" />
      <text x="56" y="126" fontFamily="monospace" fontSize="11" fill={C.muted}>p50</text>
    </>
  );
}

function Schema() {
  return (
    <>
      <Bg />
      <rect x="64" y="54" width="352" height="132" rx="12" fill={C.ink} />
      <g fontFamily="monospace" fontSize="12">
        <text x="82" y="82" fill="#7dd3fc">send_email<tspan fill="#e4e4e7">(&#123;</tspan></text>
        <rect x="96" y="92" width="220" height="20" rx="4" fill="rgba(220,38,38,0.18)" />
        <text x="104" y="107" fill="#fca5a5">to: &quot;a@x.com&quot;   // string</text>
        <rect x="96" y="120" width="220" height="20" rx="4" fill="rgba(22,163,74,0.18)" />
        <text x="104" y="135" fill="#86efac">to: [&quot;a@x.com&quot;] // array</text>
        <text x="82" y="162" fill="#e4e4e7">&#125;)</text>
      </g>
    </>
  );
}

function Default() {
  return (
    <>
      <Bg />
      <g transform="translate(240 120) scale(3.6)">
        <g transform="translate(-16 -16)" fill="none" stroke={C.ink} strokeWidth="1.6">
          <circle cx="16" cy="6" r="3.2" fill={C.brand} stroke="none" />
          <circle cx="7" cy="22" r="3.2" fill={C.ink} stroke="none" />
          <circle cx="25" cy="22" r="3.2" fill={C.ink} stroke="none" />
          <path d="M16 9 L8.5 19 M16 9 L23.5 19 M9.5 22 L22.5 22" />
        </g>
      </g>
    </>
  );
}

const SCENES: Record<ArtKey, () => React.ReactElement> = {
  protocol: Protocol,
  errors: Errors,
  bars: Bars,
  funnel: Funnel,
  clients: Clients,
  latency: Latency,
  schema: Schema,
  default: Default,
};

export function BlogArt({
  art,
  className = "",
  fit = "meet",
}: {
  art: ArtKey;
  className?: string;
  fit?: "meet" | "slice";
}) {
  const Scene = SCENES[art] ?? Default;
  return (
    <svg
      viewBox="0 0 480 240"
      preserveAspectRatio={`xMidYMid ${fit}`}
      className={className}
      role="img"
      aria-hidden
    >
      <Scene />
    </svg>
  );
}
