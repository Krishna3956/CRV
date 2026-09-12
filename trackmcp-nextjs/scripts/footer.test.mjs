import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const footer = readFileSync("src/components/Footer.tsx", "utf8");

test("footer has a focused CTA and purposeful navigation groups", () => {
  assert.match(footer, /aria-labelledby="footer-cta-title"/);
  assert.match(footer, /Start with TrackMCP/);
  assert.match(footer, /Read the docs/);
  assert.match(footer, /aria-label="Footer navigation"/);
  for (const title of ["Product", "Developers", "Explore", "MCP Observability", "Company"]) {
    assert.match(footer, new RegExp(`title: "${title}"`));
  }
});

test("footer keeps canonical high-intent internal links and legal links", () => {
  for (const href of [
    "/mcp-observability",
    "/mcp-server-analytics",
    "/docs",
    "/repository",
    "/free-mcp-servers",
    "/mcp-servers/social-media",
    "/mcp-observability/compare/trackmcp-vs-sentry",
    "/mcp-observability/compare/trackmcp-vs-datadog",
    "/privacy",
    "/terms",
  ]) assert.match(footer, new RegExp(`href(?:=|: )\"${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\"`));
  assert.doesNotMatch(footer, /href(?:=|: )\"\/tools\/mcp-health-check\"/);
  assert.doesNotMatch(footer, /href(?:=|: )\"\/tools\/mcp-inspector\"/);
});

const baseUrl = process.env.FOOTER_TEST_BASE_URL?.replace(/\/$/, "");
test("rendered footer is accessible on a public page", { skip: !baseUrl }, async () => {
  const response = await fetch(`${baseUrl}/mcp-observability`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /id="footer-cta-title"/);
  assert.match(html, /aria-label="Footer navigation"/);
  assert.match(html, /href="\/mcp-observability"/);
  assert.match(html, /href="\/free-mcp-servers"/);
  assert.match(html, /href="\/privacy"/);
});
