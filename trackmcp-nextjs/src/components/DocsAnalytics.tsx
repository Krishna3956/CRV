"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackActivationEvent } from "@/lib/marketing-analytics";

export function DocsAnalytics() {
  const pathname = usePathname() || "/docs";

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    trackActivationEvent("sdk_docs_viewed", {
      path: pathname,
      source: searchParams.get("utm_source") || searchParams.get("source") || "direct",
    });
  }, [pathname]);

  return null;
}
