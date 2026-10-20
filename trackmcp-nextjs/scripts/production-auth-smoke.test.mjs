import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./production-auth-smoke.mjs", import.meta.url), "utf8");

test("authenticated production smoke is explicit, HTTPS-only, and secret-free in its report", () => {
  assert.match(source, /I_UNDERSTAND_PRODUCTION_AUTH_SMOKE/);
  assert.match(source, /parsed\.protocol !== "https:"/);
  assert.match(source, /workspace_scope_verified/);
  assert.match(source, /founderOsReadModels/);
  assert.match(source, /authenticated workspace envelope/);
  assert.match(source, /action queue API-key denial/);
  assert.match(source, /Read-only authenticated scope checks/);
  assert.match(source, /Keys, workspace IDs, response bodies/);
  assert.doesNotMatch(source, /console\.log\([^\n]*keyA/);
  assert.doesNotMatch(source, /JSON\.stringify\([^\n]*(keyA|keyB|workspaceA|workspaceB)/);
});
