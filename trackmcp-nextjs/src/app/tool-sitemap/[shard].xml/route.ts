import { getToolNamesPage, TOOL_SITEMAP_PAGE_SIZE } from "@/lib/repository/queries";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

const BASE = "https://trackmcp.com";

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

export async function GET(_request: Request, context: { params: Promise<{ shard?: string }> }) {
  const params = await context.params;
  const rawShard = params.shard;
  if (typeof rawShard !== "string" || !/^\d+$/.test(rawShard)) return new Response("Not found", { status: 404 });
  const shard = Number(rawShard);
  if (!Number.isSafeInteger(shard) || shard < 0 || shard > 49_999) return new Response("Not found", { status: 404 });
  const tools = await getToolNamesPage(shard * TOOL_SITEMAP_PAGE_SIZE, TOOL_SITEMAP_PAGE_SIZE);
  const urls = tools.map((tool) => {
    const lastmod = tool.updated ? `<lastmod>${escapeXml(tool.updated)}</lastmod>` : "";
    return `<url><loc>${escapeXml(`${BASE}/tool/${encodeURIComponent(tool.slug)}`)}</loc>${lastmod}<changefreq>monthly</changefreq><priority>0.5</priority></url>`;
  }).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
