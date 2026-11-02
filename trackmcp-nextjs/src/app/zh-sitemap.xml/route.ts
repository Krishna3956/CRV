import { CHINESE_SEO_PATHS, chineseUrl, englishUrl } from "@/lib/chinese-seo";

export const revalidate = 3600;

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

export function GET() {
  const urls = CHINESE_SEO_PATHS.map((path) => {
    const zh = chineseUrl(path);
    const en = englishUrl(path);
    return `<url><loc>${escapeXml(zh)}</loc><xhtml:link rel="alternate" hreflang="zh-CN" href="${escapeXml(zh)}"/><xhtml:link rel="alternate" hreflang="en" href="${escapeXml(en)}"/></url>`;
  }).join("");
  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`;
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
      "X-TrackMCP-Chinese-URLs": String(CHINESE_SEO_PATHS.length),
    },
  });
}
