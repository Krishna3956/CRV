import assert from "node:assert/strict";
import test from "node:test";
import { evaluatePrivacyLegalHold } from "./privacy-legal-hold.ts";

const clearInput = {
  request_scope: "workspace" as const,
  legal_hold: "clear" as const,
  retention_exception: "none" as const,
  dependency_review: "clear" as const,
  second_approver_id: "operator-2",
};

test("legal-hold policy requires every bounded clearance before eligibility", () => {
  const result = evaluatePrivacyLegalHold(clearInput);
  assert.equal(result.eligible, true);
  assert.deepEqual(result.blockers, []);
  assert.match(result.policy_version, /^2026-/);
});

test("active holds, retention exceptions, dependencies, and missing approval fail closed", () => {
  const result = evaluatePrivacyLegalHold({
    ...clearInput,
    legal_hold: "active",
    retention_exception: "present",
    dependency_review: "blocked",
    second_approver_id: null,
  });
  assert.equal(result.eligible, false);
  assert.deepEqual(result.blockers, [
    "legal_hold_not_cleared",
    "retention_exception_not_cleared",
    "dependency_review_not_cleared",
    "second_approver_required",
  ]);
});

test("unknown or oversized operator identity cannot satisfy second approval", () => {
  const result = evaluatePrivacyLegalHold({ ...clearInput, second_approver_id: "x".repeat(129) });
  assert.equal(result.eligible, false);
  assert.deepEqual(result.blockers, ["second_approver_required"]);
});

test("policy output contains no raw request or operator material", () => {
  const result = evaluatePrivacyLegalHold({ ...clearInput, request_scope: "unknown", second_approver_id: "operator@example.com" });
  assert.equal(result.eligible, false);
  assert.deepEqual(result.blockers, ["workspace_scope_required", "second_approver_required"]);
  assert.equal(JSON.stringify(result).includes("operator@example.com"), false);
});
