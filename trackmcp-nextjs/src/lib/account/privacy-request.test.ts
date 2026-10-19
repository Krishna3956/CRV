import test from "node:test";
import assert from "node:assert/strict";
import {
  canTransitionPrivacyRequest,
  normalizeIdempotencyKey,
  normalizePrivacyRequestType,
  publicPrivacyRequest,
} from "./privacy-request.ts";

test("privacy requests accept only the deletion request type", () => {
  assert.equal(normalizePrivacyRequestType("delete"), "delete");
  assert.equal(normalizePrivacyRequestType("export"), null);
  assert.equal(normalizePrivacyRequestType("DELETE"), null);
});

test("idempotency keys are bounded and constrained", () => {
  assert.equal(normalizeIdempotencyKey(" request-123 "), "request-123");
  assert.equal(normalizeIdempotencyKey("bad key"), null);
  assert.equal(normalizeIdempotencyKey("x".repeat(129)), null);
});

test("privacy lifecycle disallows skipping review or reopening terminal states", () => {
  assert.equal(canTransitionPrivacyRequest("requested", "under_review"), true);
  assert.equal(canTransitionPrivacyRequest("under_review", "approved"), true);
  assert.equal(canTransitionPrivacyRequest("requested", "processing"), false);
  assert.equal(canTransitionPrivacyRequest("completed", "processing"), false);
});

test("public projection does not expose audit or idempotency material", () => {
  const result = publicPrivacyRequest({
    id: "r1", request_type: "delete", status: "requested", workspace_id: "w1",
    requested_at: "2026-10-18T00:00:00Z", idempotency_key: "secret",
    reviewer_user_id: "reviewer", internal_note: "sensitive",
  });
  assert.deepEqual(result, {
    id: "r1", request_type: "delete", status: "requested", workspace_id: "w1",
    requested_at: "2026-10-18T00:00:00Z", reviewed_at: null, completed_at: null,
  });
  assert.equal("idempotency_key" in result, false);
});
