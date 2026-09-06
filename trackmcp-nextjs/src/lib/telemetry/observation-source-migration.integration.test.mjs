import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";

const migrationPath = new URL("../../../../supabase/migrations/20260907000008_observation_source.sql", import.meta.url);
const image = "postgres:16-alpine";

function docker(...args) {
  return spawnSync("docker", args, { encoding: "utf8" });
}

function dockerInput(input, ...args) {
  return spawnSync("docker", args, { encoding: "utf8", input });
}

function dockerAvailable() {
  return docker("info").status === 0 && docker("image", "inspect", image).status === 0;
}

function exec(container, ...args) {
  const result = docker("exec", "-i", container, ...args);
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return result.stdout.trim();
}

function psql(container, database, sql, allowFailure = false) {
  const result = docker("exec", "-i", container, "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", database, "-At", "-c", sql);
  if (!allowFailure && result.status !== 0) throw new Error(result.stderr || result.stdout);
  return result.stdout.trim();
}

test("applies observation provenance migration and rolls back incompatible definitions", async (t) => {
  if (!dockerAvailable()) {
    t.skip("Docker daemon or local postgres:16-alpine image is unavailable");
    return;
  }
  const migration = await readFile(migrationPath, "utf8");
  const started = docker("run", "-d", "-e", "POSTGRES_PASSWORD=test", image);
  assert.equal(started.status, 0, started.stderr);
  const container = started.stdout.trim();
  try {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      if (docker("exec", container, "pg_isready", "-U", "postgres").status === 0) break;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (attempt === 29) throw new Error("PostgreSQL container did not become ready");
    }
    exec(container, "createdb", "-U", "postgres", "incompatible");
    psql(container, "postgres", "create table public.trackmcp_events (id bigint generated always as identity primary key, workspace_id text not null, started_at timestamptz not null); insert into public.trackmcp_events (workspace_id, started_at) values ('legacy', now());");
    const applied = dockerInput(migration, "exec", "-i", container, "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres", "-f", "-");
    assert.equal(applied.status, 0, applied.stderr);
    const rerun = dockerInput(migration, "exec", "-i", container, "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres", "-f", "-");
    assert.equal(rerun.status, 0, rerun.stderr);
    assert.equal(psql(container, "postgres", "select data_type from information_schema.columns where table_schema='public' and table_name='trackmcp_events' and column_name='observation_source';"), "text");
    assert.match(psql(container, "postgres", "select pg_get_constraintdef(oid) from pg_constraint where conrelid='public.trackmcp_events'::regclass and conname='trackmcp_events_observation_source_check';"), /client.*server/i);
    assert.equal(psql(container, "postgres", "select indexname from pg_indexes where schemaname='public' and indexname='trackmcp_events_workspace_observation_source_started_idx';"), "trackmcp_events_workspace_observation_source_started_idx");
    assert.equal(psql(container, "postgres", "select count(*) from public.trackmcp_events where observation_source is null;"), "1");

    psql(container, "incompatible", "create table public.trackmcp_events (id bigint generated always as identity primary key, workspace_id text not null, started_at timestamptz not null, observation_source text); alter table public.trackmcp_events add constraint trackmcp_events_observation_source_check check (observation_source is null or observation_source = 'server'); insert into public.trackmcp_events (workspace_id, started_at, observation_source) values ('legacy', now(), null);");
    const rejected = dockerInput(migration, "exec", "-i", container, "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "incompatible", "-f", "-");
    assert.notEqual(rejected.status, 0);
    assert.match(rejected.stderr, /incompatible definition/i);
    assert.equal(psql(container, "incompatible", "select count(*) from public.trackmcp_events where observation_source is null;"), "1");
    assert.match(psql(container, "incompatible", "select pg_get_constraintdef(oid) from pg_constraint where conrelid='public.trackmcp_events'::regclass and conname='trackmcp_events_observation_source_check';"), /server/i);
    assert.equal(psql(container, "incompatible", "select count(*) from pg_indexes where schemaname='public' and indexname='trackmcp_events_workspace_observation_source_started_idx';"), "0");

    exec(container, "createdb", "-U", "postgres", "partial_failure");
    psql(container, "partial_failure", "create table public.trackmcp_events (id bigint generated always as identity primary key, workspace_id text not null, started_at timestamptz not null);");
    const faultInjected = migration.replace(
      "create index if not exists trackmcp_events_workspace_observation_source_started_idx\n  on public.trackmcp_events (workspace_id, observation_source, started_at desc);",
      "create index trackmcp_events_workspace_observation_source_started_idx\n  on public.trackmcp_events (workspace_id, observation_source, missing_index_column);",
    );
    const partial = dockerInput(faultInjected, "exec", "-i", container, "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "partial_failure", "-f", "-");
    assert.notEqual(partial.status, 0);
    assert.match(partial.stderr, /missing_index_column/i);
    assert.equal(psql(container, "partial_failure", "select count(*) from information_schema.columns where table_schema='public' and table_name='trackmcp_events' and column_name='observation_source';"), "0");
    assert.equal(psql(container, "partial_failure", "select count(*) from pg_constraint where conrelid='public.trackmcp_events'::regclass and conname='trackmcp_events_observation_source_check';"), "0");
    assert.equal(psql(container, "partial_failure", "select count(*) from pg_indexes where schemaname='public' and indexname='trackmcp_events_workspace_observation_source_started_idx';"), "0");
  } finally {
    docker("rm", "-f", container);
  }
});
