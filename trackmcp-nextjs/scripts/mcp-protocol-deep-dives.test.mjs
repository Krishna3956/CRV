import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const read = (path) => readFileSync(resolve(path), "utf8");
const postsSource = read("src/app/blog/posts.ts");
const enrichmentSource = read("src/app/blog/enrichment.ts");
const sitemapSource = read("src/app/sitemap.ts");
const emDash = String.fromCharCode(0x2014);

const deepDiveSlugs = [
  "mcp-pagination-nextcursor",
  "mcp-tool-list-caching-ttlms-cachescope",
  "mcp-progress-notifications",
  "mcp-tasks-extension",
  "mcp-elicitation-form-url-mode",
];

const productionQuestionSlugs = [
  "mcp-tool-naming-conventions",
  "mcp-retry-safety-idempotency",
  "mcp-request-timeouts-deadlines",
  "mcp-server-auth-discovery-protected-resource-metadata",
  "mcp-tool-catalog-design",
];

function postSource(slug) {
  const start = postsSource.indexOf(`    slug: "${slug}"`);
  const next = postsSource.indexOf("\n  {", start + 1);
  assert.ok(start > -1, `missing deep-dive post ${slug}`);
  return postsSource.slice(start, next > -1 ? next : undefined);
}

test("the technical deep-dive batch has five distinct posts", () => {
  assert.equal(new Set(deepDiveSlugs).size, 5);
  const positions = deepDiveSlugs.map((slug) => postsSource.indexOf(`    slug: "${slug}"`));
  assert.ok(positions.every((position) => position > -1));
  assert.ok(Math.max(...positions) < postsSource.indexOf('    slug: "best-mcp-observability-tools-for-production-servers"'));
});

test("every deep-dive post has dated metadata, FAQs, sources, and internal links", () => {
  for (const slug of deepDiveSlugs) {
    const source = postSource(slug);
    assert.match(source, /title: "[^"]{40,}"/);
    assert.match(source, /tag: "MCP protocol deep dive"/);
    assert.match(source, /excerpt:\s*\n?\s*"[^"]{100,}"/);
    assert.match(source, /date: "Sep 12, 2026"/);
    assert.match(source, /updated: "Sep 12, 2026"/);
    assert.match(source, /verified: "Sep 12, 2026"/);
    assert.match(source, /read: "1[3-9] min read"/);
    assert.match(source, /keywords: \[/);
    assert.match(source, /related: \[/);
    assert.match(source, /faq\(/);
    assert.match(source, /https:\/\/modelcontextprotocol\.io\//);
    assert.match(source, /href: "\//);
    assert.doesNotMatch(source, /TrackMCP vs|Sentry|Datadog|Grafana|MCP Tester|Health Check/i);
    assert.equal(source.includes(emDash), false);
  }
});

test("each deep-dive post has matching artwork and the shared Article metadata path", () => {
  for (const slug of deepDiveSlugs) {
    assert.match(enrichmentSource, new RegExp(`"${slug}":`));
  }
  assert.match(sitemapSource, /posts\.map/);
  assert.match(read("src/app/blog/[slug]/page.tsx"), /@type": "Article"/);
  assert.match(read("src/app/blog/[slug]/page.tsx"), /breadcrumbJsonLd/);
});

test("the deep-dive batch contains no em dashes or speculative tester links", () => {
  const newContent = deepDiveSlugs.map(postSource).join("\n");
  assert.equal(newContent.includes(emDash), false);
  assert.doesNotMatch(newContent, /MCP Tester|Health Check|\/tools\/mcp-/i);
});

test("the production-question batch has distinct, dated, source-backed content", () => {
  assert.equal(new Set(productionQuestionSlugs).size, 5);
  const positions = productionQuestionSlugs.map((slug) => postsSource.indexOf(`    slug: "${slug}"`));
  assert.ok(positions.every((position) => position > -1));
  assert.ok(Math.max(...positions) < postsSource.indexOf('    slug: "mcp-pagination-nextcursor"'));

  for (const slug of productionQuestionSlugs) {
    const source = postSource(slug);
    assert.match(source, /title: "[^\"]{40,}"/);
    assert.match(source, /excerpt:\s*\n?\s*"[^\"]{100,}"/);
    assert.match(source, /date: "Sep 12, 2026"/);
    assert.match(source, /updated: "Sep 12, 2026"/);
    assert.match(source, /verified: "Sep 12, 2026"/);
    assert.match(source, /read: "[89] min read"/);
    assert.match(source, /keywords: \[/);
    assert.match(source, /related: \[/);
    assert.match(source, /faq\(/);
    assert.match(source, /https:\/\/modelcontextprotocol\.io\//);
    assert.match(source, /href: "\//);
    assert.doesNotMatch(source, /MCP Tester|Health Check|\/tools\/mcp-/i);
    assert.equal(source.includes(emDash), false);
    assert.match(enrichmentSource, new RegExp(`"${slug}":`));
  }
});
