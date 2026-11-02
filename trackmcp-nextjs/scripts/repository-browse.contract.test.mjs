import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const nav = await readFile(new URL("src/components/Nav.tsx", root), "utf8");
const browse = await readFile(new URL("src/components/repository/BrowseClient.tsx", root), "utf8");
const queries = await readFile(new URL("src/lib/repository/queries.ts", root), "utf8");
const repositoryPage = await readFile(new URL("src/app/repository/page.tsx", root), "utf8");

test("repository navigation exposes Browse all instead of navigating on the parent click", () => {
  assert.match(nav, /label: "Browse all", href: "\/repository"/);
  assert.match(nav, /aria-expanded=\{repoOpen\}/);
  assert.match(nav, /onClick=\{\(\) => setRepoOpen/);
  assert.doesNotMatch(nav, /<a\s+href="\/repository"[\s\S]{0,120}>\s*Repository/);
  assert.match(nav, /<Link[\s\S]*href=\{r\.href\}[\s\S]*onClick=\{\(\) => setRepoOpen\(false\)\}/);
});

test("repository first render does not block on a full catalog category scan", () => {
  assert.doesNotMatch(repositoryPage, /getCategoryCounts/);
  assert.match(repositoryPage, /categoryCounts=\{\{\}\}/);
  assert.match(repositoryPage, /Category totals are loaded lazily/);
});

test("browse uses the full category count and paginates category rows", () => {
  assert.match(browse, /categoryCounts\?: Record<string, number>/);
  assert.match(browse, /categoryCounts\[category\]/);
  assert.match(browse, /toolsByCategoryAction\(category, 500, categoryLoadedCount\)/);
  assert.match(queries, /getToolsByCategory\(category: string, limit = 300, offset = 0\)/);
  assert.match(queries, /const requestedOffset = offset/);
  assert.match(queries, /\.range\(cursor, cursor \+ batch - 1\)/);
});

test("search has a dedicated repo-name query for newly submitted rows", () => {
  assert.match(queries, /\.ilike\("repo_name", pattern\)/);
  assert.match(queries, /const merged = new Map<string, McpTool>\(\)/);
});
