import assert from "node:assert/strict";
import test from "node:test";
import { classifyPath } from "./release-scope-audit.mjs";

test("release scope classifies intended Founder OS paths", () => {
  assert.equal(classifyPath("trackmcp-nextjs/src/app/api/v2/overview/route.ts"), "intended-release-scope");
  assert.equal(classifyPath("supabase/migrations/20261018000014_rate_limit_buckets.sql"), "intended-release-scope");
  assert.equal(classifyPath(".github/workflows/founder-os-refresh-worker.yml"), "intended-release-scope");
  assert.equal(classifyPath("docs/architecture.md"), "intended-release-scope");
  assert.equal(classifyPath("trackmcp-nextjs/package.json"), "intended-release-scope");
  assert.equal(classifyPath("trackmcp-nextjs/package-lock.json"), "intended-release-scope");
});

test("release scope isolates local artifacts and unknown paths", () => {
  assert.equal(classifyPath("trackmcp-nextjs/campaigns/internal.html"), "excluded-local-artifact");
  assert.equal(classifyPath("trackmcp-submissions.csv"), "excluded-local-artifact");
  assert.equal(classifyPath("notes/poetry.lock"), "review-required");
  assert.equal(classifyPath("notes/undocumented-plan.txt"), "review-required");
});
