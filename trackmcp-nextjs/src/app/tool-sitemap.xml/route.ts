import { getToolCount, TOOL_SITEMAP_PAGE_SIZE } from "@/lib/repository/queries";

export const revalidate = 3600;

const BASE = "https://trackmcp.com";

export async function GET() {
  const count = await getToolCount();
  // If the count query is temporarily unavailable, keep the index crawlable;
  // the shard route still performs its own bounded read and can recover later.
  const shardCount = Math.max(1, Math.ceil(count / TOOL_SITEMAP_PAGE_SIZE));
  const urls = Array.from({ length: shardCount }, (_, shard) => `<sitemap><loc>${BASE}/tool-sitemap/${shard}.xml</loc></sitemap>`).join("");

  return new Response(`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</sitemapindex>`, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
