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
const dashboardPageSource = await readFile(
  new URL("../../app/dashboard/page.tsx", import.meta.url),
  "utf8",
);
const workspaceRouteSource = await readFile(
  new URL("../../app/api/v1/account/workspace/route.ts", import.meta.url),
  "utf8",
);
const globalsSource = await readFile(
  new URL("../../app/globals.css", import.meta.url),
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
  assert.match(source, /id: "journeys", label: "Journeys", icon: Route/);
  assert.match(source, /id: "capabilities", label: "Capabilities", icon: Blocks/);
  assert.match(source, /id: "quality", label: "Quality", icon: ShieldCheck/);
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

test("dashboard typography uses the product type system", () => {
  assert.match(globalsSource, /--font-sans: var\(--font-inter\)/);
  assert.match(globalsSource, /\.dashboard-shell h1/);
  assert.match(globalsSource, /\.dashboard-shell \.dashboard-page-title/);
  assert.match(globalsSource, /font-size: 1\.75rem/);
  assert.match(globalsSource, /\.dashboard-shell \.dashboard-section-title/);
  assert.match(globalsSource, /font-size: 1rem/);
  assert.match(source, /dashboard-shell min-h-screen bg-\[#f7f8f7\] font-sans/);
});

test("data source state is explicit and never silently substituted", () => {
  assert.match(source, /params\.set\("data", dataMode\)/);
  assert.match(
    source,
    /rawData === "example" \|\| rawData === "sample" \? "example" : "my"/,
  );
  assert.match(source, /My data selected/);
  assert.match(source, /Example data selected/);
  assert.match(source, /This is a guided example, not workspace telemetry/);
  assert.match(source, /QuickBooks Finance MCP/);
  assert.match(source, /No other data source was substituted/);
  assert.match(source, /No live data available/);
  assert.match(source, /Live data could not be loaded/);
  assert.doesNotMatch(source, /sampleMode \?\? /);
  assert.doesNotMatch(source, /Connected to live telemetry/);
  assert.doesNotMatch(source, /updated just now/);
});

test("zero-event activation uses page-specific connection states", () => {
  assert.match(source, /Your MCP server has not sent its first event yet\./);
  assert.match(source, /Your MCP server is not connected yet\./);
  assert.match(
    source,
    /zeroEventState = Boolean\([\s\S]*analytics\.total_events === 0/,
  );
  assert.match(source, /function ServerConnectionState\(/);
  assert.match(source, /See Example data/);
  assert.match(source, /Complete setup/);
  assert.doesNotMatch(source, /View setup instructions/);
  assert.match(
    source,
    /!isExample && \(!workspace \|\| !hasActiveKey \|\| zeroEventState\)/,
  );
  assert.match(source, /setTraceSessionId\(null\)/);
  assert.match(source, /setTraceCorrelationHandle\(null\)/);
  assert.match(source, /setTraceOrigin\("evidence"\)/);
  assert.match(source, /writeRouteState\(view, range, next, null, null, "evidence"\)/);
  assert.match(source, /!workspace \|\| !hasActiveKey/);
  assert.match(source, /state === "key"\s*\? "Complete setup"/);
  assert.match(
    source,
    /!hasActiveKey\s*\? \(\) => goTo\("setup"\)\s*:/,
  );
  assert.doesNotMatch(source, /onboardingMode/);
});

test("connection keys are explicitly created from Setup and shown once in full", () => {
  assert.match(source, /Complete setup/);
  assert.match(source, /className="max-w-full break-all overflow-x-auto/);
  assert.match(source, /\{newKey\}/);
  assert.match(source, /\{key\.key_prefix\}••••••/);
  assert.match(source, /onClick=\{onGenerateKey\}/);
});

test("workspace provisioning does not mint a connection key", () => {
  assert.match(dashboardPageSource, /body: JSON\.stringify\(\{ create_key: false \}\)/);
  assert.match(workspaceRouteSource, /if \(body\.create_key !== false\)/);
  assert.match(
    workspaceRouteSource,
    /api_key: null, message: "Workspace created\. Create a connection key from Setup/,
  );
});

test("Setup remains reachable for My data activation states", () => {
  const setupBranch = source.indexOf('view === "setup" ? (');
  const connectionStateBranch = source.indexOf(
    "!isExample && (!workspace || !hasActiveKey || zeroEventState)",
  );
  assert.ok(setupBranch >= 0, "Setup view branch must exist");
  assert.ok(connectionStateBranch >= 0, "connection state branch must exist");
  assert.ok(
    setupBranch < connectionStateBranch,
    "Setup must win over connection activation state",
  );
  assert.match(source, /Complete setup/);
  assert.match(source, /function SetupView\(/);
});

test("Setup documentation link is external and the connection steps are explicit", () => {
  assert.match(source, /label: "Read documentation"/);
  assert.match(source, /href: "https:\/\/trackmcp\.com\/docs"/);
  assert.match(source, /target="_blank"/);
  assert.match(source, /TRACKMCP_KEY/);
  assert.match(source, /make one real tool call/);
  assert.match(source, /Know what you are sharing/);
  assert.match(source, /redacts and bounds them locally/);
  assert.match(source, /What is protected/);
  assert.match(source, /Metadata mode to omit tool arguments\s+and results entirely/);
  assert.match(source, /No proxying or tool execution is involved/);
  assert.doesNotMatch(source, /Connection state/);
});

test("example data offers a clear setup path and Setup keeps trust below the setup cards", () => {
  assert.match(source, /["']\/dashboard\?view=setup&data=my["']/);
  assert.match(source, /Connect your MCP/);
  assert.match(source, /View my data/);
  assert.match(source, /canViewMyData/);
  assert.match(source, /hasMyData/);
  const setupStart = source.indexOf("function SetupView(");
  const setupEnd = source.indexOf("// Kept as an inert compatibility artifact", setupStart);
  assert.ok(setupStart >= 0 && setupEnd > setupStart, "Setup view must be present");
  const setupSource = source.slice(setupStart, setupEnd);
  assert.doesNotMatch(setupSource, /actions=\{pageControls\}/);
  assert.match(setupSource, /max-h-64 space-y-2 overflow-y-auto/);
  assert.ok(
    setupSource.indexOf('title="Connect the server"') <
      setupSource.indexOf("Know what you are sharing"),
    "Trust explanation should follow the setup cards",
  );
});

test("empty page previews explain each product area instead of repeating generic placeholders", () => {
  for (const phrase of [
    "The business tasks users start",
    "What your MCP advertises versus what users call",
    "p95 timing over the selected activity period",
    "The current state, such as firing, resolved, or suppressed",
    "The ordered steps, timing, and status of the trace",
  ]) {
    assert.match(source, new RegExp(phrase.replace(/[.*+?^$()|[\\]\\]/g, "\\$&")));
  }
  assert.match(source, /Populates after connection/);
});

test("copy actions provide a green check success state", () => {
  assert.match(source, /copied \? \(\s*<Check size=\{13\} className="text-brand-strong"/);
  assert.match(source, /\{copied \? "Copied" : "Copy setup"\}/);
  assert.match(source, /\{copied \? "Copied" : "Copy key"\}/);
  assert.match(traceSource, /copied \? \(\s*<Check size=\{13\} className="text-brand-strong"/);
  assert.match(traceSource, /\{copied \? "Copied" : "Copy ID"\}/);
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

test("Overview session actions clearly open traces", () => {
  assert.match(source, /title="Sessions in selected period"[\s\S]*label: "View traces"/);
  assert.match(source, /Open trace <ChevronRight/);
});

test("completion is explicit-outcome-only and tool quality exposes insufficient reasons", () => {
  assert.match(source, /function explicitOutcomeTotals/);
  assert.match(source, /Explicit workflow outcome events only/);
  assert.match(source, /No explicit workflow outcome data/);
  assert.match(source, /Specific reason:/);
  assert.match(source, /observed calls before/);
  assert.match(source, /Showing a bounded result/);
  assert.match(source, /Some events may be omitted/);
  assert.match(source, /eligible comparison volume/);
  assert.doesNotMatch(source, /eligible comparison events/);
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
  assert.match(traceSource, /sampleTraceResponse/);
  assert.match(traceSource, /Illustrative trace:/);
  assert.match(source, /sampleMode=\{dataMode === "example"\}/);
  assert.match(source, /View sample trace/);
});

test("Needs attention stays chart-height and scrolls its signals internally", () => {
  assert.match(source, /min-h-\[320px\] max-h-\[320px\] flex-col/);
  assert.match(source, /aria-label="Needs attention signals"/);
  assert.match(source, /overflow-y-auto pr-2/);
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

test("Example Issues shows illustrative incident lifecycles", () => {
  assert.match(source, /EXAMPLE_ALERT_INCIDENTS: AlertIncident\[\]/);
  assert.match(source, /Illustrative alert lifecycle examples with bounded evidence/);
  assert.match(source, /These are illustrative examples[\s\S]*firing,\s*resolved,\s*insufficient-data,\s*and suppressed incidents appear/);
  assert.match(source, /View sample evidence/);
  assert.doesNotMatch(source, /Alert incidents are available for My data only/);
});

test("example Capabilities, Quality, and Evidence omit the explanatory blue summary panels", () => {
  assert.doesNotMatch(source, /function ExampleServerSummary/);
  assert.doesNotMatch(source, /What this example server does/);
  assert.doesNotMatch(source, /How to read this example/);
  assert.doesNotMatch(source, /Illustrative example/);
  assert.match(source, /function ExampleEvidencePreview/);
});

test("date controls appear only on views with period-based data", () => {
  assert.doesNotMatch(
    source,
    /Follow the invoice lookup example across Overview, Capabilities,\s*Quality, and Evidence\./,
  );
  assert.match(source, /const pageControls =\s*view === "issues" \? null/);
  const issuesStart = source.indexOf("function IssuesView(");
  const issuesEnd = source.indexOf("function IncidentCard(", issuesStart);
  assert.ok(issuesStart >= 0 && issuesEnd > issuesStart, "Issues view must be present");
  assert.doesNotMatch(source.slice(issuesStart, issuesEnd), /actions=\{pageControls\}/);
});

test("page headers do not add a divider before page content", () => {
  const pageIntroStart = source.indexOf("function PageIntro(");
  const pageIntroEnd = source.indexOf("function ExampleEvidencePreview(", pageIntroStart);
  assert.ok(pageIntroStart >= 0 && pageIntroEnd > pageIntroStart, "PageIntro must be present");
  const pageIntroSource = source.slice(pageIntroStart, pageIntroEnd);
  assert.doesNotMatch(pageIntroSource, /border-b border-line/);
});
