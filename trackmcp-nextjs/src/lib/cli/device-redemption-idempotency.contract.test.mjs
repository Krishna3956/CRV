import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const route = await readFile(new URL("../../app/api/v1/cli/device/sessions/redeem/handlers.ts", import.meta.url), "utf8");
const migration = await readFile(new URL("../../../../supabase/migrations/20261018000013_cli_redemption_idempotency.sql", import.meta.url), "utf8");
const postflight = await readFile(new URL("../../../../supabase/manual/founder-os-cli-redemption-idempotency-postflight.sql", import.meta.url), "utf8");

test("redeem requires and persists only a bounded redemption-id hash", () => {
  assert.match(route, /redemption_id/);
  assert.match(route, /hashDeviceCode\(redemptionId\)/);
  assert.match(route, /redemption_id_hash/);
  assert.match(route, /is\("redemption_id_hash", null\)/);
  assert.doesNotMatch(route, /console\.(log|error).*redemptionId/);
  assert.doesNotMatch(route, /api_key.*redemption_id|redemption_id.*api_key/);
  assert.match(migration, /add column if not exists redemption_id_hash text/);
  assert.match(migration, /'\^\[a-f0-9\]\{64\}\$'/);
  assert.match(migration, /create unique index if not exists trackmcp_cli_device_sessions_redemption_id_idx/);
});

test("redemption idempotency postflight is read-only", () => {
  assert.match(postflight, /select/i);
  assert.doesNotMatch(postflight, /insert into|update |delete from|truncate /i);
});
