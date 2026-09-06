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
  assert.match(dashboard, /Sample data/);
  assert.match(dashboard, /Live data/);
  assert.match(dashboard, /session heuristic/);
  assert.match(dashboard, /Ended after successful call/);
  assert.match(dashboard, /Explicitly completed/);
  assert.match(dashboard, /View trace/);
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
  assert.match(pages[1], /Sample data/);
  assert.match(pages[2], /Sample data/);
  assert.match(pages[3], /does not proxy arbitrary hosted MCP servers/);
  assert.match(pages[3], /Sample data/);
  assert.match(pages[4], /Planned/);
  assert.match(pages[5], /Planned/);
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
  assert.match(quickstart, /Sample data/);
  assert.match(docsHome, /private model turn/);
});

test("trust pages avoid promising unshipped retention and export controls", async () => {
  const security = await source("src/app/security/page.tsx");
  const privacy = await source("src/app/privacy/page.tsx");
  assert.match(security, /confirm them with the TrackMCP team/);
  assert.match(security, /not represented as shipped functionality/);
  assert.match(privacy, /Confirm current retention/);
  assert.match(privacy, /export integrations are planned/);
});
