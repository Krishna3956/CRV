import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "..");
const sql = fs.readFileSync(path.join(root, "supabase/manual/founder-os-analytics-query-plans.sql"), "utf8");
const statements = sql.replace(/--[^\n]*/g, "");

test("analytics query-plan script is planner-only, bounded, and workspace-scoped", () => {
  assert.equal((sql.match(/explain \(format json, analyze false, buffers false\)/g) || []).length, 4);
  for (const phrase of ["trackmcp_events", "trackmcp_catalog_versions", "trackmcp_catalog_entity_reads", "trackmcp_refresh_jobs", "limit 10000", "limit 101", "limit 10001", "workspace_id"]) {
    assert.ok(sql.toLowerCase().includes(phrase.toLowerCase()), `missing query-plan boundary: ${phrase}`);
  }
  assert.doesNotMatch(sql, /\b(explain\s+analyze|insert\s+into|update\s+|delete\s+from|truncate\s+|alter\s+|drop\s+)/i);
});

test("query-plan script does not select secrets or raw payloads", () => {
  assert.doesNotMatch(statements, /api[_ ]?key|token|authorization|payload\b/i);
  assert.match(sql, /Never paste API keys/i);
});
