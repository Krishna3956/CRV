import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const handlers = await readFile(new URL("./handlers.ts", import.meta.url), "utf8");
const route = await readFile(new URL("./route.ts", import.meta.url), "utf8");
const state = await readFile(new URL("./setup-state.ts", import.meta.url), "utf8");

test("setup route delegates to a named handler and exposes no write method", () => {
  assert.match(route, /import \{ GET \} from "\.\/handlers\.ts"/);
  assert.match(route, /export \{ GET \}/);
  assert.doesNotMatch(route, /POST|PUT|PATCH|DELETE/);
});

test("setup contract is authenticated, workspace-scoped, bounded, and privacy-safe", () => {
  assert.match(handlers, /trackmcp_api_keys/);
  assert.match(handlers, /service_scope, environment_scope/);
  assert.match(handlers, /connection_key: keyScope/);
  assert.match(handlers, /setupScopeMatch/);
  assert.match(handlers, /scope_match: scopeMatch/);
  assert.match(handlers, /slice\(0, 100\)/);
  assert.match(handlers, /slice\(0, 64\)/);
  assert.match(handlers, /trackmcp_workspace_members/);
  assert.match(handlers, /trackmcp_events/);
  assert.match(handlers, /workspace_id/);
  assert.match(handlers, /Math\.min\(90/);
  assert.match(handlers, /payload_policy/);
  assert.match(handlers, /account_identity_source/);
  assert.match(handlers, /accountResolverObservation\(latest\?\.account_identity_source\)/);
  assert.match(handlers, /deployment_linked/);
  assert.match(handlers, /deployment_id/);
  assert.match(handlers, /service, environment/);
  assert.match(handlers, /service: typeof latest\?\.service/);
  assert.match(handlers, /environment: typeof latest\?\.environment/);
  assert.match(handlers, /business-workflow completion/);
  assert.match(handlers, /next_steps/);
  assert.match(handlers, /TRACKMCP_KEY/);
  assert.match(handlers, /over HTTPS/);
  assert.match(handlers, /ingestion_lag_seconds/);
  assert.match(handlers, /7_776_000/);
  assert.match(handlers, /cache-control.*no-store/);
  assert.doesNotMatch(handlers, /api_key.*response|key_value|raw_payload/i);
});

test("setup state vocabulary distinguishes key and first-event states", () => {
  assert.match(state, /"server_created"/);
  assert.match(state, /"waiting_for_first_event"/);
  assert.match(state, /"connected_limited_coverage"/);
  assert.match(state, /"connected"/);
  assert.match(handlers, /setupConnectionState/);
});
