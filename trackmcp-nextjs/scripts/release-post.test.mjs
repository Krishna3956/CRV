import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const read = (path) => readFileSync(resolve(path), "utf8");
const postsSource = read("src/app/blog/posts.ts");
const enrichmentSource = read("src/app/blog/enrichment.ts");
const releasesPageSource = read("src/app/blog/releases/page.tsx");
const articlePageSource = read("src/app/blog/[slug]/page.tsx");
const artSource = read("src/app/blog/art.tsx");
const blogPageSource = read("src/app/blog/page.tsx");
const navSource = read("src/components/Nav.tsx");
const footerSource = read("src/components/Footer.tsx");
const sitemapSource = read("src/app/sitemap.ts");
const nextConfigSource = read("next.config.ts");
const slug = "trackmcp-foundation-release";
const oldSlug = "trackmcp-p0-release-mcp-observability-foundation";
const releaseStart = postsSource.indexOf(`    slug: "${slug}"`);
const firstExistingPostStart = postsSource.indexOf('  {\n    slug: "mcp-incident-response-runbook"');
const releaseSource = postsSource.slice(releaseStart, firstExistingPostStart);

test("Foundation Release has the canonical public metadata", () => {
  assert.ok(releaseStart > -1);
  assert.ok(releaseStart < firstExistingPostStart);
  assert.match(releaseSource, /slug: "trackmcp-foundation-release"/);
  assert.match(releaseSource, /title: "TrackMCP Foundation Release: Safer, More Honest MCP Observability"/);
  assert.match(releaseSource, /tag: "Foundation Release"/);
  assert.match(releaseSource, /section: "releases"/);
  assert.match(releaseSource, /date: "Sep 6, 2026"/);
  assert.match(releaseSource, /updated: "Sep 6, 2026"/);
  assert.match(releaseSource, /read: "8 min read"/);
  assert.doesNotMatch(releaseSource, /P0/);
});

test("release index filters by the release section", () => {
  assert.match(releasesPageSource, /posts\.filter\(\(post\) => post\.section === "releases"\)/);
  assert.match(releasesPageSource, /path: "\/blog\/releases"/);
  assert.match(releasesPageSource, /breadcrumbJsonLd/);
  assert.match(releasesPageSource, /pageMeta\(/);
  assert.match(releasesPageSource, /href=\{`\/blog\/\$\{post\.slug\}`\}/);
});

test("article metadata and JSON-LD use the canonical release URL", () => {
  assert.match(articlePageSource, /path: `\/blog\/\$\{slug\}`/);
  assert.match(articlePageSource, /mainEntityOfPage: `https:\/\/trackmcp\.com\/blog\/\$\{post\.slug\}`/);
  assert.match(articlePageSource, /breadcrumbJsonLd\(\[/);
  assert.match(articlePageSource, /ariaLabel=\{`\$\{post\.title\} illustration`\}/);
  assert.match(releasesPageSource, /serializeJsonLd\(breadcrumbSchema\)/);
});

test("Foundation Release uses new artwork with accessible labels", () => {
  assert.match(artSource, /\| "foundation"/);
  assert.match(artSource, /function Foundation\(\)/);
  assert.match(artSource, /foundation: Foundation/);
  assert.match(artSource, /ariaLabel\?: string/);
  assert.match(enrichmentSource, /art: "foundation"/);
  assert.match(enrichmentSource, /fig\("foundation"/);
});

test("release discovery links and sitemap entry are present", () => {
  assert.match(blogPageSource, /href="\/blog\/releases"/);
  assert.doesNotMatch(navSource, /label: "Releases", href: "\/blog\/releases"/);
  assert.match(footerSource, /label: "Releases", href: "\/blog\/releases"/);
  assert.match(sitemapSource, /\$\{BASE\}\/blog\/releases/);
  for (const relatedSlug of [
    "mcp-server-analytics-guide",
    "mcp-observability-guide",
    "how-to-monitor-an-mcp-server-in-production",
    "mcp-tool-schemas",
    "mcp-server-slos",
  ]) {
    assert.match(releaseSource, new RegExp(`\\"${relatedSlug}\\"`));
  }
});

test("the old unreleased slug is not kept as a redirect", () => {
  assert.doesNotMatch(postsSource, new RegExp(oldSlug));
  assert.doesNotMatch(nextConfigSource, new RegExp(oldSlug));
  assert.doesNotMatch(releaseSource, /P0/);
  assert.doesNotMatch(releasesPageSource, /P0/);
});

const baseUrl = process.env.RELEASE_TEST_BASE_URL?.replace(/\/$/, "");
test("rendered release routes expose metadata and BreadcrumbList JSON-LD", { skip: !baseUrl }, async () => {
  for (const route of ["/blog/releases", `/blog/${slug}`]) {
    const response = await fetch(`${baseUrl}${route}`);
    assert.equal(response.status, 200, `${route} returned HTTP ${response.status}`);
    const html = await response.text();
    assert.match(html, /<title>/);
    assert.match(html, /https:\/\/trackmcp\.com\/blog\/(?:releases|trackmcp-foundation-release)/);
    assert.match(html, /"@type":"BreadcrumbList"/);
    assert.doesNotMatch(html, /TrackMCP P0/);
  }
});
