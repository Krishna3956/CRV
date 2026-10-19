import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(process.cwd());
const read = (file) => readFile(resolve(root, file), "utf8");

test("analytics read surfaces declare bounded windows, pages, and source scans", async () => {
  const [v1, tools, catalogs, docs] = await Promise.all([
    read("src/app/api/v1/analytics/handlers.ts"),
    read("src/app/api/v2/tools/handlers.ts"),
    read("src/app/api/v2/catalogs/handlers.ts"),
    read("../docs/FOUNDER-OS-METRIC-CONTRACT.md"),
  ]);
  assert.match(v1, /Math\.min\(90, Math\.max\(1, Math\.floor\(requestedDays\)\)\)/);
  assert.match(v1, /const analyticsQueryLimit = 10000/);
  assert.match(v1, /\.limit\(analyticsQueryLimit\)/);
  assert.match(v1, /\.limit\(10001\)/);
  assert.match(tools, /const MAX_PAGE_SIZE = 100/);
  assert.match(tools, /decodeCursor/);
  assert.match(catalogs, /const MAX_TOOLS = 500/);
  assert.match(docs, /bounded read limits/i);
  assert.match(docs, /10,000/);
  assert.match(docs, /90-day/);
});

test("analytics bounds are disclosed as partial evidence rather than hidden completeness", async () => {
  const [v1, docs] = await Promise.all([
    read("src/app/api/v1/analytics/handlers.ts"),
    read("../docs/FOUNDER-OS-METRIC-CONTRACT.md"),
  ]);
  assert.match(v1, /buildTrackMCPDataTrust/);
  assert.match(v1, /truncated/);
  assert.match(docs, /partial|truncated|incomplete/i);
});
