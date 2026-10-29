import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const script = await readFile(new URL("./apprunner-deploy.sh", import.meta.url), "utf8");
const template = await readFile(new URL("./env.deploy.template", import.meta.url), "utf8");
const readme = await readFile(new URL("./README.md", import.meta.url), "utf8");
const dockerfile = await readFile(new URL("../Dockerfile", import.meta.url), "utf8");

test("deployment guide names the standalone server the container actually runs", () => {
  assert.match(dockerfile, /node server\.js/);
  assert.match(dockerfile, /ENV TRACKMCP_ENABLE_REFRESH_JOBS=true/);
  assert.match(readme, /standalone `server\.js`/);
  assert.doesNotMatch(readme, /standard `next start` server/);
});

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

test("translation provider wiring is opt-in and secret-backed", () => {
  assert.match(template, /TRANSLATION_PROVIDER=""/);
  assert.match(template, /TRANSLATION_ENABLE_MACHINE_TRANSLATION="false"/);
  assert.match(script, /TRANSLATION_PROVIDER must be empty, deepl, or google/);
  assert.match(script, /TRANSLATION_ENABLE_MACHINE_TRANSLATION must be true or false/);
  assert.match(script, /provider == "deepl"/);
  assert.match(script, /DEEPL_API_KEY.*secrets_arn/);
  assert.match(script, /provider == "google"/);
  assert.match(script, /GOOGLE_TRANSLATE_API_KEY.*secrets_arn/);
  assert.doesNotMatch(script, /DEEPL_API_KEY="/);
  assert.doesNotMatch(script, /GOOGLE_TRANSLATE_API_KEY="/);
});
