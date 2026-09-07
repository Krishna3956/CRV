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
