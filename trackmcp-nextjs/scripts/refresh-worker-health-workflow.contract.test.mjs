import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(new URL("../../.github/workflows/founder-os-refresh-health.yml", import.meta.url), "utf8");

test("health workflow can recover a missed worker tick without overlapping an active run", () => {
  assert.match(workflow, /actions: write/);
  assert.match(workflow, /founder-os-refresh-worker\.yml\/runs\?status=in_progress/);
  assert.match(workflow, /founder-os-refresh-worker\.yml\/dispatches/);
  assert.match(workflow, /Recovery dispatch: requested/);
  assert.match(workflow, /Recovery dispatch: skipped/);
  assert.match(workflow, /status=completed&per_page=1/);
  assert.match(workflow, /latest_age.*1200/);
  assert.match(workflow, /completed within the 20-minute cooldown/);
  assert.doesNotMatch(workflow, /echo \"- State: `\$state`\"/);
  assert.match(workflow, /--data '\{"ref":"main"\}'/);
});
