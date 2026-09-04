"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Keep App Router transitions deterministic when a link is clicked from deep in a page. */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    root.style.scrollBehavior = previousBehavior;
  }, [pathname]);

  return null;
}
