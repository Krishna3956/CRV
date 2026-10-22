import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./release-gate.mjs", import.meta.url), "utf8");

test("release-gate suite processes have a bounded lifetime", () => {
  assert.match(source, /timeout:\s*300_000/);
  assert.match(source, /killSignal:\s*["']SIGTERM["']/);
  assert.match(source, /result\.error\.code === ["']ETIMEDOUT["']/);
  assert.match(source, /Release gate timed out at/);
});
