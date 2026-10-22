import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(process.cwd(), "..");
const read = (relative) => readFile(resolve(root, relative), "utf8");
const [docs, traceExplorer, sdkManifest, cliManifest] = await Promise.all([
  read("trackmcp-nextjs/src/app/docs/page.tsx"),
  read("trackmcp-nextjs/src/components/dashboard/TraceExplorer.tsx"),
  read("trackmcp-nextjs/packages/typescript-sdk/package.json"),
  read("trackmcp-nextjs/packages/cli/package.json"),
]);
const sdkVersion = JSON.parse(sdkManifest).version;
const cliVersion = JSON.parse(cliManifest).version;

test("public quickstart names the currently published CLI and TypeScript SDK versions", () => {
  assert.match(docs, new RegExp(`current CLI is ${cliVersion}`));
  assert.match(docs, new RegExp(`current TypeScript SDK is ${sdkVersion}`));
  assert.match(traceExplorer, new RegExp(`sdk_version: "${sdkVersion}"`));
});

test("public quickstart explains the release-train boundary", () => {
  assert.match(docs, /Source fixes are grouped\s+into reviewed release trains/);
  assert.match(docs, /does\s+not consume an npm or PyPI version/);
  assert.match(docs, /coherent SDK\/CLI\/Python milestone/);
});
