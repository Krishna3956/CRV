import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../../../../supabase/migrations/20261018000014_rate_limit_buckets.sql", import.meta.url), "utf8");
const postflight = await readFile(new URL("../../../../supabase/manual/founder-os-rate-limit-postflight.sql", import.meta.url), "utf8");

test("distributed limiter migration is bounded and service-role-only", () => {
  assert.match(migration, /create table if not exists public\.trackmcp_rate_limit_buckets/);
  assert.match(migration, /trackmcp_consume_rate_limit/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /trackmcp_cleanup_rate_limit_buckets/);
  assert.match(migration, /limit p_max_rows/);
  assert.match(migration, /revoke all on public\.trackmcp_rate_limit_buckets from anon, authenticated/);
  assert.match(migration, /grant execute on function public\.trackmcp_consume_rate_limit[\s\S]*to service_role/);
  assert.doesNotMatch(migration, /payload|api[_-]?key|device_code/i);
  assert.match(migration, /delete from public\.trackmcp_rate_limit_buckets/);
});

test("rate-limit postflight is read-only and checks public access", () => {
  assert.match(postflight, /to_regclass/);
  assert.match(postflight, /rls_enabled/);
  assert.match(postflight, /updated_index_exists/);
  assert.match(postflight, /has_function_privilege/);
  assert.match(postflight, /cleanup_function_exists/);
  assert.match(postflight, /service_role_can_execute/);
  assert.match(postflight, /service_role_can_cleanup/);
  assert.doesNotMatch(postflight, /insert into|update |delete from|truncate /i);
});
