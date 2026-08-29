import { getSupabase } from "./supabase";
import { isBlocked } from "./blocked";
import type { McpTool } from "./types";

/* Drop repos that are blocked from the directory (404/invalid/banned). */
function keep(tools: McpTool[]): McpTool[] {
  return tools.filter((t) => !isBlocked(t.repo_name));
}

/* Server-side queries for the MCP directory (ported from the live site's
   db-queries). All read approved + pending tools. Safe when Supabase is not
   configured (return empty / 0). */

const FIELDS =
  "id, repo_name, description, stars, github_url, language, topics, category, last_updated, status, created_at";

export async function getToolCount(): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from("mcp_tools")
    .select("id", { count: "exact", head: true })
    .in("status", ["approved", "pending"]);
  if (error) return 0;
  return count || 0;
}

export async function getTopTools(limit = 300): Promise<McpTool[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("mcp_tools")
    .select(FIELDS)
    .in("status", ["approved", "pending"])
    .order("stars", { ascending: false })
    .limit(limit);
  return keep((data as McpTool[]) || []);
}

export async function getNewestTools(limit = 60): Promise<McpTool[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("mcp_tools")
    .select(FIELDS)
    .in("status", ["approved", "pending"])
    .order("created_at", { ascending: false })
    .limit(limit);
  return keep((data as McpTool[]) || []);
}

export async function getToolByName(name: string): Promise<McpTool | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const decoded = decodeURIComponent(name);
  if (/\.(md|txt)$/i.test(decoded) || ["LICENSE", "CONTRIBUTING", "README"].includes(decoded)) {
    return null;
  }
  if (isBlocked(decoded)) return null;
  const { data } = await supabase
    .from("mcp_tools")
    .select("*")
    .ilike("repo_name", decoded)
    .limit(1)
    .maybeSingle();
  return (data as McpTool) || null;
}

export async function getToolsByCategory(category: string, limit = 300): Promise<McpTool[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("mcp_tools")
    .select(FIELDS)
    .in("status", ["approved", "pending"])
    .eq("category", category)
    .order("stars", { ascending: false })
    .limit(limit);
  return keep((data as McpTool[]) || []);
}

export async function searchToolsQuery(query: string, limit = 200): Promise<McpTool[]> {
  const supabase = getSupabase();
  if (!supabase || !query.trim()) return [];
  const { data } = await supabase
    .from("mcp_tools")
    .select(FIELDS)
    .in("status", ["approved", "pending"])
    .or(`repo_name.ilike.%${query}%,description.ilike.%${query}%`)
    .order("stars", { ascending: false })
    .limit(limit);
  return keep((data as McpTool[]) || []);
}

/* All tool names (for the sitemap). Batched to work around row limits. */
export async function getAllToolNames(max = 6000): Promise<{ name: string; updated: string | null }[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const out: { name: string; updated: string | null }[] = [];
  let offset = 0;
  const batch = 1000;
  while (out.length < max) {
    const { data, error } = await supabase
      .from("mcp_tools")
      .select("repo_name, last_updated")
      .in("status", ["approved", "pending"])
      .order("stars", { ascending: false })
      .range(offset, offset + batch - 1);
    if (error || !data || data.length === 0) break;
    for (const r of data as { repo_name: string | null; last_updated: string | null }[]) {
      if (r.repo_name && !isBlocked(r.repo_name)) out.push({ name: r.repo_name, updated: r.last_updated });
    }
    if (data.length < batch) break;
    offset += batch;
  }
  return out.slice(0, max);
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  const supabase = getSupabase();
  if (!supabase) return {};
  // one row per tool, category only — cheap enough for a few thousand rows
  const { data } = await supabase
    .from("mcp_tools")
    .select("category, repo_name")
    .in("status", ["approved", "pending"])
    .limit(10000);
  const counts: Record<string, number> = {};
  for (const row of (data as { category: string | null; repo_name: string | null }[]) || []) {
    if (isBlocked(row.repo_name)) continue;
    const c = row.category || "Others";
    counts[c] = (counts[c] || 0) + 1;
  }
  return counts;
}

/* Fetch a repo's README markdown server-side (optional GitHub token). */
export async function getReadme(repoPath: string): Promise<string> {
  if (!/^[\w-]+\/[\w.-]+$/.test(repoPath)) return "";
  const headers: HeadersInit = { Accept: "application/vnd.github.v3.raw" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  try {
    const res = await fetch(`https://api.github.com/repos/${repoPath}/readme`, {
      headers,
      next: { revalidate: 21600 },
    });
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  }
}

/* Related tools by language / topic / star similarity (ported heuristic). */
export function relatedTools(tool: McpTool, pool: McpTool[], limit = 6): McpTool[] {
  const topics = new Set((tool.topics || []).map((t) => t.toLowerCase()));
  return pool
    .filter((t) => t.id !== tool.id && t.repo_name && t.github_url)
    .map((t) => {
      let score = 0;
      if (t.language && tool.language && t.language === tool.language) score += 3;
      const overlap = (t.topics || []).filter((x) => topics.has(x.toLowerCase())).length;
      score += overlap * 2;
      if (t.category && tool.category && t.category === tool.category) score += 2;
      const ratio = (t.stars || 0) / Math.max(tool.stars || 1, 1);
      if (ratio >= 0.5 && ratio <= 2) score += 1;
      return { t, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.t);
}
