import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(
  new URL("../../.github/workflows/founder-os-rate-limit-cleanup.yml", import.meta.url),
  "utf8",
);

test("rate-limit cleanup reads the dedicated AWS worker secret", () => {
  assert.match(workflow, /secretsmanager:ap-south-1:\d{12}:secret:trackmcp\/refresh\/worker-/);
  assert.match(workflow, /secretsmanager get-secret-value/);
  assert.match(workflow, /WORKER_SECRET_ARN/);
  assert.match(workflow, /::add-mask::\$WORKER_SECRET/);
  assert.doesNotMatch(workflow, /secrets\.TRACKMCP_REFRESH_WORKER_SECRET/);
  assert.match(workflow, /api\/internal\/rate-limit\/cleanup/);
});
