import assert from "node:assert/strict";
import { test } from "node:test";
import { redemptionAction } from "./redemption-state.ts";

test("same redemption id recovers a redeeming session after a lost finalization", () => {
  assert.equal(redemptionAction("redeeming", true), "recover");
});

test("a different redemption id cannot recover a redeeming session", () => {
  assert.equal(redemptionAction("redeeming", false), "already_redeemed");
});

test("same redemption id recovers a finalized session", () => {
  assert.equal(redemptionAction("redeemed", true), "recover");
});

test("a different redemption id cannot replay a finalized session", () => {
  assert.equal(redemptionAction("redeemed", false), "already_redeemed");
});

test("approved and pending sessions can begin redemption only once", () => {
  assert.equal(redemptionAction("approved", false), "new");
  assert.equal(redemptionAction("pending", false), "new");
});
