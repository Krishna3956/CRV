import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../../../../supabase/migrations/20261018000012_privacy_deletion_batches.sql", import.meta.url), "utf8");
const parityMigration = await readFile(new URL("../../../../supabase/migrations/20261024000003_privacy_deletion_catalog_entity_reads.sql", import.meta.url), "utf8");
const postflight = await readFile(new URL("../../../../supabase/manual/founder-os-privacy-deletion-batches-postflight.sql", import.meta.url), "utf8");

test("privacy deletion batch audit migration is bounded, scoped, and non-destructive", () => {
  assert.match(migration, /create table if not exists public\.trackmcp_privacy_deletion_batches/);
  assert.match(migration, /references public\.trackmcp_privacy_requests/);
  assert.match(migration, /references public\.trackmcp_workspaces/);
  assert.match(migration, /batch_number between 0 and 100000/);
  assert.match(migration, /returned_count between 0 and 500/);
  assert.match(migration, /dry_run boolean not null default true/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on public\.trackmcp_privacy_deletion_batches from anon, authenticated/);
  assert.doesNotMatch(migration, /delete from|truncate|drop table/i);
});

test("privacy deletion audit dataset constraint stays in parity with the review-only plan", () => {
  assert.match(parityMigration, /EXPLICIT RELEASE REVIEW/i);
  assert.match(parityMigration, /drop constraint if exists trackmcp_privacy_deletion_batches_dataset_check/i);
  assert.match(parityMigration, /add constraint trackmcp_privacy_deletion_batches_dataset_check check/i);
  assert.match(parityMigration, /catalog_entity_reads/);
  assert.doesNotMatch(parityMigration, /delete from|truncate|drop table|drop column/i);
});

test("privacy deletion batch postflight is read-only", () => {
  assert.match(postflight, /select/i);
  assert.doesNotMatch(postflight, /insert into|update |delete from|truncate /i);
});
