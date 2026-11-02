const base = (process.env.CHINESE_SEO_AUDIT_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const paths = [
  "/zh-cn",
  "/zh-cn/mcp-observability",
  "/zh-cn/mcp-server-analytics",
  "/zh-cn/mcp-tool-analytics",
  "/zh-cn/free-mcp-servers",
  "/zh-cn/docs",
  "/zh-cn/docs/protocol",
  "/zh-cn/docs/typescript",
  "/zh-cn/docs/python",
  "/zh-cn/blog",
];

function count(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

async function get(path) {
  const response = await fetch(`${base}${path}`, { redirect: "manual", signal: AbortSignal.timeout(15_000) });
  return { response, body: await response.text() };
}

const results = [];
for (const path of paths) {
  const { response, body } = await get(path);
  const canonical = body.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] || "";
  const title = body.match(/<title>([^<]+)<\/title>/i)?.[1] || "";
  const hasChinese = /[\u3400-\u9fff]/.test(body);
  const expectedCanonical = `${base}${path}`;
  const checks = {
    status: response.status === 200,
    title: Boolean(title) && hasChinese,
    description: /<meta name="description" content="[^"]+[\u3400-\u9fff]/i.test(body),
    canonical: canonical === expectedCanonical || canonical === expectedCanonical.replace("http://localhost:3000", "https://trackmcp.com"),
    hreflang: /hrefLang="zh-CN"/.test(body) && /hrefLang="en"/.test(body),
    h1: count(body, /<h1[\s>]/gi) === 1,
    inLanguage: /inLanguage["']?:["']zh-CN/.test(body),
  };
  results.push({ path, ...checks });
  if (Object.values(checks).some((value) => !value)) throw new Error(`${path}: ${JSON.stringify(checks)}`);
}

const sitemap = await get("/zh-sitemap.xml");
const sitemapUrls = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (sitemap.response.status !== 200 || sitemapUrls.length !== paths.length) {
  throw new Error(`Chinese sitemap expected ${paths.length} URLs, received HTTP ${sitemap.response.status} and ${sitemapUrls.length} URLs.`);
}

console.log(JSON.stringify({ base, pages: results.length, sitemapUrls: sitemapUrls.length, results }, null, 2));
