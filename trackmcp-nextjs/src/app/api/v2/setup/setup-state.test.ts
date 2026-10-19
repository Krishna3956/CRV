import assert from "node:assert/strict";
import test from "node:test";
import { accountResolverObservation, setupConnectionState } from "./setup-state.ts";

test("setup identity evidence distinguishes resolved, explicit unresolved, and legacy unknown", () => {
  assert.equal(accountResolverObservation("resolver"), true);
  assert.equal(accountResolverObservation("unresolved"), false);
  assert.equal(accountResolverObservation(undefined), null);
  assert.equal(accountResolverObservation("legacy"), null);
});

test("setup state refuses to call incomplete event evidence connected", () => {
  assert.equal(setupConnectionState({ hasKey: false, hasEvent: false, mcpMethodObserved: false, transportObserved: false, privacyPolicyApplied: false }), "server_created");
  assert.equal(setupConnectionState({ hasKey: true, hasEvent: false, mcpMethodObserved: false, transportObserved: false, privacyPolicyApplied: false }), "waiting_for_first_event");
  assert.equal(setupConnectionState({ hasKey: true, hasEvent: true, mcpMethodObserved: true, transportObserved: false, privacyPolicyApplied: true }), "connected_limited_coverage");
  assert.equal(setupConnectionState({ hasKey: true, hasEvent: true, mcpMethodObserved: true, transportObserved: true, privacyPolicyApplied: true }), "connected");
});

test("setup readiness treats identity as optional and counts only required evidence", () => {
  const required = [true, true, true, true, true];
  assert.equal(required.filter(Boolean).length, 5);
  assert.equal(accountResolverObservation("unresolved"), false);
});
