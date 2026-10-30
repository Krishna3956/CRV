import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = new URL("../../../../supabase/migrations/20261018000003_founder_os_read_model.sql", import.meta.url);
const taskTransitionMigrationPath = new URL("../../../../supabase/migrations/20261019000005_task_transition_history.sql", import.meta.url);
const lifecycleFactMigrationPath = new URL("../../../../supabase/migrations/20261024000001_lifecycle_fact_type.sql", import.meta.url);
const taskTransitionScopeMigrationPath = new URL("../../../../supabase/migrations/20261030000002_task_transition_scope.sql", import.meta.url);
const catalogEntityTransportMigrationPath = new URL("../../../../supabase/migrations/20261030000003_catalog_entity_transport_scope.sql", import.meta.url);

test("Founder OS read-model migration is additive and bounded", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /create table if not exists public\.trackmcp_semantic_facts/i);
  assert.match(sql, /create table if not exists public\.trackmcp_action_queue/i);
  assert.match(sql, /primary key \(workspace_id, source_event_id, fact_version\)/i);
  assert.match(sql, /unique \(workspace_id, fingerprint\)/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /revoke all on public\.trackmcp_semantic_facts/i);
  assert.match(sql, /revoke all on public\.trackmcp_action_queue/i);
  assert.doesNotMatch(sql, /\b(drop|truncate|delete)\s+(table|schema|from|database)\b/i);
  assert.doesNotMatch(sql, /\b(insert|update)\s+into\b/i);
});

test("task transition migration is additive, bounded, and service-role-only", async () => {
  const sql = await readFile(taskTransitionMigrationPath, "utf8");
  assert.match(sql, /create table if not exists public\.trackmcp_task_transitions/i);
  assert.match(sql, /unique \(workspace_id, source_event_id\)/i);
  assert.match(sql, /task_id_hash.*\^\[a-f0-9\].*\{64\}/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /revoke all on public\.trackmcp_task_transitions from anon, authenticated/i);
  assert.match(sql, /grant select, insert, update, delete on public\.trackmcp_task_transitions to service_role/i);
  assert.doesNotMatch(sql, /\b(drop|truncate|delete)\s+(table|schema|from|database)\b/i);
  assert.doesNotMatch(sql, /\b(insert|update)\s+into\b/i);
});

test("lifecycle fact type migration widens only the reviewed fact constraint", async () => {
  const sql = await readFile(lifecycleFactMigrationPath, "utf8");
  assert.match(sql, /drop constraint if exists trackmcp_semantic_facts_fact_type_check/i);
  assert.match(sql, /fact_type in \('activity', 'outcome', 'observation', 'lifecycle'\)/i);
  assert.match(sql, /no backfill|no raw payloads/i);
  assert.doesNotMatch(sql, /\b(insert|update|delete|truncate|drop\s+table)\b/i);
});

test("task transition scope migration is additive and bounded", async () => {
  const sql = await readFile(taskTransitionScopeMigrationPath, "utf8");
  assert.match(sql, /add column if not exists service text/i);
  assert.match(sql, /add column if not exists environment text/i);
  assert.match(sql, /add column if not exists server_id text/i);
  assert.match(sql, /add column if not exists transport text/i);
  assert.match(sql, /trackmcp_task_transitions_transport_check/i);
  assert.match(sql, /stdio.*streamable_http.*sse.*custom.*unknown/s);
  assert.doesNotMatch(sql, /\b(drop|truncate|delete)\s+(table|schema|from|database)\b/i);
  assert.doesNotMatch(sql, /\b(insert|update)\s+into\b/i);
});

test("catalog entity transport migration is additive and bounded", async () => {
  const sql = await readFile(catalogEntityTransportMigrationPath, "utf8");
  assert.match(sql, /add column if not exists transport text/i);
  assert.match(sql, /trackmcp_catalog_entity_reads_transport_check/i);
  assert.match(sql, /stdio.*streamable_http.*sse.*custom.*unknown/s);
  assert.doesNotMatch(sql, /\b(drop|truncate|delete)\s+(table|schema|from|database)\b/i);
  assert.doesNotMatch(sql, /\b(insert|update)\s+into\b/i);
});
