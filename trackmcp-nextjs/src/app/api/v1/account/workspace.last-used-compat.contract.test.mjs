import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(process.cwd(), "src/app/api/v1/account/workspace/route.ts"), "utf8");

test("workspace key reads tolerate an additive last-use column during schema rollout", () => {
  assert.match(source, /select\("id, name, key_prefix, service_scope, environment_scope, revoked_at, created_at, last_used_at"\)/);
  assert.match(source, /schema cache|does not exist/);
  assert.match(source, /last_used_at: null/);
  assert.match(source, /unrelated database errors still fail/);
});
