const BASE = "https://trackmcp.com";

export const revalidate = 3600;

/**
 * A single submission point for Search Console. The regular sitemap remains
 * available at /sitemap.xml for backwards compatibility, while this index
 * also includes the large directory sitemap index and the server-rendered
 * Simplified Chinese sitemap.
 */
export function GET() {
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `<sitemap><loc>${BASE}/sitemap.xml</loc></sitemap>`,
    `<sitemap><loc>${BASE}/tool-sitemap.xml</loc></sitemap>`,
    `<sitemap><loc>${BASE}/zh-sitemap.xml</loc></sitemap>`,
    "</sitemapindex>",
  ].join("");

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
