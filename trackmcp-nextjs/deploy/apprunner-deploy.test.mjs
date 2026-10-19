import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const deployScript = await readFile(new URL("./apprunner-deploy.sh", import.meta.url), "utf8");
const deployTemplate = await readFile(new URL("./env.deploy.template", import.meta.url), "utf8");

test("App Runner production memory stays at 4 GB", () => {
  assert.match(deployScript, /"Memory": "4 GB"/);
  assert.doesNotMatch(deployScript, /"Memory": "2 GB"/);
});

test("deployment preserves the opt-in distributed rate-limit setting", () => {
  assert.match(deployScript, /TRACKMCP_RATE_LIMIT_MODE/);
  assert.match(deployScript, /TRACKMCP_TRUST_PROXY/);
  assert.match(deployScript, /RUNTIME_ENV/);
  assert.match(deployTemplate, /TRACKMCP_TRUST_PROXY="false"/);
  assert.match(deployTemplate, /TRACKMCP_ENABLE_FACT_WRITES="false"/);
});

test("deployment wires the refresh worker secret from Secrets Manager", () => {
  assert.match(deployScript, /TRACKMCP_REFRESH_WORKER_SECRET/);
  assert.match(deployScript, /TRACKMCP_PRIVACY_REVIEW_SECRET/);
  assert.match(deployScript, /RuntimeEnvironmentSecrets/);
});

test("deployment fails before AWS calls for incompatible Founder OS configuration", () => {
  assert.match(deployScript, /TRACKMCP_RATE_LIMIT_MODE must be empty, memory, or supabase/);
  assert.match(deployScript, /TRACKMCP_ENABLE_FACT_WRITES must be true or false/);
  assert.match(deployScript, /TRACKMCP_TRUST_PROXY must be true or false/);
  assert.match(deployScript, /SECRETS_ARN is required when distributed rate limits or fact writes are enabled/);
  assert.match(deployScript, /TRACKMCP_RATE_LIMIT_MODE must be explicitly set when fact writes are enabled/);
});
