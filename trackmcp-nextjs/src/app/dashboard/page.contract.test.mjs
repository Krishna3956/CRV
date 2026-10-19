import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const source = await readFile(new URL("./page.tsx", import.meta.url), "utf8");

test("dashboard recovers from a stale selected workspace", () => {
  assert.match(source, /error\.status = response\.status/);
  assert.match(source, /status !== 404/);
  assert.match(source, /removeItem\("trackmcp\.selected_workspace_id"\)/);
  assert.match(source, /account = await loadAccount\(\)/);
});
