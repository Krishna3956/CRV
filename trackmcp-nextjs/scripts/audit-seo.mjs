#!/usr/bin/env node

const baseUrl = (process.env.SEO_AUDIT_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const sitemapPath = process.env.SEO_AUDIT_SITEMAP || "/sitemap.xml";
const includeTools = process.argv.includes("--all-tools");
const explicitPaths = (process.env.SEO_AUDIT_PATHS || "")
  .split(",")
  .map((path) => path.trim())
  .filter(Boolean)
  .map((path) => (path.startsWith("/") ? path : `/${path}`));

function textBetween(html, pattern) {
  const match = html.match(pattern);
  return match?.[1]?.replace(/\s+/g, " ").trim() || "";
}

function urlsFromSitemap(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
}

function localPath(value) {
  const url = new URL(value, baseUrl);
  return `${url.pathname}${url.search}`;
}

async function get(path) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
  const html = await response.text();
  return { response, html };
}

let paths = explicitPaths;
if (!paths.length) {
  const rootSitemap = await get(sitemapPath);
  if (!rootSitemap.response.ok) {
    console.error(`Could not read ${baseUrl}${sitemapPath}: HTTP ${rootSitemap.response.status}`);
    process.exit(1);
  }

  paths = urlsFromSitemap(rootSitemap.html).map(localPath);
  if (includeTools) {
    const toolSitemap = await get("/tool-sitemap.xml");
    if (toolSitemap.response.ok) paths.push(...urlsFromSitemap(toolSitemap.html).map(localPath));
  }
}

const uniquePaths = [...new Set(paths)];
const failures = [];
let checked = 0;

for (const path of uniquePaths) {
  const { response, html } = await get(path);
  checked += 1;
  const title = textBetween(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = textBetween(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  const canonical = textBetween(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i);
  const h1Count = [...html.matchAll(/<h1\b/gi)].length;
  const issues = [];

  if (response.status !== 200) issues.push(`HTTP ${response.status}`);
  if (!title) issues.push("missing title");
  if (!description) issues.push("missing description");
  if (!canonical) issues.push("missing canonical");
  if (h1Count !== 1) issues.push(`expected 1 h1, found ${h1Count}`);

  if (issues.length) failures.push({ path, issues });
}

console.log(`SEO audit: ${checked} URL${checked === 1 ? "" : "s"} checked at ${baseUrl}`);
if (failures.length) {
  console.error(`Failures: ${failures.length}`);
  for (const failure of failures) console.error(`- ${failure.path}: ${failure.issues.join(", ")}`);
  process.exit(1);
}

console.log("All audited pages returned HTTP 200 with a title, description, canonical, and exactly one H1.");
