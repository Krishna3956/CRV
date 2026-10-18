"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  captureSubmissionAttribution,
  marketingAttributionProperties,
  trackMarketingEvent,
} from "@/lib/marketing-analytics";

/** Emits a privacy-safe page event carrying attribution context on each SPA route. */
export function MarketingAttributionTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const snapshot = captureSubmissionAttribution();
    trackMarketingEvent("marketing_pageview", {
      pathname,
      ...marketingAttributionProperties(snapshot),
    });
  }, [pathname]);

  return null;
}
