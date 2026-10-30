import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");
const workflow = await readFile(new URL("../../../../../../../.github/workflows/founder-os-refresh-worker.yml", import.meta.url), "utf8");

test("refresh trigger is secret-authenticated, bounded, and uses the lease worker", () => {
  assert.match(source, /TRACKMCP_REFRESH_WORKER_SECRET/);
  assert.match(source, /timingSafeEqual/);
  assert.match(source, /requested > 100/);
  assert.match(source, /JSON body must be an object/);
  assert.match(source, /runRefreshJobBatch/);
  assert.match(source, /AbortController/);
  assert.match(source, /45_000/);
  assert.match(source, /signal: controller\.signal/);
  assert.match(source, /createSupabaseRefreshJobStore/);
  assert.match(source, /cache-control.*no-store/);
  assert.match(source, /result\.retryable > 0/);
  assert.match(source, /result\.failed > 0/);
  assert.match(source, /aborted batch can be a healthy bounded slice/);
  assert.doesNotMatch(source, /\|\| result\.aborted/);
  assert.match(source, /hasUnhealthyWork/);
  assert.doesNotMatch(source, /console\.log\(.*secret|api_key|payload/);
  assert.doesNotMatch(source, /secret:\s*undefined/);
});

test("scheduled refresh trigger is serial and distinguishes bounded timeouts from failures", () => {
  assert.match(workflow, /runs-on: ubuntu-latest\n(?:\s+#.*\n)*\s+timeout-minutes: 5/);
  assert.match(workflow, /concurrency:\s*\n\s+group: founder-os-refresh-worker/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /--retry 3/);
  assert.match(workflow, /--retry-all-errors/);
  assert.match(workflow, /--connect-timeout 5/);
  assert.match(workflow, /--retry-max-time 45/);
  assert.match(workflow, /--max-time 55/);
  assert.match(workflow, /timeout --signal=TERM --kill-after=10s 70s curl/);
  assert.match(workflow, /status=\$\?/);
  assert.match(workflow, /\[ "\$status" -eq 28 \] \|\| \[ "\$status" -eq 124 \] \|\| \[ "\$status" -eq 137 \]/);
  assert.match(workflow, /client timeout; continuing/);
  assert.match(workflow, /timed_out=\$timed_out/);
  assert.match(workflow, /\.timed_out \/\/ false\) == true/);
  assert.match(workflow, /One small bounded request runs at a time/);
  assert.match(workflow, /for batch in \$\(seq 1 1\); do/);
  assert.match(workflow, /--data '\{"max_jobs":4\}'/);
  assert.match(workflow, /::error::Refresh worker endpoint or secret ARN is not configured/);
  assert.match(workflow, /secret ARN is not configured[\s\S]*?exit 1/);
});
