import { hashTrackMCPKey } from "@/lib/telemetry/keys";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function lookupCliKey(admin: SupabaseClient, authorization: string) {
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!/^tmcp_[A-Za-z0-9_-]{20,}$/.test(token)) return { token: null, key: null, error: "missing_or_malformed" as const };
  const result = await admin.from("trackmcp_api_keys").select("id, workspace_id, revoked_at").eq("key_hash", hashTrackMCPKey(token)).maybeSingle();
  if (result.error) return { token: null, key: null, error: "lookup_failed" as const };
  return { token: true, key: result.data as { id: string; workspace_id: string; revoked_at: string | null } | null, error: null };
}
