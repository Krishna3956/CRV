import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server.js";
import { getSupabaseAdmin } from "../../../../../lib/repository/supabase.ts";
import { runAlertsWorker } from "../../../../../lib/alerts/worker.ts";

export const runtime = "nodejs";
export const maxDuration = 60;

function validWorkerToken(request: Request): boolean {
  const expected = process.env.TRACKMCP_ALERT_WORKER_TOKEN;
  const provided = request.headers.get("x-trackmcp-worker-token") || "";
  if (!expected || !provided) return false;
  const expectedBytes = Buffer.from(expected, "utf8");
  const providedBytes = Buffer.from(provided, "utf8");
  return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes);
}

export async function POST(request: Request) {
  if (!validWorkerToken(request)) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Alert worker is not configured." }, { status: 503 });
  const result = await runAlertsWorker(admin as unknown as Parameters<typeof runAlertsWorker>[0]);
  return NextResponse.json({ state: result.state, configurations: result.configurations, incidents: result.incidents, deliveries: result.deliveries, skipped: result.skipped, error_code: result.error_code }, { status: result.state === "failed" ? 503 : 200 });
}
