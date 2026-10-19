import { NextResponse } from "next/server.js";
import { getSupabaseServer } from "../../../../../lib/auth/supabase-server.ts";
import { getSupabaseAdmin } from "../../../../../lib/repository/supabase.ts";
import { normalizeIdempotencyKey, normalizePrivacyRequestType, publicPrivacyRequest } from "../../../../../lib/account/privacy-request.ts";

type Admin = NonNullable<ReturnType<typeof getSupabaseAdmin>>;
type User = { id: string };
type Dependencies = { getUser?: () => Promise<User | null>; getAdmin?: () => Admin | null };

const MAX_PRIVACY_REQUEST_BODY_BYTES = 4096;

async function defaultGetUser(): Promise<User | null> {
  const auth = await getSupabaseServer();
  const { data, error } = await auth.auth.getUser();
  return error ? null : data.user;
}

export function createPrivacyRequestHandlers(deps: Dependencies = {}) {
  const getUser = deps.getUser ?? defaultGetUser;
  const getAdmin = deps.getAdmin ?? getSupabaseAdmin;

  async function POST(request: Request) {
    const user = await getUser();
    const admin = getAdmin();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    if (!admin) return NextResponse.json({ error: "Account service is not configured." }, { status: 503 });
    let body: { request_type?: unknown; idempotency_key?: unknown; workspace_id?: unknown; reason_category?: unknown };
    try {
      const raw = await request.arrayBuffer();
      if (raw.byteLength > MAX_PRIVACY_REQUEST_BODY_BYTES) {
        return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
      }
      const parsed: unknown = JSON.parse(new TextDecoder().decode(raw));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return NextResponse.json({ error: "JSON body must be an object." }, { status: 400 });
      }
      body = parsed as typeof body;
    } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
    const requestType = normalizePrivacyRequestType(body.request_type);
    const idempotencyKey = normalizeIdempotencyKey(body.idempotency_key);
    if (!requestType) return NextResponse.json({ error: "request_type must be delete." }, { status: 400 });
    if (!idempotencyKey) return NextResponse.json({ error: "A valid idempotency_key is required." }, { status: 400 });
    const workspaceId = typeof body.workspace_id === "string" && body.workspace_id.trim() ? body.workspace_id.trim() : null;
    if (workspaceId) {
      const membership = await admin.from("trackmcp_workspace_members").select("workspace_id").eq("user_id", user.id).eq("workspace_id", workspaceId).maybeSingle();
      if (membership.error) return NextResponse.json({ error: "Could not verify workspace access." }, { status: 500 });
      if (!membership.data) return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    }
    const reason = ["user_requested", "privacy_concern", "account_closure", "other"].includes(String(body.reason_category)) ? String(body.reason_category) : "user_requested";
    const existing = await admin.from("trackmcp_privacy_requests").select("id,request_type,status,workspace_id,requested_at,reviewed_at,completed_at").eq("requester_user_id", user.id).eq("idempotency_key", idempotencyKey).maybeSingle();
    if (existing.error) return NextResponse.json({ error: "Could not check existing privacy request." }, { status: 500 });
    if (existing.data) return NextResponse.json({ request: publicPrivacyRequest(existing.data as Record<string, unknown>), idempotent_replay: true });
    const created = await admin.from("trackmcp_privacy_requests").insert({ requester_user_id: user.id, workspace_id: workspaceId, request_type: requestType, idempotency_key: idempotencyKey, reason_category: reason, audit_metadata: { source: "account_privacy_request", contract_version: "2026-10-18.v1" } }).select("id,request_type,status,workspace_id,requested_at,reviewed_at,completed_at").single();
    if (created.error || !created.data) {
      if (created.error?.code === "23505") return NextResponse.json({ error: "A request with this idempotency key already exists." }, { status: 409 });
      return NextResponse.json({ error: "Could not record privacy request." }, { status: 500 });
    }
    return NextResponse.json({ request: publicPrivacyRequest(created.data as Record<string, unknown>), idempotent_replay: false }, { status: 201 });
  }

  async function GET(request: Request) {
    const user = await getUser();
    const admin = getAdmin();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    if (!admin) return NextResponse.json({ error: "Account service is not configured." }, { status: 503 });
    const requestId = new URL(request.url).searchParams.get("request_id");
    if (!requestId || requestId.length > 80) return NextResponse.json({ error: "request_id is required." }, { status: 400 });
    const result = await admin.from("trackmcp_privacy_requests").select("id,request_type,status,workspace_id,requested_at,reviewed_at,completed_at").eq("id", requestId).eq("requester_user_id", user.id).maybeSingle();
    if (result.error) return NextResponse.json({ error: "Could not load privacy request." }, { status: 500 });
    if (!result.data) return NextResponse.json({ error: "Privacy request not found." }, { status: 404 });
    return NextResponse.json({ request: publicPrivacyRequest(result.data as Record<string, unknown>) }, { headers: { "cache-control": "no-store" } });
  }

  return { GET, POST };
}
