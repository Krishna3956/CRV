import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const batch = fs.readFileSync(path.join(root, "src/app/blog/analytics-batch.ts"), "utf8");
const posts = fs.readFileSync(path.join(root, "src/app/blog/posts.ts"), "utf8");
const enrichment = fs.readFileSync(path.join(root, "src/app/blog/analytics-batch-enrichment.ts"), "utf8");
const art = fs.readFileSync(path.join(root, "src/app/blog/art.tsx"), "utf8");

const slugs = [
  "mcp-analytics-build-vs-buy",
  "how-to-build-mcp-analytics-from-scratch",
  "mcp-analytics-event-model-and-instrumentation",
  "mcp-analytics-metrics-slos-and-funnels",
  "mcp-analytics-opentelemetry-warehouse-dashboard-architecture",
];

test("analytics batch is registered as new content", () => {
  assert.match(posts, /\.\.\.analyticsBatch/);
  for (const slug of slugs) assert.match(batch, new RegExp(`slug: "${slug}"`), slug);
});

test("analytics articles are long-form and cover build decisions", () => {
  assert.ok((batch.match(/body: \[/g) ?? []).length >= slugs.length);
  assert.ok((batch.match(/Frequently asked questions/g) ?? []).length >= slugs.length);
  assert.match(batch, /build versus buy/i);
  assert.match(batch, /OpenTelemetry/);
  assert.match(batch, /result-level error/i);
  assert.doesNotMatch(batch, /India|DPDP|Indian audience/i);
});

test("each analytics article has dedicated editorial enrichment", () => {
  for (const slug of slugs) assert.match(enrichment, new RegExp(`"${slug}"`), slug);
  assert.equal((enrichment.match(/\["(?:mcp|how-to)[^"]+"/g) ?? []).length, slugs.length);
  assert.equal((enrichment.match(/"analytics-[a-z-]+-(?:cover|detail)"/g) ?? []).length, slugs.length * 2);
  for (const key of ["analytics-build-cover", "analytics-scratch-cover", "analytics-event-cover", "analytics-metrics-cover", "analytics-architecture-cover"]) {
    assert.match(art, new RegExp(`"${key}"`), key);
  }
});

test("analytics copy avoids typographic dash filler", () => {
  assert.doesNotMatch(batch, /[—–]/);
});
