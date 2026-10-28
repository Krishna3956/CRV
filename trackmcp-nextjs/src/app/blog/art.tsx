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
