import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./[id]/route.ts", import.meta.url), "utf8");

test("connection-key revocation is limited to owner/admin workspace members", () => {
  assert.match(source, /select\("workspace_id, role"\)/);
  assert.match(source, /searchParams\.get\("workspace_id"\)/);
  assert.match(source, /workspace_id is required/);
  assert.match(source, /\.in\("role", \["owner", "admin"\]\)/);
  assert.match(source, /\.eq\("workspace_id", requestedWorkspaceId\)/);
  assert.match(source, /\.eq\("workspace_id", membership\.data\.workspace_id\)/);
  assert.match(source, /\.is\("revoked_at", null\)/);
});
