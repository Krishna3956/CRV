import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./refresh-scheduler-endpoint-smoke.mjs", import.meta.url), "utf8");

test("refresh endpoint smoke is HTTPS-only, bounded, and secret-free", () => {
  assert.match(source, /TRACKMCP_REFRESH_SMOKE_URL/);
  assert.match(source, /protocol, "https:"/);
  assert.ok(source.includes("/\\/api\\/internal\\/refresh\\/run$/"));
  assert.match(source, /AbortSignal\.timeout\(10_000\)/);
  assert.match(source, /invalid-test-token/);
  assert.match(source, /unauthenticated, 401/);
  assert.match(source, /invalidToken, 401/);
  assert.doesNotMatch(source, /TRACKMCP_REFRESH_WORKER_SECRET/);
  assert.doesNotMatch(source, /get-secret-value|SecretString/i);
});
