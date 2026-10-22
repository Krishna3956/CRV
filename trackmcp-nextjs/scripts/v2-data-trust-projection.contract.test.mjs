import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routes = [
  "catalogs", "journeys", "outcomes", "people", "prompts", "protocol-activity",
  "reliability", "resources", "tasks", "tools",
];

test("all public v2 analytics projections use the bounded provenance contract", async () => {
  for (const route of routes) {
    const source = await readFile(new URL(`../src/app/api/v2/${route}/handlers.ts`, import.meta.url), "utf8");
    assert.match(source, /projectTrackMCPDataTrust/,
      `${route} must project data_trust before it crosses the public envelope`);
    assert.doesNotMatch(source, /data_trust:\s*body\.data_trust\s*\?\?/,
      `${route} must not forward raw data_trust`);
  }
  const detail = await readFile(new URL("../src/app/api/v2/tools/[name]/handlers.ts", import.meta.url), "utf8");
  assert.match(detail, /projectTrackMCPDataTrust/);
  assert.doesNotMatch(detail, /data_trust:\s*body\.data_trust\s*\?\?/);
});
