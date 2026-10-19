import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const migration = await readFile(new URL("../../../../supabase/migrations/20261019000001_alert_action_queue_link.sql", import.meta.url), "utf8");
const postflight = await readFile(new URL("../../../../supabase/manual/founder-os-alert-action-queue-link-postflight.sql", import.meta.url), "utf8");
const persistence = await readFile(new URL("./persistence.ts", import.meta.url), "utf8");

test("alert Action Queue link migration is additive, hash-only, and indexed", () => {
  assert.match(migration, /add column if not exists action_queue_fingerprint text/i);
  assert.match(migration, /action_queue_fingerprint_shape/i);
  assert.match(migration, /\^\[0-9a-f\]\{64\}\$/i);
  assert.match(migration, /trackmcp_alert_incidents_action_queue_fingerprint_idx/i);
  assert.match(migration, /where action_queue_fingerprint is not null/i);
  assert.doesNotMatch(migration, /^\s*(delete from|drop table|truncate table|update\s+public\.)/im);
});

test("link postflight is read-only and checks invalid rows", () => {
  assert.match(postflight, /information_schema\.columns/i);
  assert.match(postflight, /pg_indexes/i);
  assert.match(postflight, /invalid_link_rows/i);
  assert.match(postflight, /matched_queue_rows/i);
  assert.match(postflight, /left join public\.trackmcp_action_queue/i);
  assert.match(postflight, /left join public\.trackmcp_alert_deliveries/i);
  assert.match(postflight, /permanent_delivery_failures/i);
  assert.doesNotMatch(postflight, /alter table|create index|delete from|update\s+public\./i);
});

test("runtime top-level link is opt-in until the production postflight passes", () => {
  assert.match(persistence, /TRACKMCP_ENABLE_ALERT_ACTION_QUEUE_LINK/);
  assert.match(persistence, /action_queue_fingerprint = actionQueueLink/);
  assert.match(persistence, /bounded evidence link remains available/);
});
