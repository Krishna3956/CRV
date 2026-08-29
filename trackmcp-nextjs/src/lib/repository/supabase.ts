import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* Supabase client for the MCP directory. Reads the public URL + anon key from
   env. Returns null when they are not configured so the UI can show a graceful
   "not connected" state instead of crashing. The anon key is a publishable
   client key and is safe to expose. */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (!client) client = createClient(url, anonKey);
  return client;
}

export const isRepositoryConfigured = Boolean(url && anonKey);
