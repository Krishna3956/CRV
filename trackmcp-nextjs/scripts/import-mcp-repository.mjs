#!/usr/bin/env node

/**
 * Import public MCP Repository listings into TrackMCP.
 *
 * Safe defaults:
 *   - crawls only public mcprepository.com pages
 *   - does not collect or infer email addresses
 *   - writes a local JSONL snapshot unless --import is explicitly passed
 *   - imports as `pending` rows, so the existing review flow still applies
 *
 * Examples:
 *   node scripts/import-mcp-repository.mjs --limit 100 --no-enrich
 *   node scripts/import-mcp-repository.mjs --output /tmp/mcp.jsonl
 *   node scripts/import-mcp-repository.mjs --import
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const SOURCE_ORIGIN = "https://mcprepository.com";
const USER_AGENT = "TrackMCP-public-directory-import/1.0 (+https://trackmcp.com/contact)";
const DEFAULT_OUTPUT = ".data/mcp-repository-public.jsonl";
const PAGE_DELAY_MS = 250;
const DETAIL_CONCURRENCY = 4;
const GITHUB_CONCURRENCY = 3;

const args = new Set(process.argv.slice(2));
const valueFor = (name, fallback) => {
  const prefix = `${name}=`;
  const arg = process.argv.slice(2).find((item) => item.startsWith(prefix));
  if (arg) return arg.slice(prefix.length);
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] && !process.argv[index + 1].startsWith("-")
    ? process.argv[index + 1]
    : fallback;
};

const outputFile = valueFor("--output", DEFAULT_OUTPUT);
const inputFile = valueFor("--from", null);
const limitValue = valueFor("--limit", "0");
const requestedLimit = Number.parseInt(limitValue, 10);
const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? requestedLimit : Infinity;
const shouldEnrich = !args.has("--no-enrich");
const shouldImport = args.has("--import");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function extractHrefs(html) {
  const hrefs = [];
  const pattern = /href=(['"])(.*?)\1/gi;
  for (const match of html.matchAll(pattern)) hrefs.push(decodeHtml(match[2]));
  return hrefs;
}

function sitePathFromHref(href) {
  try {
    const url = new URL(href, SOURCE_ORIGIN);
    if (url.origin !== SOURCE_ORIGIN) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length !== 2) return null;
    if (parts.some((part) => !/^[\w.-]+$/.test(part))) return null;
    if (["category", "search", "api", "static"].includes(parts[0].toLowerCase())) return null;
    return `/${parts[0]}/${parts[1]}`;
  } catch {
    return null;
  }
}

function githubRepoFromHref(href) {
  try {
    const url = new URL(href);
    if (url.hostname.toLowerCase() !== "github.com") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    if (![parts[0], parts[1]].every((part) => /^[\w.-]+$/.test(part))) return null;
    if (parts[1].endsWith(".git")) parts[1] = parts[1].slice(0, -4);
    return `https://github.com/${parts[0]}/${parts[1]}`;
  } catch {
    return null;
  }
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function fetchJson(url) {
  const headers = {
    "User-Agent": USER_AGENT,
    Accept: "application/vnd.github+json",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function mapWithConcurrency(items, concurrency, worker) {
  const output = new Array(items.length);
  let nextIndex = 0;
  async function run() {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      output[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return output;
}

async function crawlSource() {
  const homeHtml = await fetchText(SOURCE_ORIGIN);
  const categoryPaths = [...new Set(extractHrefs(homeHtml).map((href) => {
    try {
      const url = new URL(href, SOURCE_ORIGIN);
      return url.origin === SOURCE_ORIGIN && url.pathname.startsWith("/category/") ? url.pathname : null;
    } catch {
      return null;
    }
  }).filter(Boolean))];

  const sourcePages = ["/", ...categoryPaths];
  const listingPaths = new Set();
  for (const [index, sourcePath] of sourcePages.entries()) {
    const url = new URL(sourcePath, SOURCE_ORIGIN).toString();
    try {
      const html = sourcePath === "/" ? homeHtml : await fetchText(url);
      for (const href of extractHrefs(html)) {
        const listingPath = sitePathFromHref(href);
        if (listingPath) listingPaths.add(listingPath);
      }
      process.stdout.write(`Source page ${index + 1}/${sourcePages.length}: ${sourcePath} -> ${listingPaths.size} listings\n`);
    } catch (error) {
      process.stderr.write(`Skipped ${url}: ${error.message}\n`);
    }
    if (sourcePath !== sourcePages.at(-1)) await sleep(PAGE_DELAY_MS);
  }

  const selectedPaths = [...listingPaths].slice(0, limit);
  const detailRows = await mapWithConcurrency(selectedPaths, DETAIL_CONCURRENCY, async (listingPath, index) => {
    const listingUrl = new URL(listingPath, SOURCE_ORIGIN).toString();
    try {
      const html = await fetchText(listingUrl);
      const listingOwner = listingPath.split("/")[1].toLowerCase();
      const candidates = [...new Set(extractHrefs(html).map(githubRepoFromHref).filter(Boolean))]
        .filter((repoUrl) => !repoUrl.toLowerCase().includes("github.com/mcprepository/"));
      const ownerMatch = candidates.find((repoUrl) => repoUrl.split("/")[3]?.toLowerCase() === listingOwner);
      const githubUrl = ownerMatch || candidates[0] || null;
      process.stdout.write(`Detail ${index + 1}/${selectedPaths.length}: ${listingPath}${githubUrl ? ` -> ${githubUrl}` : " -> unresolved"}\n`);
      return { source_url: listingUrl, listing_path: listingPath, github_url: githubUrl };
    } catch (error) {
      process.stderr.write(`Skipped detail ${listingUrl}: ${error.message}\n`);
      return { source_url: listingUrl, listing_path: listingPath, github_url: null, error: error.message };
    } finally {
      await sleep(PAGE_DELAY_MS);
    }
  });

  const unique = new Map();
  for (const row of detailRows) {
    if (row.github_url && !unique.has(row.github_url.toLowerCase())) unique.set(row.github_url.toLowerCase(), row);
  }
  return [...unique.values()];
}

async function enrichGithub(rows) {
  if (!shouldEnrich) return rows;
  return mapWithConcurrency(rows, GITHUB_CONCURRENCY, async (row, index) => {
    const repoPath = row.github_url.replace("https://github.com/", "");
    try {
      const data = await fetchJson(`https://api.github.com/repos/${repoPath}`);
      process.stdout.write(`GitHub ${index + 1}/${rows.length}: ${data.full_name}\n`);
      const cleanRow = { ...row };
      delete cleanRow.github_error;
      return {
        ...cleanRow,
        repo_name: data.name ?? null,
        full_name: data.full_name ?? null,
        description: data.description ?? null,
        stars: data.stargazers_count ?? null,
        language: data.language ?? null,
        topics: Array.isArray(data.topics) ? data.topics : [],
        last_updated: data.updated_at ?? null,
        archived: Boolean(data.archived),
        fork: Boolean(data.fork),
        owner_type: data.owner?.type ?? null,
        homepage: data.homepage ?? null,
      };
    } catch (error) {
      process.stderr.write(`GitHub lookup failed ${row.github_url}: ${error.message}\n`);
      return { ...row, github_error: error.message };
    } finally {
      await sleep(PAGE_DELAY_MS);
    }
  });
}

async function writeSnapshot(rows) {
  await mkdir(dirname(outputFile), { recursive: true });
  const jsonl = rows.map((row) => JSON.stringify(row)).join("\n") + (rows.length ? "\n" : "");
  await writeFile(outputFile, jsonl, "utf8");
}

async function importIntoSupabase(rows) {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("--import requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const blockedSource = await readFile(new URL("../src/lib/repository/blocked.ts", import.meta.url), "utf8");
  const blocked = new Set([...blockedSource.matchAll(/\"([^\"]+)\"/g)].map((match) => match[1].toLowerCase()));

  const payload = rows
    .filter((row) => row.github_url && row.repo_name && !row.github_error && !blocked.has(row.repo_name.toLowerCase()))
    .map((row) => ({
      github_url: row.github_url,
      repo_name: row.repo_name,
      description: row.description,
      stars: row.stars,
      language: row.language,
      topics: row.topics,
      last_updated: row.last_updated,
      status: "pending",
    }));

  const blockedCount = rows.filter((row) => row.repo_name && blocked.has(row.repo_name.toLowerCase())).length;
  if (blockedCount) process.stdout.write(`Skipped blocklisted rows: ${blockedCount}\n`);

  let imported = 0;
  for (let index = 0; index < payload.length; index += 100) {
    const batch = payload.slice(index, index + 100);
    const { error } = await supabase.from("mcp_tools").upsert(batch, {
      onConflict: "github_url",
      ignoreDuplicates: true,
    });
    if (error) throw new Error(`Supabase import failed: ${error.message}`);
    imported += batch.length;
    process.stdout.write(`Imported batch: ${Math.min(index + batch.length, payload.length)}/${payload.length}\n`);
  }
  return imported;
}

async function main() {
  process.stdout.write(`Crawling ${SOURCE_ORIGIN}; limit=${limit === Infinity ? "all reachable" : limit}; enrich=${shouldEnrich}; import=${shouldImport}\n`);
  const crawled = inputFile
    ? (await readFile(inputFile, "utf8"))
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line))
    : await crawlSource();
  if (inputFile) process.stdout.write(`Loaded snapshot: ${inputFile} (${crawled.length} rows)\n`);
  const rows = await enrichGithub(crawled);
  await writeSnapshot(rows);
  const resolved = rows.filter((row) => row.github_url).length;
  const enriched = rows.filter((row) => row.repo_name).length;
  process.stdout.write(`Snapshot: ${outputFile}\n`);
  process.stdout.write(`Unique listings: ${rows.length}; GitHub URLs: ${resolved}; enriched: ${enriched}\n`);
  if (shouldImport) {
    const imported = await importIntoSupabase(rows);
    process.stdout.write(`Supabase rows submitted for review: ${imported}\n`);
  } else {
    process.stdout.write("Dry run only. Pass --import after reviewing the snapshot to write pending rows.\n");
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
