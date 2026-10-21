import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { glob } from "node:fs/promises";
import test from "node:test";

const files = (await Array.fromAsync(glob("src/app/api/v2/**/handlers.ts", { cwd: process.cwd() })))
  .sort();

test("every Founder OS v2 read surface uses the shared provenance envelope", async () => {
  const expected = [
    "action-queue/handlers.ts", "catalogs/handlers.ts", "data-trust/handlers.ts", "journeys/handlers.ts",
    "outcomes/handlers.ts", "overview/handlers.ts", "people/handlers.ts", "prompts/handlers.ts", "protocol-activity/handlers.ts",
    "reliability/handlers.ts", "resources/handlers.ts", "setup/handlers.ts", "tasks/handlers.ts", "tools/[name]/handlers.ts", "tools/handlers.ts",
  ];
  assert.deepEqual(files.map((file) => file.replace(/^src\/app\/api\/v2\//, "")), expected);
  for (const file of files) {
    const source = await readFile(file, "utf8");
    assert.match(source, /withTrackMCPV2Envelope|envelopeV2Response/, file);
    assert.doesNotMatch(source, /JSON\.stringify\([^)]*payload/i, `${file} must not serialize raw payloads`);
    assert.doesNotMatch(source, /\b(?:api_key|key_hash|access_token|refresh_token|password|service_role)\b/i, `${file} must not expose credential fields`);
  }
});
