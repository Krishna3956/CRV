import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const comparisons = fs.readFileSync(path.join(root, "src/app/blog/wave2-listicles.ts"), "utf8");
const wave2 = fs.readFileSync(path.join(root, "src/app/blog/wave2.ts"), "utf8");
const posts = fs.readFileSync(path.join(root, "src/app/blog/posts.ts"), "utf8");
const page = fs.readFileSync(path.join(root, "src/app/blog/[slug]/page.tsx"), "utf8");
const enrichment = fs.readFileSync(path.join(root, "src/app/blog/wave2-enrichment.ts"), "utf8");

const slugs = [
  "best-mcp-testing-debugging-tools",
  "best-mcp-security-scanners-tool-poisoning",
  "best-mcp-gateways-production-security-observability",
  "best-mcp-registries-marketplaces",
  "best-mcp-load-reliability-testing-tools",
  "best-mcp-servers-monitoring-observability-data",
  "best-mcp-agent-evaluation-tool-selection-tools",
  "mcp-observability-benchmark-2026",
  "mcp-failure-taxonomy-diagnostic-matrix",
  "mcp-telemetry-field-map-opentelemetry",
  "mcp-server-reliability-scorecard",
  "mcp-tool-adoption-report",
  "mcp-observability-glossary-buyers-guide",
];

test("all wave2 articles have a dedicated comparison definition", () => {
  for (const slug of slugs) assert.match(comparisons, new RegExp(`"${slug}"\\s*:\\s*\\{`), slug);
  assert.match(wave2, /comparisonBlocks\(comparison\)/);
  assert.match(wave2, /wave2Comparisons\[spec\.slug\]/);
});

test("each comparison has a dedicated TrackMCP section and named alternatives", () => {
  const sections = comparisons.split(/\n  "(?=[a-z0-9-]+": \{)/).slice(1);
  for (const section of sections) {
    const slug = section.match(/^([^"\n]+)"/)?.[1];
    if (!slug || !slugs.includes(slug)) continue;
    assert.match(section, /trackmcp: entry\("TrackMCP"/);
    assert.match(section, /entries: \[/);
    assert.ok((section.match(/\n      entry\(/g) ?? []).length >= 4, `${slug} needs four named alternatives`);
    assert.doesNotMatch(section, /Where TrackMCP fits/);
  }
});

test("comparison blocks use the existing editorial block renderer", () => {
  assert.match(comparisons, /export function comparisonBlocks/);
  assert.match(comparisons, /\{ t: "h2", c: section\.name \}/);
  assert.match(comparisons, /\{ t: "links", items: section\.links \}/);
  assert.doesNotMatch(posts, /t: "listicle"/);
  assert.doesNotMatch(page, /b\.t === "listicle"/);
});

test("all comparison source links open safely in a new tab", () => {
  assert.match(page, /target="_blank" rel=(?:"noopener noreferrer"|\{item\.sponsored \? "sponsored nofollow noopener noreferrer" : "noopener noreferrer"\})/);
  assert.doesNotMatch(comparisons, /[—–]/);
});

test("the existing successful observability article remains registered", () => {
  assert.match(posts, /slug: "best-mcp-observability-tools-for-production-servers"/);
});

test("each wave2 article has a distinct cover and inline visual", () => {
  const visuals = [...enrichment.matchAll(/\["[^\"]+",\s*"([^\"]+)",\s*"([^\"]+)"/g)];
  const covers = visuals.map((m) => m[1]);
  const details = visuals.map((m) => m[2]);
  assert.equal(covers.length, slugs.length);
  assert.equal(details.length, slugs.length);
  assert.equal(new Set(covers).size, slugs.length);
  assert.equal(new Set(details).size, slugs.length);
  assert.match(enrichment, /t: "figure"/);
});
