import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function source(relativePath) {
  return readFile(resolve(root, relativePath), "utf8");
}

test("dashboard distinguishes live data and completion evidence", async () => {
  const dashboard = await source("src/components/dashboard/DashboardApp.tsx");
  assert.match(dashboard, /Example data/);
  assert.match(dashboard, /Live data/);
  assert.doesNotMatch(dashboard, /session heuristic/);
  assert.match(dashboard, /No explicit workflow outcome data/);
  assert.match(dashboard, /Source: workflow outcome events/);
  assert.match(dashboard, /Open Evidence/);
});

test("marketing example dashboard uses the real Founder OS tab vocabulary", async () => {
  const mock = await source("src/components/DashboardMock.tsx");
  for (const label of ["Overview", "What they're doing", "The journey", "Did it work", "What's broken", "Who's using it", "Evidence", "Setup"]) {
    assert.match(mock, new RegExp(`label: \\\"${label.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\\"`));
  }
  for (const stale of ["label: \\\"Tools\\\"", "label: \\\"Sessions\\\"", "label: \\\"Workflows\\\"", "label: \\\"Reliability\\\""]) {
    assert.doesNotMatch(mock, new RegExp(stale));
  }
});

test("reference and API docs describe bounded trace responses and latency semantics", async () => {
  const reference = await source("src/app/docs/reference/page.tsx");
  const api = await source("src/app/docs/api/page.tsx");
  assert.match(reference, /nearest-rank/);
  assert.match(reference, /N\/A/);
  assert.match(reference, /workflow_events/);
  assert.match(reference, /workspace-scoped/);
  assert.match(api, /default limit is 200/);
  for (const field of ["event_count", "truncated", "completion_source", "correlation_quality"]) {
    assert.match(api, new RegExp(field));
  }
  assert.match(api, /authenticated workspace and session/);
  assert.match(api, /idempotent/);
});

test("SDK docs explain boundary, privacy defaults, workflow semantics, and fail-open behavior", async () => {
  const typescript = await source("packages/typescript-sdk/README.md");
  const python = await source("../packages/python-sdk/README.md");
  const typescriptWeb = await source("src/app/docs/typescript/page.tsx");
  const reference = await source("src/app/docs/reference/page.tsx");
  assert.match(typescriptWeb, /bounded server-side tool, session, result, and client observations/);
  assert.doesNotMatch(typescriptWeb, /every call,?\s*result,?\s*and client is captured automatically/i);
  assert.match(reference, /supported tool calls observed at the configured server boundary/);
  assert.doesNotMatch(reference, /On every tool call, the wrapper records/i);
  for (const docs of [typescript, python]) {
    assert.match(docs, /server boundary/i);
    assert.match(docs, /redact/i);
    assert.match(docs, /metadata/i);
    assert.match(docs, /opt into `full`|full mode/i);
    assert.match(docs, /fail-open/i);
    assert.match(docs, /workflow/i);
    assert.match(docs, /answer was correct|answer correctness/i);
  }
});

test("public website labels sample visuals and qualifies unsupported roadmap claims", async () => {
  const pages = await Promise.all([
    source("src/app/mcp-server-analytics/page.tsx"),
    source("src/app/mcp-tool-analytics/page.tsx"),
    source("src/app/mcp-observability/page.tsx"),
    source("src/app/mcp-observability/remote-http/page.tsx"),
    source("src/app/features/page.tsx"),
    source("src/app/pricing/page.tsx"),
  ]);
  assert.match(pages[0], /server sees/);
  assert.match(pages[1], /Example data/);
  assert.match(pages[2], /Example data/);
  assert.match(pages[3], /does not proxy arbitrary hosted MCP servers/);
  assert.match(pages[3], /Example data/);
  assert.match(pages[4], /Planned/);
  assert.match(pages[5], /Planned/);
  assert.match(pages[4], /Observed calls, ranked and trended/);
  assert.doesNotMatch(pages[4], /Every call, ranked and trended/);
});

test("onboarding and quickstart make privacy and boundary behavior discoverable", async () => {
  const onboarding = await source("src/components/dashboard/IntegrationChecklist.tsx");
  const setup = await source("src/components/dashboard/SetupModal.tsx");
  const quickstart = await source("src/app/mcp-server-analytics/quickstart/page.tsx");
  const docsHome = await source("src/app/docs/page.tsx");
  for (const content of [onboarding, setup, quickstart, docsHome]) {
    assert.match(content, /redact|redacted/i);
  }
  assert.match(setup, /fail-open/);
  assert.match(quickstart, /fails open/);
  assert.match(quickstart, /Example data/);
  assert.match(docsHome, /private model turn/);
});

test("authentication docs disclose the distributed rate-limit boundary", async () => {
  const authentication = await source("src/app/docs/authentication/page.tsx");
  assert.match(authentication, /TRACKMCP_RATE_LIMIT_MODE/);
  assert.match(authentication, /process-local fallback/);
  assert.match(authentication, /does not coordinate limits across multiple application instances/);
  assert.match(authentication, /reviewed rate-limit postflight/);
});

test("homepage presents the terminal-first CLI as the primary setup action", async () => {
  const homepage = await source("src/app/page.tsx");
  const systemStory = await source("src/components/scenes/SystemStoryScene.tsx");
  const howItWorks = await source("src/components/HowItWorksFlow.tsx");
  const firstSetup = homepage.indexOf("npx @trackmcp/cli init");
  assert.notEqual(firstSetup, -1);
  assert.match(homepage, /CopyButton text="npx @trackmcp\/cli init"/);
  assert.ok(firstSetup < homepage.indexOf("@trackmcp\/sdk"), "the setup command should appear before the SDK implementation example");
  assert.match(homepage, /configured server-boundary observations/);
  assert.match(homepage, /Accepted observations appear after processing/);
  assert.doesNotMatch(homepage, /captures every call|dashboard in real time|Track and analyze who uses your MCP server/i);
  assert.match(systemStory, /Illustrative flow/);
  assert.match(systemStory, /configured observations/);
  assert.match(systemStory, /observes and summarizes/);
  assert.doesNotMatch(systemStory, /captures every call|captures and synthesizes/);
  assert.match(howItWorks, /after processing/);
});

test("release notes describe the CLI activation boundary without claiming browser key handling", async () => {
  const posts = await source("src/app/blog/posts.ts");
  assert.match(posts, /slug: "trackmcp-cli-activation-release"/);
  assert.match(posts, /npx @trackmcp\/cli init/);
  assert.match(posts, /browser never receives or displays the connection key/);
  assert.match(posts, /Does npm install start the browser flow\?/);
  assert.doesNotMatch(posts, /Create or open a TrackMCP workspace, create an API key, install the SDK for your runtime/i);
});

test("brand logo links remove decoration while retaining a visible keyboard focus ring", async () => {
  const logo = await source("src/components/TrackMCPLogo.tsx");
  const css = await source("src/app/globals.css");
  assert.match(logo, /no-underline/);
  assert.match(logo, /focus-visible:ring-2/);
  assert.doesNotMatch(logo, /focus-visible:underline/);
  assert.match(css, /\.trackmcp-logo:hover/);
  assert.match(css, /\.trackmcp-logo:active/);
  assert.match(css, /\.trackmcp-logo:visited/);
  assert.match(css, /text-decoration: none !important/);
});

test("trust pages avoid promising unshipped retention and export controls", async () => {
  const security = await source("src/app/security/page.tsx");
  const privacy = await source("src/app/privacy/page.tsx");
  assert.match(security, /confirm them with the TrackMCP team/);
  assert.match(security, /not represented as shipped functionality/);
  assert.match(privacy, /Confirm current retention/);
  assert.match(privacy, /Export is bounded and privacy-safe/);
  assert.match(privacy, /self-service deletion remains a reviewed workflow/);
});
