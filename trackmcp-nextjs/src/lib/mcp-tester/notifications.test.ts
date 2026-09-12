import assert from "node:assert/strict";
import test from "node:test";
import { buildMcpTestNotification } from "./notifications.ts";
import type { McpTesterReport } from "./types.ts";

const report = {
  schemaVersion: "mcp-tester-report.v1",
  observedAt: "2026-09-12T10:00:00.000Z",
  durationMs: 420,
  verdict: "healthy_now",
  verdictMessage: "The endpoint completed the bounded read-only MCP probe successfully.",
  endpoint: { origin: "https://example.com", pathname: "/mcp", queryPresent: true },
  transport: { kind: "streamable_http", scheme: "https", browserDirect: true },
  protocol: { requestedVersion: "2025-11-25", negotiatedVersion: "2025-11-25", clientName: "TrackMCP tester", clientVersion: "1", sessionIdPresent: true },
  server: { name: "Example MCP", version: "1.0.0" },
  capabilities: { tools: true, resources: false, prompts: true },
  healthDimensions: {},
  phases: [],
  timings: [],
  timeline: [],
  timelineTruncated: false,
  findings: [{ code: "example", category: "catalog", severity: "warning", message: "example" }],
  tools: { items: [], count: 2, pages: 1, complete: true, truncated: false },
  resources: { items: [], count: 0, pages: 0, complete: true, truncated: false },
  prompts: { items: [], count: 1, pages: 1, complete: true, truncated: false },
  limitations: [],
} as unknown as McpTesterReport;

test("test notifications identify the tool, endpoint, result, and safe summary", () => {
  const notification = buildMcpTestNotification({ mode: "health", email: "person@example.com", customHeaderCount: 1, report });
  assert.equal(notification.subject, "TrackMCP MCP tool test notification");
  assert.equal(notification.tool, "MCP Health Check");
  assert.equal(notification.email, "person@example.com");
  assert.equal(notification.endpoint, "https://example.com/mcp");
  assert.equal(notification.query_parameters_present, "Yes, values omitted");
  assert.equal(notification.capabilities, "tools, prompts");
  assert.equal(notification.tools_found, 2);
  assert.match(String(notification.message), /values intentionally omitted/);
});

test("test notifications never include query values or custom header values", () => {
  const notification = buildMcpTestNotification({
    mode: "tester",
    email: "not-an-email\nBearer secret",
    customHeaderCount: 2,
    report: {
      ...report,
      endpoint: { origin: "https://example.com", pathname: "/mcp", queryPresent: true },
    },
  });
  const serialized = JSON.stringify(notification);
  assert.doesNotMatch(serialized, /Bearer secret|token=|api_key=/i);
  assert.equal(notification.email, undefined);
  assert.equal(notification.custom_headers_supplied, 2);
});

test("all three public tool modes identify themselves in the notification", () => {
  const expected = {
    tester: "MCP Server Tester",
    health: "MCP Health Check",
    inspector: "MCP Inspector",
  } as const;
  for (const [mode, label] of Object.entries(expected)) {
    const notification = buildMcpTestNotification({ mode: mode as keyof typeof expected, customHeaderCount: 0, report });
    assert.equal(notification.tool, label);
    assert.match(String(notification.from_name), new RegExp(label));
  }
});
