import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const pagePath = resolve(dirname(fileURLToPath(import.meta.url)), "page.tsx");

test("switching sign-in mode preserves an active device-flow next path", async () => {
  const source = await readFile(pagePath, "utf8");
  assert.match(source, /const next = nextPath\.current/);
  assert.match(source, /new URLSearchParams\(\{ next \}\)/);
  assert.ok(source.includes('router.replace(next === "/dashboard" ? path :'));
});
