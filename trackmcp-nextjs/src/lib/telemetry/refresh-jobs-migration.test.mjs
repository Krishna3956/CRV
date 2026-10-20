import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const migration = await readFile(resolve(process.cwd(), "../supabase/migrations/20261018000006_founder_os_refresh_jobs.sql"), "utf8");
const postflight = await readFile(resolve(process.cwd(), "../supabase/manual/founder-os-refresh-jobs-postflight.sql"), "utf8");
const workerMigration = await readFile(resolve(process.cwd(), "../supabase/migrations/20261018000010_refresh_job_worker_rpc.sql"), "utf8");
const workerPostflight = await readFile(resolve(process.cwd(), "../supabase/manual/founder-os-refresh-worker-rpc-postflight.sql"), "utf8");
const retryPriorityMigration = await readFile(resolve(process.cwd(), "../supabase/migrations/20261020000011_prioritize_due_refresh_retries.sql"), "utf8");
const deferredMigration = await readFile(resolve(process.cwd(), "../supabase/migrations/20261020000012_defer_cancelled_refresh_jobs.sql"), "utf8");

test("refresh-job migration is additive, bounded, and worker-only", () => {
  assert.match(migration, /create table if not exists public\.trackmcp_refresh_jobs/);
  assert.match(migration, /kind in \('fact_projection', 'action_queue_refresh', 'catalog_recompute', 'retention_cleanup'\)/);
  assert.match(migration, /state in \('queued', 'running', 'retryable', 'succeeded', 'failed', 'cancelled'\)/);
  assert.match(migration, /attempt_count integer not null default 0 check \(attempt_count >= 0 and attempt_count <= 8\)/);
  assert.match(migration, /char_length\(last_error_detail\) <= 240/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on public\.trackmcp_refresh_jobs from anon, authenticated/);
  assert.doesNotMatch(migration, /delete from|truncate|drop table/i);
});

test("postflight is read-only and checks due/expired work", () => {
  assert.match(postflight, /select/i);
  assert.match(postflight, /expired_leases/);
  assert.doesNotMatch(postflight, /insert into|update |delete from|truncate /i);
});

test("worker RPC migration is service-role-only and lease-fenced", () => {
  assert.match(workerMigration, /trackmcp_claim_refresh_job/);
  assert.match(workerMigration, /for update skip locked/);
  assert.match(workerMigration, /trackmcp_record_refresh_job_result/);
  assert.match(workerMigration, /lease_owner = p_owner/);
  assert.match(workerMigration, /lease_until > now\(\)/);
  assert.match(workerMigration, /grant execute on function public\.trackmcp_claim_refresh_job\(text, integer\) to service_role/);
  assert.match(workerMigration, /revoke all on function public\.trackmcp_record_refresh_job_result/);
  assert.doesNotMatch(workerMigration, /delete from|truncate /i);
  assert.match(workerPostflight, /has_function_privilege/);
  assert.doesNotMatch(workerPostflight, /insert into|update |delete from|truncate /i);
});

test("retry-priority migration prevents due retries from starving", () => {
  assert.match(retryPriorityMigration, /create or replace function public\.trackmcp_claim_refresh_job/);
  assert.match(retryPriorityMigration, /state = 'retryable' then 0 else 1/);
  assert.match(retryPriorityMigration, /for update skip locked/);
  assert.match(retryPriorityMigration, /grant execute on function public\.trackmcp_claim_refresh_job\(text, integer\) to service_role/);
  assert.doesNotMatch(retryPriorityMigration, /delete from|truncate |drop table/i);
});

test("deferred cancellation migration requeues bounded deadline work", () => {
  assert.match(deferredMigration, /create or replace function public\.trackmcp_record_refresh_job_result/);
  assert.match(deferredMigration, /when p_outcome = 'deferred' then 'queued'/);
  assert.match(deferredMigration, /when p_outcome = 'deferred' then now\(\)/);
  assert.match(deferredMigration, /p_outcome in \('succeeded', 'deferred', 'retryable', 'failed'\)/);
  assert.match(deferredMigration, /grant execute on function public\.trackmcp_record_refresh_job_result/);
  assert.doesNotMatch(deferredMigration, /delete from|truncate |drop table/i);
});
