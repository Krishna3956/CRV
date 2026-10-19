import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const validation = await readFile(resolve(process.cwd(), "../docs/FOUNDER-OS-LOAD-VALIDATION.md"), "utf8");

test("load-validation runbook keeps a bounded first-wave profile", () => {
  for (const term of [
    "At most 100 customer workspaces",
    "25 during the first launch window",
    "60 events/minute/source",
    "batches of 1, 10, 50, and 100",
    "one refresh/minute/session",
    "10 simultaneous disposable device flows",
    "p95 ≤ 750 ms",
    "error rate ≤ 1%",
  ]) assert.match(validation, new RegExp(term.replace(/[()[\].+?^$|{}\\]/g, "\\$&")));
});

test("load-validation runbook defines safe stop and recovery boundaries", () => {
  for (const term of [
    "Stop new invitations",
    "tenant-isolation",
    "non-zero load-test timeout",
    "manual queue mutation",
    "first observed",
    "recovered UTC times",
    "immutable image/commit identifiers",
  ]) assert.match(validation, new RegExp(term.replace(/[()[\].+?^$|{}\\]/g, "\\$&")));
  assert.match(validation, /ad-hoc\s+SQL/);
});
