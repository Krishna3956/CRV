/**
 * Review-only policy inputs for privacy deletion planning.
 *
 * This module intentionally makes no database calls and cannot execute a
 * deletion. It gives the future worker a bounded decision contract that must
 * be satisfied before a destructive adapter is even considered.
 */

export const PRIVACY_LEGAL_HOLD_POLICY_VERSION = "2026-10-19.v1";

export type PrivacyLegalHoldInput = {
  request_scope: "workspace" | "account" | "unknown";
  legal_hold: "clear" | "active" | "unknown";
  retention_exception: "none" | "present" | "unknown";
  dependency_review: "clear" | "blocked" | "unknown";
  second_approver_id: string | null;
};

export type PrivacyLegalHoldDecision = {
  eligible: boolean;
  policy_version: string;
  blockers: readonly string[];
};

const OPERATOR_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

/** Return only bounded reasons; never include request content or identities. */
export function evaluatePrivacyLegalHold(input: PrivacyLegalHoldInput): PrivacyLegalHoldDecision {
  const blockers: string[] = [];
  if (input.request_scope !== "workspace") blockers.push("workspace_scope_required");
  if (input.legal_hold !== "clear") blockers.push("legal_hold_not_cleared");
  if (input.retention_exception !== "none") blockers.push("retention_exception_not_cleared");
  if (input.dependency_review !== "clear") blockers.push("dependency_review_not_cleared");
  if (typeof input.second_approver_id !== "string" || !OPERATOR_ID.test(input.second_approver_id)) {
    blockers.push("second_approver_required");
  }
  return { eligible: blockers.length === 0, policy_version: PRIVACY_LEGAL_HOLD_POLICY_VERSION, blockers };
}
