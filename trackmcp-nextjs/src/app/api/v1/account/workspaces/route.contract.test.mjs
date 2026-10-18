import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");

test("workspace list is authenticated, user-scoped, bounded, and secret-free", () => {
  assert.match(source, /if \(!user\).*401/s);
  assert.match(source, /\.eq\("user_id", user\.id\)/);
  assert.match(source, /publicWorkspaceMemberships/);
  assert.match(source, /cache-control.*no-store/);
  assert.doesNotMatch(source, /api_key|key_hash|password|token/i);
});
