import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const read = (path) => readFileSync(resolve(path), "utf8");
const postsSource = read("src/app/blog/posts.ts");
const enrichmentSource = read("src/app/blog/enrichment.ts");
const emDash = String.fromCharCode(0x2014);

const slugs = [
  "mcp-server-conformance-testing-ci",
  "mcp-apps-security-observability-boundaries",
  "mcp-resource-subscriptions-cache-invalidation",
  "mcp-tool-annotations-safety-enforcement",
];

function postSource(slug) {
  const start = postsSource.indexOf(`    slug: "${slug}"`);
  const next = postsSource.indexOf("\n  {", start + 1);
  assert.ok(start > -1, `missing post ${slug}`);
  return postsSource.slice(start, next > -1 ? next : undefined);
}

test("the current operator batch has four distinct posts featured first", () => {
  assert.equal(new Set(slugs).size, 4);
  const positions = slugs.map((slug) => postsSource.indexOf(`    slug: "${slug}"`));
  assert.ok(positions.every((position) => position > -1));
  assert.ok(positions.every((position, index) => index === 0 || position > positions[index - 1]));
  assert.ok(Math.max(...positions) < postsSource.indexOf('    slug: "mcp-registry-vs-gateway-vs-runtime-observability"'));
});

test("each post has reviewed metadata, primary sources, internal links, and FAQs", () => {
  for (const slug of slugs) {
    const source = postSource(slug);
    assert.match(source, /title: "[^"]{40,}"/);
    assert.match(source, /excerpt:\s*\n?\s*"[^"]{100,}"/);
    assert.match(source, /date: "Oct 18, 2026"/);
    assert.match(source, /updated: "Oct 18, 2026"/);
    assert.match(source, /verified: "Oct 18, 2026"/);
    assert.match(source, /read: "[1-9][0-9]? min read"/);
    assert.match(source, /keywords: \[/);
    assert.match(source, /related: \[/);
    assert.match(source, /faq\(/);
    assert.match(source, /https:\/\//);
    assert.match(source, /href: "\//);
    assert.match(enrichmentSource, new RegExp(`"${slug}":`));
    assert.equal(source.includes(emDash), false);
  }
});

test("the guides distinguish protocol, user outcome, and enforcement claims", () => {
  assert.match(postSource(slugs[0]), /do not prove that your tool returns correct business data/);
  assert.match(postSource(slugs[1]), /server must authorize every request/);
  assert.match(postSource(slugs[2]), /not a durable event log/);
  assert.match(postSource(slugs[3]), /not an access-control mechanism/);
});
