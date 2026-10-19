import assert from "node:assert/strict";
import test from "node:test";
import { evaluateWorkerHealth, type WorkerHealthEvent } from "./worker-health.ts";

const now = new Date("2026-10-19T12:00:00.000Z");
const event = (state: string, queued_at = "2026-10-19T11:59:00.000Z") => ({ state, queued_at });

test("returns explicit insufficient-data findings for an empty worker window", () => {
  const findings = evaluateWorkerHealth([], now);
  assert.deepEqual(findings.map((finding) => finding.state), ["insufficient_data", "insufficient_data", "insufficient_data", "insufficient_data"]);
  assert.ok(findings.every((finding) => finding.reasons.includes("below_minimum_volume") || finding.reasons.includes("missing_measurement")));
});

test("classifies a bounded healthy worker window", () => {
  const findings = evaluateWorkerHealth(Array.from({ length: 10 }, () => event("completed")), now);
  assert.deepEqual(findings.map((finding) => finding.state), ["normal", "insufficient_data", "normal", "normal"]);
  assert.equal(findings[3]?.value, 1);
});

test("classifies backlog and lag independently", () => {
  const events = Array.from({ length: 25 }, () => event("queued", "2026-10-19T11:40:00.000Z"));
  const findings = evaluateWorkerHealth(events, now);
  assert.equal(findings[0]?.state, "warning");
  assert.equal(findings[0]?.value, 25);
  assert.equal(findings[1]?.state, "critical");
  assert.equal(findings[1]?.value, 20);
});

test("raises critical dead-letter and success-rate findings", () => {
  const events = [
    ...Array.from({ length: 6 }, () => event("dead_letter")),
    ...Array.from({ length: 4 }, () => event("failed")),
  ];
  const findings = evaluateWorkerHealth(events, now);
  assert.equal(findings[2]?.state, "critical");
  assert.equal(findings[3]?.state, "critical");
  assert.equal(findings[3]?.value, 0);
});

test("bounds malformed values and future queue timestamps", () => {
  const findings = evaluateWorkerHealth([
    { state: "queued", queued_at: "not-a-date", attempts: "999999999999999999" },
    { state: "queued", queued_at: "2026-10-19T13:00:00.000Z" },
  ], now);
  assert.equal(findings[0]?.value, 2);
  assert.equal(findings[1]?.value, null);
  assert.equal(findings[1]?.state, "insufficient_data");
});

test("never includes event details or payload-shaped fields in findings", () => {
  const findings = evaluateWorkerHealth([{ state: "failed", error_body: "secret" } as WorkerHealthEvent], now);
  assert.equal(JSON.stringify(findings).includes("secret"), false);
  assert.deepEqual(Object.keys(findings[0] ?? {}).sort(), ["metric", "reasons", "sample_count", "state", "threshold", "unit", "value"]);
});
