import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = (relativePath) => readFile(resolve(root, relativePath), "utf8");

test("pilot support page publishes an honest, discoverable scope boundary", async () => {
  const [page, footer, sitemap] = await Promise.all([
    source("src/app/support/page.tsx"),
    source("src/components/Footer.tsx"),
    source("src/app/sitemap.ts"),
  ]);
  assert.match(page, /npx @trackmcp\/cli init/);
  assert.match(page, /npx @trackmcp\/cli doctor --non-interactive/);
  assert.match(page, /Supported/);
  assert.match(page, /Limited by design/);
  assert.match(page, /Not in this pilot/);
  assert.match(page, /OTLP\/HTTP JSON/);
  assert.match(page, /OTLP\/gRPC/);
  assert.match(page, /Never share an API key/);
  assert.match(page, /successful call alone does not prove telemetry was accepted/);
  assert.match(footer, /Pilot support/);
  assert.match(footer, /href: "\/support"/);
  assert.match(sitemap, /\$\{BASE\}\/support/);
});
