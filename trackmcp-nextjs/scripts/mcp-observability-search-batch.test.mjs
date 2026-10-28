import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const read = (path) => readFileSync(resolve(path), "utf8");
const batch = read("src/app/blog/next-batch.ts");
const research = read("src/app/blog/deep-research.ts");
const posts = read("src/app/blog/posts.ts");
const enrichment = read("src/app/blog/enrichment.ts");
const slugs = [...batch.matchAll(/slug: "([^"]+)"/g)].map((match) => match[1]);
const emDash = String.fromCharCode(0x2014);

test("the search-led observability batch contains exactly thirty distinct posts", () => {
  assert.equal(slugs.length, 30);
  assert.equal(new Set(slugs).size, 30);
  assert.match(posts, /\.\.\.nextBatch/);
  assert.match(enrichment, /\.\.\.nextBatchEnrichment/);
});

test("every search-led post has answer-first content and SEO inputs", () => {
  for (const slug of slugs) {
    const start = batch.indexOf(`slug: "${slug}"`);
    const end = batch.indexOf("\n  },", start);
    const source = batch.slice(start, end > -1 ? end : undefined);
    assert.match(source, /title: "[^\"]{45,}"/);
    assert.match(source, /excerpt: "[^\"]{100,}"/);
    assert.match(source, /keywords: \[/);
    assert.match(source, /answer: "[^\"]{180,}"/);
    assert.match(source, /sections: \[/);
    assert.match(source, /faq: \[/);
    assert.match(source, /related: \[/);
    assert.match(source, /source: \{ label: /);
    assert.doesNotMatch(source, new RegExp(emDash));
  }
});

test("the batch links back to the observability pillar and product docs", () => {
  assert.match(batch, /mcp-observability-guide/);
  assert.match(batch, /best-mcp-observability-tools-for-production-servers/);
  assert.match(batch, /href: "\/docs"/);
  assert.doesNotMatch(batch, /measure-mcp-tool-adoption[\"`]/);
  assert.match(batch, /measure-mcp-tool-adoption-workflow-completion/);
});

test("every article has a topic-specific research note and named ecosystem tools", () => {
  for (const slug of slugs) {
    assert.match(research, new RegExp(`\\"${slug}\\":`));
  }
  for (const tool of ["Sentry", "Grafana", "Datadog", "Langfuse", "OpenTelemetry", "MCP Conformance"]) {
    assert.match(research, new RegExp(tool));
  }
  assert.ok((research.match(/sources: \[/g) ?? []).length >= 30);
});
