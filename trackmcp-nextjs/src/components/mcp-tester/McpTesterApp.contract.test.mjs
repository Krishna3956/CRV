import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const app = await readFile(resolve(root, "src/components/mcp-tester/McpTesterApp.tsx"), "utf8");

test("tester UI invokes only the browser-injected fetch and engine", () => {
  assert.match(app, /runMcpTester\(/);
  assert.match(app, /fetch:\s*window\.fetch\.bind\(window\)/);
  assert.match(app, /new AbortController\(\)/);
  assert.match(app, /onProgress:/);
  assert.match(app, /30-second maximum/);
  assert.doesNotMatch(app, /globalThis\.fetch/);
  assert.doesNotMatch(app, /dangerouslySetInnerHTML|innerHTML/);
});

test("remote report fields are rendered as text, never as navigation targets", () => {
  assert.doesNotMatch(app, /href=\{[^}]*report/);
  assert.doesNotMatch(app, /window\.location|location\.assign|location\.href/);
  assert.match(app, /report\.verdictMessage/);
  assert.match(app, /finding\.message/);
  assert.match(app, /event\.details/);
  assert.match(app, /phaseDetail\(/);
});

test("sensitive form state is cleared after completion and cancellation is exposed", () => {
  assert.match(app, /setHeaders\(EMPTY_HEADERS\)/);
  assert.match(app, /controllerRef\.current\?\.abort\(\)/);
  assert.match(app, /Cancel test/);
  assert.match(app, /Test another server/);
});

test("completed tests send a sanitized notification with optional tester identity", () => {
  assert.match(app, /sendMcpTestNotification\(/);
  assert.match(app, /email: testerEmail/);
  assert.match(app, /customHeaderCount/);
  assert.match(app, /id=\"tester-email\"/);
  assert.match(app, /Your email for test follow-up/);
});

test("the report exposes timestamped evidence, bounded timing, response size, and monitoring CTA", () => {
  assert.match(app, /Observed during this test at/);
  assert.match(app, /report\.observedAt/);
  assert.match(app, /Response data/);
  assert.match(app, /body_bytes/);
  assert.match(app, /Monitor continuously with TrackMCP/);
});
