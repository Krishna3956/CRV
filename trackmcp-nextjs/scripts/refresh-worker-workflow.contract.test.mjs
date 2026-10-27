import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(new URL("../../.github/workflows/founder-os-refresh-worker.yml", import.meta.url), "utf8");

test("scheduled refresh worker emits a bounded redacted lag/retry summary artifact", () => {
  assert.match(workflow, /summary_file=\"\$RUNNER_TEMP\/trackmcp-refresh-worker-summary\.jsonl\"/);
  assert.match(workflow, /max_queue_lag_ms/);
  assert.match(workflow, /freshness_budget_ms=900000/);
  assert.match(workflow, /freshness_slo/);
  assert.match(workflow, /freshness_alert/);
  assert.match(workflow, /GITHUB_STEP_SUMMARY/);
  assert.match(workflow, /::warning::Refresh worker freshness is stale/);
  assert.match(workflow, /no_backlog_observed/);
  assert.match(workflow, /within_budget/);
  assert.match(workflow, /stale/);
  assert.match(workflow, /max_attempt_count/);
  assert.match(workflow, /errors_count/);
  assert.match(workflow, /response_unparseable/);
  assert.match(workflow, /timed_out/);
  assert.match(workflow, /batches_with_unparseable_response/);
  assert.match(workflow, /freshness_slo:\(if \$timed_out == 1/);
  assert.match(workflow, /workflow_failed/);
  assert.match(workflow, /refresh-worker-summary-\$\{\{ github\.run_id \}\}/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /if: always\(\)/);
  assert.match(workflow, /secretsmanager get-secret-value/);
  assert.match(workflow, /WORKER_SECRET_ARN=arn:aws:secretsmanager:ap-south-1:/);
  assert.match(workflow, /::add-mask::\$WORKER_SECRET/);
  assert.doesNotMatch(workflow, /secrets\.TRACKMCP_REFRESH_WORKER_SECRET/);
  assert.doesNotMatch(workflow, /cat \"\$batch_dir\/\$batch\.json\"/);
});

test("scheduled refresh worker fans out ten independently bounded leases", () => {
  assert.match(workflow, /Ten\s+bounded requests run concurrently/);
  assert.match(workflow, /Ten\n\s+# concurrent calls increase drain throughput/);
  assert.match(workflow, /for batch in \$\(seq 1 10\); do/);
  assert.match(workflow, /pids=\(\)/);
  assert.match(workflow, /wait \"\$\{pids\[\$\(\(batch - 1\)\)\]\}\"/);
});
