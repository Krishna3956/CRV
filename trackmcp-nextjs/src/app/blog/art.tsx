/* On-brand SVG illustrations for blog covers and inline figures. No external
   images — every scene is a small, meaningful diagram drawn from the product's
   own visual language (ink + brand green on a soft gridded card). */

export type ArtKey =
  | "protocol"
  | "foundation"
  | "errors"
  | "bars"
  | "funnel"
  | "clients"
  | "latency"
  | "schema"
  | "layers"
  | "inventory"
  | "observability"
  | "monitoring"
  | "privacy"
  | "sdk"
  | "remote"
  | "fleet"
  | "outcomes"
  | "adoption"
  | "catalog"
  | "release"
  | "compare"
  | "opentelemetry"
  | "buyer"
  | "testing-grid"
  | "security-grid"
  | "gateway-grid"
  | "registry-grid"
  | "load-grid"
  | "monitoring-grid"
  | "evaluation-grid"
  | "benchmark-grid"
  | "taxonomy-grid"
  | "telemetry-grid"
  | "scorecard-grid"
  | "adoption-grid"
  | "buyer-grid"
  | "testing-cover"
  | "security-cover"
  | "gateway-cover"
  | "registry-cover"
  | "load-cover"
  | "monitoring-cover"
  | "evaluation-cover"
  | "benchmark-cover"
  | "taxonomy-cover"
  | "telemetry-cover"
  | "scorecard-cover"
  | "adoption-cover"
  | "buyer-cover"
  | "testing-detail"
  | "security-detail"
  | "gateway-detail"
  | "registry-detail"
  | "load-detail"
  | "monitoring-detail"
  | "evaluation-detail"
  | "benchmark-detail"
  | "taxonomy-detail"
  | "telemetry-detail"
  | "scorecard-detail"
  | "adoption-detail"
  | "buyer-detail"
  | "analytics-build-cover"
  | "analytics-build-detail"
  | "analytics-scratch-cover"
  | "analytics-scratch-detail"
  | "analytics-event-cover"
  | "analytics-event-detail"
  | "analytics-metrics-cover"
  | "analytics-metrics-detail"
  | "analytics-architecture-cover"
  | "analytics-architecture-detail"
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

function Foundation() {
  return (
    <>
      <Bg />
      <rect x="44" y="44" width="392" height="152" rx="18" fill={C.white} stroke={C.line} strokeWidth="1.5" />
      <text x="68" y="70" fontFamily="system-ui" fontSize="12" fill={C.muted}>TrackMCP Foundation Release</text>
      <g>
        <rect x="68" y="88" width="102" height="72" rx="10" fill={C.ink} />
        <text x="119" y="112" textAnchor="middle" fontFamily="monospace" fontSize="11" fill={C.white}>event</text>
        <text x="119" y="130" textAnchor="middle" fontFamily="monospace" fontSize="11" fill="#86efac">contract v1</text>
        <text x="119" y="148" textAnchor="middle" fontFamily="monospace" fontSize="10" fill={C.faint}>stable ID</text>
      </g>
      <g>
        <rect x="189" y="88" width="102" height="72" rx="10" fill={C.brandSoft} stroke={C.brand} />
        <path d="M240 104 l16 7 v13 c0 12-8 20-16 24-8-4-16-12-16-24v-13z" fill={C.brand} />
        <path d="M232 124 l6 6 11-13" fill="none" stroke={C.white} strokeWidth="2.5" />
        <text x="240" y="153" textAnchor="middle" fontFamily="monospace" fontSize="10" fill={C.brandStrong}>redacted</text>
      </g>
      <g>
        <rect x="310" y="88" width="102" height="72" rx="10" fill={C.paper} stroke={C.line} />
        <path d="M326 143 L341 132 L355 137 L370 112 L396 126" fill="none" stroke={C.brand} strokeWidth="2.5" />
        <circle cx="341" cy="132" r="3" fill={C.ink} />
        <circle cx="370" cy="112" r="3" fill={C.red} />
        <text x="361" y="153" textAnchor="middle" fontFamily="monospace" fontSize="10" fill={C.muted}>trace + p95</text>
      </g>
      <path d="M171 124 H189 M291 124 H310" stroke={C.faint} strokeWidth="2" />
      <path d="M185 124 l-7 -4 v8 z M306 124 l-7 -4 v8 z" fill={C.faint} />
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

function Layers() {
  return (
    <>
      <Bg />
      {[
        { y: 38, label: "REGISTRY", sub: "find + describe", fill: C.white, stroke: C.line, color: C.ink },
        { y: 83, label: "GATEWAY", sub: "route + enforce", fill: C.ink, stroke: C.ink, color: C.white },
        { y: 128, label: "RUNTIME", sub: "host + isolate", fill: C.white, stroke: C.line, color: C.ink },
        { y: 173, label: "OBSERVABILITY", sub: "measure + explain", fill: C.brandSoft, stroke: C.brand, color: C.brandStrong },
      ].map((row) => (
        <g key={row.label}>
          <rect x="94" y={row.y} width="292" height="32" rx="9" fill={row.fill} stroke={row.stroke} strokeWidth="1.5" />
          <text x="110" y={row.y + 20} fontFamily="monospace" fontSize="11" fill={row.color}>{row.label}</text>
          <text x="370" y={row.y + 20} textAnchor="end" fontFamily="system-ui" fontSize="11" fill={row.color}>{row.sub}</text>
        </g>
      ))}
      <path d="M240 70 V80 M240 115 V125 M240 160 V170" stroke={C.faint} strokeWidth="2" />
      <path d="M240 80 l-4 -6 h8 z M240 125 l-4 -6 h8 z M240 170 l-4 -6 h8 z" fill={C.faint} />
    </>
  );
}

function Inventory() {
  return (
    <>
      <Bg />
      <rect x="76" y="48" width="328" height="144" rx="14" fill={C.white} stroke={C.line} strokeWidth="1.5" />
      <text x="96" y="73" fontFamily="system-ui" fontSize="12" fill={C.muted}>Server inventory</text>
      {["owner: platform-search", "environment: production", "auth: delegated OAuth"].map((label, i) => (
        <g key={label}>
          <rect x="96" y={87 + i * 29} width="288" height="22" rx="5" fill={i === 0 ? C.brandSoft : C.mist} />
          <circle cx="108" cy={98 + i * 29} r="3" fill={i === 0 ? C.brand : C.muted} />
          <text x="119" y={102 + i * 29} fontFamily="monospace" fontSize="10.5" fill={C.body}>{label}</text>
        </g>
      ))}
      <circle cx="374" cy="61" r="8" fill={C.brandSoft} stroke={C.brand} />
      <path d="M370 61 l3 3 5 -6" fill="none" stroke={C.brandStrong} strokeWidth="1.5" />
    </>
  );
}

function Observability() {
  return (
    <>
      <Bg />
      <text x="56" y="52" fontFamily="system-ui" fontSize="12" fill={C.muted}>server-boundary evidence</text>
      {[
        ["CONNECTION", "client + transport"],
        ["CATALOG", "tools + schemas"],
        ["CALL", "duration + result"],
        ["OUTCOME", "completed + failed"],
      ].map(([label, sub], i) => (
        <g key={label}>
          <rect x={56 + i * 94} y="86" width="82" height="70" rx="10" fill={i === 3 ? C.brandSoft : C.white} stroke={i === 3 ? C.brand : C.line} strokeWidth="1.5" />
          <circle cx={97 + i * 94} cy="106" r="7" fill={i === 3 ? C.brand : C.ink} />
          <text x={97 + i * 94} y="128" textAnchor="middle" fontFamily="monospace" fontSize="9.5" fill={C.ink}>{label}</text>
          <text x={97 + i * 94} y="143" textAnchor="middle" fontFamily="system-ui" fontSize="8.5" fill={C.muted}>{sub}</text>
          {i < 3 ? <path d={`M${138 + i * 94} 121 H${150 + i * 94}`} stroke={C.faint} strokeWidth="2" /> : null}
        </g>
      ))}
    </>
  );
}

function Monitoring() {
  return (
    <>
      <Bg />
      <text x="64" y="51" fontFamily="system-ui" fontSize="12" fill={C.muted}>from reachable to useful</text>
      {["REACHABLE", "NEGOTIATED", "CATALOG", "TOOL RESULT"].map((label, i) => (
        <g key={label}>
          <rect x="64" y={70 + i * 34} width={260 - i * 18} height="22" rx="6" fill={i === 3 ? C.brand : i === 2 ? C.ink : C.white} stroke={i === 3 ? C.brand : C.line} />
          <text x="76" y={85 + i * 34} fontFamily="monospace" fontSize="10" fill={i >= 2 ? C.white : C.body}>{label}</text>
          <text x="420" y={85 + i * 34} textAnchor="end" fontFamily="monospace" fontSize="10" fill={i === 3 ? C.brandStrong : C.muted}>{i === 3 ? "useful" : "check"}</text>
        </g>
      ))}
    </>
  );
}

function Privacy() {
  return (
    <>
      <Bg />
      <rect x="56" y="82" width="112" height="70" rx="10" fill={C.white} stroke={C.line} />
      <text x="112" y="108" textAnchor="middle" fontFamily="monospace" fontSize="10" fill={C.ink}>tool result</text>
      <text x="112" y="128" textAnchor="middle" fontFamily="system-ui" fontSize="9" fill={C.red}>customer data</text>
      <path d="M176 117 H214" stroke={C.faint} strokeWidth="2" /><path d="M214 117 l-8 -4 v8 z" fill={C.faint} />
      <rect x="220" y="70" width="112" height="94" rx="10" fill={C.brandSoft} stroke={C.brand} />
      <path d="M276 88 l18 8 v16 c0 14-9 23-18 28-9-5-18-14-18-28V96z" fill={C.brand} />
      <path d="M266 112 l7 7 14-16" fill="none" stroke={C.white} strokeWidth="2.5" />
      <text x="276" y="154" textAnchor="middle" fontFamily="monospace" fontSize="9" fill={C.brandStrong}>redact locally</text>
      <path d="M340 117 H378" stroke={C.faint} strokeWidth="2" /><path d="M378 117 l-8 -4 v8 z" fill={C.faint} />
      <rect x="384" y="82" width="40" height="70" rx="8" fill={C.white} stroke={C.line} />
      <text x="404" y="105" textAnchor="middle" fontFamily="monospace" fontSize="8" fill={C.muted}>safe</text>
      <text x="404" y="120" textAnchor="middle" fontFamily="monospace" fontSize="8" fill={C.muted}>meta</text>
      <text x="404" y="135" textAnchor="middle" fontFamily="monospace" fontSize="8" fill={C.muted}>only</text>
    </>
  );
}

function Sdk() {
  return (
    <>
      <Bg />
      <rect x="64" y="48" width="352" height="144" rx="12" fill={C.ink} />
      <text x="84" y="75" fontFamily="monospace" fontSize="11" fill="#86efac">server.ts</text>
      <text x="84" y="101" fontFamily="monospace" fontSize="11" fill="#7dd3fc">withTrackMCP</text>
      <text x="84" y="122" fontFamily="monospace" fontSize="11" fill={C.white}>(server, &#123;</text>
      <text x="104" y="143" fontFamily="monospace" fontSize="11" fill="#fcd34d">apiKey: env.TRACKMCP_KEY</text>
      <text x="84" y="164" fontFamily="monospace" fontSize="11" fill={C.white}>&#125;)</text>
      <rect x="318" y="80" width="78" height="26" rx="6" fill={C.brand} /><text x="357" y="97" textAnchor="middle" fontFamily="monospace" fontSize="10" fill={C.white}>boundary</text>
    </>
  );
}

function Remote() {
  return (
    <>
      <Bg />
      {["CLIENT", "GATEWAY", "MCP SERVER", "DEPENDENCY"].map((label, i) => (
        <g key={label}>
          <rect x={30 + i * 112} y="92" width="94" height="56" rx="10" fill={i === 2 ? C.brandSoft : C.white} stroke={i === 2 ? C.brand : C.line} strokeWidth="1.5" />
          <text x={77 + i * 112} y="116" textAnchor="middle" fontFamily="monospace" fontSize="9" fill={C.ink}>{label}</text>
          <text x={77 + i * 112} y="132" textAnchor="middle" fontFamily="system-ui" fontSize="8" fill={C.muted}>{i === 1 ? "auth + route" : i === 2 ? "tools + result" : i === 0 ? "discover + call" : "slow or down"}</text>
          {i < 3 ? <path d={`M${124 + i * 112} 120 H${136 + i * 112}`} stroke={C.faint} strokeWidth="2" /> : null}
        </g>
      ))}
      <text x="240" y="67" textAnchor="middle" fontFamily="system-ui" fontSize="12" fill={C.muted}>remote HTTP path</text>
    </>
  );
}

function Fleet() {
  return (
    <>
      <Bg />
      <text x="64" y="51" fontFamily="system-ui" fontSize="12" fill={C.muted}>MCP server fleet</text>
      {["search / prod", "billing / prod", "docs / staging", "crm / prod"].map((label, i) => (
        <g key={label}>
          <rect x={64 + (i % 2) * 188} y={70 + Math.floor(i / 2) * 62} width="164" height="44" rx="9" fill={i === 0 ? C.brandSoft : C.white} stroke={i === 0 ? C.brand : C.line} />
          <circle cx={82 + (i % 2) * 188} cy={92 + Math.floor(i / 2) * 62} r="5" fill={i === 0 ? C.brand : C.muted} />
          <text x={95 + (i % 2) * 188} y={96 + Math.floor(i / 2) * 62} fontFamily="monospace" fontSize="9.5" fill={C.ink}>{label}</text>
          <text x={212 + (i % 2) * 188} y={96 + Math.floor(i / 2) * 62} textAnchor="end" fontFamily="system-ui" fontSize="8.5" fill={C.muted}>{i === 0 ? "healthy" : "owner"}</text>
        </g>
      ))}
    </>
  );
}

function Outcomes() {
  return (
    <>
      <Bg />
      <text x="64" y="51" fontFamily="system-ui" fontSize="12" fill={C.muted}>result state is not outcome</text>
      <rect x="64" y="78" width="148" height="70" rx="10" fill={C.white} stroke={C.line} />
      <text x="138" y="104" textAnchor="middle" fontFamily="monospace" fontSize="10" fill={C.ink}>tool result</text>
      <text x="138" y="127" textAnchor="middle" fontFamily="monospace" fontSize="10" fill={C.brandStrong}>returned</text>
      <path d="M224 113 H256" stroke={C.faint} strokeWidth="2" /><path d="M256 113 l-8 -4 v8 z" fill={C.faint} />
      <rect x="268" y="78" width="148" height="70" rx="10" fill={C.brandSoft} stroke={C.brand} />
      <text x="342" y="104" textAnchor="middle" fontFamily="monospace" fontSize="10" fill={C.ink}>workflow</text>
      <text x="342" y="127" textAnchor="middle" fontFamily="monospace" fontSize="10" fill={C.brandStrong}>completed</text>
      <text x="240" y="178" textAnchor="middle" fontFamily="system-ui" fontSize="10" fill={C.red}>emit explicit outcome</text>
    </>
  );
}

function Adoption() {
  return (
    <>
      <Bg />
      <text x="64" y="51" fontFamily="system-ui" fontSize="12" fill={C.muted}>tool adoption path</text>
      {[{ l: "exposed", w: 328, c: C.ink }, { l: "called", w: 248, c: C.muted }, { l: "succeeded", w: 184, c: C.brand }, { l: "completed", w: 124, c: C.brandStrong }].map((row, i) => (
        <g key={row.l}><rect x="64" y={68 + i * 33} width={row.w} height="22" rx="6" fill={row.c} /><text x="76" y={83 + i * 33} fontFamily="monospace" fontSize="10" fill={C.white}>{row.l}</text><text x={row.w + 76} y={83 + i * 33} fontFamily="monospace" fontSize="10" fill={C.muted}>{[100, 76, 56, 38][i]}%</text></g>
      ))}
    </>
  );
}

function Catalog() {
  return (
    <>
      <Bg />
      <rect x="58" y="48" width="168" height="144" rx="12" fill={C.white} stroke={C.line} />
      <rect x="252" y="48" width="168" height="144" rx="12" fill={C.white} stroke={C.line} />
      <text x="76" y="74" fontFamily="monospace" fontSize="10" fill={C.muted}>release N</text>
      <text x="270" y="74" fontFamily="monospace" fontSize="10" fill={C.muted}>release N+1</text>
      {["search_docs", "create_issue", "run_query"].map((label, i) => <g key={label}><text x="76" y={103 + i * 25} fontFamily="monospace" fontSize="9.5" fill={C.body}>{label}</text><text x="270" y={103 + i * 25} fontFamily="monospace" fontSize="9.5" fill={i === 1 ? C.red : C.body}>{i === 1 ? "schema changed" : label}</text></g>)}
      <text x="240" y="126" textAnchor="middle" fontFamily="monospace" fontSize="14" fill={C.red}>Δ</text>
    </>
  );
}

function Release() {
  return (
    <>
      <Bg />
      <line x1="68" y1="126" x2="414" y2="126" stroke={C.faint} strokeWidth="2" />
      {[{ x: 92, l: "baseline" }, { x: 190, l: "canary" }, { x: 288, l: "rollout" }, { x: 386, l: "evidence" }].map((item, i) => <g key={item.l}><circle cx={item.x} cy="126" r="9" fill={i === 3 ? C.brand : C.white} stroke={i === 3 ? C.brand : C.ink} strokeWidth="2" /><text x={item.x} y="158" textAnchor="middle" fontFamily="monospace" fontSize="9" fill={C.muted}>{item.l}</text></g>)}
      <text x="68" y="70" fontFamily="system-ui" fontSize="12" fill={C.muted}>release → traffic → evidence</text>
      <text x="68" y="91" fontFamily="monospace" fontSize="10" fill={C.brandStrong}>error rate · p95 · catalog · outcome</text>
    </>
  );
}

function Compare() {
  return (
    <>
      <Bg />
      {[{ x: 48, title: "MCP", sub: "server boundary", fill: C.brandSoft, stroke: C.brand }, { x: 184, title: "AGENT", sub: "model + tools", fill: C.white, stroke: C.line }, { x: 320, title: "APM", sub: "infra + app", fill: C.white, stroke: C.line }].map((card) => <g key={card.title}><rect x={card.x} y="70" width="112" height="94" rx="12" fill={card.fill} stroke={card.stroke} strokeWidth="1.5" /><text x={card.x + 56} y="104" textAnchor="middle" fontFamily="monospace" fontSize="11" fill={C.ink}>{card.title}</text><text x={card.x + 56} y="126" textAnchor="middle" fontFamily="system-ui" fontSize="9" fill={C.muted}>{card.sub}</text></g>)}
      <path d="M160 117 H184 M296 117 H320" stroke={C.faint} strokeWidth="2" />
      <text x="240" y="194" textAnchor="middle" fontFamily="system-ui" fontSize="10" fill={C.muted}>complementary evidence, different boundaries</text>
    </>
  );
}

function OpenTelemetry() {
  return (
    <>
      <Bg />
      <text x="64" y="52" fontFamily="system-ui" fontSize="12" fill={C.muted}>one trace, named boundaries</text>
      {["gateway", "mcp tool", "database"].map((label, i) => <g key={label}><rect x={64 + i * 124} y="88" width="100" height="42" rx="8" fill={i === 1 ? C.brandSoft : C.white} stroke={i === 1 ? C.brand : C.line} /><text x={114 + i * 124} y="113" textAnchor="middle" fontFamily="monospace" fontSize="10" fill={C.ink}>{label}</text>{i < 2 ? <path d={`M${164 + i * 124} 109 H${180 + i * 124}`} stroke={C.faint} strokeWidth="2" /> : null}</g>)}
      <line x1="64" y1="154" x2="388" y2="154" stroke={C.red} strokeWidth="1.5" strokeDasharray="5 5" /><text x="388" y="174" textAnchor="end" fontFamily="monospace" fontSize="9" fill={C.red}>preserve MCP fields</text>
    </>
  );
}

function Buyer() {
  return (
    <>
      <Bg />
      <rect x="72" y="50" width="336" height="142" rx="14" fill={C.white} stroke={C.line} />
      <text x="94" y="77" fontFamily="system-ui" fontSize="12" fill={C.muted}>evaluation scorecard</text>
      {["boundary coverage", "privacy + retention", "incident usefulness", "total operating cost"].map((label, i) => <g key={label}><text x="94" y={103 + i * 21} fontFamily="system-ui" fontSize="10" fill={C.body}>{label}</text><rect x="274" y={94 + i * 21} width="100" height="10" rx="5" fill={C.mist} /><rect x="274" y={94 + i * 21} width={[82, 66, 91, 54][i]} height="10" rx="5" fill={i === 2 ? C.brand : C.ink} /></g>)}
    </>
  );
}

function ComparisonGrid({
  title,
  labels,
  accent = C.brand,
}: {
  title: string;
  labels: string[];
  accent?: string;
}) {
  return (
    <>
      <Bg />
      <text x="56" y="48" fontFamily="system-ui" fontSize="12" fill={C.muted}>{title}</text>
      <text x="424" y="48" textAnchor="end" fontFamily="monospace" fontSize="10" fill={C.faint}>one card per boundary</text>
      {labels.map((label, i) => {
        const x = 56 + (i % 3) * 126;
        const y = 68 + Math.floor(i / 3) * 58;
        const isTrack = label === "TrackMCP";
        return (
          <g key={label}>
            <rect x={x} y={y} width="108" height="40" rx="9" fill={isTrack ? C.brandSoft : C.white} stroke={isTrack ? accent : C.line} strokeWidth="1.5" />
            <circle cx={x + 15} cy={y + 20} r="5" fill={isTrack ? accent : i % 2 ? C.ink : C.muted} />
            <text x={x + 27} y={y + 24} fontFamily="monospace" fontSize="9.5" fill={isTrack ? C.brandStrong : C.ink}>{label}</text>
          </g>
        );
      })}
      <path d="M56 195 H424" stroke={C.line} />
      <text x="56" y="216" fontFamily="system-ui" fontSize="10" fill={C.muted}>compare coverage · evidence · limits · fit</text>
    </>
  );
}

const TestingGrid = () => <ComparisonGrid title="MCP testing stack" labels={["Inspector", "Conformance", "Postman", "Promptfoo", "MCPJam", "TrackMCP"]} />;
const SecurityGrid = () => <ComparisonGrid title="MCP security layers" labels={["Static", "Dependencies", "Runtime", "Red team", "Policy", "TrackMCP"]} accent={C.red} />;
const GatewayGrid = () => <ComparisonGrid title="MCP gateway boundaries" labels={["Policy", "Routing", "Identity", "Registry", "Direct", "TrackMCP"]} />;
const RegistryGrid = () => <ComparisonGrid title="MCP discovery surfaces" labels={["Official", "Glama", "Smithery", "Metorial", "PopMCP", "TrackMCP"]} />;
const LoadGrid = () => <ComparisonGrid title="MCP reliability test bench" labels={["k6", "Locust", "Artillery", "MCPTest", "Inspector", "TrackMCP"]} />;
const MonitoringGrid = () => <ComparisonGrid title="MCP monitoring data" labels={["Grafana", "Datadog", "Sentry", "New Relic", "Agent traces", "TrackMCP"]} />;
const EvaluationGrid = () => <ComparisonGrid title="MCP agent evaluation" labels={["LangSmith", "Langfuse", "Phoenix", "Braintrust", "Promptfoo", "TrackMCP"]} />;
const BenchmarkGrid = () => <ComparisonGrid title="Benchmark dimensions" labels={["Load", "Scenarios", "Telemetry", "Variance", "Outcomes", "TrackMCP"]} />;
const TaxonomyGrid = () => <ComparisonGrid title="Failure evidence map" labels={["Protocol", "Application", "Infra", "Trace", "Runbook", "TrackMCP"]} accent={C.red} />;
const TelemetryGrid = () => <ComparisonGrid title="Telemetry field ownership" labels={["Trace", "Server", "Errors", "Service", "Agent", "TrackMCP"]} />;
const ScorecardGrid = () => <ComparisonGrid title="Reliability scorecard" labels={["Conformance", "Latency", "Errors", "Context", "Safety", "TrackMCP"]} />;
const AdoptionGrid = () => <ComparisonGrid title="Adoption funnel" labels={["Exposed", "Discovered", "Called", "Succeeded", "Outcome", "TrackMCP"]} />;
const BuyerGrid = () => <ComparisonGrid title="Buyer evidence boundaries" labels={["MCP", "OTel", "APM", "Errors", "Agent", "TrackMCP"]} />;

/* Wave 2 editorial visuals. These are intentionally code-native rather than
   stock or generic generated images: each scene names the article's actual
   decision surface and leaves enough negative space for the wide cover crop. */
type WaveVisualKind =
  | "testing" | "security" | "gateway" | "registry" | "load" | "monitoring"
  | "evaluation" | "benchmark" | "taxonomy" | "telemetry" | "scorecard" | "adoption" | "buyer";

const waveVisualData: Record<WaveVisualKind, { label: string; accent: string; chips: string[] }> = {
  testing: { label: "failure reproduction", accent: C.brand, chips: ["fixture", "assert", "result"] },
  security: { label: "risk surface", accent: C.red, chips: ["content", "policy", "side effect"] },
  gateway: { label: "request boundary", accent: C.brand, chips: ["identity", "route", "audit"] },
  registry: { label: "catalog trust", accent: C.brand, chips: ["owner", "version", "verify"] },
  load: { label: "pressure model", accent: C.brand, chips: ["ramp", "tail", "retry"] },
  monitoring: { label: "live evidence", accent: C.brand, chips: ["client", "tool", "outcome"] },
  evaluation: { label: "agent behavior", accent: C.brand, chips: ["select", "call", "finish"] },
  benchmark: { label: "reproducible measure", accent: C.brand, chips: ["fixture", "window", "limit"] },
  taxonomy: { label: "failure boundary", accent: C.red, chips: ["protocol", "app", "infra"] },
  telemetry: { label: "field ownership", accent: C.brand, chips: ["span", "event", "metric"] },
  scorecard: { label: "health dimensions", accent: C.brand, chips: ["availability", "latency", "safety"] },
  adoption: { label: "usage path", accent: C.brand, chips: ["exposed", "called", "complete"] },
  buyer: { label: "selection evidence", accent: C.brand, chips: ["coverage", "privacy", "cost"] },
};

function WaveCover({ kind }: { kind: WaveVisualKind }) {
  const d = waveVisualData[kind];
  return (
    <>
      <Bg />
      <text x="56" y="46" fontFamily="system-ui" fontSize="12" fill={C.muted}>{d.label}</text>
      <text x="424" y="46" textAnchor="end" fontFamily="monospace" fontSize="10" fill={C.faint}>TrackMCP editorial</text>
      <rect x="56" y="64" width="368" height="126" rx="16" fill={C.white} stroke={C.line} strokeWidth="1.5" />
      {kind === "testing" && <>
        <rect x="78" y="84" width="160" height="84" rx="10" fill={C.ink} />
        <circle cx="94" cy="98" r="4" fill={C.brand} /><circle cx="108" cy="98" r="4" fill={C.red} />
        {["connect()", "tools/list", "call → result"].map((t, i) => <text key={t} x="86" y={122 + i * 15} fontFamily="monospace" fontSize="10" fill={i === 2 ? "#86efac" : C.white}>{t}</text>)}
        <path d="M258 105 H382 M258 130 H354 M258 155 H388" stroke={C.line} strokeWidth="7" strokeLinecap="round" />
        <circle cx="258" cy="105" r="5" fill={C.brand} /><circle cx="258" cy="130" r="5" fill={C.brand} /><circle cx="258" cy="155" r="5" fill={C.red} />
      </>}
      {kind === "security" && <>
        <path d="M142 84 L190 102 V132 C190 151 175 164 142 174 C109 164 94 151 94 132 V102 Z" fill={C.redSoft} stroke={C.red} strokeWidth="2" />
        <path d="M120 130 l14 14 29-34" fill="none" stroke={C.red} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        {d.chips.map((t, i) => <g key={t}><rect x={238} y={84 + i * 28} width="148" height="20" rx="6" fill={i === 1 ? C.ink : C.mist} /><text x="250" y={98 + i * 28} fontFamily="monospace" fontSize="10" fill={i === 1 ? C.white : C.body}>{t}</text></g>)}
      </>}
      {kind === "gateway" && <>
        <circle cx="112" cy="126" r="22" fill={C.ink} /><text x="112" y="130" textAnchor="middle" fontFamily="monospace" fontSize="10" fill={C.white}>client</text>
        <rect x="196" y="91" width="92" height="70" rx="12" fill={C.brandSoft} stroke={C.brand} strokeWidth="2" /><text x="242" y="121" textAnchor="middle" fontFamily="monospace" fontSize="11" fill={C.brandStrong}>gateway</text><text x="242" y="140" textAnchor="middle" fontFamily="system-ui" fontSize="10" fill={C.body}>policy + route</text>
        {[{ y:92, t:"server A" }, { y:126, t:"server B" }, { y:160, t:"server C" }].map((s) => <g key={s.t}><line x1="288" y1="126" x2="330" y2={s.y} stroke={C.faint} strokeWidth="2" /><circle cx="356" cy={s.y} r="18" fill={C.white} stroke={C.line} /><text x="356" y={s.y + 3} textAnchor="middle" fontFamily="monospace" fontSize="9" fill={C.body}>{s.t}</text></g>)}
        <line x1="134" y1="126" x2="196" y2="126" stroke={C.faint} strokeWidth="2" /><path d="M196 126 l-8 -5 v10 z" fill={C.faint} />
      </>}
      {kind === "registry" && <>
        {[0, 1, 2].map((i) => <g key={i}><rect x={78 + i * 112} y={90 + (i % 2) * 22} width="96" height="58" rx="9" fill={i === 1 ? C.brandSoft : C.paper} stroke={i === 1 ? C.brand : C.line} /><circle cx={94 + i * 112} cy={107 + (i % 2) * 22} r="5" fill={i === 1 ? C.brand : C.ink} /><text x={106 + i * 112} y={111 + (i % 2) * 22} fontFamily="monospace" fontSize="9" fill={C.ink}>server {String.fromCharCode(65 + i)}</text><text x={90 + i * 112} y={132 + (i % 2) * 22} fontFamily="system-ui" fontSize="9" fill={C.muted}>{d.chips[i]}</text></g>)}
        <path d="M84 166 H396" stroke={C.line} strokeDasharray="4 4" /><text x="240" y="181" textAnchor="middle" fontFamily="monospace" fontSize="10" fill={C.muted}>record → claim → verify</text>
      </>}
      {kind === "load" && <>
        <line x1="82" y1="164" x2="398" y2="164" stroke={C.line} />
        {[20, 34, 48, 70, 42, 92, 58, 112, 66, 126, 76].map((h, i) => <rect key={i} x={84 + i * 28} y={164 - h} width="16" height={h} rx="4" fill={i > 7 ? C.brand : C.ink} opacity={0.55 + i * 0.035} />)}
        <line x1="84" y1="92" x2="396" y2="92" stroke={C.red} strokeDasharray="5 5" /><text x="396" y="87" textAnchor="end" fontFamily="monospace" fontSize="10" fill={C.red}>p95 budget</text>
      </>}
      {kind === "monitoring" && <>
        <rect x="78" y="84" width="308" height="84" rx="10" fill={C.ink} />
        <text x="94" y="105" fontFamily="monospace" fontSize="10" fill={C.faint}>server boundary / 24h</text>
        <path d="M94 147 L130 136 L160 143 L194 116 L222 126 L258 108 L290 130 L324 101 L366 116" fill="none" stroke="#86efac" strokeWidth="3" />
        <circle cx="324" cy="101" r="5" fill={C.red} /><text x="366" y="153" textAnchor="end" fontFamily="monospace" fontSize="10" fill={C.white}>tool error</text>
      </>}
      {kind === "evaluation" && <>
        {[0, 1, 2, 3].map((i) => <g key={i}><rect x={84 + i * 52} y={150 - i * 19} width={46} height={i * 19 + 18} rx="6" fill={i === 3 ? C.brand : C.ink} opacity={i === 3 ? 1 : 0.78} /><text x={107 + i * 52} y={145 - i * 19} textAnchor="middle" fontFamily="monospace" fontSize="9" fill={C.muted}>{["intent", "select", "call", "finish"][i]}</text></g>)}
        <path d="M84 86 H388" stroke={C.line} strokeDasharray="4 4" /><text x="388" y="80" textAnchor="end" fontFamily="system-ui" fontSize="10" fill={C.muted}>task evidence</text>
      </>}
      {kind === "benchmark" && <>
        <circle cx="160" cy="126" r="48" fill={C.brandSoft} stroke={C.brand} /><circle cx="160" cy="126" r="29" fill={C.paper} stroke={C.line} />
        <path d="M160 78 V174 M112 126 H208 M126 92 L194 160 M194 92 L126 160" stroke={C.line} />
        <path d="M160 95 L190 113 L178 149 L144 157 L128 120 Z" fill={C.brand} opacity="0.75" />
        {["fixture", "window", "variance"].map((t, i) => <text key={t} x="250" y={105 + i * 25} fontFamily="monospace" fontSize="10" fill={C.body}>● {t}</text>)}
      </>}
      {kind === "taxonomy" && <>
        <circle cx="240" cy="84" r="13" fill={C.ink} /><path d="M240 97 V118 M240 118 H150 M240 118 H330 M150 118 V143 M240 118 V143 M330 118 V143" stroke={C.faint} strokeWidth="2" />
        {[{ x:150, t:"protocol" }, { x:240, t:"application" }, { x:330, t:"infra" }].map((n) => <g key={n.t}><rect x={n.x - 43} y="143" width="86" height="22" rx="6" fill={n.t === "application" ? C.redSoft : C.white} stroke={n.t === "application" ? C.red : C.line} /><text x={n.x} y="158" textAnchor="middle" fontFamily="monospace" fontSize="9" fill={C.body}>{n.t}</text></g>)}
      </>}
      {kind === "telemetry" && <>
        <rect x="80" y="84" width="112" height="82" rx="10" fill={C.ink} /><text x="136" y="105" textAnchor="middle" fontFamily="monospace" fontSize="10" fill={C.white}>MCP event</text>{["tool", "result", "retry"].map((t, i) => <text key={t} x="94" y={126 + i * 14} fontFamily="monospace" fontSize="9" fill="#86efac">{t}</text>)}
        {["span", "event", "metric"].map((t, i) => <g key={t}><line x1="192" y1="125" x2="245" y2={95 + i * 31} stroke={C.faint} strokeWidth="2" /><rect x="245" y={84 + i * 31} width="112" height="22" rx="6" fill={i === 0 ? C.brandSoft : C.white} stroke={i === 0 ? C.brand : C.line} /><text x="301" y={99 + i * 31} textAnchor="middle" fontFamily="monospace" fontSize="10" fill={C.body}>{t}</text></g>)}
      </>}
      {kind === "scorecard" && <>
        <circle cx="142" cy="128" r="43" fill="none" stroke={C.line} strokeWidth="12" /><path d="M112 153 A43 43 0 1 1 172 153" fill="none" stroke={C.brand} strokeWidth="12" strokeLinecap="round" /><text x="142" y="134" textAnchor="middle" fontFamily="monospace" fontSize="18" fill={C.ink}>82</text>
        {d.chips.map((t, i) => <g key={t}><rect x="226" y={91 + i * 27} width="150" height="18" rx="5" fill={C.mist} /><rect x="226" y={91 + i * 27} width={[116, 91, 128][i]} height="18" rx="5" fill={i === 2 ? C.brand : C.ink} opacity="0.85" /><text x="236" y={104 + i * 27} fontFamily="monospace" fontSize="9" fill={i === 2 ? C.white : C.white}>{t}</text></g>)}
      </>}
      {kind === "adoption" && <>
        {[{ x:84, w:300, t:"exposed" }, { x:112, w:244, t:"discovered" }, { x:142, w:184, t:"called" }, { x:176, w:116, t:"complete" }].map((r, i) => <g key={r.t}><rect x={r.x} y={78 + i * 24} width={r.w} height="18" rx="7" fill={i === 3 ? C.brand : C.ink} opacity={0.9 - i * 0.1} /><text x="240" y={91 + i * 24} textAnchor="middle" fontFamily="monospace" fontSize="9" fill={C.white}>{r.t}</text></g>)}
      </>}
      {kind === "buyer" && <>
        <text x="90" y="92" fontFamily="system-ui" fontSize="10" fill={C.muted}>evidence owned by</text>
        {["MCP boundary", "agent trace", "infra APM"].map((t, i) => <g key={t}><rect x="90" y={104 + i * 21} width="132" height="16" rx="4" fill={i === 0 ? C.brandSoft : C.mist} stroke={i === 0 ? C.brand : "none"} /><text x="100" y={115 + i * 21} fontFamily="monospace" fontSize="9" fill={C.body}>{t}</text></g>)}
        <path d="M240 112 H380 M240 133 H348 M240 154 H366" stroke={C.line} strokeWidth="8" strokeLinecap="round" /><circle cx="240" cy="112" r="4" fill={C.brand} /><circle cx="240" cy="133" r="4" fill={C.ink} /><circle cx="240" cy="154" r="4" fill={C.muted} />
      </>}
    </>
  );
}

function WaveDetail({ kind }: { kind: WaveVisualKind }) {
  const d = waveVisualData[kind];
  return (
    <>
      <Bg />
      <rect x="64" y="52" width="352" height="136" rx="14" fill={C.white} stroke={C.line} />
      <text x="86" y="76" fontFamily="system-ui" fontSize="11" fill={C.muted}>{d.label} / field notes</text>
      {d.chips.map((t, i) => <g key={t}><rect x={86 + (i % 3) * 104} y="92" width="92" height="24" rx="7" fill={i === 1 ? C.ink : C.brandSoft} stroke={i === 1 ? C.ink : C.brand} /><text x={132 + (i % 3) * 104} y="108" textAnchor="middle" fontFamily="monospace" fontSize="9" fill={i === 1 ? C.white : C.brandStrong}>{t}</text></g>)}
      <path d="M88 140 H392" stroke={C.line} />
      {kind === "testing" && <><circle cx="112" cy="160" r="6" fill={C.brand} /><circle cx="200" cy="160" r="6" fill={C.brand} /><circle cx="288" cy="160" r="6" fill={C.red} /><path d="M118 160 H194 M206 160 H282" stroke={C.faint} strokeWidth="2" /></>}
      {kind === "security" && <><path d="M112 155 l18 18 42-45" fill="none" stroke={C.red} strokeWidth="4" strokeLinecap="round" /><text x="218" y="164" fontFamily="monospace" fontSize="10" fill={C.body}>finding → owner → regression test</text></>}
      {kind === "gateway" && <><path d="M92 160 H172 L208 145 L244 160 H388" fill="none" stroke={C.brand} strokeWidth="3" /><circle cx="208" cy="145" r="6" fill={C.ink} /><text x="92" y="178" fontFamily="monospace" fontSize="9" fill={C.muted}>client</text><text x="360" y="178" fontFamily="monospace" fontSize="9" fill={C.muted}>server</text></>}
      {kind === "registry" && <><path d="M92 157 H388" stroke={C.line} strokeWidth="9" strokeLinecap="round" /><path d="M92 157 H318" stroke={C.brand} strokeWidth="9" strokeLinecap="round" /><text x="92" y="178" fontFamily="monospace" fontSize="9" fill={C.muted}>publisher identity</text><text x="388" y="178" textAnchor="end" fontFamily="monospace" fontSize="9" fill={C.muted}>verification time</text></>}
      {kind === "load" && <><path d="M88 165 C118 124 144 174 176 136 S234 129 262 164 S322 122 392 150" fill="none" stroke={C.brand} strokeWidth="3" /><text x="392" y="178" textAnchor="end" fontFamily="monospace" fontSize="9" fill={C.muted}>tail, not average</text></>}
      {kind === "monitoring" && <><path d="M88 166 L128 151 L160 158 L200 131 L232 144 L272 121 L308 148 L352 113 L392 129" fill="none" stroke={C.brand} strokeWidth="3" /><line x1="88" y1="136" x2="392" y2="136" stroke={C.red} strokeDasharray="5 5" /><text x="392" y="178" textAnchor="end" fontFamily="monospace" fontSize="9" fill={C.muted}>latency + result state</text></>}
      {kind === "evaluation" && <><rect x="92" y="151" width="88" height="18" rx="5" fill={C.mist} /><rect x="192" y="151" width="88" height="18" rx="5" fill={C.brandSoft} /><rect x="292" y="151" width="88" height="18" rx="5" fill={C.ink} /><text x="136" y="164" textAnchor="middle" fontFamily="monospace" fontSize="9" fill={C.body}>choose</text><text x="236" y="164" textAnchor="middle" fontFamily="monospace" fontSize="9" fill={C.brandStrong}>execute</text><text x="336" y="164" textAnchor="middle" fontFamily="monospace" fontSize="9" fill={C.white}>finish</text></>}
      {kind === "benchmark" && <><text x="92" y="164" fontFamily="monospace" fontSize="10" fill={C.body}>N=120 fixtures</text><text x="238" y="164" fontFamily="monospace" fontSize="10" fill={C.body}>window=7d</text><text x="350" y="164" fontFamily="monospace" fontSize="10" fill={C.brandStrong}>replayable</text></>}
      {kind === "taxonomy" && <><path d="M92 161 H160 V146 H228 V161 H296 V146 H388" fill="none" stroke={C.red} strokeWidth="3" /><text x="92" y="178" fontFamily="monospace" fontSize="9" fill={C.muted}>name the first broken boundary</text></>}
      {kind === "telemetry" && <><text x="92" y="164" fontFamily="monospace" fontSize="10" fill={C.body}>source</text><text x="190" y="164" fontFamily="monospace" fontSize="10" fill={C.body}>meaning</text><text x="300" y="164" fontFamily="monospace" fontSize="10" fill={C.body}>retention</text></>}
      {kind === "scorecard" && <><rect x="92" y="151" width="296" height="18" rx="5" fill={C.mist} /><rect x="92" y="151" width="214" height="18" rx="5" fill={C.brand} /><text x="240" y="164" textAnchor="middle" fontFamily="monospace" fontSize="9" fill={C.white}>raw measures stay visible</text></>}
      {kind === "adoption" && <><path d="M92 164 H388" stroke={C.line} strokeWidth="9" strokeLinecap="round" /><path d="M92 164 H284" stroke={C.brand} strokeWidth="9" strokeLinecap="round" /><text x="388" y="178" textAnchor="end" fontFamily="monospace" fontSize="9" fill={C.muted}>call ≠ outcome</text></>}
      {kind === "buyer" && <><path d="M92 159 H388" stroke={C.line} strokeWidth="2" /><circle cx="148" cy="159" r="7" fill={C.brand} /><circle cx="260" cy="159" r="7" fill={C.ink} /><circle cx="348" cy="159" r="7" fill={C.muted} /><text x="92" y="178" fontFamily="monospace" fontSize="9" fill={C.muted}>choose the owner of the evidence</text></>}
    </>
  );
}

const TestingCover = () => <WaveCover kind="testing" />;
const SecurityCover = () => <WaveCover kind="security" />;
const GatewayCover = () => <WaveCover kind="gateway" />;
const RegistryCover = () => <WaveCover kind="registry" />;
const LoadCover = () => <WaveCover kind="load" />;
const MonitoringCover = () => <WaveCover kind="monitoring" />;
const EvaluationCover = () => <WaveCover kind="evaluation" />;
const BenchmarkCover = () => <WaveCover kind="benchmark" />;
const TaxonomyCover = () => <WaveCover kind="taxonomy" />;
const TelemetryCover = () => <WaveCover kind="telemetry" />;
const ScorecardCover = () => <WaveCover kind="scorecard" />;
const AdoptionCover = () => <WaveCover kind="adoption" />;
const BuyerCover = () => <WaveCover kind="buyer" />;
const TestingDetail = () => <WaveDetail kind="testing" />;
const SecurityDetail = () => <WaveDetail kind="security" />;
const GatewayDetail = () => <WaveDetail kind="gateway" />;
const RegistryDetail = () => <WaveDetail kind="registry" />;
const LoadDetail = () => <WaveDetail kind="load" />;
const MonitoringDetail = () => <WaveDetail kind="monitoring" />;
const EvaluationDetail = () => <WaveDetail kind="evaluation" />;
const BenchmarkDetail = () => <WaveDetail kind="benchmark" />;
const TaxonomyDetail = () => <WaveDetail kind="taxonomy" />;
const TelemetryDetail = () => <WaveDetail kind="telemetry" />;
const ScorecardDetail = () => <WaveDetail kind="scorecard" />;
const AdoptionDetail = () => <WaveDetail kind="adoption" />;
const BuyerDetail = () => <WaveDetail kind="buyer" />;

/* Dedicated MCP analytics illustrations. Each pair has a cover composition
   and a second, more diagnostic inline composition so the article explains
   itself visually without relying on generic dashboards or stock imagery. */
function AnalyticsBuildCover() {
  return (
    <>
      <Bg />
      <text x="56" y="46" fontFamily="system-ui" fontSize="12" fill={C.muted}>build versus buy</text>
      <text x="424" y="46" textAnchor="end" fontFamily="monospace" fontSize="10" fill={C.faint}>decision frame</text>
      <rect x="56" y="64" width="164" height="126" rx="16" fill={C.ink} />
      <text x="78" y="89" fontFamily="monospace" fontSize="12" fill={C.white}>BUILD</text>
      {["event model", "collector", "queries"].map((t, i) => <g key={t}><rect x="78" y={104 + i * 23} width="120" height="15" rx="5" fill={i === 1 ? "#365314" : "#27272a"} /><text x="88" y={115 + i * 23} fontFamily="monospace" fontSize="9" fill={i === 1 ? "#bbf7d0" : C.faint}>{t}</text></g>)}
      <rect x="260" y="64" width="164" height="126" rx="16" fill={C.brandSoft} stroke={C.brand} strokeWidth="1.5" />
      <text x="282" y="89" fontFamily="monospace" fontSize="12" fill={C.brandStrong}>BUY</text>
      {["server evidence", "ready views", "less upkeep"].map((t, i) => <g key={t}><rect x="282" y={104 + i * 23} width="120" height="15" rx="5" fill={C.white} stroke={C.line} /><text x="292" y={115 + i * 23} fontFamily="monospace" fontSize="9" fill={C.body}>{t}</text></g>)}
      <path d="M220 126 H260" stroke={C.faint} strokeWidth="2" /><path d="M251 126 l-8 -5 v10 z" fill={C.faint} />
      <text x="240" y="178" textAnchor="middle" fontFamily="system-ui" fontSize="10" fill={C.muted}>same evidence questions</text>
    </>
  );
}

function AnalyticsBuildDetail() {
  return (
    <>
      <Bg />
      <rect x="64" y="52" width="352" height="136" rx="14" fill={C.white} stroke={C.line} />
      <text x="86" y="77" fontFamily="system-ui" fontSize="11" fill={C.muted}>decision scorecard</text>
      {["coverage", "privacy", "portability", "time to evidence"].map((t, i) => <g key={t}><text x="86" y={101 + i * 20} fontFamily="monospace" fontSize="9" fill={C.body}>{t}</text><rect x="218" y={93 + i * 20} width="154" height="11" rx="5" fill={C.mist} /><rect x="218" y={93 + i * 20} width={[126, 96, 112, 138][i]} height="11" rx="5" fill={i === 3 ? C.brand : C.ink} /></g>)}
      <text x="86" y="177" fontFamily="monospace" fontSize="9" fill={C.faint}>first trustworthy event &gt; first chart</text>
    </>
  );
}

function AnalyticsScratchCover() {
  return (
    <>
      <Bg />
      <text x="56" y="46" fontFamily="system-ui" fontSize="12" fill={C.muted}>build MCP analytics</text>
      <text x="424" y="46" textAnchor="end" fontFamily="monospace" fontSize="10" fill={C.faint}>from first event</text>
      <rect x="56" y="76" width="78" height="72" rx="12" fill={C.ink} /><text x="95" y="103" textAnchor="middle" fontFamily="monospace" fontSize="10" fill={C.white}>MCP</text><text x="95" y="122" textAnchor="middle" fontFamily="monospace" fontSize="9" fill="#86efac">server</text>
      {[
        { x: 170, label: "event" },
        { x: 250, label: "collect" },
        { x: 330, label: "query" },
      ].map((n, i) => <g key={n.label}><rect x={n.x} y="76" width="62" height="72" rx="12" fill={i === 1 ? C.brandSoft : C.white} stroke={i === 1 ? C.brand : C.line} /><circle cx={n.x + 31} cy="101" r="8" fill={i === 1 ? C.brand : C.ink} /><text x={n.x + 31} y="105" textAnchor="middle" fontFamily="monospace" fontSize="8" fill={C.white}>{i + 1}</text><text x={n.x + 31} y="128" textAnchor="middle" fontFamily="monospace" fontSize="9" fill={C.body}>{n.label}</text></g>)}
      {[134, 232, 312].map((x) => <g key={x}><line x1={x} y1="112" x2={x + 36} y2="112" stroke={C.faint} strokeWidth="2" /><path d={`M${x + 36} 112 l-7 -4 v8 z`} fill={C.faint} /></g>)}
      <text x="240" y="180" textAnchor="middle" fontFamily="system-ui" fontSize="10" fill={C.muted}>instrument → protect → explain</text>
    </>
  );
}

function AnalyticsScratchDetail() {
  return (
    <>
      <Bg />
      <rect x="64" y="52" width="352" height="136" rx="14" fill={C.white} stroke={C.line} />
      <text x="86" y="77" fontFamily="system-ui" fontSize="11" fill={C.muted}>first production question</text>
      <rect x="86" y="92" width="150" height="64" rx="9" fill={C.ink} /><text x="99" y="112" fontFamily="monospace" fontSize="9" fill={C.white}>why did tool X</text><text x="99" y="128" fontFamily="monospace" fontSize="9" fill={C.white}>stop completing?</text><text x="99" y="146" fontFamily="monospace" fontSize="8" fill="#86efac">one bounded answer</text>
      <path d="M244 124 H274" stroke={C.faint} strokeWidth="2" /><path d="M274 124 l-8 -5 v10 z" fill={C.faint} />
      <rect x="288" y="92" width="104" height="64" rx="9" fill={C.brandSoft} stroke={C.brand} /><text x="340" y="112" textAnchor="middle" fontFamily="monospace" fontSize="9" fill={C.brandStrong}>event + trace</text><text x="340" y="130" textAnchor="middle" fontFamily="monospace" fontSize="9" fill={C.body}>known source</text><text x="340" y="146" textAnchor="middle" fontFamily="monospace" fontSize="8" fill={C.muted}>tested query</text>
    </>
  );
}

function AnalyticsEventCover() {
  return (
    <>
      <Bg />
      <text x="56" y="46" fontFamily="system-ui" fontSize="12" fill={C.muted}>MCP analytics event model</text>
      <text x="424" y="46" textAnchor="end" fontFamily="monospace" fontSize="10" fill={C.faint}>bounded evidence</text>
      <rect x="70" y="67" width="250" height="124" rx="14" fill={C.ink} />
      <text x="90" y="91" fontFamily="monospace" fontSize="10" fill="#86efac">mcp.analytics.v1</text>
      {["operation: tool_call", "result: application_error", "source: server-boundary", "payload: excluded"].map((t, i) => <text key={t} x="90" y={116 + i * 18} fontFamily="monospace" fontSize="9" fill={i === 1 ? "#fca5a5" : C.white}>{t}</text>)}
      <rect x="344" y="85" width="80" height="80" rx="16" fill={C.brandSoft} stroke={C.brand} /><path d="M384 101 L402 108 V126 C402 143 393 153 384 158 C375 153 366 143 366 126 V108 Z" fill={C.brand} /><path d="M376 127 l6 6 13-16" fill="none" stroke={C.white} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><text x="384" y="180" textAnchor="middle" fontFamily="monospace" fontSize="9" fill={C.brandStrong}>redact first</text>
    </>
  );
}

function AnalyticsEventDetail() {
  return (
    <>
      <Bg />
      <rect x="64" y="52" width="352" height="136" rx="14" fill={C.white} stroke={C.line} />
      <text x="86" y="77" fontFamily="system-ui" fontSize="11" fill={C.muted}>one event, separate claims</text>
      {["transport", "protocol", "application", "outcome"].map((t, i) => <g key={t}><rect x={86 + (i % 2) * 164} y={92 + Math.floor(i / 2) * 36} width="140" height="25" rx="7" fill={i === 2 ? C.redSoft : i === 3 ? C.brandSoft : C.mist} stroke={i === 2 ? C.red : i === 3 ? C.brand : C.line} /><circle cx={100 + (i % 2) * 164} cy={104 + Math.floor(i / 2) * 36} r="4" fill={i === 2 ? C.red : i === 3 ? C.brand : C.ink} /><text x={112 + (i % 2) * 164} y={108 + Math.floor(i / 2) * 36} fontFamily="monospace" fontSize="9" fill={C.body}>{t}</text></g>)}
      <text x="86" y="177" fontFamily="monospace" fontSize="9" fill={C.faint}>do not collapse these into one success flag</text>
    </>
  );
}

function AnalyticsMetricsCover() {
  return (
    <>
      <Bg />
      <text x="56" y="46" fontFamily="system-ui" fontSize="12" fill={C.muted}>MCP metrics that matter</text>
      <text x="424" y="46" textAnchor="end" fontFamily="monospace" fontSize="10" fill={C.faint}>from reach to result</text>
      {[
        { y: 73, x: 74, w: 332, label: "exposed" },
        { y: 99, x: 106, w: 268, label: "discovered" },
        { y: 125, x: 140, w: 200, label: "called" },
        { y: 151, x: 178, w: 124, label: "completed" },
      ].map((r, i) => <g key={r.label}><rect x={r.x} y={r.y} width={r.w} height="20" rx="7" fill={i === 3 ? C.brand : C.ink} opacity={i === 3 ? 1 : 0.88 - i * 0.08} /><text x="240" y={r.y + 14} textAnchor="middle" fontFamily="monospace" fontSize="9" fill={C.white}>{r.label}</text></g>)}
      <text x="240" y="185" textAnchor="middle" fontFamily="system-ui" fontSize="10" fill={C.muted}>each stage has its own denominator</text>
    </>
  );
}

function AnalyticsMetricsDetail() {
  return (
    <>
      <Bg />
      <rect x="64" y="52" width="352" height="136" rx="14" fill={C.white} stroke={C.line} />
      <text x="86" y="77" fontFamily="system-ui" fontSize="11" fill={C.muted}>SLO view / tool call</text>
      <line x1="86" y1="160" x2="392" y2="160" stroke={C.line} />
      <path d="M92 148 L128 139 L162 145 L196 128 L228 136 L264 118 L296 143 L334 102 L386 124" fill="none" stroke={C.brand} strokeWidth="3" />
      <line x1="86" y1="116" x2="392" y2="116" stroke={C.red} strokeDasharray="5 5" /><text x="392" y="111" textAnchor="end" fontFamily="monospace" fontSize="9" fill={C.red}>p95 budget</text>
      <text x="86" y="178" fontFamily="monospace" fontSize="9" fill={C.muted}>tail latency + result state</text>
    </>
  );
}

function AnalyticsArchitectureCover() {
  return (
    <>
      <Bg />
      <text x="56" y="46" fontFamily="system-ui" fontSize="12" fill={C.muted}>MCP analytics architecture</text>
      <text x="424" y="46" textAnchor="end" fontFamily="monospace" fontSize="10" fill={C.faint}>preserve meaning</text>
      {[
        { y: 70, label: "MCP server", fill: C.ink, color: C.white },
        { y: 96, label: "Collector", fill: C.brandSoft, color: C.brandStrong },
        { y: 122, label: "facts + raw", fill: C.white, color: C.body },
        { y: 148, label: "queries + alerts", fill: C.white, color: C.body },
        { y: 174, label: "operator", fill: C.brand, color: C.white },
      ].map((r, i) => <g key={r.label}><rect x={i % 2 ? 154 : 74} y={r.y} width="252" height="20" rx="7" fill={r.fill} stroke={r.fill === C.white ? C.line : r.fill === C.brandSoft ? C.brand : "none"} /><text x="240" y={r.y + 14} textAnchor="middle" fontFamily="monospace" fontSize="9" fill={r.color}>{r.label}</text>{i < 4 && <path d={`M240 ${r.y + 20} V${r.y + 26}`} stroke={C.faint} strokeWidth="2" />}</g>)}
    </>
  );
}

function AnalyticsArchitectureDetail() {
  return (
    <>
      <Bg />
      <rect x="64" y="52" width="352" height="136" rx="14" fill={C.white} stroke={C.line} />
      <text x="86" y="77" fontFamily="system-ui" fontSize="11" fill={C.muted}>one call, many views</text>
      <circle cx="112" cy="126" r="22" fill={C.ink} /><text x="112" y="130" textAnchor="middle" fontFamily="monospace" fontSize="9" fill={C.white}>call</text>
      {[{ y: 88, t: "trace" }, { y: 126, t: "metric" }, { y: 164, t: "event" }].map((r) => <g key={r.t}><line x1="134" y1="126" x2="218" y2={r.y} stroke={C.faint} strokeWidth="2" /><rect x="218" y={r.y - 13} width="90" height="26" rx="7" fill={r.t === "event" ? C.brandSoft : C.mist} stroke={r.t === "event" ? C.brand : C.line} /><text x="263" y={r.y + 4} textAnchor="middle" fontFamily="monospace" fontSize="9" fill={C.body}>{r.t}</text></g>)}
      <rect x="328" y="108" width="66" height="36" rx="8" fill={C.ink} /><text x="361" y="124" textAnchor="middle" fontFamily="monospace" fontSize="8" fill={C.white}>same</text><text x="361" y="136" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#86efac">event id</text>
    </>
  );
}

const AnalyticsBuildCoverArt = () => <AnalyticsBuildCover />;
const AnalyticsBuildDetailArt = () => <AnalyticsBuildDetail />;
const AnalyticsScratchCoverArt = () => <AnalyticsScratchCover />;
const AnalyticsScratchDetailArt = () => <AnalyticsScratchDetail />;
const AnalyticsEventCoverArt = () => <AnalyticsEventCover />;
const AnalyticsEventDetailArt = () => <AnalyticsEventDetail />;
const AnalyticsMetricsCoverArt = () => <AnalyticsMetricsCover />;
const AnalyticsMetricsDetailArt = () => <AnalyticsMetricsDetail />;
const AnalyticsArchitectureCoverArt = () => <AnalyticsArchitectureCover />;
const AnalyticsArchitectureDetailArt = () => <AnalyticsArchitectureDetail />;

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
  foundation: Foundation,
  errors: Errors,
  bars: Bars,
  funnel: Funnel,
  clients: Clients,
  latency: Latency,
  schema: Schema,
  layers: Layers,
  inventory: Inventory,
  observability: Observability,
  monitoring: Monitoring,
  privacy: Privacy,
  sdk: Sdk,
  remote: Remote,
  fleet: Fleet,
  outcomes: Outcomes,
  adoption: Adoption,
  catalog: Catalog,
  release: Release,
  compare: Compare,
  opentelemetry: OpenTelemetry,
  buyer: Buyer,
  "testing-grid": TestingGrid,
  "security-grid": SecurityGrid,
  "gateway-grid": GatewayGrid,
  "registry-grid": RegistryGrid,
  "load-grid": LoadGrid,
  "monitoring-grid": MonitoringGrid,
  "evaluation-grid": EvaluationGrid,
  "benchmark-grid": BenchmarkGrid,
  "taxonomy-grid": TaxonomyGrid,
  "telemetry-grid": TelemetryGrid,
  "scorecard-grid": ScorecardGrid,
  "adoption-grid": AdoptionGrid,
  "buyer-grid": BuyerGrid,
  "testing-cover": TestingCover,
  "security-cover": SecurityCover,
  "gateway-cover": GatewayCover,
  "registry-cover": RegistryCover,
  "load-cover": LoadCover,
  "monitoring-cover": MonitoringCover,
  "evaluation-cover": EvaluationCover,
  "benchmark-cover": BenchmarkCover,
  "taxonomy-cover": TaxonomyCover,
  "telemetry-cover": TelemetryCover,
  "scorecard-cover": ScorecardCover,
  "adoption-cover": AdoptionCover,
  "buyer-cover": BuyerCover,
  "testing-detail": TestingDetail,
  "security-detail": SecurityDetail,
  "gateway-detail": GatewayDetail,
  "registry-detail": RegistryDetail,
  "load-detail": LoadDetail,
  "monitoring-detail": MonitoringDetail,
  "evaluation-detail": EvaluationDetail,
  "benchmark-detail": BenchmarkDetail,
  "taxonomy-detail": TaxonomyDetail,
  "telemetry-detail": TelemetryDetail,
  "scorecard-detail": ScorecardDetail,
  "adoption-detail": AdoptionDetail,
  "buyer-detail": BuyerDetail,
  "analytics-build-cover": AnalyticsBuildCoverArt,
  "analytics-build-detail": AnalyticsBuildDetailArt,
  "analytics-scratch-cover": AnalyticsScratchCoverArt,
  "analytics-scratch-detail": AnalyticsScratchDetailArt,
  "analytics-event-cover": AnalyticsEventCoverArt,
  "analytics-event-detail": AnalyticsEventDetailArt,
  "analytics-metrics-cover": AnalyticsMetricsCoverArt,
  "analytics-metrics-detail": AnalyticsMetricsDetailArt,
  "analytics-architecture-cover": AnalyticsArchitectureCoverArt,
  "analytics-architecture-detail": AnalyticsArchitectureDetailArt,
  default: Default,
};

export function BlogArt({
  art,
  className = "",
  fit = "meet",
  ariaLabel,
}: {
  art: ArtKey;
  className?: string;
  fit?: "meet" | "slice";
  ariaLabel?: string;
}) {
  const Scene = SCENES[art] ?? Default;
  return (
    <svg
      viewBox="0 0 480 240"
      preserveAspectRatio={`xMidYMid ${fit}`}
      className={className}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      <Scene />
    </svg>
  );
}
