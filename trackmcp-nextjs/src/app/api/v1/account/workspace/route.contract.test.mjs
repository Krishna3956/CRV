import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");

test("workspace account route returns all memberships and validates explicit selection", () => {
  assert.match(source, /select\("user_id, workspace_id, role, trackmcp_workspaces\(id, name, slug\)"\)/);
  assert.match(source, /publicWorkspaceMemberships/);
  assert.match(source, /new URL\(request\.url\)\.searchParams\.get\("workspace_id"\)/);
  assert.match(source, /requestedWorkspaceId\.length > 128/);
  assert.match(source, /workspaces\.find\(\(candidate\) => candidate\.id === requestedWorkspaceId\)/);
  assert.match(source, /You do not have access to that workspace/);
  assert.match(source, /workspaces, role/);
});

test("workspace key creation cannot silently choose among multiple memberships", () => {
  assert.match(source, /workspace_id\?: unknown/);
  assert.match(source, /workspace_id is required when you belong to multiple workspaces/);
  assert.match(source, /requestedWorkspaceId \|\| memberships\[0\]\?\.workspace_id/);
  assert.match(source, /You do not have access to that workspace/);
});

test("workspace creation responses containing connection keys are never cacheable", () => {
  assert.match(source, /api_key: generated\.key[\s\S]*?cache-control.*no-store/);
});

test("workspace provisioning is idempotent across concurrent OAuth callbacks", () => {
  assert.match(source, /created\.error\?\.code !== "23505"/);
  assert.match(source, /eq\("slug", slug\)\.maybeSingle\(\)/);
  assert.match(source, /upsert\(\{ workspace_id: workspaceId, user_id: user\.id, role: "owner" \}/);
  assert.match(source, /if \(created\.data\) await admin\.from\("trackmcp_workspaces"\)\.delete\(\)/);
});

test("workspace account reads are not cacheable", () => {
  assert.match(source, /keys: \[\][\s\S]*?cache-control.*no-store/);
  assert.match(source, /keys: keys \|\| \[\][\s\S]*?cache-control.*no-store/);
});

test("workspace writes bound JSON input and profile fields", () => {
  assert.match(source, /MAX_WORKSPACE_BODY_BYTES = 8192/);
  assert.match(source, /Request body is too large/);
  assert.match(source, /JSON body must be an object/);
  assert.match(source, /boundedText\(body\.use_case, 1000\)/);
  assert.match(source, /boundedText\(body\.key_name, 128\)/);
  assert.match(source, /rawWorkspaceId\.length > 128/);
  assert.match(source, /const requestedWorkspaceId = rawWorkspaceId/);
});

test("connection-key creation exposes optional service and environment scopes", () => {
  assert.match(source, /service_scope/);
  assert.match(source, /environment_scope/);
  assert.match(source, /boundedScope\(rawServiceScope, 100\)/);
  assert.match(source, /boundedScope\(rawEnvironmentScope, 64\)/);
  assert.match(source, /rawServiceScope\.length > 100 \|\| rawEnvironmentScope\.length > 64/);
  assert.match(source, /Key scope is too long/);
  assert.match(source, /service_scope, environment_scope/);
});

test("scope validation completes before membership and profile persistence", () => {
  const validation = source.indexOf("Key scope is too long");
  const membershipRead = source.indexOf("membershipsResult");
  const profileWrite = source.indexOf("trackmcp_profiles");
  assert.ok(validation > -1 && validation < membershipRead);
  assert.ok(validation < profileWrite);
});
