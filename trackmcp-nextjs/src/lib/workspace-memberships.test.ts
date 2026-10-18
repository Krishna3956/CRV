import test from "node:test";
import assert from "node:assert/strict";
import { publicWorkspaceMemberships } from "./workspace-memberships.ts";

const row = (id: string, name: string, role = "member", user_id = "user-1") => ({
  user_id,
  workspace_id: id,
  role,
  trackmcp_workspaces: { id, name, slug: id },
});

test("workspace membership response handles zero, one, and multiple workspaces", () => {
  assert.deepEqual(publicWorkspaceMemberships([], "user-1"), []);
  assert.deepEqual(publicWorkspaceMemberships([row("workspace-a", "Alpha", "owner")], "user-1"), [
    { id: "workspace-a", name: "Alpha", slug: "workspace-a", role: "owner" },
  ]);
  assert.equal(publicWorkspaceMemberships([row("workspace-a", "Alpha"), row("workspace-b", "Beta")], "user-1").length, 2);
});

test("workspace membership response excludes other users and secrets", () => {
  const result = publicWorkspaceMemberships([
    row("workspace-a", "Alpha", "owner"),
    row("workspace-b", "Other", "owner", "user-2"),
  ], "user-1");
  assert.deepEqual(result, [{ id: "workspace-a", name: "Alpha", slug: "workspace-a", role: "owner" }]);
  assert.doesNotMatch(JSON.stringify(result), /api_key|key_hash|email|password|token/i);
});

test("workspace membership response bounds public fields", () => {
  const long = "x".repeat(500);
  const [workspace] = publicWorkspaceMemberships([row(long, long, long)], "user-1");
  assert.equal(workspace.id.length, 128);
  assert.equal(workspace.name.length, 128);
  assert.equal(workspace.slug.length, 128);
  assert.equal(workspace.role.length, 32);
});
