import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/repository/supabase";

function matchesSecret(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function boundedDate(value: string | null, fallback: string): string {
  if (!value || value.length > 40 || Number.isNaN(Date.parse(value))) return fallback;
  return new Date(value).toISOString();
}

export async function GET(request: Request) {
  const expected = process.env.TRACKMCP_ADMIN_KEY;
  const provided = request.headers.get("x-trackmcp-admin-key") || "";
  if (!expected || !matchesSecret(provided, expected)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Activation reporting is not configured." }, { status: 503 });
  const url = new URL(request.url);
  const from = boundedDate(url.searchParams.get("from"), new Date(Date.now() - 30 * 86400_000).toISOString());
  const to = boundedDate(url.searchParams.get("to"), new Date().toISOString());
  const report = await admin.rpc("trackmcp_activation_funnel_report", { p_from: from, p_to: to });
  if (report.error || !report.data || typeof report.data !== "object" || Array.isArray(report.data)) return NextResponse.json({ error: "Could not load activation report." }, { status: 500 });
  return NextResponse.json({
    ...report.data,
    range: { from, to },
    npm_downloads: { value: null, label: "aggregate downloads; not unique users" },
  }, { headers: { "cache-control": "no-store" } });
}
