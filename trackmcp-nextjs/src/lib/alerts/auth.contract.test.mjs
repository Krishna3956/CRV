import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./auth.ts", import.meta.url), "utf8");

test("browser alert authentication honors an explicit workspace selection", () => {
  assert.match(source, /new URL\(request\.url\)\.searchParams\.get\("workspace_id"\)/);
  assert.match(source, /membershipQuery\.eq\("workspace_id", requestedWorkspaceId\)/);
  assert.match(source, /You do not have access to that workspace/);
});

test("browser alert authentication does not guess a workspace", () => {
  assert.match(source, /workspace_id is required/);
  assert.match(source, /requestedWorkspaceId\.length > 128/);
});

test("API-key alert authentication cannot be redirected by a workspace query", () => {
  const apiKeyBlock = source.slice(source.indexOf('if (apiKey)'), source.indexOf('  const auth = await getServer()'));
  assert.doesNotMatch(apiKeyBlock, /requestedWorkspaceId/);
  assert.match(apiKeyBlock, /workspaceId: result\.data\.workspace_id/);
});
