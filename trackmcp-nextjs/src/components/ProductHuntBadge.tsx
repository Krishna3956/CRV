"use client";

import { useEffect, useState } from "react";

const IMAGE_URL =
  "https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1238286&theme=light";
const PRODUCT_URL =
  "https://www.producthunt.com/products/trackmcp?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-trackmcp";
const REFRESH_INTERVAL = 5 * 60 * 1000;

export function ProductHuntBadge() {
  const [cacheBust, setCacheBust] = useState("1788520956579");

  useEffect(() => {
    const refresh = () => setCacheBust(String(Date.now()));
    refresh();

    const interval = window.setInterval(refresh, REFRESH_INTERVAL);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <a
      href={PRODUCT_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="TrackMCP on Product Hunt"
      className="mb-6 inline-flex rounded-lg transition-transform duration-200 hover:scale-[1.02]"
    >
      <img
        alt="TrackMCP - Google Analytics for MCP Servers | Product Hunt"
        width={250}
        height={54}
        className="h-auto w-[210px]"
        src={`${IMAGE_URL}&t=${cacheBust}`}
      />
    </a>
  );
}
