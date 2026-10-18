import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const migration = await readFile(new URL("../../../../supabase/migrations/20261018000001_cli_device_authorization.sql", import.meta.url), "utf8");
const hardeningMigration = await readFile(new URL("../../../../supabase/migrations/20261018000002_cli_activation_hardening.sql", import.meta.url), "utf8");
const redeemRoute = await readFile(new URL("../../../../trackmcp-nextjs/src/app/api/v1/cli/device/sessions/redeem/route.ts", import.meta.url), "utf8");

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

test("redemption hardening has retry identity and never adds raw key storage", () => {
  assert.match(hardeningMigration, /redemption_id_hash text/);
  assert.match(hardeningMigration, /unique index if not exists trackmcp_cli_device_sessions_redemption_idx/);
  assert.doesNotMatch(hardeningMigration, /api_key text|raw_key|secret text|device_code text/);
});

test("funnel ledger covers bounded activation facts and source attribution", () => {
  assert.match(hardeningMigration, /signup_completed/);
  assert.match(hardeningMigration, /api_key_copied/);
  assert.match(hardeningMigration, /setup_snippet_copied/);
  assert.match(hardeningMigration, /first_telemetry_seen/);
  assert.match(hardeningMigration, /source in \('npm', 'sdk_docs', 'github', 'ai', 'direct', 'device', 'unknown'\)/);
  assert.doesNotMatch(hardeningMigration, /(?:^|\n)\s*(?:email|ip_address|api_key)\s+text\b/im);
  assert.doesNotMatch(hardeningMigration, /payload\s+jsonb/);
});

test("redemption handles retry, concurrent claim, expiry, replay, and secret boundaries", () => {
  assert.match(redeemRoute, /status === "redeemed"/);
  assert.match(redeemRoute, /status === "redeeming"/);
  assert.match(redeemRoute, /eq\("status", "approved"\)/);
  assert.match(redeemRoute, /eq\("status", "redeeming"\)/);
  assert.match(redeemRoute, /isExpired\(session\.expires_at\)/);
  assert.match(redeemRoute, /redemption_id_hash/);
  assert.match(redeemRoute, /createDeterministicTrackMCPKey/);
  assert.doesNotMatch(redeemRoute, /console\.(log|error).*generated\.key/);
  assert.doesNotMatch(redeemRoute, /insert\(\{[^}]*api_key:/s);
});
