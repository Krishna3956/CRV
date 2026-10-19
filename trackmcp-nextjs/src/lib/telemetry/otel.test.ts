import test from "node:test";
import assert from "node:assert/strict";
import { mapOTelSpanToTrackMCPEvent } from "./otel.ts";

test("maps an MCP OTel span into a metadata-only tool event", () => {
  const result = mapOTelSpanToTrackMCPEvent({
    name: "tools/call",
    startTimeUnixNano: "1700000000000000000",
    endTimeUnixNano: "1700000000123000000",
    attributes: {
      "mcp.method.name": "tools/call",
      "gen_ai.tool.name": "search_docs",
      "mcp.transport": "streamable-http",
      "mcp.protocol.version": "2025-06-18",
      "mcp.session.id": "session-1",
      "mcp.request.id": "request-1",
      "mcp.client.name": "fixture-client",
    },
    status: { code: "OK" },
  }, { service: "fixture" });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.event.event_type, "tool_call");
  assert.equal(result.event.tool_name, "search_docs");
  assert.equal(result.event.transport, "streamable_http");
  assert.equal(result.event.duration_ms, 123);
  assert.equal(result.event.payload_policy, "metadata");
  assert.equal("payload" in result.event, false);
});

test("maps OTel error status without copying exception bodies", () => {
  const result = mapOTelSpanToTrackMCPEvent({
    name: "tools/call",
    startTime: new Date("2026-01-01T00:00:00Z"),
    endTime: new Date("2026-01-01T00:00:01Z"),
    attributes: { "mcp.method": "tools/call", "gen_ai.tool.name": "private_tool", "exception.message": "do not retain" },
    status: { code: 2, message: "secret details" },
  }, { service: "fixture" });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.event.success, false);
  assert.equal(result.event.is_error, true);
  assert.equal(JSON.stringify(result.event).includes("secret details"), false);
  assert.equal(JSON.stringify(result.event).includes("do not retain"), false);
});

test("rejects spans without a stable operation and start time", () => {
  assert.equal(mapOTelSpanToTrackMCPEvent({}, { service: "fixture" }).ok, false);
  const result = mapOTelSpanToTrackMCPEvent({ name: "tools/call" }, { service: "fixture" });
  if (result.ok) throw new Error("expected missing_start_time rejection");
  assert.equal(result.reason, "missing_start_time");
});
