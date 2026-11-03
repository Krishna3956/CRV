import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./TraceExplorer.tsx", import.meta.url), "utf8");

test("evidence drill-down uses business-readable language", () => {
  assert.match(source, /Sample \/ Evidence details/);
  assert.match(source, /Evidence details/);
  assert.match(source, /Review one bounded interaction in observed order/);
  assert.doesNotMatch(source, /Trace Explorer/);
});
