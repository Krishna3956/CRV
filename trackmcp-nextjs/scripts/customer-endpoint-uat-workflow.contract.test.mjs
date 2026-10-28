import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(new URL("../../.github/workflows/customer-endpoint-uat.yml", import.meta.url), "utf8");

test("customer endpoint UAT is manual-only and least-privilege", () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /permissions:\s+contents: read/);
  assert.match(workflow, /TRACKMCP_CUSTOMER_ENDPOINT_UAT_CONFIRM/);
  assert.match(workflow, /TRACKMCP_CUSTOMER_ENDPOINT_UAT_KEY/);
  assert.match(workflow, /TRACKMCP_CUSTOMER_ENDPOINT_UAT_AUTH_TOKEN/);
  assert.doesNotMatch(workflow, /schedule:/);
  assert.doesNotMatch(workflow, /SUPABASE_SERVICE_ROLE_KEY|AWS_ACCESS_KEY/);
});

test("customer endpoint UAT installs the SDK and uploads only the redacted report", () => {
  assert.match(workflow, /npm ci --prefix packages\/typescript-sdk/);
  assert.match(workflow, /customer-endpoint-uat\.mjs/);
  assert.match(workflow, /Upload redacted UAT evidence/);
  assert.match(workflow, /trackmcp-customer-endpoint-uat\.json/);
  assert.doesNotMatch(workflow, /TRACKMCP_CUSTOMER_ENDPOINT_UAT_ALLOW_PRIVATE/);
});

test("customer endpoint UAT is explicit about transport and protocol version", () => {
  assert.match(workflow, /type: choice/);
  assert.match(workflow, /streamable_http/);
  assert.match(workflow, /2025-06-18/);
  assert.match(workflow, /2026-07-28/);
  assert.match(workflow, /i95pzq2xh7\.ap-south-1\.awsapprunner\.com/);
});
