import { execFileSync } from "node:child_process";
import path from "node:path";

const repoRoot = path.resolve(process.cwd(), "..");

const EXCLUDED = [
  /(^|\/)(?:campaigns|node_modules|build|\.next(?:-[^/]+)?)(\/|$)/,
  // Local handoff notes and inspection output are deliberately kept outside
  // the product candidate. They may be present in a working checkout while a
  // release is being audited and must never become review-required by accident.
  /(?:^|\/)(?:docs\/codex-handoff|tmp)(\/|$)/,
  /(?:^|\/)(?:[^/]+\.(?:csv|tsbuildinfo))$/i,
  /(?:^|\/)(?:\.env(?:\.|$)|deploy\/\.env\.deploy$)/,
  /(?:^|\/)AGENTS\.md$/i,
];

const INTENDED = [
  /^\.github\/workflows\//,
  /^trackmcp-nextjs\/\.github\/workflows\//,
  /^\.gitignore$/,
  /^FOUNDER-OS-[^/]+\.md$/,
  // The release gate runs from trackmcp-nextjs, so root-level pilot manifests
  // appear as trackmcp-nextjs/FOUNDER-OS-*.md after path normalization.
  /^trackmcp-nextjs\/FOUNDER-OS-[^/]+\.md$/,
  /^docs\/FOUNDER-OS-/,
  /^supabase\/(?:migrations|manual)\//,
  /^packages\/python-sdk\//,
  /^docs\/(?:architecture|getting-started)\.md$/,
  // The web lockfile is release scope only because the dependency-pin contract
  // test verifies its direct framework/MCP entries against package manifests
  // and customer documentation. Other lockfiles still require explicit review.
  /^trackmcp-nextjs\/(?:\.gitignore|eslint\.config\.mjs|next\.config\.ts|package(?:-lock)?\.json)$/,
  /^trackmcp-nextjs\/(?:src|packages|deploy|docs|scripts|workers)\//,
];

export function classifyPath(relativePath) {
  const normalized = relativePath.replaceAll("\\", "/");
  if (EXCLUDED.some((pattern) => pattern.test(normalized))) return "excluded-local-artifact";
  if (INTENDED.some((pattern) => pattern.test(normalized))) return "intended-release-scope";
  return "review-required";
}

function changedPaths() {
  const output = execFileSync("git", ["status", "--porcelain=v1", "--untracked-files=all"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  return output.split(/\r?\n/).filter(Boolean).map((line) => {
    // Porcelain v1 uses two status columns followed by a space. For renames,
    // keep both paths visible rather than silently dropping the old location.
    return line.slice(3).split(" -> ").map((value) => {
      const candidate = value.trim().replace(/^"(.*)"$/, "$1");
      // `git status` reports paths relative to the current working directory,
      // while the audit classifies paths relative to the repository root. The
      // release gate runs from trackmcp-nextjs, so normalize both views before
      // applying the scope policy; otherwise ../docs and ../tmp handoff files
      // are incorrectly treated as review-required product files.
      const rootRelative = candidate === "trackmcp-nextjs" || candidate.startsWith("trackmcp-nextjs/")
        ? candidate
        : path.relative(repoRoot, path.resolve(process.cwd(), candidate));
      return rootRelative.replaceAll("\\", "/");
    });
  }).flat();
}

function trackedPaths() {
  return execFileSync("git", ["ls-files", "-z"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).split("\0").filter(Boolean);
}

const paths = process.argv.includes("--all-tracked") ? trackedPaths() : changedPaths();
const rows = paths.map((file) => ({ file, classification: classifyPath(file) }));
const summary = rows.reduce((counts, row) => {
  counts[row.classification] = (counts[row.classification] || 0) + 1;
  return counts;
}, {});

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ repository: repoRoot, summary, files: rows }, null, 2));
} else {
  console.log("Founder OS release-scope audit (read-only)");
  console.log(`Repository: ${repoRoot}`);
  for (const classification of ["intended-release-scope", "review-required", "excluded-local-artifact"]) {
    const group = rows.filter((row) => row.classification === classification);
    console.log(`\n${classification}: ${group.length}`);
    for (const row of group) console.log(`  ${row.file}`);
  }
}

if (process.argv.includes("--strict") && (summary["review-required"] || summary["excluded-local-artifact"])) {
  process.exitCode = 1;
}
