import { getSupabase } from "./supabase";
import { isBlocked } from "./blocked";
import { githubPathFromToolSlug, inferCategory, normalizeCategory, toolSlug } from "./types";
import type { McpTool } from "./types";
import { unstable_cache, unstable_noStore } from "next/cache";

/* Drop repos that are blocked from the directory (404/invalid/banned). */
function keep(tools: McpTool[]): McpTool[] {
  return tools.filter((t) => !isBlocked(t.repo_name));
}

function withDisplayCategory(tool: McpTool): McpTool {
  return { ...tool, category: inferCategory(tool) };
}

function withDisplayCategories(tools: McpTool[]): McpTool[] {
  return tools.map(withDisplayCategory);
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

/** Strict count for sitemap generation: null means the catalog could not be read. */
export async function getToolCountStrict(): Promise<number | null> {
  const tools = await getCachedSitemapCatalog();
  return tools?.length ?? null;
}

export async function getTopTools(limit = 300): Promise<McpTool[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("mcp_tools")
    .select(FIELDS)
    .in("status", ["approved", "pending"])
    .order("stars", { ascending: false, nullsFirst: false })
    .order("id", { ascending: true })
    .limit(limit);
  return withDisplayCategories(keep((data as McpTool[]) || []));
}

export async function getNewestTools(limit = 60): Promise<McpTool[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("mcp_tools")
    .select(FIELDS)
    .in("status", ["approved", "pending"])
    .order("created_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: true })
    .limit(limit);
  return withDisplayCategories(keep((data as McpTool[]) || []));
}

export async function getToolByName(name: string): Promise<McpTool | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const decoded = decodeURIComponent(name);
  if (/\.(md|txt)$/i.test(decoded) || ["LICENSE", "CONTRIBUTING", "README"].includes(decoded)) {
    return null;
  }
  return getCachedToolByName(decoded);
}

const getCachedToolByName = unstable_cache(
  async (decoded: string): Promise<McpTool | null> => {
    const supabase = getSupabase();
    if (!supabase) return null;

    let data: McpTool | null = null;
    const githubPath = githubPathFromToolSlug(decoded);
    if (githubPath) {
      const githubUrl = `https://github.com/${githubPath.owner}/${githubPath.repo}`;
      const escapedPattern = githubUrl.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
      const result = await supabase
        .from("mcp_tools")
        .select(FIELDS)
        .ilike("github_url", escapedPattern)
        .limit(1)
        .maybeSingle();
      data = (result.data as McpTool) || null;
    }
    if (!data && !isBlocked(decoded)) {
      const result = await supabase
        .from("mcp_tools")
        .select(FIELDS)
        .ilike("repo_name", decoded)
        .limit(1)
        .maybeSingle();
      data = (result.data as McpTool) || null;
    }
    if (!data || isBlocked(data.repo_name)) return null;
    return data;
  },
  ["repository-tool-by-name"],
  { revalidate: 21600, tags: ["repository-tools"] },
);

export async function getToolsByCategory(category: string, limit = 300, offset = 0): Promise<McpTool[]> {
  const supabase = getSupabase();
  if (!supabase || !Number.isInteger(limit) || limit < 1 || !Number.isInteger(offset) || offset < 0) return [];
  const requested = normalizeCategory(category);
  const requestedOffset = offset;
  const matches: McpTool[] = [];
  let skipped = 0;
  const batch = 1000;
  const maxRows = 50000;
  // Imported catalogs contain legacy labels (for example `Other`) and rows
  // without a category. Read deterministically in pages and apply the same
  // display-time classifier used by the category counts so category routes do
  // not return a misleading zero-match page.
  for (let cursor = 0; cursor < maxRows && matches.length < limit; cursor += batch) {
    const { data, error } = await supabase
      .from("mcp_tools")
      .select(FIELDS)
      .in("status", ["approved", "pending"])
      .order("stars", { ascending: false, nullsFirst: false })
      .order("id", { ascending: true })
      .range(cursor, cursor + batch - 1);
    if (error || !data || data.length === 0) break;
    const rows = withDisplayCategories(keep((data as McpTool[]) || []));
    for (const tool of rows) {
      if (tool.category !== requested) continue;
      if (skipped < requestedOffset) {
        skipped += 1;
        continue;
      }
      matches.push(tool);
      if (matches.length >= limit) break;
    }
    if (data.length < batch) break;
  }
  return matches.slice(0, limit);
}

export async function searchToolsQuery(query: string, limit = 200): Promise<McpTool[]> {
  // Search must reflect a just-submitted row even when the repository page was
  // previously rendered from a cached snapshot.
  unstable_noStore();
  const supabase = getSupabase();
  if (!supabase || !query.trim()) return [];
  const escapedQuery = query.trim().replaceAll("%", "\\%").replaceAll("_", "\\_");
  const pattern = `%${escapedQuery}%`;
  // Keep a dedicated repo-name query alongside the broad OR query. This avoids
  // losing exact directory matches when a PostgREST OR expression contains a
  // nullable description or a newly inserted row that is not in the initial
  // popularity snapshot.
  const [repoResult, broadResult] = await Promise.all([
    supabase
      .from("mcp_tools")
      .select(FIELDS)
      .in("status", ["approved", "pending"])
      .ilike("repo_name", pattern)
      .order("stars", { ascending: false, nullsFirst: false })
      .order("id", { ascending: true })
      .limit(limit),
    supabase
      .from("mcp_tools")
      .select(FIELDS)
      .in("status", ["approved", "pending"])
      .or(`repo_name.ilike.${pattern},description.ilike.${pattern},github_url.ilike.${pattern}`)
      .order("stars", { ascending: false, nullsFirst: false })
      .order("id", { ascending: true })
      .limit(limit),
  ]);
  const merged = new Map<string, McpTool>();
  for (const row of [...((repoResult.data as McpTool[]) || []), ...((broadResult.data as McpTool[]) || [])]) {
    if (!merged.has(row.id)) merged.set(row.id, row);
  }
  return withDisplayCategories(keep([...merged.values()]).sort((a, b) => (b.stars || 0) - (a.stars || 0) || a.id.localeCompare(b.id)).slice(0, limit));
}

// Keep each generated shard comfortably below the protocol ceiling and small
// enough that a transient database issue cannot turn a very large response
// into an empty sitemap. Four shards cover the current directory.
export const TOOL_SITEMAP_PAGE_SIZE = 5000;
// Supabase/PostgREST commonly caps a response at 1,000 rows even when a
// larger range is requested. Keep sitemap pages large for the URL protocol,
// but read them in bounded API-sized windows so the page never silently stops
// at the first 1,000 rows.
const TOOL_QUERY_BATCH_SIZE = 1000;

/** One deterministic sitemap page, kept below the protocol URL ceiling. */
export async function getToolNamesPage(offset = 0, limit = TOOL_SITEMAP_PAGE_SIZE): Promise<{ name: string; slug: string; updated: string | null }[] | null> {
  if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > TOOL_SITEMAP_PAGE_SIZE) return [];
  const tools = await getCachedSitemapCatalog();
  return tools?.slice(offset, offset + limit) ?? null;
}

type SitemapTool = { name: string; slug: string; updated: string | null };

/**
 * Read the catalog once per cache window, then paginate the already-deduped
 * canonical URL set. A repository can appear more than once in mcp_tools
 * (for example, casing differences in GitHub URLs); deduping each shard in
 * isolation would put the same canonical URL in multiple sitemap shards.
 */
const getCachedSitemapCatalog = unstable_cache(
  async (): Promise<SitemapTool[] | null> => {
    const supabase = getSupabase();
    if (!supabase) return null;

    const rows: { repo_name: string | null; github_url: string; last_updated: string | null }[] = [];
    const maxRows = 50_000;
    const batchSize = TOOL_QUERY_BATCH_SIZE;
    const concurrency = 6;

    for (let offset = 0; offset < maxRows; offset += batchSize * concurrency) {
      const ranges = Array.from({ length: concurrency }, (_, index) => {
        const start = offset + index * batchSize;
        return { start, end: Math.min(start + batchSize - 1, maxRows - 1) };
      }).filter(({ start }) => start < maxRows);

      const batches = await Promise.all(ranges.map(({ start, end: batchEnd }) => {
        const cursor = start;
        return supabase
        .from("mcp_tools")
        .select("id, repo_name, github_url, last_updated")
        .in("status", ["approved", "pending"])
        .order("stars", { ascending: false, nullsFirst: false })
        .order("id", { ascending: true })
        .range(cursor, batchEnd);
      }));

      let sawRows = false;
      for (const { data, error } of batches) {
        if (error || !data) return null;
        const batchRows = data as { repo_name: string | null; github_url: string; last_updated: string | null }[];
        if (batchRows.length > 0) sawRows = true;
        rows.push(...batchRows);
      }
      if (!sawRows || batches.some(({ data }) => !data || data.length < batchSize)) break;
    }

    const seen = new Set<string>();
    const out: SitemapTool[] = [];
    for (const row of rows) {
      if (!row.repo_name || isBlocked(row.repo_name)) continue;
      const slug = toolSlug(row.github_url, row.repo_name);
      if (seen.has(slug)) continue;
      seen.add(slug);
      out.push({ name: row.repo_name, slug, updated: row.last_updated });
    }
    return out;
  },
  ["repository-sitemap-catalog"],
  { revalidate: 300, tags: ["repository-sitemap", "repository-tools"] },
);

/* All tool names (for callers that need one bounded list). */
export async function getAllToolNames(max = 50000): Promise<{ name: string; slug: string; updated: string | null }[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const out: { name: string; slug: string; updated: string | null }[] = [];
  const seen = new Set<string>();
  let offset = 0;
  const batch = 1000;
  while (out.length < max) {
    const { data, error } = await supabase
      .from("mcp_tools")
      .select("id, repo_name, github_url, last_updated")
      .in("status", ["approved", "pending"])
      // Offset pagination is only safe when the ordering is deterministic.
      // `stars` alone has many ties, so use the immutable row id as a stable
      // secondary key to prevent skipped/duplicated sitemap URLs between
      // batches.
      .order("stars", { ascending: false, nullsFirst: false })
      .order("id", { ascending: true })
      .range(offset, offset + batch - 1);
    if (error || !data || data.length === 0) break;
    for (const r of data as { repo_name: string | null; github_url: string; last_updated: string | null }[]) {
      if (r.repo_name && !isBlocked(r.repo_name)) {
        const slug = toolSlug(r.github_url, r.repo_name);
        if (!seen.has(slug)) {
          seen.add(slug);
          out.push({ name: r.repo_name, slug, updated: r.last_updated });
        }
      }
    }
    if (data.length < batch) break;
    offset += batch;
  }
  return out.slice(0, max);
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  const supabase = getSupabase();
  const counts: Record<string, number> = {};
  if (!supabase) return counts;
  // Category totals must cover the full directory. Batch the read so the
  // Supabase row limit cannot silently undercount larger catalogs.
  const batch = 1000;
  const max = 50000;
  for (let offset = 0; offset < max; offset += batch) {
    const { data, error } = await supabase
      .from("mcp_tools")
      .select("id, category, repo_name, description, topics, language")
      .in("status", ["approved", "pending"])
      .order("id", { ascending: true })
      .range(offset, offset + batch - 1);
    if (error || !data || data.length === 0) break;
    for (const row of data as { id: string; category: string | null; repo_name: string | null; description: string | null; topics: string[] | null; language: string | null }[]) {
      if (isBlocked(row.repo_name)) continue;
      const c = inferCategory(row);
      counts[c] = (counts[c] || 0) + 1;
    }
    if (data.length < batch) break;
  }
  return counts;
}

/* Fetch a repo's README markdown server-side (optional GitHub token). */
export async function getReadme(repoPath: string): Promise<string> {
  if (!/^[\w-]+\/[\w.-]+$/.test(repoPath)) return "";
  return getCachedReadme(repoPath);
}

const MAX_README_CHARS = 120_000;

const getCachedReadme = unstable_cache(
  async (repoPath: string): Promise<string> => {
  const headers: HeadersInit = { Accept: "application/vnd.github.v3.raw" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  try {
    const res = await fetch(`https://api.github.com/repos/${repoPath}/readme`, {
      headers,
      next: { revalidate: 21600 },
    });
    if (!res.ok) return "";
    if (!res.body) return (await res.text()).slice(0, MAX_README_CHARS);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let content = "";
    while (content.length < MAX_README_CHARS) {
      const { done, value } = await reader.read();
      if (done) break;
      content += decoder.decode(value, { stream: true });
    }
    await reader.cancel();
    return content.slice(0, MAX_README_CHARS);
  } catch {
    return "";
  }
  },
  ["repository-readme"],
  { revalidate: 21600, tags: ["repository-readmes"] },
);

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
