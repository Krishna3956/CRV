import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const matrix = await readFile(new URL("../../docs/FOUNDER-OS-PROTOCOL-MATRIX.md", import.meta.url), "utf8");

test("protocol matrix names every major surface and an explicit status", () => {
  for (const surface of [
    "initialize", "tools/list", "tools/call", "resources/list", "resources/read",
    "prompts/list", "prompts/get", "pagination", "cancellation", "progress",
    "subscriptions", "completions", "sampling", "elicitation", "tasks",
    "streamable HTTP", "stdio", "OAuth / MCP authorization", "OTLP/HTTP JSON", "OTLP/HTTP protobuf", "OTLP/gRPC",
  ]) assert.match(matrix, new RegExp(surface.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), "i"));
  assert.match(matrix, /\| Surface \| Current evidence \| Product status \| Required evidence/);
  assert.match(matrix, /Observed/);
  assert.match(matrix, /Partial/);
  assert.match(matrix, /Deferred/);
  assert.match(matrix, /Unsupported/);
  assert.match(matrix, /external authorization-server integration/i);
  assert.match(matrix, /HTTP\/2 gRPC listener/i);
  assert.match(matrix, /2026-07-28 modern era deprecates/i);
  assert.match(matrix, /legacy server-initiated sampling.*MRTR/i);
});

test("matrix keeps absence separate from success", () => {
  assert.match(matrix, /missing observation is never interpreted as a successful or failed/);
  assert.match(matrix, /unknown.*insufficient evidence/i);
});

test("public protocol docs do not claim the published SDK is a complete v2 client", async () => {
  const docs = await readFile(new URL("../src/app/docs/protocol/page.tsx", import.meta.url), "utf8");
  assert.match(docs, /observability adapter/i);
  assert.match(docs, /not a claim that the SDK implements every modern client lifecycle/i);
  assert.match(docs, /cooperative cancellations/i);
  assert.match(docs, /task creation, notification subscriptions, and result payload retrieval remain outside/i);
  assert.doesNotMatch(docs, /until a v2 SDK adapter is released/i);
});
