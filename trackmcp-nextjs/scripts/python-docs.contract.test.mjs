import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pythonDocs = await readFile(new URL("../src/app/docs/python/page.tsx", import.meta.url), "utf8");

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
});
