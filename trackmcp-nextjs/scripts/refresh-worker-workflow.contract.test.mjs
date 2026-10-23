import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(new URL("../../.github/workflows/founder-os-refresh-worker.yml", import.meta.url), "utf8");

test("scheduled refresh worker emits a bounded redacted lag/retry summary artifact", () => {
  assert.match(workflow, /summary_file=\"\$RUNNER_TEMP\/trackmcp-refresh-worker-summary\.jsonl\"/);
  assert.match(workflow, /max_queue_lag_ms/);
  assert.match(workflow, /max_attempt_count/);
  assert.match(workflow, /errors_count/);
  assert.match(workflow, /response_unparseable/);
  assert.match(workflow, /workflow_failed/);
  assert.match(workflow, /refresh-worker-summary-\$\{\{ github\.run_id \}\}/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /if: always\(\)/);
  assert.doesNotMatch(workflow, /cat \"\$batch_dir\/\$batch\.json\"/);
});
