import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const listicles = fs.readFileSync(path.join(root, "src/app/blog/wave2-listicles.ts"), "utf8");
const enrichment = fs.readFileSync(path.join(root, "src/app/blog/wave2-enrichment.ts"), "utf8");
const page = fs.readFileSync(path.join(root, "src/app/blog/[slug]/page.tsx"), "utf8");
const wave2 = fs.readFileSync(path.join(root, "src/app/blog/wave2.ts"), "utf8");

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

test("all wave2 articles have an explicit comparison map", () => {
  for (const slug of slugs) {
    assert.match(listicles, new RegExp(`"${slug}"\\s*:\\s*\\{`), slug);
  }
});

test("every wave2 comparison names TrackMCP and has at least four cards", () => {
  const sections = listicles.split(/\n  "(?=[a-z0-9-]+": \{)/).slice(1);
  for (const section of sections) {
    const slug = section.match(/^([^"\n]+)"/)?.[1];
    if (!slug || !slugs.includes(slug)) continue;
    const cards = section.match(/\n      item\(/g) ?? [];
    assert.ok(cards.length >= 4, `${slug} has ${cards.length} cards`);
    assert.match(section, /item\("TrackMCP"/);
    assert.match(section, /TrackMCP['’]s lane|TrackMCP is the production join|TrackMCP supplies/);
  }
});

test("the renderer emits semantic cards and safe source links", () => {
  assert.match(page, /b\.t === "listicle"/);
  assert.match(page, /<article key=\{item\.name\}/);
  assert.match(page, /Where TrackMCP fits/);
  assert.match(page, /target="_blank" rel="noopener noreferrer"/);
  assert.match(wave2, /wave2Listicles\[spec\.slug\]/);
});

test("wave2 uses topic-specific comparison cover art", () => {
  for (const key of ["testing-grid", "security-grid", "gateway-grid", "registry-grid", "load-grid", "monitoring-grid", "evaluation-grid", "benchmark-grid", "taxonomy-grid", "telemetry-grid", "scorecard-grid", "adoption-grid", "buyer-grid"]) {
    assert.match(enrichment, new RegExp(`"${key}"`), key);
  }
  assert.doesNotMatch(enrichment, /best-mcp-testing-debugging-tools", "protocol"/);
});

test("new comparison copy does not use typographic AI dashes", () => {
  assert.doesNotMatch(listicles, /[—–]/);
});
