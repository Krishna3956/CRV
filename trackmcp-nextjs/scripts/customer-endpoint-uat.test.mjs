import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./customer-endpoint-uat.mjs", import.meta.url), "utf8");

test("customer endpoint UAT is manual-only and explicitly confirmed", () => {
  assert.match(source, /TRACKMCP_CUSTOMER_ENDPOINT_UAT_CONFIRM/);
  assert.match(source, /I_UNDERSTAND_CUSTOMER_ENDPOINT_UAT/);
  assert.match(source, /TRACKMCP_CUSTOMER_ENDPOINT_UAT_URL/);
  assert.match(source, /TRACKMCP_CUSTOMER_ENDPOINT_UAT_KEY/);
});

test("customer endpoint UAT uses only the reviewed official transports", () => {
  assert.match(source, /StreamableHTTPClientTransport/);
  assert.match(source, /SSEClientTransport/);
  assert.match(source, /transportName !== "streamable_http"/);
  assert.match(source, /transportName !== "sse"/);
  assert.match(source, /redirectPolicy: "same-origin"/);
  assert.match(source, /setProtocolVersion/);
});

test("customer endpoint UAT has SSRF and redirect boundaries", () => {
  assert.match(source, /parsed\.protocol !== "https:"/);
  assert.match(source, /parsed\.username/);
  assert.match(source, /parsed\.search/);
  assert.match(source, /isPrivateHostname/);
  assert.match(source, /TRACKMCP_CUSTOMER_ENDPOINT_UAT_ALLOW_PRIVATE/);
  assert.match(source, /untrusted_ingest_origin/);
});

test("customer endpoint UAT is metadata-only and discovery-only", () => {
  assert.match(source, /TrackMCPClientAdapter/);
  assert.match(source, /listTools/);
  assert.match(source, /listResources/);
  assert.match(source, /listPrompts/);
  assert.doesNotMatch(source, /callTool\(/);
  assert.doesNotMatch(source, /readResource\(/);
  assert.doesNotMatch(source, /getPrompt\(/);
  assert.match(source, /does not discover OAuth providers/);
  assert.match(source, /Reports contain no endpoint path/);
});

test("customer endpoint UAT report is redacted and requires a drained adapter", () => {
  assert.match(source, /mode: 0o600/);
  assert.match(source, /authorization_supplied/);
  assert.match(source, /queued_events/);
  assert.match(source, /delivery_error_count/);
  assert.match(source, /assertClean/);
  assert.match(source, /failure_code/);
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|AWS_ACCESS_KEY|\.env\.local/);
});
