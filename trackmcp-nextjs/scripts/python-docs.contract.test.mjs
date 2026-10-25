import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pythonDocs = await readFile(new URL("../src/app/docs/python/page.tsx", import.meta.url), "utf8");
const pythonCli = await readFile(new URL("../../packages/python-sdk/trackmcp/cli.py", import.meta.url), "utf8");

test("Python docs state the supported server-boundary coverage without overclaiming", () => {
  assert.match(pythonDocs, /server-side instrumentation/);
  assert.match(pythonDocs, /bounded server-side tool, session, and client observations/);
  assert.match(pythonDocs, /does not inspect a host application/);
  assert.match(pythonDocs, /Python MCP client transports/);
  assert.match(pythonDocs, /from mcp\.server\.fastmcp import FastMCP/);
  assert.doesNotMatch(pythonDocs, /from mcp\.server import server/);
  assert.match(pythonDocs, /transport="stdio"/);
  assert.match(pythonDocs, /streamable_http/);
  assert.match(pythonDocs, /recorded as unknown instead of guessed/);
  assert.match(pythonDocs, /record_transport_failure/);
  assert.match(pythonDocs, /metadata-only session evidence/);
});

test("Python activation metadata does not use a generic client label", () => {
  assert.match(pythonCli, /CLIENT_VERSION = package_version\("trackmcp"\)/);
  assert.match(pythonCli, /"client_version": CLIENT_VERSION/);
  assert.doesNotMatch(pythonCli, /"client_version": "python-sdk"/);
});
