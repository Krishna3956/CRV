import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/repository/supabase";

export async function POST(request: Request) {
  let body: { email?: unknown } = {};
  try {
    const raw = await request.arrayBuffer();
    if (raw.byteLength > 1024) return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
    const parsed: unknown = JSON.parse(new TextDecoder().decode(raw));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    body = parsed as typeof body;
  } catch {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Account service is not configured." }, { status: 503 });

  let page = 1;
  let exists = false;
  while (page <= 100) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return NextResponse.json({ error: "Could not check this email." }, { status: 500 });
    exists = data.users.some((user) => user.email?.trim().toLowerCase() === email);
    if (exists || data.users.length < 1000) break;
    page += 1;
  }

  return NextResponse.json(
    { exists },
    { headers: { "Cache-Control": "no-store" } },
  );
}
