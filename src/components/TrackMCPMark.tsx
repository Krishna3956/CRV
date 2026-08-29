/* The TrackMCP mark: a network node — a central hub linked out to three nodes,
   with one detached node, echoing agents connecting to an MCP server. Drawn on a
   32-unit grid, colored via `currentColor` so it inherits text color, with the
   top node tinted TrackMCP green by default. Legible from 16px up. Recreated as
   vector from the supplied logo art. */

export function TrackMCPMark({
  size = 24,
  className = "",
  title = "TrackMCP",
  topAccent = true,
}: {
  size?: number;
  className?: string;
  title?: string;
  /** color the top node TrackMCP green (matches the "mcp" in the wordmark) */
  topAccent?: boolean;
}) {
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
      {/* bonds from the hub */}
      <g stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" fill="none">
        <path d="M16 16 Q20.5 10 25 7" />
        <path d="M16 16 Q10 20.5 7 25" />
        <path d="M16 16 Q22.5 20 25 25" />
      </g>
      {/* nodes */}
      <g fill="currentColor">
        <circle cx="6.6" cy="6.6" r="4.4" />
        <circle cx="7" cy="25" r="4" />
        <circle cx="25" cy="25" r="4" />
      </g>
      {/* top node — green accent */}
      <circle cx="25" cy="7" r="4" fill={topAccent ? "#16a34a" : "currentColor"} />
      {/* hub on top */}
      <circle cx="16" cy="16" r="4.4" fill="currentColor" />
    </svg>
  );
}
