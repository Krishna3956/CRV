import Link from "next/link";
import Image from "next/image";
import { TrackMCPAppIcon } from "./TrackMCPAppIcon";

/* The TrackMCP wordmark. The identity is intentionally typography-first:
   a clean lowercase black wordmark. The app mark remains a separate component
   so changing the wordmark never changes the favicon or product icon. */

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

const wordmarkSize: Record<LogoSize, string> = {
  nav: "h-[1.12em] w-auto",
  footer: "h-[1.08em] w-auto",
  watermark: "h-[0.72em] w-auto",
};

export function TrackMCPLogo({
  size = "nav",
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
      <Image
        src="/trackmcp-wordmark.svg"
        alt="trackmcp"
        width={512}
        height={96}
        className={wordmarkSize[size]}
      />
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
