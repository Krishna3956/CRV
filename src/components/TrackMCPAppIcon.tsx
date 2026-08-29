import { TrackMCPMark } from "./TrackMCPMark";

/* The TrackMCP app icon — the brand identity lockup: the network mark in white
   on a TrackMCP-green rounded square. This matches the favicon (app/icon.svg)
   exactly, so the mark reads the same in the browser tab, the nav, the footer,
   and inside the product. One reusable piece keeps it consistent everywhere. */

export function TrackMCPAppIcon({
  size = 28,
  className = "",
  title = "TrackMCP",
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <span
      role="img"
      aria-label={title}
      className={`grid shrink-0 place-items-center rounded-[26%] bg-brand text-white ${className}`}
      style={{ width: size, height: size }}
    >
      <TrackMCPMark size={Math.round(size * 0.6)} topAccent={false} className="text-white" />
    </span>
  );
}
