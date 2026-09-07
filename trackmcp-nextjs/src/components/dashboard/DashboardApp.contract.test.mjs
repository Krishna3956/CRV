import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("./DashboardApp.tsx", import.meta.url),
  "utf8",
);
const traceSource = await readFile(
  new URL("./TraceExplorer.tsx", import.meta.url),
  "utf8",
);
const tracesRoute = await readFile(
  new URL("../../app/dashboard/traces/page.tsx", import.meta.url),
  "utf8",
);

test("business-first navigation and KPI hierarchy are explicit", () => {
  for (const item of [
    'id: "overview", label: "Overview"',
    'id: "journeys", label: "Journeys"',
    'id: "capabilities", label: "Capabilities"',
    'id: "quality", label: "Quality"',
    'id: "issues", label: "Issues"',
  ])
    assert.match(source, new RegExp(item.replace(/[.*+?^$()|[\]\\]/g, "\\$&")));
  assert.match(source, /id: "clients", label: "AI clients"/);
  assert.match(source, /id: "evidence", label: "Evidence"/);
  assert.match(source, /id: "setup", label: "Setup"/);
  assert.match(
    source,
    /label="AI clients"[\s\S]*label="Activity"[\s\S]*label="Work completed"[\s\S]*label="Needs attention"/,
  );
  assert.doesNotMatch(source, /id: "tool-quality"/);
  assert.doesNotMatch(source, /Open Configure/);
});

test("data source state is explicit and never silently substituted", () => {
  assert.match(source, /params\.set\("data", dataMode\)/);
  assert.match(
    source,
    /rawData === "example" \|\| rawData === "sample" \? "example" : "my"/,
  );
  assert.match(source, /My data selected/);
  assert.match(source, /Example data selected/);
  assert.match(source, /Illustrative records are shown by explicit selection/);
  assert.match(source, /No other data source was substituted/);
  assert.match(source, /No live data available/);
  assert.match(source, /Live data could not be loaded/);
  assert.doesNotMatch(source, /sampleMode \?\? /);
  assert.doesNotMatch(source, /Connected to live telemetry/);
  assert.doesNotMatch(source, /updated just now/);
});

test("zero-event activation remains on Overview with trace state cleared", () => {
  assert.match(source, /Your server has not sent its first event yet\./);
  assert.match(
    source,
    /zeroEventState = Boolean\([\s\S]*analytics\.total_events === 0/,
  );
  assert.match(source, /setTraceSessionId\(null\)/);
  assert.match(source, /setTraceCorrelationHandle\(null\)/);
  assert.match(source, /setTraceOrigin\("evidence"\)/);
  assert.match(source, /writeRouteState\(view, range, next, null, null, "evidence"\)/);
  assert.match(source, /onOpenDashboard/);
  assert.match(source, /setView\("overview"\)/);
  assert.match(source, /!workspace \|\| !hasActiveKey/);
});

test("Overview always renders Needs attention and preserves uncertainty", () => {
  assert.ok((source.match(/Needs attention/g) || []).length >= 2);
  assert.match(source, /No actionable signals yet\./);
  assert.match(source, /Insufficient data to identify an issue/);
  assert.match(source, /Evidence basis: API insight/);
  assert.match(source, /confidence: not provided/);
  assert.match(source, /This is not a confirmed failure/);
  assert.doesNotMatch(source, /sufficient observed evidence/);
});

test("completion is explicit-outcome-only and tool quality exposes insufficient reasons", () => {
  assert.match(source, /function explicitOutcomeTotals/);
  assert.match(source, /Explicit workflow outcome events only/);
  assert.match(source, /No explicit workflow outcome data/);
  assert.match(source, /Specific reason:/);
  assert.match(source, /observed calls before/);
  assert.match(source, /Showing a bounded result/);
  assert.match(source, /Some events may be omitted/);
});

test("trace states preserve retry, loading reset, privacy and legacy provenance", () => {
  assert.match(traceSource, /Legacy\/Unknown/);
  assert.match(traceSource, /Showing a bounded result/);
  assert.match(traceSource, /Some events may be omitted/);
  assert.match(traceSource, /Retry/);
  assert.match(traceSource, /setResponse\(null\)/);
  assert.match(traceSource, /setLoading\(true\)/);
  assert.match(traceSource, /result\.status === 401/);
  assert.match(source, /TraceExplorer/);
});

test("preferred Evidence route and legacy trace URLs remain supported", () => {
  assert.match(tracesRoute, /initialView="traces"/);
  assert.match(source, /window\.location\.pathname === "\/dashboard\/traces"/);
  assert.match(source, /params\.get\("view"\) === "trace"/);
  assert.match(source, /view === "evidence"[\s\S]*dashboard\/traces/);
});

test("Issues consumes bounded workspace incidents without adding Alerts navigation", () => {
  assert.match(source, /\/api\/v1\/alert-incidents\?limit=50/);
  assert.match(source, /credentials: "same-origin"/);
  assert.match(source, /Firing regression/);
  assert.match(source, /Insufficient evidence/);
  assert.match(source, /Configuration needs attention/);
  assert.match(source, /Notification status/);
  assert.match(source, /Not included in this response/);
  assert.match(source, /You do not have permission to view regression incidents/);
  assert.match(source, /Regression incidents could not be loaded/);
  assert.match(source, /onViewIncidentEvidence/);
  assert.match(source, /Incident evidence/);
  assert.doesNotMatch(source, /id: "alerts", label: "Alerts"/);
});
