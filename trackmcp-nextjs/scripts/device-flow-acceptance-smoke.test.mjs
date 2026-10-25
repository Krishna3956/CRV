import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./device-flow-acceptance-smoke.mjs", import.meta.url), "utf8");

test("device-flow acceptance smoke is fixture-only and redacted", () => {
  assert.match(source, /deterministic-fixtures/);
  assert.match(source, /fixtureDeviceAuthAdapter/);
  assert.match(source, /publicWorkspaceMemberships/);
  assert.match(source, /does not exercise a production browser session/);
  assert.doesNotMatch(source, /TRACKMCP_LIFECYCLE_COOKIE|authorization\s*:\s*`Bearer/);
});

test("device-flow acceptance smoke covers each open browser-state scenario", () => {
  for (const marker of ["expired device session", "denied device session", "multiple workspace memberships", "workspace creation when no membership exists"]) {
    assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\\]\\]/g, "\\\\$&")), marker);
  }
});
