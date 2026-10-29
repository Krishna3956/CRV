import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const layout = await readFile(new URL("../src/app/layout.tsx", import.meta.url), "utf8");
const loader = await readFile(new URL("../src/components/FontshareLoader.tsx", import.meta.url), "utf8");

test("the optional display font cannot block the server-rendered page", () => {
  assert.doesNotMatch(layout, /api\.fontshare\.com\/v2\/css/);
  assert.match(layout, /<FontshareLoader\s*\/>/);
  assert.match(loader, /useEffect/);
  assert.match(loader, /data-trackmcp-fontshare/);
  assert.match(loader, /display=swap/);
});
