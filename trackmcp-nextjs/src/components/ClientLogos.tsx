/* Minimal, original monochrome marks for the AI clients that connect to an
   MCP server. These are simple geometric glyphs (not the vendors' real
   trademarked logos) so nothing is hotlinked and they stay grayscale by
   default, taking a green accent only when a client is "active". */

export type ClientName = "Claude" | "Cursor" | "ChatGPT" | "Custom";

export function ClientMark({
  name,
  size = 16,
  className = "",
}: {
  name: ClientName;
  size?: number;
  className?: string;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    "aria-hidden": true,
    className,
  };
  switch (name) {
    case "Claude":
      // radial burst
      return (
        <svg {...common}>
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * Math.PI) / 4;
            return (
              <line
                key={i}
                x1={12 + Math.cos(a) * 3}
                y1={12 + Math.sin(a) * 3}
                x2={12 + Math.cos(a) * 9}
                y2={12 + Math.sin(a) * 9}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      );
    case "Cursor":
      // pointer / caret
      return (
        <svg {...common}>
          <path
            d="M6 4l12 6-5 1.6L10.8 17 6 4z"
            fill="currentColor"
          />
        </svg>
      );
    case "ChatGPT":
      // interlocked hex knot
      return (
        <svg {...common}>
          <path
            d="M12 3l7 4v10l-7 4-7-4V7l7-4z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2.4" fill="currentColor" />
        </svg>
      );
    default:
      // Custom agent — terminal chevron
      return (
        <svg {...common}>
          <rect
            x="3.5"
            y="4.5"
            width="17"
            height="15"
            rx="3"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M8 10l2.5 2L8 14M13 14h3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

/** A compact grayscale logo tile, green when active. */
export function ClientTile({
  name,
  active = false,
  className = "",
}: {
  name: ClientName;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`grid h-8 w-8 place-items-center rounded-lg border ${
        active
          ? "border-brand/40 bg-brand-soft text-brand-strong"
          : "border-line bg-white text-slate-500"
      } ${className}`}
    >
      <ClientMark name={name} size={16} />
    </span>
  );
}

const defaultMix: { name: ClientName; pct: number }[] = [
  { name: "Claude", pct: 42 },
  { name: "Cursor", pct: 28 },
  { name: "ChatGPT", pct: 19 },
  { name: "Custom", pct: 11 },
];

/** Client-mix breakdown used inside product scenes. */
export function ClientMix({
  data = defaultMix,
  className = "",
}: {
  data?: { name: ClientName; pct: number }[];
  className?: string;
}) {
  return (
    <ul className={`space-y-2.5 ${className}`}>
      {data.map((c, i) => (
        <li key={c.name} className="flex items-center gap-2.5">
          <span
            className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border ${
              i === 0
                ? "border-brand/40 bg-brand-soft text-brand-strong"
                : "border-line bg-paper text-slate-500"
            }`}
          >
            <ClientMark name={c.name} size={13} />
          </span>
          <span className="w-14 shrink-0 text-[12.5px] text-body">{c.name}</span>
          <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-mist">
            <span
              className={`absolute inset-y-0 left-0 rounded-full ${
                i === 0 ? "bg-brand" : "bg-brand/45"
              }`}
              style={{ width: `${c.pct}%` }}
            />
          </span>
          <span className="w-8 shrink-0 text-right font-mono text-[11.5px] text-muted">
            {c.pct}%
          </span>
        </li>
      ))}
    </ul>
  );
}
