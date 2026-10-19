import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./layout.tsx", import.meta.url), "utf8");

test("Vercel observability is opt-in outside Vercel hosting", () => {
  assert.match(source, /NEXT_PUBLIC_ENABLE_VERCEL_OBSERVABILITY === "true"/);
  assert.match(source, /ENABLE_VERCEL_OBSERVABILITY && \(/);
  assert.match(source, /<Analytics \/>/);
  assert.match(source, /<SpeedInsights \/>/);
});
