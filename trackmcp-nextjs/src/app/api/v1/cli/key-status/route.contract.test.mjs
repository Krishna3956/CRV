import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const routePath = resolve(dirname(fileURLToPath(import.meta.url)), "route.ts");

test("key-status reports the first accepted ingest milestone without exposing key material", async () => {
  const source = await readFile(routePath, "utf8");
  assert.match(source, /trackmcp_activation_milestones/);
  assert.match(source, /\.eq\("key_id", lookup\.key\.id\)/);
  assert.match(source, /accepted_telemetry: Boolean\(milestone\.data\)/);
  assert.match(source, /first_event_accepted: Boolean\(milestone\.data\)/);
  assert.doesNotMatch(source, /api_key|raw_key|authorization:.*lookup\.key/);
});
