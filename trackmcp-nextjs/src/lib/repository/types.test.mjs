import assert from "node:assert/strict";
import test from "node:test";
import { formatMcpName } from "./types.ts";

test("formats MCP names for customer-facing copy", () => {
  assert.equal(formatMcpName("metabrain"), "MetaBrain");
  assert.equal(formatMcpName("Noodle-MCP"), "Noodle MCP");
  assert.equal(formatMcpName("eth-mcp"), "ETH MCP");
  assert.equal(formatMcpName("mcpServer"), "MCP Server");
  assert.equal(formatMcpName("ethMcp"), "ETH MCP");
  assert.equal(formatMcpName("my_mcp_v2"), "My MCP V2");
  assert.equal(formatMcpName("MetaBrain"), "MetaBrain");
});
