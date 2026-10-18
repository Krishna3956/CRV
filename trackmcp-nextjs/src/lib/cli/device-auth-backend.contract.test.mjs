import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const migration = await readFile(new URL("../../../../supabase/migrations/20261018000001_cli_device_authorization.sql", import.meta.url), "utf8");
const hardeningMigration = await readFile(new URL("../../../../supabase/migrations/20261018000002_cli_activation_hardening.sql", import.meta.url), "utf8");
const redeemRoute = await readFile(new URL("../../../../trackmcp-nextjs/src/app/api/v1/cli/device/sessions/redeem/route.ts", import.meta.url), "utf8");
const redemptionState = await readFile(new URL("../../../../trackmcp-nextjs/src/lib/cli/redemption-state.ts", import.meta.url), "utf8");
const keySource = await readFile(new URL("../../../../trackmcp-nextjs/src/lib/telemetry/keys.ts", import.meta.url), "utf8");
const reportingMigration = await readFile(new URL("../../../../supabase/migrations/20261018000003_cli_activation_reporting.sql", import.meta.url), "utf8");
const funnelRoute = await readFile(new URL("../../../../trackmcp-nextjs/src/app/api/v1/activation/funnel/route.ts", import.meta.url), "utf8");
const activationEventsRoute = await readFile(new URL("../../../../trackmcp-nextjs/src/app/api/v1/activation/events/route.ts", import.meta.url), "utf8");
const approveRoute = await readFile(new URL("../../../../trackmcp-nextjs/src/app/api/v1/cli/device/sessions/approve/route.ts", import.meta.url), "utf8");

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
  assert.match(redeemRoute, /recoveringRedeeming/);
  assert.match(redeemRoute, /redemptionAction\(session\.status, existingRedemptionMatches\)/);
  assert.match(redemptionState, /status === "redeeming" \|\| status === "redeemed"/);
  assert.match(redemptionState, /redemptionIdMatches \? "recover" : "already_redeemed"/);
});

test("deterministic key recovery requires a dedicated production secret", () => {
  assert.match(keySource, /TRACKMCP_DEVICE_KEY_DERIVATION_SECRET/);
  assert.match(keySource, /TRACKMCP_ALLOW_SERVICE_ROLE_KEY_FALLBACK === "true"/);
  assert.match(keySource, /NODE_ENV === "development" \|\| env\.NODE_ENV === "test"/);
  assert.doesNotMatch(keySource, /TRACKMCP_DEVICE_KEY_DERIVATION_SECRET \|\| process\.env\.SUPABASE_SERVICE_ROLE_KEY/);
});

test("browser approval has an explicit, key-free status contract", () => {
  for (const status of ["approved", "already_approved", "already_redeemed", "expired", "denied", "invalid"]) assert.match(approveRoute, new RegExp(`status: \\"${status}\\"`));
  assert.match(approveRoute, /status: "approved"/);
  assert.match(approveRoute, /status: "already_approved"/);
  assert.match(approveRoute, /status: "already_redeemed"/);
  assert.match(approveRoute, /status: "expired"/);
  assert.match(approveRoute, /status: "denied"/);
  assert.match(approveRoute, /status: "invalid"/);
  assert.doesNotMatch(approveRoute, /api_key|createTrackMCPKey|generated\.key/);
});

test("funnel aggregation is server-side and not subject to Supabase page limits", () => {
  assert.match(reportingMigration, /create or replace function public\.trackmcp_activation_funnel_report/);
  assert.match(reportingMigration, /group by event_type, source/);
  assert.match(reportingMigration, /group by status/);
  assert.match(reportingMigration, /group by observation_source/);
  assert.match(funnelRoute, /rpc\("trackmcp_activation_funnel_report"/);
  assert.doesNotMatch(funnelRoute, /from\("trackmcp_activation_funnel_events"\)/);
  assert.doesNotMatch(funnelRoute, /\.reduce<.*eventCounts/);
});

test("activation event ingestion is bounded, authenticated, and rejects arbitrary fields", () => {
  assert.match(activationEventsRoute, /getUser\(\)/);
  assert.match(activationEventsRoute, /MAX_EVENT_BODY_BYTES/);
  assert.match(activationEventsRoute, /validateActivationEventBody/);
  assert.match(activationEventsRoute, /trackmcp_workspace_members/);
  assert.match(activationEventsRoute, /retry-after/);
});

test("reporting migration exposes an operator-only, bounded cleanup function", () => {
  assert.match(reportingMigration, /create or replace function public\.trackmcp_cleanup_cli_device_sessions/);
  assert.match(reportingMigration, /p_before > now\(\)/);
  assert.match(reportingMigration, /status in \('denied', 'redeemed', 'expired'\)/);
  assert.match(reportingMigration, /grant execute on function public\.trackmcp_cleanup_cli_device_sessions\(timestamptz\) to service_role/);
});
