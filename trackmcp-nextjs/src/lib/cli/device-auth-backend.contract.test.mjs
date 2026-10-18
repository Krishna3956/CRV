import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const migration = await readFile(new URL("../../../../supabase/migrations/20261018000001_cli_device_authorization.sql", import.meta.url), "utf8");

test("device migration stores hashes and service-only access", () => {
  assert.match(migration, /device_code_hash text not null unique/);
  assert.match(migration, /user_code_hash text not null unique/);
  assert.match(migration, /status in \('pending', 'approved', 'denied', 'redeeming', 'redeemed', 'expired'\)/);
  assert.match(migration, /alter table public\.trackmcp_cli_device_sessions enable row level security/);
  assert.match(migration, /revoke all on public\.trackmcp_cli_device_sessions from anon, authenticated/);
  assert.doesNotMatch(migration, /device_code text|user_code text|api_key text|password text|email text|project_path text/);
});

test("activation milestone is idempotent and bounded", () => {
  assert.match(migration, /create table if not exists public\.trackmcp_activation_milestones/);
  assert.match(migration, /unique \(workspace_id, key_id\)/);
  assert.match(migration, /event_type in \('protocol', 'tool_call', 'session', 'catalog', 'workflow', 'custom'\)/);
});
