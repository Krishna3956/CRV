import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./DashboardApp.tsx", import.meta.url), "utf8");

test("dashboard exposes Tool Quality under the Quality navigation and labels live/sample data", () => {
  assert.match(source, /id: "tool-quality", label: "Tool quality"/);
  assert.match(source, /Tool Quality/);
  assert.match(source, /Sample data/);
  assert.match(source, /Live data/);
});

test("dashboard copy preserves observation and non-causal completion semantics", () => {
  assert.match(source, /tool_call_share/);
  assert.match(source, /Observed repeat call/);
  assert.match(source, /Associated with low explicit completion/);
  assert.match(source, /does not establish a cause/);
  assert.doesNotMatch(source, /Confirmed re-ask/);
});
