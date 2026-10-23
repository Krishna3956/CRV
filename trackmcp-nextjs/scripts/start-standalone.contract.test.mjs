import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const starter = await readFile(new URL("./start-standalone.mjs", import.meta.url), "utf8");

test("production start uses the generated standalone server", () => {
  assert.equal(packageJson.scripts.start, "node scripts/start-standalone.mjs");
  assert.doesNotMatch(packageJson.scripts.start, /next start/);
  assert.match(starter, /NEXT_DIST_DIR/);
  assert.match(starter, /standalone.*server\.js/);
  assert.match(starter, /HOSTNAME/);
  assert.match(starter, /PORT/);
  assert.match(starter, /loadEnvConfig/);
});
