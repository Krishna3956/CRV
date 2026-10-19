import { NextResponse } from "next/server.js";
import { authenticateAlertRequest, isAuthResult } from "../../../../../lib/alerts/auth.ts";
import { readBoundedJson } from "../../../../../lib/alerts/http.ts";
import { getSupabaseServer } from "../../../../../lib/auth/supabase-server.ts";
import { getSupabaseAdmin } from "../../../../../lib/repository/supabase.ts";
import { persistTrackMCPActionQueueTransition, transitionTrackMCPActionQueueItem, type TrackMCPActionQueueMutation } from "../../../../../lib/telemetry/action-queue-lifecycle.ts";

type RouteContext = { params: Promise<{ id: string }> };

function parseMutation(body: unknown): TrackMCPActionQueueMutation | { error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body) || typeof (body as { action?: unknown }).action !== "string") return { error: "action is required." };
  const input = body as Record<string, unknown>;
  if (input.action === "acknowledge") return { action: "acknowledge" };
  if (input.action === "snooze" && typeof input.until === "string") return { action: "snooze", until: input.until };
  if (input.action === "resolve") return { action: "resolve", ...(typeof input.note === "string" ? { note: input.note } : {}) };
  return { error: "action must be acknowledge, snooze, or resolve with valid fields." };
}

export function createActionQueueItemHandlers(getAdmin: typeof getSupabaseAdmin = getSupabaseAdmin, getServer: typeof getSupabaseServer = getSupabaseServer) {
  async function PATCH(request: Request, context: RouteContext) {
    const auth = await authenticateAlertRequest(request, getAdmin, getServer);
    if (!isAuthResult(auth)) return auth.response;
    const { id } = await context.params;
    const currentResult = await auth.admin.from("trackmcp_action_queue").select("*").eq("workspace_id", auth.workspaceId).eq("id", id).maybeSingle();
    if (currentResult.error) return NextResponse.json({ error: "Could not load action-queue item." }, { status: 500 });
    if (!currentResult.data) return NextResponse.json({ error: "Action-queue item was not found." }, { status: 404 });
    const body = await readBoundedJson(request);
    if (body && typeof body === "object" && "error" in body && "code" in body) return NextResponse.json({ error: body.error }, { status: body.code === "too_large" ? 413 : 400 });
    const mutation = parseMutation(body);
    if ("error" in mutation) return NextResponse.json(mutation, { status: 400 });
    const transition = transitionTrackMCPActionQueueItem(currentResult.data, mutation, {
      actor_id: auth.actorId || "api-key",
      workspace_id: auth.workspaceId,
      can_manage_action_queue: auth.canManageActionQueue,
    });
    if (!transition.ok) return NextResponse.json({ error: transition.message }, { status: transition.code === "unauthorized" ? 403 : transition.code === "not_found" ? 404 : 400 });
    if (!transition.changed) return NextResponse.json(transition.item);
    const persisted = await persistTrackMCPActionQueueTransition(auth.admin as unknown as Parameters<typeof persistTrackMCPActionQueueTransition>[0], currentResult.data, transition.item);
    if (persisted.conflict) return NextResponse.json({ error: "The item changed; reload and try again." }, { status: 409 });
    if (!persisted.ok || !persisted.data) return NextResponse.json({ error: "Could not update action-queue item." }, { status: 500 });
    return NextResponse.json(persisted.data);
  }

  return { PATCH };
}

export const PATCH = createActionQueueItemHandlers().PATCH;
