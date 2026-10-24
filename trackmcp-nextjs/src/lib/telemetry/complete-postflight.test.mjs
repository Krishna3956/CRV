import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const migrationRoot = new URL("../../../../supabase/migrations/", import.meta.url);
const postflightUrl = new URL("../../../../supabase/manual/founder-os-complete-postflight.sql", import.meta.url);

const requiredTables = [
  "trackmcp_workspaces",
  "trackmcp_api_keys",
  "trackmcp_workspace_members",
  "trackmcp_events",
  "trackmcp_servers",
  "trackmcp_environments",
  "trackmcp_deployments",
  "trackmcp_catalog_versions",
  "trackmcp_catalog_entity_reads",
  "trackmcp_cli_device_sessions",
  "trackmcp_activation_milestones",
  "trackmcp_semantic_facts",
  "trackmcp_action_queue",
  "trackmcp_refresh_jobs",
  "trackmcp_privacy_requests",
  "trackmcp_rate_limit_buckets",
];

const requiredColumns = [
  ["trackmcp_workspaces", "slug"],
  ["trackmcp_api_keys", "key_hash"],
  ["trackmcp_workspace_members", "user_id"],
  ["trackmcp_events", "result_type"],
  ["trackmcp_events", "interaction_id"],
  ["trackmcp_events", "request_state_hash"],
  ["trackmcp_events", "catalog_item_name_hashes"],
  ["trackmcp_catalog_versions", "snapshot_hash"],
  ["trackmcp_catalog_versions", "workspace_id"],
  ["trackmcp_catalog_entity_reads", "workspace_id"],
  ["trackmcp_catalog_entity_reads", "entity_hash"],
  ["trackmcp_action_queue", "revision"],
  ["trackmcp_refresh_jobs", "lease_owner"],
  ["trackmcp_privacy_requests", "idempotency_key"],
  ["trackmcp_rate_limit_buckets", "bucket_key"],
  ["trackmcp_rate_limit_buckets", "updated_at"],
];

test("complete Founder OS postflight covers every required table and high-risk column", async () => {
  const sql = await readFile(postflightUrl, "utf8");
  for (const table of requiredTables) assert.match(sql, new RegExp(`['\\"]${table}['\\"]`), `missing table ${table}`);
  for (const [table, column] of requiredColumns) {
    assert.match(sql, new RegExp(`\\('${table}', '${column}'\\)`), `missing column ${table}.${column}`);
  }
  assert.match(sql, /rls_enabled/);
  assert.match(sql, /anon_can_select/);
  assert.match(sql, /authenticated_can_select/);
});

test("complete Founder OS postflight is read-only", async () => {
  const sql = (await readFile(postflightUrl, "utf8"))
    .replace(/--[^\n]*\n/g, "\n")
    .replace(/\/\*[\s\S]*?\*\//g, "\n");
  assert.doesNotMatch(sql, /\b(insert|update|delete|alter|drop|truncate|create)\s+/i);
  assert.doesNotMatch(sql, /supabase_migrations/i);
});

test("round-trip postflight is included in the same reviewed migration family", async () => {
  const migration = `${await readFile(new URL("20261018000009_mcp_round_trip_outcomes.sql", migrationRoot), "utf8")}\n${await readFile(new URL("20261019000004_mcp_mrtr_request_counts.sql", migrationRoot), "utf8")}`;
  const postflight = await readFile(new URL("../../../../supabase/manual/founder-os-round-trip-outcomes-postflight.sql", import.meta.url), "utf8");
  for (const column of ["result_type", "interaction_id", "request_state_hash", "input_request_count", "resource_priority"]) {
    assert.match(migration, new RegExp(`add column if not exists ${column}`));
    assert.match(postflight, new RegExp(column));
  }
});

test("refresh-worker RPCs are included in the reviewed postflight family", async () => {
  const migration = await readFile(new URL("20261018000010_refresh_job_worker_rpc.sql", migrationRoot), "utf8");
  const postflight = await readFile(new URL("../../../../supabase/manual/founder-os-refresh-worker-rpc-postflight.sql", import.meta.url), "utf8");
  assert.match(migration, /trackmcp_claim_refresh_job/);
  assert.match(migration, /trackmcp_record_refresh_job_result/);
  assert.match(postflight, /trackmcp_claim_refresh_job/);
  assert.match(postflight, /trackmcp_record_refresh_job_result/);
});

test("catalog workspace scope is included in the reviewed migration family", async () => {
  const migration = await readFile(new URL("20261018000011_catalog_workspace_scope.sql", migrationRoot), "utf8");
  const postflight = await readFile(new URL("../../../../supabase/manual/founder-os-catalog-snapshot-postflight.sql", import.meta.url), "utf8");
  assert.match(migration, /add column if not exists workspace_id/);
  assert.match(migration, /trackmcp_catalog_versions_workspace_scope_idx/);
  assert.match(postflight, /has_workspace_scope/);
});

test("catalog entity and workspace-scoped uniqueness postflights are included", async () => {
  const entityMigration = await readFile(new URL("20261019000002_catalog_entity_reads.sql", migrationRoot), "utf8");
  const scopeMigration = await readFile(new URL("20261019000003_catalog_workspace_unique_scope.sql", migrationRoot), "utf8");
  const postflight = await readFile(new URL("../../../../supabase/manual/founder-os-complete-postflight.sql", import.meta.url), "utf8");
  assert.match(entityMigration, /trackmcp_catalog_entity_reads/);
  assert.match(scopeMigration, /workspace_id,\s*server_id,\s*environment_id,\s*catalog_kind,\s*snapshot_hash/s);
  assert.match(postflight, /trackmcp_catalog_entity_reads/);
  assert.match(postflight, /trackmcp_catalog_versions_snapshot_hash_idx/);
});

test("lifecycle fact type constraint is included in reviewed postflight evidence", async () => {
  const migration = await readFile(new URL("20261024000001_lifecycle_fact_type.sql", migrationRoot), "utf8");
  const postflight = await readFile(postflightUrl, "utf8");
  const audit = await readFile(new URL("../../../../supabase/manual/founder-os-complete-production-audit.sql", import.meta.url), "utf8");
  assert.match(migration, /trackmcp_semantic_facts_fact_type_check/);
  assert.match(postflight, /trackmcp_semantic_facts_fact_type_check/);
  assert.match(audit, /trackmcp_semantic_facts_fact_type_check/);
});
