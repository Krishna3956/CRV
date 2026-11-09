import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/repository/supabase";
import { toolSlug } from "@/lib/repository/types";

const SAFE_FIELDS = ["repo_name", "description", "topics", "language", "category", "meta_description", "status"] as const;
const SAFE_SELECT = "id,repo_name,description,github_url,topics,language,category,meta_description,status,updated_at";
const VALID_STATUSES = new Set(["pending", "approved", "archived"]);
const MAX_BODY_BYTES = 16 * 1024;

type SafeField = (typeof SAFE_FIELDS)[number];
type ListingChanges = Partial<Record<SafeField, string | string[] | null>>;

function isAuthorized(req: Request): boolean {
  const expected = process.env.TRACKMCP_ADMIN_KEY;
  const provided = req.headers.get("x-trackmcp-admin-key") || "";
  if (!expected || !provided) return false;
  const expectedBytes = Buffer.from(expected, "utf8");
  const providedBytes = Buffer.from(provided, "utf8");
  return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateChanges(value: unknown): { changes?: ListingChanges; error?: string } {
  if (!isPlainObject(value)) return { error: "changes must be an object." };
  const keys = Object.keys(value);
  if (!keys.length) return { error: "At least one listing field must be changed." };
  const unknown = keys.filter((key) => !(SAFE_FIELDS as readonly string[]).includes(key));
  if (unknown.length) return { error: `Unsupported listing field: ${unknown[0]}.` };

  const changes: ListingChanges = {};
  for (const key of keys as SafeField[]) {
    const next = value[key];
    if (["repo_name", "description", "language", "category", "meta_description", "status"].includes(key)) {
      if (next !== null && typeof next !== "string") return { error: `${key} must be a string or null.` };
      if (typeof next === "string" && next.length > (key === "description" ? 12000 : key === "meta_description" ? 320 : 256)) {
        return { error: `${key} is too long.` };
      }
      if (key === "status" && typeof next === "string" && !VALID_STATUSES.has(next)) {
        return { error: "status must be pending, approved, or archived." };
      }
      changes[key] = next as string | null;
      continue;
    }
    if (key === "topics") {
      if (!Array.isArray(next) || next.length > 50 || next.some((topic) => typeof topic !== "string" || topic.length > 64)) {
        return { error: "topics must be an array of at most 50 short strings." };
      }
      changes.topics = next as string[];
    }
  }
  return { changes };
}

function safeSnapshot(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(["id", "repo_name", "description", "github_url", "topics", "language", "category", "meta_description", "status", "updated_at"].map((key) => [key, row[key] ?? null]));
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "cache-control": "no-store" } });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return jsonError("Not authorized.", 401);
  const supabase = getSupabaseAdmin();
  if (!supabase) return jsonError("Admin service is not configured.", 503);

  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return jsonError("A valid listing id is required.", 400);
  }

  let body: { changes?: unknown; expected_updated_at?: unknown; reason?: unknown };
  try {
    const raw = await req.arrayBuffer();
    if (raw.byteLength > MAX_BODY_BYTES) return jsonError("Request is too large.", 413);
    const parsed = JSON.parse(new TextDecoder().decode(raw));
    if (!isPlainObject(parsed)) return jsonError("Invalid JSON.", 400);
    body = parsed as typeof body;
  } catch {
    return jsonError("Invalid JSON.", 400);
  }

  if (typeof body.expected_updated_at !== "string" || !body.expected_updated_at.trim()) {
    return jsonError("expected_updated_at is required for concurrency protection.", 400);
  }
  if (typeof body.reason !== "string" || !body.reason.trim() || body.reason.length > 500) {
    return jsonError("A concise reason is required.", 400);
  }
  const validation = validateChanges(body.changes);
  if (validation.error || !validation.changes) return jsonError(validation.error || "Invalid changes.", 400);

  const { data: current, error: readError } = await supabase.from("mcp_tools").select(SAFE_SELECT).eq("id", id).maybeSingle();
  if (readError) {
    console.error("Listing read failed", readError);
    return jsonError("Could not read the listing.", 500);
  }
  if (!current) return jsonError("Listing not found.", 404);
  if (current.updated_at !== body.expected_updated_at) return jsonError("The listing changed. Read it again before updating.", 409);

  const before = safeSnapshot(current as Record<string, unknown>);
  const update = { ...validation.changes, updated_at: new Date().toISOString() };
  const { data: updated, error: updateError } = await supabase
    .from("mcp_tools")
    .update(update)
    .eq("id", id)
    .eq("updated_at", body.expected_updated_at)
    .select(SAFE_SELECT)
    .maybeSingle();
  if (updateError) {
    console.error("Listing update failed", updateError);
    return jsonError("Could not update the listing.", 500);
  }
  if (!updated) return jsonError("The listing changed. Read it again before updating.", 409);

  const after = safeSnapshot(updated as Record<string, unknown>);
  const actor = (req.headers.get("x-trackmcp-operator") || "trackmcp-admin").trim().slice(0, 128) || "trackmcp-admin";
  const action = validation.changes.status === "archived" ? "archive" : validation.changes.status === "approved" && current.status === "archived" ? "restore" : "update";
  const { error: auditError } = await supabase.from("mcp_tool_listing_audits").insert({
    tool_id: id,
    actor,
    action,
    reason: body.reason.trim(),
    before_data: before,
    after_data: after,
  });
  if (auditError) {
    const rollback = Object.fromEntries(Object.keys(validation.changes).map((key) => [key, current[key as keyof typeof current]]));
    const { error: rollbackError } = await supabase.from("mcp_tools").update({ ...rollback, updated_at: body.expected_updated_at }).eq("id", id).eq("updated_at", updated.updated_at);
    if (rollbackError) {
      console.error("Listing audit failed and rollback could not be confirmed", rollbackError);
      return jsonError("The listing update needs manual review because its audit could not be recorded.", 500);
    }
    console.error("Listing audit failed; update rolled back", auditError);
    return jsonError("Could not record the listing audit, so the update was rolled back.", 500);
  }

  const slug = toolSlug(updated.github_url, updated.repo_name || "tool");
  revalidatePath(`/tool/${slug}`);
  revalidatePath("/tool/[name]", "page");
  revalidatePath("/repository", "page");
  revalidatePath("/new", "page");
  revalidatePath("/tool-sitemap.xml");
  revalidatePath("/tool-sitemap/[shard]", "page");
  revalidateTag("repository-tools", "max");

  return NextResponse.json({ tool: after, action }, { headers: { "cache-control": "no-store" } });
}
