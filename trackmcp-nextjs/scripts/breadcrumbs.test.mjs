import assert from "node:assert/strict";
import test from "node:test";

const baseUrl = (process.env.SEO_TEST_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const routeCases = [
  { route: "/blog", names: ["Home", "Blog"] },
  {
    route: "/blog/mcp-tool-schemas",
    names: ["Home", "Blog", "MCP Tool Schemas: Validation Patterns That Reduce Agent Retries"],
  },
  {
    route: "/category/ai-and-machine-learning",
    names: ["Home", "MCP Categories", "AI & Machine Learning"],
  },
  { route: "/docs", names: ["Home", "Docs"] },
  { route: "/docs/typescript", names: ["Home", "Docs", "TypeScript SDK"] },
  { route: "/tool/ricktorzynski--anthropic-mcp", names: ["MCP Repository", "anthropic-mcp"] },
];

function jsonLdNodes(value) {
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((item) => (Array.isArray(item?.["@graph"]) ? item["@graph"] : [item]));
}

async function getBreadcrumb(route) {
  const response = await fetch(`${baseUrl}${route}`);
  assert.equal(response.status, 200, `${route} returned HTTP ${response.status}`);
  const html = await response.text();
  const schemas = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(
    (match) => {
      try {
        return jsonLdNodes(JSON.parse(match[1]));
      } catch {
        return [];
      }
    },
  );
  const breadcrumb = schemas.find((schema) => schema?.["@type"] === "BreadcrumbList");
  assert.ok(breadcrumb, `${route} is missing BreadcrumbList JSON-LD`);
  return breadcrumb;
}

for (const { route, names } of routeCases) {
  test(`breadcrumb JSON-LD is correct for ${route}`, async () => {
    const breadcrumb = await getBreadcrumb(route);
    assert.deepEqual(breadcrumb.itemListElement.map((item) => item.name), names);
    assert.equal(breadcrumb.itemListElement.length, names.length);
    for (const item of breadcrumb.itemListElement) {
      assert.match(item.item, /^https:\/\/trackmcp\.com\//);
    }
  });
}
