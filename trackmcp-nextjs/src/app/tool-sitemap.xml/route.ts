import { getToolCountStrict, TOOL_SITEMAP_PAGE_SIZE } from "@/lib/repository/queries";

export const revalidate = 3600;

const BASE = "https://trackmcp.com";

export async function GET() {
  const count = await getToolCountStrict();
  if (count === null) {
    return new Response("Sitemap temporarily unavailable", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "Retry-After": "300",
      },
    });
  }
  const shardCount = Math.max(1, Math.ceil(count / TOOL_SITEMAP_PAGE_SIZE));
  const urls = Array.from({ length: shardCount }, (_, shard) => `<sitemap><loc>${BASE}/tool-sitemap/${shard}.xml</loc></sitemap>`).join("");

  return new Response(`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</sitemapindex>`, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
      "X-TrackMCP-Sitemap-Shards": String(shardCount),
    },
  });
}
