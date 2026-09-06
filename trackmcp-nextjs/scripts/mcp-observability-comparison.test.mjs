import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const read = (path) => readFileSync(resolve(path), "utf8");
const postsSource = read("src/app/blog/posts.ts");
const enrichmentSource = read("src/app/blog/enrichment.ts");
const articleSource = read("src/app/blog/[slug]/page.tsx");
const compareSource = read("src/app/mcp-observability/compare/trackmcp-vs-sentry/page.tsx");
const datadogSource = read("src/app/mcp-observability/compare/trackmcp-vs-datadog/page.tsx");
const footerSource = read("src/components/Footer.tsx");
const sitemapSource = read("src/app/sitemap.ts");
const pillarSlug = "best-mcp-observability-tools-for-production-servers";
const comparePath = "/mcp-observability/compare/trackmcp-vs-sentry";
const datadogPath = "/mcp-observability/compare/trackmcp-vs-datadog";
const pillarStart = postsSource.indexOf(`    slug: "${pillarSlug}"`);
const firstExistingPostStart = postsSource.indexOf('  {\n    slug: "trackmcp-foundation-release"');
const pillarSource = postsSource.slice(pillarStart, firstExistingPostStart);

test("pillar article is first and has complete editorial metadata", () => {
  assert.ok(pillarStart > -1);
  assert.ok(pillarStart < firstExistingPostStart);
  assert.match(pillarSource, /title: "Best MCP Observability Tools for Production Servers"/);
  assert.match(pillarSource, /tag: "MCP observability"/);
  assert.match(pillarSource, /date: "Sep 7, 2026"/);
  assert.match(pillarSource, /updated: "Sep 7, 2026"/);
  assert.match(pillarSource, /verified: "Sep 7, 2026"/);
  assert.match(pillarSource, /"MCP observability"/);
  assert.match(pillarSource, /"MCP server monitoring"/);
  assert.match(pillarSource, /"AI observability tools"/);
});

test("pillar article covers the requested products and accurate boundaries", () => {
  for (const product of ["TrackMCP", "Sentry", "Datadog", "Grafana and OpenTelemetry", "Langfuse", "LangSmith"]) {
    assert.match(pillarSource, new RegExp(product.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const phrase of [
    "server boundary",
    "private model reasoning",
    "bounded and redacted",
    "successful transport responses",
    "does not claim to see",
    "publicly documented capabilities",
  ]) {
    assert.match(pillarSource, new RegExp(phrase, "i"));
  }
  assert.doesNotMatch(pillarSource, /\u2014/);
});

test("pillar article has internal and first-party documentation links", () => {
  for (const href of [
    "/mcp-observability",
    "/docs",
    "/mcp-server-analytics/compare",
    "/mcp-server-analytics/quickstart",
    "/blog/how-to-monitor-an-mcp-server-in-production",
    "/track-mcp",
    "https://sentry.io/changelog/mcp-monitoring---generally-available/",
    "https://docs.datadoghq.com/llm_observability/instrument/auto_instrumentation/",
    "https://grafana.com/docs/grafana-cloud/observe-and-act/monitor-applications/ai-observability/mcp-observability/",
    "https://langfuse.com/docs/observability/features/mcp-tracing",
    "https://docs.langchain.com/langsmith/observability-llm-tutorial",
  ]) {
    assert.match(pillarSource, new RegExp(`href: "${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  }
});

test("pillar article uses existing editorial artwork and displays verification metadata", () => {
  assert.match(enrichmentSource, /"best-mcp-observability-tools-for-production-servers":/);
  assert.match(enrichmentSource, /art: "clients"/);
  assert.match(articleSource, /post\.updated/);
  assert.match(articleSource, /post\.verified/);
});

test("Sentry comparison has metadata, neutral language, and the requested comparison fields", () => {
  assert.match(compareSource, /pageMeta\(/);
  assert.match(compareSource, /title: "TrackMCP vs Sentry for MCP Server Observability \| TrackMCP"/);
  assert.match(compareSource, /path: PAGE_PATH/);
  assert.match(compareSource, /Last verified/);
  for (const phrase of [
    "MCP server-side telemetry",
    "Client metadata",
    "Tool usage and adoption",
    "Resource visibility",
    "Application errors inside successful transport responses",
    "Observed tool latency",
    "Explicit workflow or outcome signals",
    "Authenticated trace exploration",
    "Local redaction and bounded payload controls",
    "General infrastructure monitoring",
    "TrackMCP is a better fit when",
    "Sentry is a better fit when",
    "Teams may use both",
    "not documented",
  ]) {
    assert.match(compareSource, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
  assert.doesNotMatch(compareSource, /Sentry lacks MCP support/i);
  assert.doesNotMatch(compareSource, /\u2014/);
});

test("Datadog comparison has factual metadata, source links, and explicit boundaries", () => {
  assert.match(datadogSource, /pageMeta\(/);
  assert.match(datadogSource, /title: "TrackMCP vs Datadog for MCP Observability \| TrackMCP"/);
  assert.match(datadogSource, /path: PAGE_PATH/);
  assert.match(datadogSource, /Last verified/);
  for (const phrase of [
    "MCP server-side telemetry",
    "MCP client instrumentation",
    "Client name and version context",
    "Tool usage and adoption",
    "Catalog and tools/list context",
    "Application errors inside successful transport responses",
    "Observed MCP tool latency",
    "Explicit MCP workflow outcome signals",
    "Authenticated trace exploration",
    "Local redaction and bounded payload controls",
    "General infrastructure and application monitoring",
    "TrackMCP is a better fit when",
    "Datadog is a better fit when",
    "Teams may use both",
    "not documented",
  ]) {
    assert.match(datadogSource, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
  for (const href of [
    "https://docs.datadoghq.com/llm_observability/instrument/auto_instrumentation/",
    "https://docs.datadoghq.com/llm_observability/guide/monitor_mcp_client/",
  ]) {
    assert.match(datadogSource, new RegExp(`href="${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  }
  assert.doesNotMatch(datadogSource, /Datadog lacks MCP support/i);
  assert.doesNotMatch(datadogSource, /Datadog MCP Server/i);
  assert.doesNotMatch(datadogSource, /\u2014/);
});

test("footer has one dedicated MCP Observability group with published canonical links", () => {
  assert.match(footerSource, /title: "MCP Observability"/);
  for (const href of [
    "/mcp-observability",
    "/blog/best-mcp-observability-tools-for-production-servers",
    "/mcp-observability/compare/trackmcp-vs-sentry",
    "/mcp-observability/compare/trackmcp-vs-datadog",
  ]) {
    assert.match(footerSource, new RegExp(`href: "${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  }
  assert.equal((footerSource.match(/href: "\/mcp-observability"/g) || []).length, 1);
  assert.doesNotMatch(footerSource, /tester|health.?check/i);
  assert.doesNotMatch(footerSource, /\u2014/);
});

test("both pages expose BreadcrumbList JSON-LD and the comparison exposes WebPage JSON-LD", () => {
  assert.match(articleSource, /breadcrumbJsonLd\(\[/);
  assert.match(compareSource, /breadcrumbJsonLd\(\[/);
  assert.match(datadogSource, /breadcrumbJsonLd\(\[/);
  assert.match(compareSource, /"@type": "WebPage"/);
  assert.match(compareSource, /serializeJsonLd\(\[jsonLd, breadcrumbSchema\]\)/);
  assert.match(datadogSource, /"@type": "WebPage"/);
  assert.match(datadogSource, /serializeJsonLd\(\[jsonLd, breadcrumbSchema\]\)/);
});

test("sitemap includes the new blog post through posts and the comparison route", () => {
  assert.match(sitemapSource, /posts\.map\(\(p\) =>/);
  assert.match(sitemapSource, /\$\{BASE\}\/mcp-observability\/compare\/trackmcp-vs-sentry/);
  assert.match(sitemapSource, /\$\{BASE\}\/mcp-observability\/compare\/trackmcp-vs-datadog/);
});

const baseUrl = process.env.OBSERVABILITY_COMPARISON_TEST_BASE_URL?.replace(/\/$/, "");
test("rendered routes expose canonical metadata and valid JSON-LD", { skip: !baseUrl }, async () => {
  for (const route of [`/blog/${pillarSlug}`, comparePath, datadogPath]) {
    const response = await fetch(`${baseUrl}${route}`);
    assert.equal(response.status, 200, `${route} returned HTTP ${response.status}`);
    const html = await response.text();
    assert.match(html, /<title>/);
    assert.match(html, /<meta[^>]+name="description"/);
    assert.match(html, /<link[^>]+rel="canonical"/);
    const schemas = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
    const nodes = schemas.flatMap((value) => Array.isArray(value) ? value : [value]);
    assert.ok(nodes.some((value) => value?.["@type"] === "BreadcrumbList"), `${route} missing BreadcrumbList`);
    if (route.startsWith("/blog/")) assert.ok(nodes.some((value) => value?.["@type"] === "Article"), `${route} missing Article`);
    if (route === comparePath || route === datadogPath) assert.ok(nodes.some((value) => value?.["@type"] === "WebPage"), `${route} missing WebPage`);
  }
});
