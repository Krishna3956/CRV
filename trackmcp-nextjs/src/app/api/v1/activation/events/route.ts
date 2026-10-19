import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/auth/supabase-server";
import { getSupabaseAdmin } from "@/lib/repository/supabase";
import { consumeRateLimit } from "@/lib/cli/rate-limit";
import { validateActivationEventBody } from "@/lib/activation/event-contract";

const MAX_EVENT_BODY_BYTES = 16 * 1024;

async function readBoundedBody(request: Request): Promise<{ body: Record<string, unknown> } | { tooLarge: true } | { invalid: true }> {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_EVENT_BODY_BYTES) return { tooLarge: true };
  const reader = request.body?.getReader();
  if (!reader) return { invalid: true };
  const decoder = new TextDecoder();
  let total = 0;
  let text = "";
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      total += chunk.value.byteLength;
      if (total > MAX_EVENT_BODY_BYTES) {
        await reader.cancel();
        return { tooLarge: true };
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { invalid: true };
    return { body: parsed as Record<string, unknown> };
  } catch {
    return { invalid: true };
  }
}

export async function POST(request: Request) {
  const auth = await getSupabaseServer();
  const { data: authData, error: authError } = await auth.auth.getUser();
  if (authError || !authData.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!consumeRateLimit(`activation-event:${authData.user.id}`, 120, 60_000)) return NextResponse.json({ error: "Too many activation events." }, { status: 429, headers: { "retry-after": "60" } });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Activation events are not configured." }, { status: 503 });
  const parsedBody = await readBoundedBody(request);
  if ("tooLarge" in parsedBody) return NextResponse.json({ error: "Activation event is too large." }, { status: 413 });
  if ("invalid" in parsedBody) return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  const event = validateActivationEventBody(parsedBody.body);
  if (!event) return NextResponse.json({ error: "Invalid activation event." }, { status: 400 });
  const { eventId, eventType, source, workspaceId, packageName, packageVersion, contentPath, resultCategory } = event;
  if (workspaceId) {
    const membership = await admin.from("trackmcp_workspace_members").select("workspace_id").eq("workspace_id", workspaceId).eq("user_id", authData.user.id).maybeSingle();
    if (membership.error || !membership.data) return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
  }
  const inserted = await admin.from("trackmcp_activation_funnel_events").insert({
    event_id: eventId,
    event_type: eventType,
    source,
    package_name: packageName,
    package_version: packageVersion,
    content_path: contentPath,
    result_category: resultCategory,
    user_id: authData.user.id,
    workspace_id: workspaceId,
  });
  if (inserted.error && inserted.error.code !== "23505") return NextResponse.json({ error: "Could not record activation event." }, { status: 500 });
  return NextResponse.json({ recorded: true }, { status: 202 });
}
