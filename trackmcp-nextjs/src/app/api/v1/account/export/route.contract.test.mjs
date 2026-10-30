import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");

test("account export includes bounded derived datasets and excludes secret tables", () => {
  assert.match(source, /trackmcp_catalog_versions/);
  assert.match(source, /trackmcp_catalog_entity_reads/);
  assert.match(source, /source_event_id,server_id,environment,transport,catalog_kind/);
  assert.match(source, /trackmcp_activation_milestones/);
  assert.match(source, /projectCatalogVersion/);
  assert.match(source, /projectCatalogEntityRead/);
  assert.match(source, /catalogEntityReadsAvailable/);
  assert.match(source, /projectActivationMilestone/);
  assert.doesNotMatch(source, /from\("trackmcp_api_keys"\)/);
  assert.doesNotMatch(source, /select\("\*"\)/);
  assert.doesNotMatch(source, /\.select\([^\n]*\b(?:payload|key_hash|device_code|user_code)\b/i);
});
