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
    'id: "journeys", label: "The journey"',
    'id: "capabilities", label: "What they\'re doing"',
    'id: "quality", label: "Did it work"',
    'id: "issues", label: "What\'s broken"',
  ])
    assert.match(source, new RegExp(item.replace(/[.*+?^$()|[\]\\]/g, "\\$&")));
  assert.match(source, /id: "journeys", label: "The journey", icon: Route/);
  assert.match(source, /id: "capabilities", label: "What they're doing", icon: Blocks/);
  assert.match(source, /id: "resources", label: "Resources & prompts", icon: FileText/);
  assert.match(source, /id: "quality", label: "Did it work", icon: ShieldCheck/);
  assert.match(source, /id: "clients", label: "Who's using it"/);
  assert.match(source, /id: "evidence", label: "Evidence"/);
  assert.match(source, /id: "setup", label: "Setup"/);
  assert.match(
    source,
    /label="AI clients"[\s\S]*label="Activity"[\s\S]*label="Work completed"[\s\S]*label="Needs attention"/,
  );
  assert.doesNotMatch(source, /id: "tool-quality"/);
  assert.doesNotMatch(source, /Open Configure/);
});

test("every dashboard tab button is wired to the shared route transition", () => {
  assert.match(source, /onClick=\{\(\) => onNavigate\(item\.id\)\}/);
  assert.match(source, /onClick=\{\(\) => goTo\(item\.id\)\}/);
  assert.match(source, /writeRouteState\(next, range, dataMode\)/);
  assert.match(source, /aria-current=\{view === item\.id \? "page" : undefined\}/);
});

test("dashboard deep links normalize singular and legacy view aliases", () => {
  assert.match(source, /journey: "journeys"/);
  assert.match(source, /capability: "capabilities"/);
  assert.match(source, /issue: "issues"/);
  assert.match(source, /people: "clients"/);
  assert.match(source, /["']resource-prompts["']: "resources"/);
});

test("Founder OS vertical slices share one data-trust contract", () => {
  for (const view of ["clients", "capabilities", "resources", "journeys", "quality", "issues"]) {
    assert.match(
      source,
      new RegExp(`DataSourceStrip[\\s\\S]*view=\\\"${view}\\\"`),
      `${view} must expose its explicit data source`,
    );
  }
  for (const readModel of [
    "who_is_using_it",
    "capability_activity",
    "resource_prompt_activity",
    "journey_activity",
    "outcome_activity",
    "issue_activity",
  ]) {
    assert.match(source, new RegExp(`analytics\\.${readModel}`));
  }
  for (const noEvidence of [
    "No resource or prompt evidence yet",
    "No common paths yet",
    "No quality observations in this period",
    "No actionable signals yet.",
  ]) {
    assert.match(source, new RegExp(noEvidence.replace(/[.*+?^$()|[\\]\\\\]/g, "\\\\$&")));
  }
  assert.match(source, /N\/A/);
  assert.match(source, /Growth over time[\s\S]*observed each week/);
  assert.match(source, /function AccountGrowthChart/);
  assert.match(source, /Unrecognized tool/);
  assert.match(source, /function CapabilityTrendChart/);
  assert.match(source, /function ToolDetailPanel/);
  assert.match(source, /signal, not a diagnosis/);
  assert.match(source, /Missing task events are not classified as abandonment/);
  assert.match(source, /insufficient data/i);
  assert.match(source, /This is a guided example, not workspace telemetry/);
});

test("desktop-only pilot boundary is visible on narrow dashboard viewports", () => {
  assert.match(source, /Founder OS is supported on desktop browsers for this pilot/);
  assert.match(source, /className="border-b border-amber-200 bg-amber-50[^\"]*lg:hidden/);
});

test("resources and prompts have a dedicated evidence-bounded surface", () => {
  assert.match(source, /function ResourcesPromptsView/);
  assert.match(source, /title=\"Resources & prompts\"/);
  assert.match(source, /Hashed entities/);
  assert.match(source, /No resource or prompt evidence yet/);
  assert.match(source, /does not expose resource contents, prompt arguments/);
});

test("primary setup panel exposes the OpenTelemetry guide", () => {
  assert.match(source, /Open the OpenTelemetry setup guide/);
  assert.match(source, /href="\/docs\/opentelemetry"/);
});

test("setup field explanations use accessible info hints", () => {
  assert.match(source, /About server name/);
  assert.match(source, /About environment/);
  assert.match(source, /About scoped keys/);
  assert.match(source, /About service scope/);
  assert.match(source, /About environment scope/);
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

test("example mode supplies every Founder OS vertical-slice read model", () => {
  for (const readModel of [
    "examplePeople",
    "exampleCapabilityActivity",
    "exampleResourcePromptActivity",
    "journey_activity:",
    "outcome_activity:",
    "issue_activity:",
  ]) {
    assert.match(source, new RegExp(readModel.replace(/[.*+?^${}()|[\\]\\]/g, "\\\\$&")));
  }
  assert.match(source, /Unrecognized.*identity_source: "unrecognized"/s);
  assert.match(source, /resource_reads: scale\(/);
  assert.match(source, /interaction_count: scale\(/);
  assert.match(source, /completion_rate: 37 \/ 50/);
  assert.match(source, /tool\.description &&/);
  assert.match(source, /Run a bounded finance query/);
  assert.match(source, /Account activity is unavailable/);
  assert.match(source, /no example or inferred account data is substituted/);
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

test("Setup exposes truthful first-event and coverage states", () => {
  assert.match(source, /First event verified/);
  assert.match(source, /Limited coverage/);
  assert.match(source, /Identity unresolved/);
  assert.match(source, /selected query reached its safety limit/);
  assert.match(source, /observed account identity could not be resolved/);
  assert.match(source, /analytics\?\.data_trust\?\.truncated/);
  assert.match(source, /identity_coverage\.denominator > 0/);
  assert.match(source, /account_resolver_observed/);
  assert.match(source, /contractIdentity !== undefined && contractIdentity !== null/);
  assert.match(source, /Identity resolved/);
  assert.match(source, /identityResolved: boolean \| null/);
  assert.match(source, /done === null \? "\?"/);
  assert.match(source, /Transport observed/);
  assert.match(source, /Event persisted/);
  assert.match(source, /First event scope:/);
  assert.match(source, /service not reported/);
  assert.match(source, /environment not reported/);
});

test("Setup renders the server readiness contract without making identity mandatory", () => {
  assert.match(source, /Required setup evidence/);
  assert.match(source, /Identity resolution is optional and does not block a connected state/);
  assert.match(source, /aria-label="Setup readiness"/);
});

test("Setup distinguishes stale ingestion evidence from current health", () => {
  assert.match(source, /firstEventIsStale/);
  assert.match(source, /historical ingestion evidence, not a current health check/);
  assert.match(source, /15 \* 60/);
});

test("Setup keeps deployment linkage count-only and non-health claiming", () => {
  assert.match(source, /Deployment linkage/);
  assert.match(source, /not deployment health or release status/);
});

test("The journey renders bounded task evidence without claiming business completion", () => {
  assert.match(source, /Async task evidence/);
  assert.match(source, /opaque handles protect task identifiers/);
  assert.match(source, /Missing task events are not classified as abandonment/);
  assert.match(source, /does not prove that a customer.*business goal succeeded/);
});

test("Needs attention renders bounded action context", () => {
  assert.match(source, /affected volume:/);
  assert.match(source, /confidence:/);
  assert.match(source, /Suggested next step:/);
});

test("connection keys are explicitly created from Setup and shown once in full", () => {
  assert.match(source, /Complete setup/);
  assert.match(source, /className="max-w-full break-all overflow-x-auto/);
  assert.match(source, /\{newKey\}/);
  assert.match(source, /\{key\.key_prefix\}••••••/);
  assert.match(source, /onClick=\{\(\) => onGenerateKey/);
});

test("mobile dashboard header wraps without clipping workspace or data controls", () => {
  assert.match(source, /pt-\[96px\] lg:pl-\[248px\] lg:pt-\[52px\]/);
  assert.match(source, /min-h-\[52px\] flex-wrap/);
  assert.match(source, /w-\[35vw\] max-w-\[180px\] min-w-0/);
  assert.match(source, /overflow-x-auto.*role=\"navigation\" aria-label=\"Dashboard navigation\"/s);
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

test("Setup breaks the no-workspace connection-key loop", () => {
  const setupStart = source.indexOf("function SetupView(");
  const setupEnd = source.indexOf("// Kept as an inert compatibility artifact", setupStart);
  const setupSource = source.slice(setupStart, setupEnd);
  assert.match(source, /onCreateWorkspace=\{onCreateWorkspace\}/);
  assert.match(setupSource, /onCreateWorkspace: \(\) => void/);
  assert.match(setupSource, /!workspaceId \? \(/);
  assert.match(setupSource, /Create your workspace/);
  assert.match(setupSource, /onClick=\{onCreateWorkspace\}/);
  assert.match(setupSource, /workspaceId \? "Create a connection key to begin" : "Create your workspace to begin"/);
});

test("Setup documentation link is external and the connection steps are explicit", () => {
  assert.match(source, /label: "Read documentation"/);
  assert.match(source, /const documentationHref = `https:\/\/trackmcp\.com\/docs\/\$\{/);
  assert.match(source, /documentationHref/);
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

test("Python setup snippet is copy-paste complete", () => {
  const setupStart = source.indexOf("function SetupView(");
  const setupEnd = source.indexOf("// Kept as an inert compatibility artifact", setupStart);
  const setupSource = source.slice(setupStart, setupEnd);
  assert.match(setupSource, /\/api\/v2\/setup\?workspace_id=/);
  assert.match(setupSource, /waiting_for_first_event/);
  assert.match(setupSource, /Privacy policy applied/);
  assert.match(setupSource, /next_steps/);
  assert.match(setupSource, /ingestion_lag_seconds/);
  assert.match(setupSource, /Python: `python3 -m pip install trackmcp\\n\\nimport os\\nfrom trackmcp import with_trackmcp/);
  assert.match(setupSource, /os\.environ\["TRACKMCP_KEY"\]/);
});

test("Setup exposes every documented SDK path without implying publication", () => {
  assert.match(source, /\["TypeScript", "Python", "Go", "\.NET"\]/);
  assert.match(source, /language === "Go"[\s\S]*\/docs\/go/);
  assert.match(source, /language === "\.NET"[\s\S]*\/docs\/dotnet/);
  assert.match(source, /reviewed source package rather than a registry release/);
  assert.match(source, /reviewed source package rather than a NuGet release/);
});

test("Setup exposes bounded export and non-destructive deletion controls", () => {
  assert.match(source, /function PrivacyControls\(/);
  assert.match(source, /\/api\/v1\/account\/export\?workspace_id=/);
  assert.match(source, /Download data export/);
  assert.match(source, /Request deletion review/);
  assert.match(source, /will record the request for review; it will not delete data immediately/);
  assert.match(source, /request_type: "delete"/);
  assert.match(source, /crypto\.randomUUID\(\)/);
  assert.match(source, /privacy-request/);
  assert.match(source, /Read privacy limits/);
  assert.match(source, /href="\/docs\/reference#privacy"/);
  assert.match(source, /inline-flex cursor-pointer items-center gap-1\.5 border border-line-strong/);
  assert.match(source, /disabled:cursor-not-allowed/);
});

test("protocol surface cards disclose durable entity-read coverage", () => {
  assert.match(source, /Observed resources and prompts/);
  assert.match(source, /Durable read projection/);
  assert.match(source, /Durable read schema unavailable/);
  assert.match(source, /Needs input/);
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

test("Setup exposes a direct transport observer documentation CTA", () => {
  const setupStart = source.indexOf("function SetupView(");
  const setupEnd = source.indexOf("// Kept as an inert compatibility artifact", setupStart);
  const setupSource = source.slice(setupStart, setupEnd);
  assert.match(setupSource, /Node client transport observer/);
  assert.match(setupSource, /\/docs\/typescript#transport-observer/);
  assert.match(setupSource, /Go server SDK/);
  assert.match(setupSource, /href="\/docs\/go"/);
  assert.match(setupSource, /.NET server SDK/);
  assert.match(setupSource, /href="\/docs\/dotnet"/);
  assert.match(setupSource, /Authentication and OAuth/);
  assert.match(setupSource, /href="\/docs\/authentication"/);
  assert.match(setupSource, /Proxy or stdio launcher/);
  assert.match(setupSource, /Read transport boundaries/);
  assert.match(setupSource, /href="\/docs\/protocol"/);
  for (const href of ["/docs/typescript#transport-observer", "/docs/go", "/docs/dotnet", "/docs/opentelemetry", "/tools/mcp-server-tester", "/docs/authentication"]) {
    const escaped = href.replace(/[.*+?^${}()|[\\]\\]/g, "\\\\$&");
    assert.match(setupSource, new RegExp(`href="${escaped}" className="[^"]*focus-visible:ring-2`), `${href} must expose a keyboard focus ring`);
  }
  const pointerAnchors = [...setupSource.matchAll(/<a\b[^>]*className="[^"]*cursor-pointer[^\"]*"[^>]*>/g)].map(([tag]) => tag);
  assert.ok(pointerAnchors.length >= 10, "Setup should retain its documented interactive link inventory");
  for (const tag of pointerAnchors) assert.match(tag, /focus-visible:ring-2/, `interactive Setup link lacks a focus ring: ${tag}`);
});

test("shared dashboard controls expose keyboard focus rings", () => {
  for (const snippet of [
    "<summary className=\"flex h-9 cursor-pointer",
    "Apply range</button>",
    "disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
    "inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
  ]) assert.match(source, new RegExp(snippet.replace(/[.*+?^${}()|[\\]\\]/g, "\\\\$&")), `${snippet} must remain keyboard accessible`);
});

test("Setup exposes safe rotation alongside revocation for active keys", () => {
  assert.match(source, /onRotateKey: \(id: string\) => void/);
  assert.match(source, /onClick=\{\(\) => onRotateKey\(key\.id\)\}/);
  assert.match(source, />\s*Rotate\s*<\/button>/);
  assert.match(source, /disabled=\{working\}/);
});

test("Setup keeps revoked key history collapsed until explicitly requested", () => {
  const setupStart = source.indexOf("function SetupView(");
  const setupEnd = source.indexOf("// Kept as an inert compatibility artifact", setupStart);
  const setupSource = source.slice(setupStart, setupEnd);
  assert.match(setupSource, /showRevokedKeys/);
  assert.match(setupSource, /aria-expanded=\{showRevokedKeys\}/);
  assert.match(setupSource, /Show revoked keys \(\$\{keys\.filter\(\(key\) => key\.revoked_at\)\.length\}\)/);
  assert.match(setupSource, /keys\.filter\(\(key\) => showRevokedKeys \|\| !key\.revoked_at\)/);
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

test("Overview exposes Founder OS outcome and evidence-quality states", () => {
  assert.match(source, /analytics\.founder_os/);
  assert.match(source, /function FounderOSSignalPanel/);
  assert.match(source, /function DataTrustPanel/);
  assert.match(source, /Identity evidence/);
  assert.match(source, /event-weighted, not unique people/);
  assert.match(source, /aria-label="Data trust"/);
  assert.match(source, /title="Outcome evidence"/);
  assert.match(source, /Semantic facts are separated from activity/);
  for (const label of ["Completed", "Failed", "Pending", "Unknown", "Not observable", "Observed", "Inferred", "Insufficient data", "Conflicting"]) {
    assert.match(source, new RegExp(label));
  }
  assert.match(source, /still need a definitive outcome/);
  assert.match(source, /never counted as success/);
  assert.match(source, /Evidence window:/);
  assert.match(source, /bounded scan complete/);
  assert.match(source, /scan limit reached; results may be incomplete/);
});

test("Data trust exposes bounded derived-refresh health without implying activity", () => {
  assert.match(source, /refreshStatus=\{analytics\.refresh_status\}/);
  assert.match(source, /aria-label="Refresh worker status"/);
  assert.match(source, /Worker metrics are bounded to the latest 100 workspace jobs/);
  assert.match(source, /no job is evidence of no customer activity/);
  assert.match(source, /Max lag/);
  assert.match(source, /worker_health/);
  assert.match(source, /insufficient_data/);
  assert.match(source, /Some derived-data jobs are queued, retrying, running, or failed/);
});

test("Overview exposes protocol lifecycle signals with an explicit non-outcome caveat", () => {
  assert.match(source, /protocol_signals/);
  assert.match(source, /function ProtocolSignalPanel/);
  assert.match(source, /Signals observed at the server boundary/);
  assert.match(source, /They are not tool success, workflow completion, or uptime evidence/);
  assert.match(source, /aria-label="Protocol lifecycle signals"/);
  assert.match(source, /Daily signal timeline/);
  assert.match(source, /aria-label="Daily protocol signal timeline"/);
  assert.match(source, /Catalog changes by surface/);
  assert.match(source, /not snapshot versions/);
  assert.match(source, /Versioned snapshots/);
  assert.match(source, /Notification counts use the bounded evidence join/);
});

test("protocol outcomes disclose hash-only matched request/response pairs", () => {
  assert.match(source, /matched/);
  assert.match(source, /same-family request\/response pairs/);
  assert.match(source, /in-memory hash/);
});

test("Capabilities exposes bounded modern protocol outcome states", () => {
  assert.match(source, /protocol_family_outcomes/);
  assert.match(source, /Modern protocol outcomes/);
  assert.match(source, />Advertised</);
  assert.match(source, />Requests</);
  assert.match(source, />Responses</);
  assert.match(source, />Matched</);
  assert.match(source, /Requests and responses are counted from explicit metadata roles/);
  assert.match(source, />Completed</);
  assert.match(source, /N\/A means no capability advertisement was observed/);
  assert.match(source, /Evidence source:/);
});

test("Capabilities exposes concise MRTR linkage evidence without raw identifiers", () => {
  assert.match(source, /protocol_mrtr_linkage/);
  assert.match(source, /MRTR linkage evidence/);
  assert.match(source, /Request-state hashes/);
  assert.match(source, /Interaction hashes/);
  assert.match(source, /Retry links/);
  assert.match(source, /Matched pairs/);
  assert.match(source, /Privacy-safe multi-round-trip metadata/);
});

test("Capabilities exposes bounded MRTR transport coverage", () => {
  assert.match(source, /protocol_transport_outcomes/);
  assert.match(source, /MRTR transport coverage/);
  assert.match(source, /Transport labels are caller-verified metadata/);
});

test("Capabilities exposes truthful catalog history states", () => {
  assert.match(source, /function CatalogHistoryPanel\(/);
  assert.match(source, /Hash-only snapshots show when the advertised capability surface changed/);
  assert.match(source, /Catalog history is unavailable/);
  assert.match(source, /No historical snapshots yet/);
  assert.match(source, /A partial or truncated scan is not evidence that an item was removed/);
  assert.match(source, /version\.diff\.added_name_count/);
  assert.match(source, /version\.diff\.removed_name_count/);
  assert.doesNotMatch(source, /version\.payload/);
});

test("Capabilities preserves tool-call activity when capability identity is missing", () => {
  assert.match(source, /analytics\.tool_calls > 0/);
  assert.match(source, /no capability name was reported/);
});

test("Capabilities presents bounded modern protocol family activity", () => {
  assert.match(source, /Modern protocol activity/);
  assert.match(source, /protocol_family_activity/);
  assert.match(source, /bounded observations/);
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

test("Issues orders confirmed critical evidence before insufficient-data noise", () => {
  assert.match(source, /incident\.data_status === "sufficient" && incident\.severity === "critical"/);
  assert.match(source, /evidenceRank\(left\) - evidenceRank\(right\)/);
  assert.match(source, /Date\.parse\(right\.last_seen_at\) - Date\.parse\(left\.last_seen_at\)/);
});

test("Issues collapses lower-priority incident volume until requested", () => {
  assert.match(source, /const visibleIncidents = showAllIncidents \? orderedIncidents : orderedIncidents\.slice\(0, 5\)/);
  assert.match(source, /Show all \$\{orderedIncidents\.length\}/);
  assert.match(source, /lower-priority or insufficient-data incident signals are collapsed/);
});

test("Overview keeps decision KPIs above expandable evidence detail", () => {
  assert.match(source, /Evidence quality and protocol detail/);
  assert.match(source, /<details>/);
  assert.match(source, /Expand details/);
});

test("dashboard panels expose concise information hints and universal pointer affordances", () => {
  assert.match(source, /function InfoHint\(/);
  assert.match(source, /role="tooltip"/);
  assert.match(source, /About \$\{title\}/);
  assert.match(globalsSource, /\.dashboard-shell button:not\(:disabled\)/);
});

test("Setup makes server-side account identity configuration discoverable", () => {
  assert.match(source, /Show resolver-linked account activity/);
  assert.match(source, /accountIdResolver/);
  assert.match(source, /account_id_resolver/);
  assert.match(source, /AccountIDResolver: func\(\) string/);
  assert.doesNotMatch(source, /ResolveAccount: func\(ctx trackmcp\.Context\)/);
  assert.match(source, /AccountIdResolver: \(\) => verifiedTenantForRequest\(\)/);
  assert.match(source, /docs\/typescript#account-identity/);
  assert.match(source, /Without a resolver, activity remains visible but is counted as unresolved/);
});

test("Setup exposes an actionable OTLP endpoint and guide", () => {
  assert.match(source, /https:\/\/trackmcp\.com\/api\/v1\/otel\/v1\/traces/);
  assert.match(source, /href="\/docs\/opentelemetry"/);
  assert.match(source, /Copy endpoint/);
  assert.match(source, /OTLP\/HTTP JSON or protobuf receiver \(gRPC is not enabled\)/);
  assert.match(source, /POST JSON or protobuf/);
  assert.match(source, /public edge currently rejects server-to-server OTEL writes with HTTP 403/);
  assert.match(source, /Do not treat an HTML 403 response as accepted telemetry/);
  assert.doesNotMatch(source, /protobuf and gRPC are not enabled/);
});

test("Setup exposes a direct MCP server tester CTA with a bounded scope", () => {
  assert.match(source, /href="\/tools\/mcp-server-tester"/);
  assert.match(source, /bounded, read-only discovery check/);
  assert.match(source, /does not replace SDK instrumentation/);
});

test("Issues labels retained synthetic canary evidence instead of presenting it as customer failure", () => {
  assert.match(source, /synthetic canary incident/);
  assert.match(source, /Synthetic canary evidence/);
  assert.match(source, /not customer failures or pilot health claims/);
});

test("Issues never renders non-finite regression percentages as NaN", () => {
  assert.match(source, /value === null \|\| !Number\.isFinite\(value\) \? "N\/A"/);
});

test("Issues renders latency regression summaries in milliseconds, not percentages", () => {
  assert.match(source, /metric === "p95_latency_regression"/);
  assert.match(source, /\$\{fmt\(summary\.value\)\} ms/);
  assert.match(source, /summaryLabel\(incident\.baseline, incident\.metric\)/);
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
