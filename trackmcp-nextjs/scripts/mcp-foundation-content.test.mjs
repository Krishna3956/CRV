import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const read = (path) => readFileSync(resolve(path), "utf8");
const postsSource = read("src/app/blog/posts.ts");
const enrichmentSource = read("src/app/blog/enrichment.ts");
const navSource = read("src/components/Nav.tsx");
const articleSource = read("src/app/blog/[slug]/page.tsx");
const emDash = String.fromCharCode(0x2014);

const foundationSlugs = [
  "what-is-an-mcp-server",
  "what-is-an-mcp-client",
  "mcp-host-client-server-architecture",
  "mcp-tools-resources-prompts",
  "how-mcp-works-step-by-step",
  "mcp-json-rpc-messages-explained",
  "mcp-capability-negotiation",
  "mcp-transports-stdio-and-streamable-http",
  "how-to-build-an-mcp-server",
  "how-to-connect-an-mcp-server-to-an-ai-client",
];

function postSource(slug) {
  const start = postsSource.indexOf(`    slug: "${slug}"`);
  const next = postsSource.indexOf("\n  {", start + 1);
  assert.ok(start > -1, `missing post ${slug}`);
  return postsSource.slice(start, next > -1 ? next : undefined);
}

test("the new MCP fundamentals batch has ten distinct evergreen posts", () => {
  assert.equal(foundationSlugs.length, 10);
  const positions = foundationSlugs.map((slug) => postsSource.indexOf(`    slug: "${slug}"`));
  assert.ok(positions.every((position) => position > -1));
  assert.ok(Math.max(...positions) < postsSource.indexOf('    slug: "best-mcp-observability-tools-for-production-servers"'));
});

test("every new post has complete editorial metadata and useful internal links", () => {
  for (const slug of foundationSlugs) {
    const source = postSource(slug);
    assert.match(source, /title: "[^"]+"/);
    assert.match(source, /tag: "MCP fundamentals"/);
    assert.match(source, /excerpt:\s*\n?\s*"[^"]{80,}"/);
    assert.match(source, /date: "Sep 12, 2026"/);
    assert.match(source, /updated: "Sep 12, 2026"/);
    assert.match(source, /verified: "Sep 12, 2026"/);
    assert.match(source, /read: "[1-9][0-9]? min read"/);
    assert.match(source, /keywords: \[/);
    assert.match(source, /related: \[/);
    assert.match(source, /href: "\//);
    assert.match(source, /faq\(/);
    assert.ok(!source.includes(emDash));
  }
});

test("new posts use the existing artwork system and shared publisher", () => {
  for (const slug of foundationSlugs) {
    assert.match(enrichmentSource, new RegExp(`"${slug}":`));
  }
  assert.match(articleSource, /name: "Krishna Goyal"/);
  assert.match(articleSource, /publisher: \{ "@type": "Organization", name: "TrackMCP"/);
});

test("the top navigation no longer includes Releases", () => {
  const linksBlock = navSource.slice(navSource.indexOf("const links = ["), navSource.indexOf("];", navSource.indexOf("const links = [")));
  assert.doesNotMatch(linksBlock, /Releases/);
  assert.match(linksBlock, /href: "\/blog"/);
});

test("the new batch does not introduce competitor comparison content or tester CTAs", () => {
  const newContent = foundationSlugs.map(postSource).join("\n");
  assert.doesNotMatch(newContent, /TrackMCP vs|Sentry|Datadog|Grafana|MCP Tester|Health Check/i);
  assert.ok(!newContent.includes(emDash));
});
