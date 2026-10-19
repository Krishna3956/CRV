import { randomUUID, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/repository/supabase";
import { createSupabaseRefreshJobStore } from "@/lib/telemetry/refresh-supabase-store";
import { createRefreshJobHandlers } from "@/lib/telemetry/refresh-handlers";
import { runRefreshJobBatch } from "@/lib/telemetry/refresh-worker";

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
  if (!admin) return NextResponse.json({ error: "Refresh worker is not configured." }, { status: 503 });
  let body: { max_jobs?: unknown } = {};
  try {
    const raw = await request.arrayBuffer();
    if (raw.byteLength > 4096) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    const parsed: unknown = JSON.parse(new TextDecoder().decode(raw));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return NextResponse.json({ error: "JSON body must be an object." }, { status: 400 });
    body = parsed as { max_jobs?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const requested = typeof body.max_jobs === "number" && Number.isFinite(body.max_jobs) ? Math.floor(body.max_jobs) : 10;
  if (requested < 1 || requested > 100) return NextResponse.json({ error: "max_jobs must be between 1 and 100." }, { status: 400 });
  const owner = `http-${randomUUID()}`;
  // Keep the route below the GitHub Actions 55-second curl deadline so a slow
  // handler cannot leave overlapping workers claiming the same queue forever.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const result = await runRefreshJobBatch({ store: createSupabaseRefreshJobStore(admin as never), handlers: createRefreshJobHandlers(admin as never), owner, signal: controller.signal }, { maxJobs: requested, signal: controller.signal });
    // A batch with retryable/failed work must fail the external scheduler. A
    // 200 here would make GitHub Actions mark a degraded run as successful and
    // suppress the next retry even though durable jobs remain unhealthy.
    const hasUnhealthyWork = result.errors.length > 0 || result.retryable > 0 || result.failed > 0 || result.aborted;
    return NextResponse.json({ ...result, owner }, { status: hasUnhealthyWork ? 500 : 200, headers: { "cache-control": "no-store" } });
  } finally {
    clearTimeout(timeout);
  }
}
