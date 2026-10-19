import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server.js";
import { getSupabaseAdmin } from "../../../../../lib/repository/supabase.ts";
import {
  canTransitionPrivacyRequest,
  normalizePrivacyRequestStatus,
  normalizePrivacyReviewStatus,
  reviewPrivacyRequest,
} from "../../../../../lib/account/privacy-request.ts";

type Admin = NonNullable<ReturnType<typeof getSupabaseAdmin>>;
type Dependencies = { getAdmin?: () => Admin | null; expectedSecret?: string };
const MAX_BODY_BYTES = 4096;
const MAX_LIMIT = 100;

function authorized(request: Request, expected: string): boolean {
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!expected || !provided) return false;
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(provided, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

function boundedId(value: unknown): string | null {
  return typeof value === "string" && /^[0-9a-f-]{1,80}$/i.test(value) ? value : null;
}

async function jsonBody(request: Request): Promise<Record<string, unknown> | null | Response> {
  try {
    const raw = await request.arrayBuffer();
    if (raw.byteLength > MAX_BODY_BYTES) return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
    const parsed: unknown = JSON.parse(new TextDecoder().decode(raw));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return NextResponse.json({ error: "JSON body must be an object." }, { status: 400 });
    return parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
}

export function createPrivacyReviewHandlers(deps: Dependencies = {}) {
  const getAdmin = deps.getAdmin ?? getSupabaseAdmin;
  const expectedSecret = deps.expectedSecret ?? process.env.TRACKMCP_PRIVACY_REVIEW_SECRET ?? "";

  async function GET(request: Request) {
    if (!authorized(request, expectedSecret)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const admin = getAdmin();
    if (!admin) return NextResponse.json({ error: "Privacy review service is not configured." }, { status: 503 });
    const url = new URL(request.url);
    const rawLimit = Number(url.searchParams.get("limit") || 25);
    const limit = Number.isInteger(rawLimit) ? Math.min(MAX_LIMIT, Math.max(1, rawLimit)) : 25;
    const status = url.searchParams.get("status");
    const normalizedStatus = status ? normalizePrivacyRequestStatus(status) : null;
    if (status && !normalizedStatus) return NextResponse.json({ error: "status is invalid." }, { status: 400 });
    let query = admin.from("trackmcp_privacy_requests")
      .select("id,request_type,status,workspace_id,reason_category,requested_at,reviewed_at,approved_at,completed_at,cancelled_at,review_note")
      .order("requested_at", { ascending: true })
      .limit(limit);
    if (normalizedStatus) query = query.eq("status", normalizedStatus);
    const result = await query;
    if (result.error) return NextResponse.json({ error: "Could not load privacy review queue." }, { status: 500 });
    return NextResponse.json({ requests: (result.data || []).map((row: Record<string, unknown>) => reviewPrivacyRequest(row)), limit }, { headers: { "cache-control": "no-store" } });
  }

  async function POST(request: Request) {
    if (!authorized(request, expectedSecret)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const admin = getAdmin();
    if (!admin) return NextResponse.json({ error: "Privacy review service is not configured." }, { status: 503 });
    const parsed = await jsonBody(request);
    if (parsed instanceof Response) return parsed;
    if (!parsed) return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    const requestId = boundedId(parsed.request_id);
    if (parsed.status === "completed") return NextResponse.json({ error: "Completion requires a separately reviewed deletion worker." }, { status: 409 });
    const toStatus = normalizePrivacyReviewStatus(parsed.status);
    if (!requestId || !toStatus) return NextResponse.json({ error: "request_id and a mutable status are required." }, { status: 400 });
    const note = parsed.note === undefined ? null : typeof parsed.note === "string" && parsed.note.trim().length <= 500 ? parsed.note.trim() || null : null;
    if (parsed.note !== undefined && typeof parsed.note !== "string") return NextResponse.json({ error: "note must be a string." }, { status: 400 });
    if (typeof parsed.note === "string" && parsed.note.trim().length > 500) return NextResponse.json({ error: "note is too long." }, { status: 400 });
    const current = await admin.from("trackmcp_privacy_requests")
      .select("id,request_type,status,workspace_id,reason_category,requested_at,reviewed_at,approved_at,completed_at,cancelled_at,review_note")
      .eq("id", requestId)
      .maybeSingle();
    if (current.error) return NextResponse.json({ error: "Could not load privacy request." }, { status: 500 });
    if (!current.data) return NextResponse.json({ error: "Privacy request not found." }, { status: 404 });
    const fromStatus = normalizePrivacyRequestStatus(current.data.status);
    if (!fromStatus || !canTransitionPrivacyRequest(fromStatus, toStatus)) return NextResponse.json({ error: "That privacy request transition is not allowed." }, { status: 409 });
    const now = new Date().toISOString();
    const update: Record<string, unknown> = {
      status: toStatus,
      updated_at: now,
      review_note: note,
      reviewed_at: current.data.reviewed_at || now,
      audit_metadata: { source: "privacy_review_operator", contract_version: "2026-10-19.v1", transition: `${fromStatus}->${toStatus}` },
    };
    if (toStatus === "approved") update.approved_at = now;
    if (toStatus === "cancelled") update.cancelled_at = now;
    const updated = await admin.from("trackmcp_privacy_requests")
      .update(update)
      .eq("id", requestId)
      .eq("status", fromStatus)
      .select("id,request_type,status,workspace_id,reason_category,requested_at,reviewed_at,approved_at,completed_at,cancelled_at,review_note")
      .maybeSingle();
    if (updated.error) return NextResponse.json({ error: "Could not persist privacy request transition." }, { status: 500 });
    if (!updated.data) return NextResponse.json({ error: "Privacy request changed before this transition was saved." }, { status: 409 });
    return NextResponse.json({ request: reviewPrivacyRequest(updated.data as Record<string, unknown>), transitioned: true }, { headers: { "cache-control": "no-store" } });
  }

  return { GET, POST };
}
