/* Shape of a row in the Supabase `mcp_tools` table (the MCP directory). */
export type McpTool = {
  id: string;
  github_url: string;
  repo_name: string | null;
  description: string | null;
  stars: number | null;
  language: string | null;
  topics: string[] | null;
  category: string | null;
  last_updated: string | null;
  status: string | null;
  created_at: string;
};

/* Directory categories (mirrors the live site). Used for filtering + browsing. */
export const CATEGORIES: { id: string; label: string }[] = [
  { id: "AI & Machine Learning", label: "AI & ML" },
  { id: "Developer Kits", label: "Dev Kits" },
  { id: "Servers & Infrastructure", label: "Infrastructure" },
  { id: "Search & Data Retrieval", label: "Search" },
  { id: "Automation & Productivity", label: "Automation" },
  { id: "Web & Internet Tools", label: "Web Tools" },
  { id: "Communication", label: "Communication" },
  { id: "File & Data Management", label: "Files" },
  { id: "Others", label: "Others" },
];

export function categorySlug(id: string): string {
  return id
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function categoryFromSlug(slug: string): string | null {
  return CATEGORIES.find((c) => categorySlug(c.id) === slug)?.id ?? null;
}

/** Owner login parsed from a GitHub repo URL, e.g. "modelcontextprotocol". */
export function ownerFromUrl(url: string): string {
  const parts = url.replace(/\/$/, "").split("/");
  return parts[parts.length - 2] ?? "";
}

/** "owner/repo" path parsed from a GitHub repo URL. */
export function repoPathFromUrl(url: string): string {
  return url.replace("https://github.com/", "").replace(/\/$/, "");
}

/** Stable, collision-resistant URL slug derived from the canonical GitHub repo. */
export function toolSlug(githubUrl: string, fallbackName = "tool"): string {
  const repoPath = repoPathFromUrl(githubUrl);
  if (/^[\w.-]+\/[\w.-]+$/.test(repoPath)) {
    return repoPath.replace("/", "--").toLowerCase();
  }
  return fallbackName;
}

/** Parse the owner--repo format used by new directory links. */
export function githubPathFromToolSlug(slug: string): { owner: string; repo: string } | null {
  const decoded = decodeURIComponent(slug);
  const separator = decoded.indexOf("--");
  if (separator <= 0) return null;
  const owner = decoded.slice(0, separator);
  const repo = decoded.slice(separator + 2);
  if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) return null;
  return { owner, repo };
}
