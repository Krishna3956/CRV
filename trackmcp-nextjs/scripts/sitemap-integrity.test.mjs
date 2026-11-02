import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(process.cwd());
const read = (file) => readFile(resolve(root, file), "utf8");

test("the canonical sitemap index submits the English and directory sitemap families", async () => {
  const route = await read("src/app/sitemap-index.xml/route.ts");
  assert.match(route, /<sitemapindex/);
  assert.match(route, /\$\{BASE\}\/sitemap\.xml/);
  assert.match(route, /\$\{BASE\}\/tool-sitemap\.xml/);
  const robots = await read("src/app/robots.ts");
  assert.match(robots, /https:\/\/trackmcp\.com\/sitemap-index\.xml/);
});

test("large directory sitemap shards are bounded and fail closed", async () => {
  const queries = await read("src/lib/repository/queries.ts");
  assert.match(queries, /TOOL_SITEMAP_PAGE_SIZE = 5000/);
  assert.match(queries, /Promise\.all\(ranges\.map/);
  assert.match(queries, /getCachedSitemapCatalog/);
  assert.match(queries, /tools\?\.slice\(offset, offset \+ limit\)/);
  assert.match(queries, /const seen = new Set<string>\(\)/);
  const index = await read("src/app/tool-sitemap.xml/route.ts");
  const shard = await read("src/app/tool-sitemap/[shard]/route.ts");
  for (const source of [index, shard]) {
    assert.match(source, /status: 503/);
    assert.match(source, /Retry-After/);
    assert.match(source, /Cache-Control/);
  }
  assert.match(index, /getToolCountStrict/);
  assert.match(shard, /tools === null/);
});

test("directory pages redirect legacy repository-name URLs to canonical slugs", async () => {
  const page = await read("src/app/tool/[name]/page.tsx");
  assert.match(page, /permanentRedirect/);
  assert.match(page, /name !== canonicalSlug/);
  assert.match(page, /rawDescription\.length >= 70/);
});
