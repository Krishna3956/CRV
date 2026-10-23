import assert from "node:assert/strict";
import test from "node:test";
import { deviceStateCopy } from "./device-auth-ui.ts";

test("every terminal device state has bounded recovery copy", () => {
  const expected = {
    invalid: "That device code is not valid",
    expired: "This device session expired",
    denied: "Device access was not approved",
    already_redeemed: "This device session was already used",
    already_approved: "This device session is already approved",
    approved: "Device approved",
  } as const;
  for (const [status, title] of Object.entries(expected)) {
    const copy = deviceStateCopy(status as keyof typeof expected);
    assert.equal(copy.title, title);
    assert.ok(copy.detail.length > 0);
    assert.doesNotMatch(`${copy.title} ${copy.detail}`, /api[_-]?key|device[_-]?code|redemption[_-]?id/i);
  }
});

test("denied state preserves only a caller-safe unavailable message", () => {
  const copy = deviceStateCopy("denied", "The device authorization service is temporarily unavailable. Please try again shortly.");
  assert.equal(copy.detail, "The device authorization service is temporarily unavailable. Please try again shortly.");
});
