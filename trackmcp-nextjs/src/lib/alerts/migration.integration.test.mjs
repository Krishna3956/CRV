import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import test from "node:test";

const databaseUrl = process.env.TRACKMCP_P1_05_DATABASE_URL;
const migration = fs.readFileSync(new URL("../../../../supabase/migrations/20260907000009_regressions_alerts.sql", import.meta.url), "utf8");
const psql = process.env.TRACKMCP_P1_05_PSQL_BIN || "psql";
const psqlCommand = process.env.TRACKMCP_P1_05_PSQL_CONTAINER ? ["docker", "exec", "-i", process.env.TRACKMCP_P1_05_PSQL_CONTAINER, "psql"] : [psql];

function sql(statement) {
  return execFileSync(psqlCommand[0], [...psqlCommand.slice(1), databaseUrl, "-v", "ON_ERROR_STOP=1", "-Atqc", statement], { encoding: "utf8" }).trim();
}

function runMigration(source = migration) {
  return execFileSync(psqlCommand[0], [...psqlCommand.slice(1), databaseUrl, "-v", "ON_ERROR_STOP=1"], { input: source, encoding: "utf8" });
}

test("P1-05 migration applies, reruns, rejects incompatible schema, and rolls back partial objects", { skip: !databaseUrl }, () => {
  sql(`
    drop table if exists public.trackmcp_alert_evaluation_runs cascade;
    drop table if exists public.trackmcp_alert_evaluation_locks cascade;
    drop table if exists public.trackmcp_alert_deliveries cascade;
    drop table if exists public.trackmcp_alert_incidents cascade;
    drop table if exists public.trackmcp_alert_configs cascade;
    drop table if exists public.trackmcp_alert_destinations cascade;
    create table if not exists public.trackmcp_workspaces (id uuid primary key);
    create table if not exists public.trackmcp_events (event_id text primary key, observation_source text);
    insert into public.trackmcp_events(event_id, observation_source) values ('legacy-p105', null) on conflict do nothing;
    insert into public.trackmcp_workspaces(id) values ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002') on conflict do nothing;
    do $$ begin
      if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
      if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
      if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
    end $$;
  `);
  runMigration();
  assert.equal(sql("select count(*) from information_schema.columns where table_schema='public' and table_name='trackmcp_alert_incidents' and column_name='last_delivered_at'"), "1");
  assert.equal(sql("select count(*) from pg_constraint where conname='trackmcp_alert_incidents_state_check'"), "1");
  assert.equal(sql("select count(*) from pg_class where oid='public.trackmcp_alert_deliveries_idempotency_idx'::regclass"), "1");
  assert.equal(sql("select count(*) from public.trackmcp_events where event_id='legacy-p105' and observation_source is null"), "1");
  assert.equal(sql("select relrowsecurity from pg_class where oid='public.trackmcp_alert_incidents'::regclass"), "t");
  assert.equal(sql("select has_table_privilege('anon', 'public.trackmcp_alert_incidents', 'select')"), "f");
  assert.equal(sql("select has_function_privilege('anon', 'public.trackmcp_claim_alert_evaluation(text,text,timestamptz,timestamptz)', 'execute')"), "f");
  sql("insert into public.trackmcp_alert_destinations(id, workspace_id, kind, endpoint_url, secret_ref) values ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'webhook', 'https://hooks.example.test', 'secret')");
  assert.throws(() => sql("update public.trackmcp_alert_destinations set workspace_id='00000000-0000-0000-0000-000000000002' where id='00000000-0000-0000-0000-000000000011'"), /Command failed/);
  assert.throws(() => sql("insert into public.trackmcp_alert_configs(workspace_id, metric, destination_ids) values ('00000000-0000-0000-0000-000000000002', 'tool_error_rate_spike', array['00000000-0000-0000-0000-000000000011'])"), /Command failed/);
  runMigration();

  sql("drop index public.trackmcp_alert_deliveries_idempotency_idx; create index trackmcp_alert_deliveries_idempotency_idx on public.trackmcp_alert_deliveries (error_code)");
  assert.throws(() => runMigration(), /incompatible definition|Command failed/);

  sql(`
    drop table if exists public.trackmcp_alert_evaluation_runs cascade;
    drop table if exists public.trackmcp_alert_evaluation_locks cascade;
    drop table if exists public.trackmcp_alert_deliveries cascade;
    drop table if exists public.trackmcp_alert_incidents cascade;
    drop table if exists public.trackmcp_alert_configs cascade;
    drop table public.trackmcp_alert_destinations cascade;
    create table public.trackmcp_alert_destinations (id uuid primary key, workspace_id uuid not null, kind text not null, endpoint_url text, secret_ref text not null, enabled boolean not null default true, revoked_at timestamptz, constraint trackmcp_alert_destinations_kind_check check (kind = 'email'));
  `);
  assert.throws(() => runMigration(), /incompatible definition|Command failed/);
  assert.equal(sql("select to_regclass('public.trackmcp_alert_configs') is null"), "t");
  sql("drop table public.trackmcp_alert_destinations cascade");

  const partialFailure = migration
    .replace("  last_delivered_at timestamptz,\n", "")
    .replace("create unique index if not exists trackmcp_alert_configs_workspace_id_idx\n  on public.trackmcp_alert_configs (workspace_id, id);", "create unique index if not exists trackmcp_alert_configs_workspace_id_idx\n  on public.trackmcp_alert_configs (column_does_not_exist);");
  assert.throws(() => runMigration(partialFailure), /Command failed/);
  assert.equal(sql("select to_regclass('public.trackmcp_alert_configs') is null"), "t");
  assert.equal(sql("select count(*) from information_schema.columns where table_schema='public' and table_name='trackmcp_alert_incidents' and column_name='last_delivered_at'"), "0");
  assert.equal(sql("select count(*) from pg_constraint where conname='trackmcp_alert_incidents_state_check'"), "0");
});
