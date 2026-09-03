import type { Metadata } from "next";

const BASE = "https://trackmcp.com";
const DEFAULT_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "TrackMCP — analytics for MCP servers",
};

/** Keep descriptions useful in search results when repository data is noisy. */
export function metaDescription(input: string | null | undefined, fallback: string): string {
  const normalized = (input || "").replace(/\s+/g, " ").trim();
  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .filter((sentence, index, all) => all.findIndex((candidate) => candidate.toLowerCase() === sentence.toLowerCase()) === index);
  const description = sentences.join(" ") || fallback;
  if (description.length <= 155) return description;
  return `${description.slice(0, 152).replace(/\s+\S*$/, "")}...`;
}

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
  const descriptionText = metaDescription(description, "Explore TrackMCP.");
  return {
    title,
    description: descriptionText,
    alternates: { canonical: path },
    openGraph: {
      title,
      description: descriptionText,
      url,
      siteName: "TrackMCP",
      type: "website",
      images: [DEFAULT_IMAGE],
    },
    twitter: { card: "summary_large_image", title, description: descriptionText, images: [DEFAULT_IMAGE.url] },
    ...(index ? {} : { robots: { index: false, follow: false } }),
  };
}
