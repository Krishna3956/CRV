import Link from "next/link";
import { TrackMCPAppIcon } from "./TrackMCPAppIcon";

/* The TrackMCP wordmark — a calm, typographic lowercase logo.
   `track` in charcoal, `mcp` in TrackMCP green. No gradient.
   With `mark`, it becomes a proper lockup: the network mark + the wordmark,
   so the nav reads as a deliberate identity rather than plain text.
   One reusable component for nav, footer, and the oversized watermark. */

type LogoSize = "nav" | "footer" | "watermark";
type LogoVariant = "green" | "mono" | "light";

const sizeClass: Record<LogoSize, string> = {
  nav: "text-[21px]",
  footer: "text-[20px]",
  watermark: "text-[15vw] leading-[0.8]",
};

const monoSize: Record<LogoSize, number> = {
  nav: 22,
  footer: 20,
  watermark: 96,
};

export function TrackMCPLogo({
  size = "nav",
  variant = "green",
  mark = false,
  asLink = true,
  href = "/",
  className = "",
}: {
  size?: LogoSize;
  variant?: LogoVariant;
  mark?: boolean;
  asLink?: boolean;
  href?: string;
  className?: string;
}) {
  const trackColor = variant === "light" ? "text-white" : "text-[#171717]";
  const mcpColor =
    variant === "mono"
      ? trackColor
      : variant === "light"
        ? "text-[#86efac]"
        : "text-brand";

  const align = mark ? "items-center gap-2" : "items-baseline";
  const base = `group inline-flex ${align} font-display font-medium lowercase tracking-[-0.045em] ${sizeClass[size]} ${className}`;

  const inner = (
    <>
      {mark && (
        <TrackMCPAppIcon
          size={monoSize[size]}
          className="shrink-0 transition-transform duration-200 group-hover:-rotate-3"
        />
      )}
      <span className={mark ? "inline-flex items-baseline" : "contents"}>
        <span className={trackColor}>track</span>
        <span className={mcpColor}>mcp</span>
      </span>
    </>
  );

  if (!asLink) {
    return (
      <span className={base} aria-hidden={size === "watermark" ? true : undefined}>
        {inner}
      </span>
    );
  }

  return (
    <Link href={href} aria-label="TrackMCP home" className={base}>
      {inner}
    </Link>
  );
}
