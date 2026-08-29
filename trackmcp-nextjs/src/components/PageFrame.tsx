/* Global editorial frame: two subtle vertical rails that run continuously down
   the page, just outside the content column, so the whole homepage reads as one
   canvas rather than stacked blocks. The rails sit ABOVE section background
   bands (so they stay visible through white → mist → tinted surfaces) but are
   pointer-events-none and never reach the content, so nothing is obscured.
   Desktop only — hidden below lg to avoid any horizontal overflow on mobile. */

import type { ReactNode } from "react";

export function PageFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 z-30 hidden w-full max-w-[1216px] -translate-x-1/2 lg:block"
      >
        <span className="absolute inset-y-0 left-0 w-px bg-line" />
        <span className="absolute inset-y-0 right-0 w-px bg-line" />
      </div>
      {children}
    </div>
  );
}
