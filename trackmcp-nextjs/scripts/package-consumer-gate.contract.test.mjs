import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./package-consumer-gate.mjs", import.meta.url), "utf8");

test("package consumer commands have a bounded child-process lifetime", () => {
  assert.match(source, /timeout:\s*180_000/);
  assert.match(source, /killSignal:\s*["']SIGTERM["']/);
  assert.match(source, /result\.error\.code === ["']ETIMEDOUT["']/);
  assert.match(source, /timed out after 180 seconds/);
});
