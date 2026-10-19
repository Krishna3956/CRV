/**
 * Human lifecycle for Founder OS action-queue signals.
 *
 * This module is deliberately a pure policy boundary. It does not talk to
 * Supabase and it never changes evidence; callers must authorize the actor and
 * persist the returned patch through a workspace-scoped repository.
 */

export type TrackMCPActionQueueStatus = "open" | "acknowledged" | "snoozed" | "resolved";

export type TrackMCPActionQueueItem = {
  id: string;
  workspace_id: string;
  status: TrackMCPActionQueueStatus;
  acknowledged_at?: string | null;
  acknowledged_by?: string | null;
  snoozed_at?: string | null;
  snoozed_until?: string | null;
  snoozed_by?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  resolution_note?: string | null;
  revision: number;
};

export type TrackMCPActionQueueMutation =
  | { action: "acknowledge" }
  | { action: "snooze"; until: string }
  | { action: "resolve"; note?: string };

export type TrackMCPActionQueueActor = {
  actor_id: string;
  workspace_id: string;
  /** Set only after the caller has checked authenticated membership/role. */
  can_manage_action_queue: boolean;
};

export type TrackMCPActionQueueLifecycleResult =
  | { ok: true; item: TrackMCPActionQueueItem; changed: boolean }
  | { ok: false; code: "unauthorized" | "not_found" | "invalid_transition" | "invalid_input"; message: string };

const MAX_NOTE_LENGTH = 500;
const MAX_SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;

function boundedId(value: string): boolean {
  return value.length > 0 && value.length <= 200 && !/[\r\n]/.test(value);
}

function validIso(value: string): number | null {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function canTransition(status: TrackMCPActionQueueStatus, action: TrackMCPActionQueueMutation["action"]): boolean {
  if (action === "acknowledge") return status !== "resolved";
  if (action === "snooze") return status !== "resolved";
  return status !== "resolved";
}

/**
 * Validate authorization and calculate an auditable lifecycle patch. The
 * operation is idempotent for the same status, but every actual mutation
 * increments revision so concurrent writers can use optimistic locking.
 */
export function transitionTrackMCPActionQueueItem(
  current: TrackMCPActionQueueItem | null,
  mutation: TrackMCPActionQueueMutation,
  actor: TrackMCPActionQueueActor,
  now = new Date(),
): TrackMCPActionQueueLifecycleResult {
  if (!current) return { ok: false, code: "not_found", message: "Action-queue item was not found." };
  if (!boundedId(actor.actor_id) || !boundedId(actor.workspace_id) || actor.workspace_id !== current.workspace_id || !actor.can_manage_action_queue) {
    return { ok: false, code: "unauthorized", message: "The actor cannot manage this workspace action-queue item." };
  }
  if (!boundedId(current.id) || !Number.isInteger(current.revision) || current.revision < 0) {
    return { ok: false, code: "invalid_input", message: "The action-queue item is malformed." };
  }
  if (!canTransition(current.status, mutation.action)) {
    return { ok: false, code: "invalid_transition", message: "Resolved action-queue items cannot be changed." };
  }
  const nowIso = now.toISOString();
  let patch: Partial<TrackMCPActionQueueItem>;
  if (mutation.action === "acknowledge") {
    if (current.status === "acknowledged") return { ok: true, item: current, changed: false };
    patch = { status: "acknowledged", acknowledged_at: current.acknowledged_at || nowIso, acknowledged_by: current.acknowledged_by || actor.actor_id, snoozed_until: null };
  } else if (mutation.action === "snooze") {
    const until = validIso(mutation.until);
    const nowMs = now.getTime();
    if (until === null || until <= nowMs || until > nowMs + MAX_SNOOZE_MS) return { ok: false, code: "invalid_input", message: "Snooze time must be in the future and within 30 days." };
    if (current.status === "snoozed" && current.snoozed_until === mutation.until) return { ok: true, item: current, changed: false };
    patch = { status: "snoozed", snoozed_at: current.snoozed_at || nowIso, snoozed_until: new Date(until).toISOString(), snoozed_by: current.snoozed_by || actor.actor_id };
  } else {
    const note = mutation.note?.trim() || null;
    if (note && note.length > MAX_NOTE_LENGTH) return { ok: false, code: "invalid_input", message: `Resolution note must be ${MAX_NOTE_LENGTH} characters or fewer.` };
    if (current.status === "resolved") return { ok: true, item: current, changed: false };
    patch = { status: "resolved", resolved_at: current.resolved_at || nowIso, resolved_by: current.resolved_by || actor.actor_id, resolution_note: note };
  }
  const item = { ...current, ...patch, revision: current.revision + 1 };
  return { ok: true, item, changed: true };
}

export const TRACKMCP_ACTION_QUEUE_LIFECYCLE_LIMITS = { max_note_length: MAX_NOTE_LENGTH, max_snooze_days: 30 } as const;

type LifecycleQuery = {
  update(values: Record<string, unknown>): LifecycleQuery;
  eq(field: string, value: unknown): LifecycleQuery;
  select(columns: string): LifecycleQuery;
  maybeSingle(): PromiseLike<{ data: TrackMCPActionQueueItem | null; error: { code?: string; message?: string } | null }>;
};
export type TrackMCPActionQueueLifecycleStore = {
  from(table: "trackmcp_action_queue"): LifecycleQuery;
};

/** Persist only an already-authorized transition with optimistic revision control. */
export async function persistTrackMCPActionQueueTransition(
  store: TrackMCPActionQueueLifecycleStore,
  current: TrackMCPActionQueueItem,
  next: TrackMCPActionQueueItem,
): Promise<{ ok: boolean; conflict: boolean; error: { code?: string; message?: string } | null; data: TrackMCPActionQueueItem | null }> {
  const values = {
    status: next.status,
    acknowledged_at: next.acknowledged_at ?? null,
    acknowledged_by: next.acknowledged_by ?? null,
    snoozed_at: next.snoozed_at ?? null,
    snoozed_until: next.snoozed_until ?? null,
    snoozed_by: next.snoozed_by ?? null,
    resolved_at: next.resolved_at ?? null,
    resolved_by: next.resolved_by ?? null,
    resolution_note: next.resolution_note ?? null,
    revision: next.revision,
    updated_at: new Date().toISOString(),
  };
  const result = await store.from("trackmcp_action_queue").update(values).eq("workspace_id", current.workspace_id).eq("id", current.id).eq("revision", current.revision).select("*").maybeSingle();
  if (result.error) return { ok: false, conflict: false, error: result.error, data: null };
  if (!result.data) return { ok: false, conflict: true, error: null, data: null };
  return { ok: true, conflict: false, error: null, data: result.data };
}
