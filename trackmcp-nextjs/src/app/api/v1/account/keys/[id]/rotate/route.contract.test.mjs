import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");

test("key rotation is workspace-scoped, owner/admin-only, and one-time secret safe", () => {
  assert.match(source, /export async function POST/);
  assert.match(source, /searchParams\.get\("workspace_id"\)/);
  assert.match(source, /\.in\("role", \["owner", "admin"\]\)/);
  assert.match(source, /\.eq\("id", id\)\.eq\("workspace_id", workspaceId\)/);
  assert.match(source, /existing\.data\.revoked_at/);
  assert.match(source, /service_scope: existing\.data\.service_scope/);
  assert.match(source, /environment_scope: existing\.data\.environment_scope/);
  assert.match(source, /key_hash: generated\.hash/);
  assert.match(source, /\.update\(\{ revoked_at:/);
  assert.match(source, /cache-control.*no-store/);
  assert.match(source, /Copy this replacement key now/);
  assert.doesNotMatch(source, /existing\.data\.key|key_secret|raw_key/);
});

test("rotation rolls back the replacement when revocation cannot complete", () => {
  assert.match(source, /from\("trackmcp_api_keys"\)\.delete\(\)\.eq\("id", inserted\.data\.id\)/);
  assert.match(source, /Could not complete API key rotation/);
});
