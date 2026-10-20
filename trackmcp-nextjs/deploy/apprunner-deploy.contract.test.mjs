import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const script = await readFile(new URL("./apprunner-deploy.sh", import.meta.url), "utf8");
const template = await readFile(new URL("./env.deploy.template", import.meta.url), "utf8");
const readme = await readFile(new URL("./README.md", import.meta.url), "utf8");

test("App Runner maps required backend runtime secrets without embedding values", () => {
  for (const name of ["GITHUB_TOKEN", "SUPABASE_SERVICE_ROLE_KEY", "TRACKMCP_DEVICE_KEY_DERIVATION_SECRET", "TRACKMCP_ADMIN_KEY"]) {
    assert.ok(script.includes(`"${name}": f"{secrets_arn}:${name}::"`), `${name} must be mapped from the Secrets Manager ARN`);
    assert.match(template, new RegExp(name));
    assert.match(readme, new RegExp(name));
  }
  assert.doesNotMatch(script, /TRACKMCP_DEVICE_KEY_DERIVATION_SECRET":\s*"[^$]/);
  assert.doesNotMatch(script, /TRACKMCP_ADMIN_KEY":\s*"[^$]/);
});

test("pilot deployment fails before AWS work when the runtime secret bundle is absent", () => {
  assert.match(script, /SECRETS_ARN:\?set SECRETS_ARN in \.env\.deploy; the production service requires its runtime secret bundle/);
  assert.match(template, /pilot deployment fails fast if this is blank/i);
  assert.match(readme, /SECRETS_ARN.*required for this production deployment path/i);
});

test("deployment docs distinguish one-time secret mapping from GitHub rollout", () => {
  assert.match(readme, /run the deploy script once after adding the\s+new JSON keys/i);
  assert.match(readme, /start-deployment[\s\S]*only rolls out the already-configured[\s\S]*service/i);
});
