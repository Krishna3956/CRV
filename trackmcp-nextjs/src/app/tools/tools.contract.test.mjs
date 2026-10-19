import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const routeFiles = [
  "mcp-server-tester/page.tsx",
  "mcp-health-check/page.tsx",
  "mcp-inspector/page.tsx",
];

test("approved public tester routes exist and use the shared client app", async () => {
  for (const route of routeFiles) {
    const source = await readFile(resolve(root, "src/app/tools", route), "utf8");
    assert.match(source, /export default function/);
    assert.match(source, /McpTesterPage|fixture/i);
    assert.doesNotMatch(source, /dangerouslySetInnerHTML|innerHTML/);
  }
});

test("focused aliases canonicalize to the main tester route", async () => {
  for (const route of ["mcp-health-check/page.tsx", "mcp-inspector/page.tsx"]) {
    const source = await readFile(resolve(root, "src/app/tools", route), "utf8");
    assert.match(source, /canonical:\s*"\/tools\/mcp-server-tester"/);
  }
});

test("sitemap includes only the approved public tester routes", async () => {
  const sitemap = await readFile(resolve(root, "src/app/sitemap.ts"), "utf8");
  for (const route of ["mcp-server-tester", "mcp-health-check", "mcp-inspector"]) assert.match(sitemap, new RegExp(`/tools/${route}`));
  assert.doesNotMatch(sitemap, /\/tools\/test-mcp-server/);
  assert.doesNotMatch(sitemap, /\/mcp-tester["`]/);
});

test("repository submissions invalidate the dynamic tool sitemap", async () => {
  const route = await readFile(resolve(root, "src/app/api/repository/submit/route.ts"), "utf8");
  assert.match(route, /revalidatePath\("\/tool-sitemap\.xml"\)/);
  assert.match(route, /revalidatePath\("\/tool-sitemap\/\[shard\]", "page"\)/);
});

test("tool sitemap is an index of bounded shards", async () => {
  const route = await readFile(resolve(root, "src/app/tool-sitemap.xml/route.ts"), "utf8");
  assert.match(route, /getToolCount/);
  assert.match(route, /sitemapindex/);
  assert.match(route, /TOOL_SITEMAP_PAGE_SIZE/);
  assert.match(route, /application\/xml/);
  const shard = await readFile(resolve(root, "src/app/tool-sitemap/[shard]/route.ts"), "utf8");
  assert.match(shard, /getToolNamesPage/);
  assert.match(shard, /TOOL_SITEMAP_PAGE_SIZE/);
  assert.match(shard, /urlset/);
  assert.match(shard, /shard > 49_999/);
  const config = await readFile(resolve(root, "next.config.ts"), "utf8");
  assert.match(config, /source: "\/tool-sitemap\/:shard\.xml"/);
  assert.match(config, /destination: "\/tool-sitemap\/:shard"/);
  const queries = await readFile(resolve(root, "src/lib/repository/queries.ts"), "utf8");
  assert.match(queries, /getToolCount/);
  assert.match(queries, /getToolNamesPage/);
  assert.match(queries, /getAllToolNames[\s\S]*?\.in\("status", \["approved", "pending"\]\)/);
  assert.match(queries, /getAllToolNames[\s\S]*?\.order\("stars",[\s\S]*?\.order\("id", \{ ascending: true \}\)/);
  assert.match(queries, /getCategoryCounts[\s\S]*?\.range\(offset, offset \+ batch - 1\)/);
  assert.match(queries, /getCategoryCounts[\s\S]*?\.order\("id", \{ ascending: true \}\)/);
  assert.doesNotMatch(queries, /getCategoryCounts[\s\S]*?\.limit\(10000\)/);
});

test("the retired fixture route is a permanent redirect to the primary tester", async () => {
  const config = await readFile(resolve(root, "next.config.ts"), "utf8");
  assert.match(config, /source:\s*"\/tools\/test-mcp-server"/);
  assert.match(config, /destination:\s*"\/tools\/mcp-server-tester"/);
  assert.match(config, /source:\s*"\/tools\/test-mcp-server"[\s\S]*?permanent:\s*true/);
  await assert.rejects(readFile(resolve(root, "src/app/tools/test-mcp-server/page.tsx"), "utf8"));
});

test("footer presents the primary tester and no retired fixture link", async () => {
  const footer = await readFile(resolve(root, "src/components/Footer.tsx"), "utf8");
  assert.match(footer, /label: "MCP server tester", href: "\/tools\/mcp-server-tester"/);
  assert.doesNotMatch(footer, /\/tools\/test-mcp-server/);
});

test("new visible route copy avoids em-dash characters", async () => {
  for (const route of routeFiles) {
    const source = await readFile(resolve(root, "src/app/tools", route), "utf8");
    const visibleSource = source.replace(/title:\s*"[^"]*"/, "title: \"\"");
    assert.doesNotMatch(visibleSource, /—/);
  }
});
