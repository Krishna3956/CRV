import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const migration = await readFile(resolve(process.cwd(), "../supabase/migrations/20261018000007_privacy_requests.sql"), "utf8");
const postflight = await readFile(resolve(process.cwd(), "../supabase/manual/founder-os-privacy-requests-postflight.sql"), "utf8");

test("privacy request migration is additive, bounded, and service-role only", () => {
  assert.match(migration, /create table if not exists public\.trackmcp_privacy_requests/);
  assert.match(migration, /request_type text not null check \(request_type = 'delete'\)/);
  assert.match(migration, /idempotency_key text not null/);
  assert.match(migration, /status in \('requested', 'under_review', 'approved', 'rejected', 'processing', 'completed', 'cancelled'\)/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on public\.trackmcp_privacy_requests from anon, authenticated/);
  assert.doesNotMatch(migration, /delete from|truncate|drop table/i);
});

test("privacy request postflight is read-only", () => {
  assert.match(postflight, /select/i);
  assert.doesNotMatch(postflight, /insert into|update |delete from|truncate /i);
});
