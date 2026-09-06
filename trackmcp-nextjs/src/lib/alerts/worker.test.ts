import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { handler as schedulerHandler } from "../../../workers/alerts-scheduler/handler.mjs";
import { runAlertsWorker, type AlertWorkerAdmin } from "./worker.ts";

function query(result: { data: unknown[] | null; error: unknown }): Record<string, unknown> {
  const value: Record<string, unknown> = {};
  for (const method of ["select", "eq", "in", "lte", "order", "insert", "update", "upsert"]) value[method] = () => value;
  value.limit = async () => result;
  value.maybeSingle = async () => ({ data: null, error: null });
  value.single = async () => ({ data: null, error: null });
  return value;
}

test("worker is bounded, records a clean empty evaluation, and skips a held lock", async () => {
  let rpcCalls = 0;
  const admin = {
    from: () => query({ data: [], error: null }),
    rpc: async () => { rpcCalls += 1; return { data: false, error: null }; },
  } as unknown as AlertWorkerAdmin;
  const result = await runAlertsWorker(admin, { now: new Date("2026-09-07T12:00:00Z") });
  assert.deepEqual(result, { state: "succeeded", configurations: 0, incidents: 0, deliveries: 0, skipped: 0, error_code: null });
  assert.equal(rpcCalls, 0);
});

test("worker exposes bounded configuration-query failure and held-lock behavior", async () => {
  const failedAdmin = {
    from: () => query({ data: null, error: new Error("database unavailable") }),
    rpc: async () => ({ data: false, error: null }),
  } as unknown as AlertWorkerAdmin;
  const failed = await runAlertsWorker(failedAdmin);
  assert.equal(failed.state, "failed");
  assert.equal(failed.error_code, "configuration_query_failed");

  const heldAdmin = {
    from: () => query({ data: [{ id: "config", workspace_id: "workspace", metric: "tool_error_rate_spike", enabled: true, paused: false, destination_ids: [], policy_version: "p1-05-v1" }], error: null }),
    rpc: async () => ({ data: false, error: null }),
  } as unknown as AlertWorkerAdmin;
  const held = await runAlertsWorker(heldAdmin);
  assert.equal(held.skipped, 1);
  assert.equal(held.incidents, 0);
});

test("scheduled invoker reports success and failure without logging response bodies", async () => {
  const previousUrl = process.env.TRACKMCP_ALERT_EVALUATOR_URL;
  const previousToken = process.env.TRACKMCP_ALERT_WORKER_TOKEN;
  const previousFetch = globalThis.fetch;
  process.env.TRACKMCP_ALERT_EVALUATOR_URL = "https://app.trackmcp.com/api/internal/alerts/evaluate";
  process.env.TRACKMCP_ALERT_WORKER_TOKEN = "worker-token";
  globalThis.fetch = (async (_input, init) => {
    assert.equal(init?.redirect, "manual");
    assert.equal(new Headers(init?.headers).get("x-trackmcp-worker-token"), "worker-token");
    return new Response(null, { status: 200 });
  }) as typeof fetch;
  assert.deepEqual(await schedulerHandler(), { statusCode: 200 });
  globalThis.fetch = (async () => new Response(null, { status: 503 })) as typeof fetch;
  await assert.rejects(() => schedulerHandler(), /HTTP 503/);
  globalThis.fetch = previousFetch;
  if (previousUrl === undefined) delete process.env.TRACKMCP_ALERT_EVALUATOR_URL; else process.env.TRACKMCP_ALERT_EVALUATOR_URL = previousUrl;
  if (previousToken === undefined) delete process.env.TRACKMCP_ALERT_WORKER_TOKEN; else process.env.TRACKMCP_ALERT_WORKER_TOKEN = previousToken;
});

test("scheduler template is hourly and disabled until explicitly enabled", () => {
  const template = fs.readFileSync(new URL("../../../workers/alerts-scheduler/template.yaml", import.meta.url), "utf8");
  assert.match(template, /Type: AWS::Scheduler::Schedule/);
  assert.match(template, /ScheduleExpression: rate\(1 hour\)/);
  assert.match(template, /MaximumEventAgeInSeconds: 3600/);
  assert.match(template, /MaximumRetryAttempts: 2/);
  assert.match(template, /DeadLetterConfig:/);
  assert.match(template, /AWS::Lambda::Permission/);
  assert.match(template, /AWS\/Lambda/);
  assert.match(template, /Default: 'false'/);
  assert.match(template, /Timeout: 60/);
  assert.match(template, /WorkerTokenSecretArn/);
});
