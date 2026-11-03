import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dashboard = await readFile(new URL("./DashboardApp.tsx", import.meta.url), "utf8");
const analyticsTypes = await readFile(new URL("../../lib/telemetry/analytics-types.ts", import.meta.url), "utf8");
const contract = await readFile(new URL("../../../../docs/dashboard-data-contract-2026-11.md", import.meta.url), "utf8");

test("each business dashboard view has a typed data contract", () => {
  for (const view of ["Overview", "Who's using it", "What they're doing", "Resources & prompts", "The journey", "Did it work", "What's broken", "Evidence", "Setup"]) {
    assert.match(contract, new RegExp(view.replace(/[.*+?^${}()|[\\]\\]/g, "\\\\$&")));
  }
  assert.match(contract, /GET \/api\/v1\/analytics/);
  assert.match(contract, /data_trust/);
  assert.match(contract, /Example mode/);
});

test("dashboard fields used by the primary views exist in the typed Analytics response", () => {
  for (const field of [
    "who_is_using_it",
    "capability_activity",
    "resource_prompt_activity",
    "journey_activity",
    "outcome_activity",
    "issue_activity",
    "data_trust",
  ]) {
    assert.match(analyticsTypes, new RegExp(`\\b${field}\\??\\s*:`));
  }
  assert.match(dashboard, /analytics\.who_is_using_it/);
  assert.match(dashboard, /analytics\.capability_activity/);
  assert.match(dashboard, /analytics\.resource_prompt_activity/);
  assert.match(dashboard, /analytics\.journey_activity/);
  assert.match(dashboard, /analytics\.outcome_activity/);
  assert.match(dashboard, /analytics\.issue_activity/);
});
