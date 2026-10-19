export const PRIVACY_REQUEST_TYPES = ["delete"] as const;
export type PrivacyRequestType = (typeof PRIVACY_REQUEST_TYPES)[number];

export const PRIVACY_REQUEST_STATUSES = [
  "requested",
  "under_review",
  "approved",
  "rejected",
  "processing",
  "completed",
  "cancelled",
] as const;
export type PrivacyRequestStatus = (typeof PRIVACY_REQUEST_STATUSES)[number];

export const PRIVACY_REVIEW_MUTABLE_STATUSES = [
  "under_review",
  "approved",
  "rejected",
  "processing",
  "cancelled",
] as const;
export type PrivacyReviewMutableStatus = (typeof PRIVACY_REVIEW_MUTABLE_STATUSES)[number];

export const PRIVACY_REQUEST_IDEMPOTENCY_MAX = 128;
export const PRIVACY_REQUEST_NOTE_MAX = 500;

export function normalizePrivacyRequestType(value: unknown): PrivacyRequestType | null {
  return value === "delete" ? "delete" : null;
}

export function normalizePrivacyRequestStatus(value: unknown): PrivacyRequestStatus | null {
  return typeof value === "string" && (PRIVACY_REQUEST_STATUSES as readonly string[]).includes(value)
    ? value as PrivacyRequestStatus
    : null;
}

export function normalizePrivacyReviewStatus(value: unknown): PrivacyReviewMutableStatus | null {
  return typeof value === "string" && (PRIVACY_REVIEW_MUTABLE_STATUSES as readonly string[]).includes(value)
    ? value as PrivacyReviewMutableStatus
    : null;
}

export function normalizeIdempotencyKey(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > PRIVACY_REQUEST_IDEMPOTENCY_MAX) return null;
  if (!/^[A-Za-z0-9._:-]+$/.test(normalized)) return null;
  return normalized;
}

export function canTransitionPrivacyRequest(
  from: PrivacyRequestStatus,
  to: PrivacyRequestStatus,
): boolean {
  const transitions: Record<PrivacyRequestStatus, PrivacyRequestStatus[]> = {
    requested: ["under_review", "cancelled"],
    under_review: ["approved", "rejected", "cancelled"],
    approved: ["processing", "cancelled"],
    rejected: [],
    processing: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };
  return transitions[from]?.includes(to) ?? false;
}

export function publicPrivacyRequest(row: Record<string, unknown>) {
  return {
    id: typeof row.id === "string" ? row.id : null,
    request_type: row.request_type === "delete" ? "delete" : null,
    status: typeof row.status === "string" ? row.status : null,
    workspace_id: typeof row.workspace_id === "string" ? row.workspace_id : null,
    requested_at: typeof row.requested_at === "string" ? row.requested_at : null,
    reviewed_at: typeof row.reviewed_at === "string" ? row.reviewed_at : null,
    completed_at: typeof row.completed_at === "string" ? row.completed_at : null,
    // Never expose reviewer identity, internal notes, idempotency keys, or scope.
  };
}

/** Operator projection: no idempotency material, raw data, or auth identity. */
export function reviewPrivacyRequest(row: Record<string, unknown>) {
  return {
    id: typeof row.id === "string" ? row.id : null,
    request_type: row.request_type === "delete" ? "delete" : null,
    status: normalizePrivacyRequestStatus(row.status),
    workspace_id: typeof row.workspace_id === "string" ? row.workspace_id : null,
    reason_category: typeof row.reason_category === "string" ? row.reason_category : null,
    requested_at: typeof row.requested_at === "string" ? row.requested_at : null,
    reviewed_at: typeof row.reviewed_at === "string" ? row.reviewed_at : null,
    approved_at: typeof row.approved_at === "string" ? row.approved_at : null,
    completed_at: typeof row.completed_at === "string" ? row.completed_at : null,
    cancelled_at: typeof row.cancelled_at === "string" ? row.cancelled_at : null,
    review_note: typeof row.review_note === "string" ? row.review_note : null,
  };
}
