import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./DashboardApp.tsx", import.meta.url), "utf8");
const traceSource = await readFile(new URL("./TraceExplorer.tsx", import.meta.url), "utf8");
const tracesRoute = await readFile(new URL("../../app/dashboard/traces/page.tsx", import.meta.url), "utf8");

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

test("dashboard never silently substitutes sample data or unsupported live claims", () => {
  assert.doesNotMatch(source, /sampleMode \?\? /);
  assert.doesNotMatch(source, /Connected to live telemetry/);
  assert.doesNotMatch(source, /updated just now/);
  assert.match(source, /Sample mode selected/);
  assert.match(source, /Live mode selected/);
  assert.match(source, /No live data available/);
  assert.match(source, /Live data could not be loaded/);
  assert.match(source, /No explicit workflow outcome data/);
  assert.match(source, /Observed signal/);
  assert.doesNotMatch(source, /Prioritized from sufficient observed evidence/);
});

test("trace states preserve privacy, bounds, legacy provenance, and retry behavior", () => {
  assert.match(traceSource, /Legacy\/Unknown/);
  assert.match(traceSource, /Showing a bounded result/);
  assert.match(traceSource, /Some events may be omitted/);
  assert.match(traceSource, /Retry/);
  assert.match(traceSource, /setResponse\(null\)/);
  assert.match(traceSource, /setLoading\(true\)/);
  assert.match(traceSource, /result\.status === 401/);
});

test("dashboard exposes the preferred traces route and one Configure control", () => {
  assert.match(tracesRoute, /initialView="traces"/);
  assert.doesNotMatch(source, /aria-label="Open Configure"/);
  assert.match(source, /id: "traces", label: "Trace Explorer"/);
  assert.match(source, /params\.get\("view"\) === "trace"/);
});
