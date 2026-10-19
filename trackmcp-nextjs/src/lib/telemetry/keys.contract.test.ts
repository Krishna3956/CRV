import assert from "node:assert/strict";
import { test } from "node:test";
import { createDeterministicTrackMCPKey, getDeviceKeyDerivationSecret } from "./keys.ts";

test("production requires a dedicated device key derivation secret", () => {
  assert.equal(getDeviceKeyDerivationSecret({ NODE_ENV: "production", SUPABASE_SERVICE_ROLE_KEY: "service-role" }), null);
  assert.equal(getDeviceKeyDerivationSecret({ NODE_ENV: "production", TRACKMCP_ALLOW_SERVICE_ROLE_KEY_FALLBACK: "true", SUPABASE_SERVICE_ROLE_KEY: "service-role" }), null);
  assert.equal(getDeviceKeyDerivationSecret({ NODE_ENV: "production", TRACKMCP_DEVICE_KEY_DERIVATION_SECRET: "dedicated" }), "dedicated");
  assert.equal(createDeterministicTrackMCPKey("session", "redemption"), null);
});

test("service-role fallback requires explicit non-production opt-in", () => {
  assert.equal(getDeviceKeyDerivationSecret({ NODE_ENV: "development", SUPABASE_SERVICE_ROLE_KEY: "service-role" }), null);
  assert.equal(getDeviceKeyDerivationSecret({ NODE_ENV: "development", TRACKMCP_ALLOW_SERVICE_ROLE_KEY_FALLBACK: "true", SUPABASE_SERVICE_ROLE_KEY: "service-role" }), "service-role");
  assert.equal(getDeviceKeyDerivationSecret({ NODE_ENV: "test", TRACKMCP_ALLOW_SERVICE_ROLE_KEY_FALLBACK: "true", SUPABASE_SERVICE_ROLE_KEY: "service-role" }), "service-role");
});
