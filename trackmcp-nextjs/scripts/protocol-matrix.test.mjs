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

test("every non-observed protocol row carries an explicit closure boundary", () => {
  const rows = matrix.split("\n").filter((line) => line.startsWith("|") && !line.startsWith("| ---"));
  const gated = rows.filter((line) => /\|\s*(Partial|Deferred|Unsupported)/i.test(line));
  assert.ok(gated.length >= 8, "expected the matrix to retain multiple explicit partial/unsupported boundaries");
  for (const row of gated) {
    const columns = row.split("|").map((value) => value.trim());
    const requiredEvidence = columns.at(-2) || "";
    assert.ok(requiredEvidence.length > 20, `missing required evidence boundary: ${row}`);
    assert.match(requiredEvidence, /before|remain|external|unsupported|UAT|evidence|not claim|complete|add .*lifecycle|add .*vectors/i, `unbounded closure text: ${row}`);
  }
});

test("public protocol docs do not claim the published SDK is a complete v2 client", async () => {
  const docs = await readFile(new URL("../src/app/docs/protocol/page.tsx", import.meta.url), "utf8");
  assert.match(docs, /observability adapter/i);
  assert.match(docs, /not a claim that the SDK implements every modern client lifecycle/i);
  assert.match(docs, /cooperative cancellations/i);
  assert.match(docs, /task creation, notification subscriptions, and result payload retrieval remain outside/i);
  assert.doesNotMatch(docs, /until a v2 SDK adapter is released/i);
});

test("TypeScript docs expose the bounded OAuth outcome helper", async () => {
  const docs = await readFile(new URL("../src/app/docs/typescript/page.tsx", import.meta.url), "utf8");
  assert.match(docs, /oauth-outcome-observer/);
  assert.match(docs, /recordAuthorizationOutcome/);
  assert.match(docs, /401/);
  assert.match(docs, /403/);
  assert.match(docs, /does not discover providers/);
});

test("all SDKs preserve the same bounded OAuth observer boundary", async () => {
  const sources = await Promise.all([
    readFile(new URL("../packages/typescript-sdk/src/client-adapter.ts", import.meta.url), "utf8"),
    readFile(new URL("../../packages/python-sdk/trackmcp/client.py", import.meta.url), "utf8"),
    readFile(new URL("../packages/go-sdk/trackmcp.go", import.meta.url), "utf8"),
    readFile(new URL("../packages/dotnet-sdk/TrackMcp.cs", import.meta.url), "utf8"),
  ]);
  assert.match(sources[0], /authorizationResponseMetadata/);
  assert.match(sources[1], /record_authorization_outcome/);
  assert.match(sources[2], /RecordAuthorizationOutcome/);
  assert.match(sources[3], /RecordAuthorizationOutcome/);
  for (const source of sources) {
    assert.match(source, /unauthorized/);
    assert.match(source, /forbidden/);
    assert.match(source, /401/);
    assert.match(source, /403/);
  }
});
