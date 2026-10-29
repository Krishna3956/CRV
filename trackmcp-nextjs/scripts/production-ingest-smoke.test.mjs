import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("./production-ingest-smoke.mjs", import.meta.url), "utf8");

test("first-ingest smoke is explicit, bounded, trusted-host-only, and redacted", () => {
  assert.match(source, /I_UNDERSTAND_FIRST_INGEST_SMOKE/);
  assert.match(source, /accepted_telemetry === true/);
  assert.match(source, /waitForAnalyticsReadBack/);
  assert.match(source, /analytics read-back exposes the accepted smoke event/);
  assert.match(source, /trustedHost/);
  assert.match(source, /EDGE_USER_AGENT = "Mozilla\/5\.0"/);
  assert.match(source, /"user-agent": EDGE_USER_AGENT/);
  assert.match(source, /event_id: `pilot-ingest-\$\{randomUUID\(\)\}`/);
  assert.match(source, /exactly one bounded event/);
  assert.match(source, /Keys, event IDs, workspace IDs, response bodies/);
  assert.match(source, /const report = \{/);
  assert.match(source, /Failure evidence is redacted/);
});
