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

const MCP_NAME_OVERRIDES: Record<string, string> = {
  metabrain: "MetaBrain",
};

const MCP_ACRONYMS = new Set(["ai", "api", "cli", "eth", "http", "https", "mcp", "qbo", "sdk", "url"]);

function splitKnownCamelAcronym(word: string): string[] {
  const match = word.match(/^(ai|api|cli|eth|http|https|mcp|qbo|sdk|url)(?=[A-Z]|$)/i);
  if (!match || match[0].length === word.length) return [word];
  return [match[0], word.slice(match[0].length)];
}

/** Format repository names for customer-facing CRM copy without changing the canonical repo name. */
export function formatMcpName(name: string): string {
  const normalized = name.trim().replace(/[\s_-]+/g, " ").replace(/\s+/g, " ");
  if (!normalized) return name;

  const override = MCP_NAME_OVERRIDES[normalized.toLowerCase()];
  if (override) return override;

  return normalized
    .split(" ")
    .flatMap(splitKnownCamelAcronym)
    .map((word) => {
      const lower = word.toLowerCase();
      if (MCP_ACRONYMS.has(lower)) return lower.toUpperCase();
      if (/[a-z][A-Z]/.test(word)) return word;
      return `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
    })
    .join(" ");
}

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

const CATEGORY_IDS = new Set(CATEGORIES.map((category) => category.id));
const CATEGORY_ALIASES: Record<string, string> = {
  other: "Others",
  others: "Others",
  uncategorized: "Others",
  "ai and machine learning": "AI & Machine Learning",
  "ai & ml": "AI & Machine Learning",
  "developer kit": "Developer Kits",
  "developer kits": "Developer Kits",
  infrastructure: "Servers & Infrastructure",
  "servers and infrastructure": "Servers & Infrastructure",
  search: "Search & Data Retrieval",
  "search and data retrieval": "Search & Data Retrieval",
  automation: "Automation & Productivity",
  "web and internet tools": "Web & Internet Tools",
  communication: "Communication",
  files: "File & Data Management",
  "file and data management": "File & Data Management",
};

/** Convert legacy/imported category labels into the directory's canonical ids. */
export function normalizeCategory(value: unknown): string {
  if (typeof value !== "string") return "Others";
  const trimmed = value.trim();
  if (!trimmed) return "Others";
  if (CATEGORY_IDS.has(trimmed)) return trimmed;
  return CATEGORY_ALIASES[trimmed.toLowerCase()] || "Others";
}

/**
 * Give legacy rows that were imported as `Other` a useful display category
 * without mutating the source catalog. This is intentionally conservative:
 * only bounded repository metadata is used and anything ambiguous remains in
 * Others. A future data backfill can persist the same decisions if desired.
 */
export function inferCategory(value: {
  category?: unknown;
  repo_name?: string | null;
  description?: string | null;
  topics?: string[] | null;
  language?: string | null;
}): string {
  const normalized = normalizeCategory(value.category);
  if (normalized !== "Others") return normalized;
  const text = [value.repo_name, value.description, value.language, ...(value.topics || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const rules: Array<[string, RegExp]> = [
    ["AI & Machine Learning", /\b(ai|llm|model|ml|machine[- ]learning|embedding|agent|rag|vector)\b/],
    ["Search & Data Retrieval", /\b(search|retrieval|database|sql|postgres|mysql|redis|elasticsearch|vector|data)\b/],
    ["Automation & Productivity", /\b(automation|workflow|productivity|calendar|task|notion|zapier|slack bot)\b/],
    ["Communication", /\b(chat|communication|discord|slack|telegram|email|messaging)\b/],
    ["File & Data Management", /\b(file|filesystem|storage|drive|dropbox|s3|spreadsheet|document)\b/],
    ["Web & Internet Tools", /\b(web|browser|http|api|scrape|crawl|website|internet)\b/],
    ["Developer Kits", /\b(sdk|cli|developer|framework|typescript|javascript|python|go|rust|java)\b/],
    ["Servers & Infrastructure", /\b(server|hosting|docker|kubernetes|cloud|aws|azure|gcp|infra|monitor)\b/],
  ];
  return rules.find(([, pattern]) => pattern.test(text))?.[0] || "Others";
}

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
