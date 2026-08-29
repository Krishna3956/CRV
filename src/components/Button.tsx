import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "ghost" | "dark" | "brand" | "white";
type Size = "md" | "sm" | "lg";

const sizes: Record<Size, string> = {
  sm: "px-3.5 py-2 text-sm",
  md: "px-[18px] py-[11px] text-[15px]",
  lg: "px-6 py-3.5 text-base",
};

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-black",
  ghost: "bg-white text-ink border border-line-strong hover:bg-paper hover:border-muted",
  dark: "bg-ink text-white hover:bg-black",
  brand: "bg-brand text-white hover:bg-brand-strong",
  white: "bg-white text-ink hover:bg-mist",
};

export function Button({
  href = "#",
  variant = "primary",
  size = "md",
  className = "",
  children,
}: {
  href?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
