const base = (process.env.TRANSLATION_AUDIT_BASE_URL || "https://trackmcp.com").replace(/\/$/, "");
const AUDIT_USER_AGENT = "TrackMCP-translation-audit/1.0 (+https://trackmcp.com) Mozilla/5.0";

async function get(path) {
  const response = await fetch(`${base}${path}`, {
    headers: {
      Accept: "application/xml",
      // Cloudflare serves an interstitial to the default Node user agent;
      // identify this as a normal read-only browser audit instead of counting
      // the edge challenge as sitemap content.
      "User-Agent": AUDIT_USER_AGENT,
    },
  });
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  return response.text();
}

function locations(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

const main = locations(await get("/sitemap.xml"));
const toolIndex = locations(await get("/tool-sitemap.xml"));
const toolPages = [];
for (const shard of toolIndex) toolPages.push(...locations(await get(new URL(shard).pathname)));

const uniqueMain = new Set(main);
const uniqueTools = new Set(toolPages);
const report = {
  base,
  publicSitemapUrls: main.length,
  publicSitemapUniqueUrls: uniqueMain.size,
  publicBlogUrls: main.filter((url) => url.includes("/blog/")).length,
  publicCategoryUrls: main.filter((url) => url.includes("/category/")).length,
  toolSitemapShards: toolIndex.length,
  publicToolUrls: toolPages.length,
  publicToolUniqueUrls: uniqueTools.size,
  totalSitemapDiscoverableUrls: uniqueMain.size + uniqueTools.size,
};

if (uniqueMain.size !== main.length) throw new Error("Main sitemap contains duplicate URLs.");
if (uniqueTools.size !== toolPages.length) throw new Error("Tool sitemap contains duplicate URLs.");
console.log(JSON.stringify(report, null, 2));
