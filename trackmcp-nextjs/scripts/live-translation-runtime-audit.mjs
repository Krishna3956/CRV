const base = (process.env.TRANSLATION_AUDIT_BASE_URL || "https://trackmcp.com").replace(/\/$/, "");
const AUDIT_USER_AGENT = "TrackMCP-translation-audit/1.0 (+https://trackmcp.com) Mozilla/5.0";

async function request(path, init) {
  const headers = new Headers(init?.headers);
  headers.set("User-Agent", AUDIT_USER_AGENT);
  const response = await fetch(`${base}${path}`, { ...init, headers });
  const body = await response.text();
  return { response, body };
}

function locations(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

const checks = [];
const root = await request("/");
checks.push({ path: "/", status: root.response.status, switcher: root.body.includes("Language: English") });

const sitemap = await request("/sitemap.xml");
const sitemapUrls = locations(sitemap.body);
const representativeBlog = sitemapUrls.find((url) => /\/blog\/[^/]+$/.test(url));
const representativeCategory = sitemapUrls.find((url) => url.includes("/category/"));
const sitemapAuditUrls = process.env.TRANSLATION_AUDIT_ALL_SITEMAP_ROUTES === "true"
  ? [...new Set(sitemapUrls)]
  : [representativeBlog, representativeCategory].filter(Boolean);
for (const url of sitemapAuditUrls) {
  if (!url) continue;
  const path = new URL(url).pathname;
  const page = await request(path);
  checks.push({ path, status: page.response.status, switcher: page.body.includes("Language: English") });
}

const toolIndex = await request("/tool-sitemap.xml");
const toolShards = locations(toolIndex.body);
if (toolShards.length) {
  const firstShard = await request(new URL(toolShards[0]).pathname);
  const toolUrl = locations(firstShard.body)[0];
  if (toolUrl) {
    const path = new URL(toolUrl).pathname;
    const page = await request(path);
    checks.push({ path, status: page.response.status, switcher: page.body.includes("Language: English") });
  }
}

const invalidTarget = await request("/api/translation", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ texts: ["Hello"], sourceLocale: "en", targetLocale: "fr" }),
});
const endpoint = { path: "/api/translation", status: invalidTarget.response.status, rejectsUnsupportedLocale: invalidTarget.response.status === 400 };
if (process.env.TRANSLATION_AUDIT_TRANSLATE === "true") {
  const providerProbe = await request("/api/translation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts: ["This is a translation smoke test."], sourceLocale: "en", targetLocale: "zh-CN" }),
  });
  let translations = [];
  try {
    const body = JSON.parse(providerProbe.body);
    translations = Array.isArray(body.translations) ? body.translations : [];
  } catch {
    translations = [];
  }
  const hasHan = typeof translations[0] === "string" && /[\u3400-\u9fff]/.test(translations[0]);
  endpoint.providerProbe = { status: providerProbe.response.status, hasHan, translationCount: translations.length };
  endpoint.providerProbePassed = providerProbe.response.status === 200 && hasHan;
}

const report = { base, checks, endpoint };
const failures = [
  ...checks.filter((check) => check.status !== 200 || !check.switcher).map((check) => `${check.path} must return 200 with the language switcher`),
  ...(endpoint.rejectsUnsupportedLocale ? [] : ["/api/translation must reject unsupported locales with HTTP 400"]),
  ...(endpoint.providerProbePassed === undefined || endpoint.providerProbePassed ? [] : ["/api/translation provider probe must return Simplified Chinese with HTTP 200"]),
];
if (failures.length) {
  console.error(JSON.stringify({ ...report, failures }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report, null, 2));
}
