import { getAllToolNames } from "@/lib/repository/queries";

export const revalidate = 3600;

const BASE = "https://trackmcp.com";

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

export async function GET() {
  const tools = await getAllToolNames(50000);
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
