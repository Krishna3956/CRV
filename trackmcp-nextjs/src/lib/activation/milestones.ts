import type { SupabaseClient } from "@supabase/supabase-js";

type AcceptedEvent = {
  event_type: string;
  sdk_version?: string | null;
  service: string;
  environment: string;
  observation_source?: string | null;
};

const knownMilestones = new Set<string>();
const MAX_KNOWN_MILESTONES = 10_000;

export async function recordFirstAcceptedIngest(
  admin: SupabaseClient,
  workspaceId: string,
  keyId: string,
  event: AcceptedEvent,
): Promise<{ error: { message: string; code?: string } | null }> {
  const cacheKey = `${workspaceId}:${keyId}`;
  if (knownMilestones.has(cacheKey)) return { error: null };
  const result = await admin.from("trackmcp_activation_milestones").insert({
    workspace_id: workspaceId,
    key_id: keyId,
    first_accepted_at: new Date().toISOString(),
    sdk_version: event.sdk_version || null,
    service: event.service.slice(0, 128),
    environment: event.environment.slice(0, 64),
    event_type: event.event_type,
    observation_source: event.observation_source || "legacy_unknown",
  });
  if (!result.error || result.error.code === "23505") {
    if (knownMilestones.size >= MAX_KNOWN_MILESTONES) knownMilestones.delete(knownMilestones.values().next().value as string);
    knownMilestones.add(cacheKey);
    return { error: null };
  }
  return { error: { message: result.error.message, code: result.error.code } };
}
