import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const migration = fs.readFileSync(new URL("../../../../supabase/migrations/20260907000009_regressions_alerts.sql", import.meta.url), "utf8");

test("P1-05 migration is forward-only, transactional, bounded, and workspace scoped", () => {
  assert.match(migration, /begin;[\s\S]*commit;/i);
  assert.doesNotMatch(migration, /drop\s+(table|column|index)/i);
  for (const table of ["trackmcp_alert_destinations", "trackmcp_alert_configs", "trackmcp_alert_incidents", "trackmcp_alert_deliveries"]) assert.match(migration, new RegExp(`create table if not exists public\\.${table}`));
  for (const index of ["trackmcp_alert_configs_workspace_enabled_idx", "trackmcp_alert_incidents_workspace_state_seen_idx", "trackmcp_alert_deliveries_retry_idx", "trackmcp_alert_deliveries_idempotency_idx", "trackmcp_alert_destinations_workspace_enabled_idx"]) assert.match(migration, new RegExp(index));
  assert.match(migration, /attempt_number between 1 and 4/);
  assert.match(migration, /enable row level security/gi);
  assert.match(migration, /revoke all on public\.trackmcp_alert_deliveries from anon, authenticated/);
});
