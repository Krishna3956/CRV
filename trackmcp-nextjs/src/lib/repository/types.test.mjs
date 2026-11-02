import assert from "node:assert/strict";
import test from "node:test";
import { formatMcpName, inferCategory, normalizeCategory } from "./types.ts";

test("formats MCP names for customer-facing copy", () => {
  assert.equal(formatMcpName("metabrain"), "MetaBrain");
  assert.equal(formatMcpName("Noodle-MCP"), "Noodle MCP");
  assert.equal(formatMcpName("eth-mcp"), "ETH MCP");
  assert.equal(formatMcpName("mcpServer"), "MCP Server");
  assert.equal(formatMcpName("ethMcp"), "ETH MCP");
  assert.equal(formatMcpName("my_mcp_v2"), "My MCP V2");
  assert.equal(formatMcpName("MetaBrain"), "MetaBrain");
});

test("normalizes legacy categories and infers useful display categories", () => {
  assert.equal(normalizeCategory("Other"), "Others");
  assert.equal(normalizeCategory("AI & ML"), "AI & Machine Learning");
  assert.equal(inferCategory({ category: "Other", repo_name: "zernio-python", language: "Python", topics: ["agent"] }), "AI & Machine Learning");
});
