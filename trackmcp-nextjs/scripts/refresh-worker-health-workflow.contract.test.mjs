import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(new URL("../../.github/workflows/founder-os-refresh-health.yml", import.meta.url), "utf8");

test("refresh health monitor is read-only, bounded, and redacted", () => {
  assert.match(workflow, /actions: read/);
  assert.match(workflow, /timeout-minutes: 5/);
  assert.match(workflow, /event=schedule/);
  assert.match(workflow, /refresh-worker-summary-\$run_id/);
  assert.match(workflow, /refresh-worker-health-\$\{\{ github\.run_id \}\}/);
  assert.match(workflow, /GITHUB_STEP_SUMMARY/);
  assert.match(workflow, /::warning::Refresh worker sequence health requires attention/);
  assert.doesNotMatch(workflow, /TRACKMCP_REFRESH_WORKER_SECRET/);
  assert.doesNotMatch(workflow, /POST/);
});
