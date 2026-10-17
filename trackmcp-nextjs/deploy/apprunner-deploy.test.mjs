import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const deployScript = await readFile(new URL("./apprunner-deploy.sh", import.meta.url), "utf8");

test("App Runner production memory stays at 4 GB", () => {
  assert.match(deployScript, /"Memory": "4 GB"/);
  assert.doesNotMatch(deployScript, /"Memory": "2 GB"/);
});
