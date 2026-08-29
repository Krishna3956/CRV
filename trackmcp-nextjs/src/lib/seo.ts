import type { Metadata } from "next";

const BASE = "https://trackmcp.com";

/**
 * Build consistent per-page metadata: title, description, self-referencing
 * canonical, per-page OpenGraph + Twitter cards. Pass index: false for pages
 * that should not be indexed (e.g. auth).
 */
export function pageMeta({
  title,
  description,
  path,
  index = true,
}: {
  title: string;
  description: string;
  path: string;
  index?: boolean;
}): Metadata {
  const url = path === "/" ? BASE : `${BASE}${path}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url, siteName: "TrackMCP", type: "website" },
    twitter: { card: "summary_large_image", title, description },
    ...(index ? {} : { robots: { index: false, follow: false } }),
  };
}
