import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");
const workflow = await readFile(new URL("../../../../../../../.github/workflows/founder-os-rate-limit-cleanup.yml", import.meta.url), "utf8");

test("rate-limit cleanup is secret-authenticated and bounded", () => {
  assert.match(source, /TRACKMCP_REFRESH_WORKER_SECRET/);
  assert.match(source, /timingSafeEqual/);
  assert.match(source, /maxAge < 3_600/);
  assert.match(source, /maxRows > 10_000/);
  assert.match(source, /JSON body must be an object/);
  assert.match(source, /trackmcp_cleanup_rate_limit_buckets/);
  assert.match(source, /cache-control.*no-store/);
  assert.doesNotMatch(source, /console\.log\(.*secret|api_key|payload/);
});

test("scheduled cleanup is serialized, retried, and reads the dedicated AWS secret", () => {
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /configure-aws-credentials@v4/);
  assert.match(workflow, /aws apprunner describe-service/);
  assert.match(workflow, /awsapprunner/);
  assert.match(workflow, /runs-on: ubuntu-latest\n\s+timeout-minutes: 2/);
  assert.match(workflow, /concurrency:\s*\n\s+group: founder-os-rate-limit-cleanup/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /--retry 3/);
  assert.match(workflow, /--max-time 55/);
  assert.match(workflow, /WORKER_SECRET_ARN: arn:aws:secretsmanager:ap-south-1:/);
  assert.match(workflow, /secretsmanager get-secret-value/);
  assert.match(workflow, /Dedicated refresh worker secret ARN is not configured[\s\S]*?exit 1/);
  assert.doesNotMatch(workflow, /secrets\.TRACKMCP_REFRESH_WORKER_SECRET/);
});
