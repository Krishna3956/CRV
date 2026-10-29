"use client";

import { useEffect } from "react";

const FONTSHARE_STYLESHEET =
  "https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap";

/**
 * Load the optional display face after hydration so a third-party stylesheet
 * cannot hold the server-rendered article headline behind a render-blocking
 * request. Inter remains the first-paint fallback from next/font/google.
 */
export function FontshareLoader() {
  useEffect(() => {
    if (document.querySelector('link[data-trackmcp-fontshare="satoshi"]')) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONTSHARE_STYLESHEET;
    link.dataset.trackmcpFontshare = "satoshi";
    document.head.appendChild(link);
  }, []);

  return null;
}
