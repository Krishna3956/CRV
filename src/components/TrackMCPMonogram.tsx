/* The TrackMCP monogram: the network-node mark inside a rounded square badge,
   matching the favicon. `accent` tints the hub green (one restrained detail).
   Works as a favicon, avatar, nav badge, or loading mark; legible from 16px. */

type Variant = "dark" | "light";

export function TrackMCPMonogram({
  size = 24,
  variant = "dark",
  accent = false,
  className = "",
  title = "TrackMCP",
}: {
  size?: number;
  variant?: Variant;
  accent?: boolean;
  className?: string;
  title?: string;
}) {
  const bg = variant === "light" ? "#ffffff" : "#0a0a0a";
  const fg = variant === "light" ? "#171717" : "#ffffff";
  const border = variant === "light" ? "#e5e5e5" : "none";
  const hub = accent ? "#16a34a" : fg;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label={title}
      className={className}
    >
      <rect x="0.5" y="0.5" width="31" height="31" rx="8" fill={bg} stroke={border} />
      {/* network mark, inset within the badge */}
      <g transform="translate(6.5 6.5) scale(0.59)">
        <g stroke={fg} strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M16 16 Q20.5 10 25 7" />
          <path d="M16 16 Q10 20.5 7 25" />
          <path d="M16 16 Q22.5 20 25 25" />
        </g>
        <g fill={fg}>
          <circle cx="7" cy="7" r="4.1" />
          <circle cx="25" cy="7" r="3.7" />
          <circle cx="7" cy="25" r="3.7" />
          <circle cx="25" cy="25" r="3.7" />
        </g>
        <circle cx="16" cy="16" r="4.3" fill={hub} />
      </g>
    </svg>
  );
}
