import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../../..");
const routePath = resolve(root, "src/app/api/v1/admin/repository/tools/[id]/route.ts");

test("listing operator route is authenticated, allowlisted, audited, and cache-aware", async () => {
  const route = await readFile(routePath, "utf8");
  assert.match(route, /x-trackmcp-admin-key/);
  assert.match(route, /timingSafeEqual/);
  assert.match(route, /mcp_tool_listing_audits/);
  assert.match(route, /expected_updated_at/);
  assert.match(route, /revalidatePath\(`\/tool\/\$\{slug\}`\)/);
  assert.match(route, /revalidatePath\("\/tool-sitemap\.xml"\)/);
  assert.match(route, /revalidateTag\("repository-tools", "max"\)/);
  assert.match(route, /archived/);
  assert.doesNotMatch(route, /submitter_email/);
  assert.match(route, /const SAFE_FIELDS = \["repo_name", "description", "topics", "language", "category", "meta_description", "status"\]/);
});

test("archived directory rows are excluded from direct tool lookup", async () => {
  const queries = await readFile(resolve(root, "src/lib/repository/queries.ts"), "utf8");
  assert.match(queries, /from\("mcp_tools"\)[\s\S]*?\.in\("status", \["approved", "pending"\]\)[\s\S]*?\.ilike\("github_url"/);
  assert.match(queries, /from\("mcp_tools"\)[\s\S]*?\.in\("status", \["approved", "pending"\]\)[\s\S]*?\.ilike\("repo_name"/);
});

test("listing audit migration protects audit history from public roles", async () => {
  const sql = await readFile(resolve(root, "../supabase/migrations/20261109000000_mcp_tool_listing_audits.sql"), "utf8");
  assert.match(sql, /create table if not exists public\.mcp_tool_listing_audits/);
  assert.match(sql, /on delete restrict/);
  assert.match(sql, /revoke all on public\.mcp_tool_listing_audits from public, anon, authenticated/);
  assert.match(sql, /grant select, insert on public\.mcp_tool_listing_audits to service_role/);
});
