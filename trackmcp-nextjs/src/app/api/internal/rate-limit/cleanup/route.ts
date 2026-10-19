import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/repository/supabase";

function authorized(request: Request): boolean {
  const expected = process.env.TRACKMCP_REFRESH_WORKER_SECRET || "";
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!expected || !provided) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Rate-limit cleanup is not configured." }, { status: 503 });
  let body: { max_age_seconds?: unknown; max_rows?: unknown } = {};
  try {
    const raw = await request.arrayBuffer();
    if (raw.byteLength > 4096) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    const parsed: unknown = JSON.parse(new TextDecoder().decode(raw));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return NextResponse.json({ error: "JSON body must be an object." }, { status: 400 });
    body = parsed as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const maxAge = typeof body.max_age_seconds === "number" && Number.isFinite(body.max_age_seconds) ? Math.floor(body.max_age_seconds) : 86_400;
  const maxRows = typeof body.max_rows === "number" && Number.isFinite(body.max_rows) ? Math.floor(body.max_rows) : 10_000;
  if (maxAge < 3_600 || maxAge > 2_592_000 || maxRows < 1 || maxRows > 10_000) return NextResponse.json({ error: "Cleanup bounds are invalid." }, { status: 400 });
  const result = await admin.rpc("trackmcp_cleanup_rate_limit_buckets", { p_max_age_seconds: maxAge, p_max_rows: maxRows });
  if (result.error) return NextResponse.json({ error: "Could not clean rate-limit buckets." }, { status: 503 });
  const deletedCount = typeof result.data === "number" ? result.data : 0;
  return NextResponse.json({ deleted_count: Math.max(0, Math.min(maxRows, Math.floor(deletedCount))), max_age_seconds: maxAge, max_rows: maxRows }, { headers: { "cache-control": "no-store" } });
}
