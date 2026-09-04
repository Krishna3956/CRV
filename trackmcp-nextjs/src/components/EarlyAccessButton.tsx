"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { contentSurface, saveContentAttribution, trackMarketingEvent } from "@/lib/marketing-analytics";

type Variant = "primary" | "brand" | "white" | "ghost";
type Size = "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  sm: "px-3.5 py-2 text-sm",
  md: "px-[18px] py-[11px] text-[15px]",
  lg: "px-6 py-3.5 text-base",
};

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-black",
  brand: "bg-brand text-white hover:bg-brand-strong",
  white: "bg-white text-ink hover:bg-mist",
  ghost: "bg-white text-ink border border-line-strong hover:bg-paper hover:border-muted",
};

/** Shared product CTA. New visitors go directly to account creation. */
export function EarlyAccessButton({
  label = "Get started",
  variant = "primary",
  size = "md",
  className = "",
}: {
  label?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  const pathname = usePathname() || "/";
  const signupUrl = new URL("https://app.trackmcp.com/signup");
  signupUrl.searchParams.set("content_path", pathname);
  signupUrl.searchParams.set("content_cta", label);
  signupUrl.searchParams.set("content_surface", contentSurface(pathname));

  const handleClick = () => {
    const attribution = {
      content_path: pathname,
      content_cta: label,
      content_surface: contentSurface(pathname),
    };
    saveContentAttribution(attribution);
    trackMarketingEvent("content_cta_clicked", attribution);
  };

  return (
    <Link
      href={signupUrl.toString()}
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {label}
    </Link>
  );
}
