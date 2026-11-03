import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./local-runtime-smoke.mjs", import.meta.url), "utf8");

test("local runtime smoke distinguishes a healthy sitemap from fail-closed database mode", () => {
  assert.match(source, /TRACKMCP_EXPECT_UNAVAILABLE_TOOL_SITEMAP/);
  assert.match(source, /path === "\/tool-sitemap\.xml"/);
  assert.match(source, /expectedStatus === 503/);
  assert.match(source, /retry-after/);
  assert.match(source, /Retry-After: 300/);
});
