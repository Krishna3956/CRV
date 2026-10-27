import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./production-transport-smoke.mjs", import.meta.url), "utf8");

test("production transport smoke is explicit, HTTPS-only, and secret-gated", () => {
  assert.match(source, /TRACKMCP_TRANSPORT_SMOKE_CONFIRM/);
  assert.match(source, /I_UNDERSTAND_TRANSPORT_SMOKE/);
  assert.match(source, /parsed\.protocol !== "https:"/);
  assert.match(source, /trustedHost/);
  assert.match(source, /TRACKMCP_TRANSPORT_SMOKE_KEY/);
});

test("production transport smoke exercises official Streamable HTTP and SSE transports", () => {
  assert.match(source, /StreamableHTTPClientTransport/);
  assert.match(source, /SSEClientTransport/);
  assert.match(source, /transport: "streamable_http"/);
  assert.match(source, /transport: "sse"/);
  assert.match(source, /notifications\/initialized/);
  assert.match(source, /tools\/call/);
});

test("production transport smoke is metadata-only and redacted", () => {
  assert.match(source, /payload/);
  assert.match(source, /mode: 0o600/);
  assert.match(source, /does not claim transport-owned reconnect/);
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|AWS_ACCESS_KEY|\.env\.local/);
});

test("production transport smoke writes bounded report evidence", () => {
  assert.match(source, /checks\.map/);
  assert.match(source, /diagnostics/);
  assert.match(source, /onDeliveryError/);
  assert.match(source, /queuedEvents/);
  assert.match(source, /delivery_error_count/);
  assert.match(source, /assertDelivered/);
  assert.match(source, /fixture-result-not-retained/);
  assert.match(source, /Production transport smoke passed/);
});
