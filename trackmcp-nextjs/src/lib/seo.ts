import type { Metadata } from "next";

export const SITE_URL = "https://trackmcp.com";
export const SITE_DESCRIPTION =
  "TrackMCP shows who is using your MCP server, what they are trying to do, and where to improve. Analytics for MCP servers, one line to install.";

export const DEFAULT_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "TrackMCP — analytics for MCP servers",
};

/** Shared entities are rendered from the root layout, so every route inherits them. */
export const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "TrackMCP",
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      inLanguage: "en-US",
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/repository?q={query}`,
        "query-input": "required name=query",
      },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "TrackMCP",
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.png`,
      sameAs: [
        "https://github.com/trackmcp",
        "https://www.linkedin.com/company/trackmcp",
        "https://x.com/trackmcp",
        "https://www.producthunt.com/products/trackmcp",
      ],
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#webapplication`,
      name: "TrackMCP",
      url: SITE_URL,
      description: "Analytics and observability for Model Context Protocol servers.",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Cross-platform",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

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
  const url = path === "/" ? SITE_URL : `${SITE_URL}${path}`;
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
