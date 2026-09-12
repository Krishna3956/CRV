import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const freePage = read("src/app/free-mcp-servers/page.tsx");
const socialPage = read("src/app/mcp-servers/social-media/page.tsx");
const posts = read("src/app/blog/posts.ts");
const enrichment = read("src/app/blog/enrichment.ts");
const sitemap = read("src/app/sitemap.ts");
const footer = read("src/components/Footer.tsx");

test("free MCP server hub has search metadata, links, and honest classification", () => {
  assert.match(freePage, /title: "Free MCP Servers and Links: Browse, Verify, and Install \| TrackMCP"/);
  assert.match(freePage, /const PAGE_PATH = "\/free-mcp-servers"/);
  assert.match(freePage, /Last verified/);
  assert.match(freePage, /CollectionPage/);
  assert.match(freePage, /breadcrumbJsonLd/);
  for (const href of ["/repository", "/categories", "/tools/mcp-server-tester", "/mcp-observability", "/mcp-servers/social-media"]) {
    assert.match(freePage, new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const phrase of ["Free to inspect", "Free to run", "Free of secrets", "Free of limits"]) assert.match(freePage, new RegExp(phrase));
  assert.doesNotMatch(freePage, /MCP Tester|Health Check/);
  assert.doesNotMatch(freePage, /\u2014/);
});

test("social MCP server page is factual, linked, and explicit about TrackMCP's boundary", () => {
  assert.match(socialPage, /title: "Free Social Media and Autoposting MCP Servers \| TrackMCP"/);
  assert.match(socialPage, /const PAGE_PATH = "\/mcp-servers\/social-media"/);
  assert.match(socialPage, /Last verified/);
  assert.match(socialPage, /CollectionPage/);
  assert.match(socialPage, /breadcrumbJsonLd/);
  for (const href of [
    "https://github.com/posteverywhere/mcp",
    "https://socialcannon.app/",
    "https://1social.dev/mcp",
    "https://github.com/IhsanKabir/social-mcp",
    "https://postlake.dev/agents/claude",
  ]) assert.match(socialPage, new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(socialPage, /TrackMCP is not an autoposting provider/);
  assert.match(socialPage, /does not publish to social networks/);
  assert.doesNotMatch(socialPage, /MCP Tester|Health Check/);
  assert.doesNotMatch(socialPage, /\u2014/);
});

test("Claude Max article captures adjacent intent without misrepresenting TrackMCP", () => {
  assert.match(posts, /slug: "claude-max-5x-vs-20x-for-mcp-development"/);
  assert.match(posts, /title: "Claude Max 5x vs 20x for MCP Development: What Actually Changes\?"/);
  assert.match(posts, /date: "Sep 12, 2026"/);
  assert.match(posts, /verified: "Sep 12, 2026"/);
  assert.match(posts, /Anthropic's current Max plan documentation/);
  assert.match(posts, /TrackMCP can and cannot tell you/);
  assert.match(posts, /does not see provider-side account quotas/);
  assert.match(enrichment, /claude-max-5x-vs-20x-for-mcp-development/);
  assert.doesNotMatch(posts, /claude-max-5x-vs-20x-for-mcp-development[\s\S]*?\u2014/);
});

test("discovery pages are in the sitemap and footer", () => {
  for (const href of ["${BASE}/free-mcp-servers", "${BASE}/mcp-servers/social-media"]) assert.match(sitemap, new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(footer, /title: "MCP Discovery"/);
  assert.match(footer, /href: "\/free-mcp-servers"/);
  assert.match(footer, /href: "\/mcp-servers\/social-media"/);
  assert.match(footer, /href: "\/top-mcp"/);
});

const baseUrl = process.env.MCP_DISCOVERY_TEST_BASE_URL?.replace(/\/$/, "");
test("discovery routes render successfully with metadata", { skip: !baseUrl }, async () => {
  for (const route of ["/free-mcp-servers", "/mcp-servers/social-media", "/blog/claude-max-5x-vs-20x-for-mcp-development"]) {
    const response = await fetch(`${baseUrl}${route}`);
    assert.equal(response.status, 200, `${route} returned HTTP ${response.status}`);
    const html = await response.text();
    assert.match(html, /<title>/);
    assert.match(html, /<meta name="description"/);
    assert.match(html, /"@type":"BreadcrumbList"/);
    assert.doesNotMatch(html, new RegExp(String.fromCodePoint(0x2014)));
  }
});
