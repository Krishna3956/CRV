import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(appRoot, relativePath), "utf8"));
}

test("direct framework and MCP SDK pins agree with the lockfiles", async () => {
  const [webPackage, webLock, sdkPackage, sdkLock] = await Promise.all([
    readJson("package.json"),
    readJson("package-lock.json"),
    readJson("packages/typescript-sdk/package.json"),
    readJson("packages/typescript-sdk/package-lock.json"),
  ]);

  assert.equal(webPackage.dependencies.next, "16.4.2");
  assert.equal(webPackage.devDependencies["eslint-config-next"], "16.4.2");
  assert.equal(webPackage.devDependencies["@modelcontextprotocol/sdk"], "1.32.2");
  assert.equal(webLock.packages[""].dependencies.next, webPackage.dependencies.next);
  assert.equal(webLock.packages[""].devDependencies["@modelcontextprotocol/sdk"], "1.32.2");
  assert.equal(webLock.packages["node_modules/next"].version, "16.4.2");
  assert.equal(webLock.packages["node_modules/@modelcontextprotocol/sdk"].version, "1.32.2");

  assert.equal(sdkPackage.peerDependencies["@modelcontextprotocol/sdk"], "1.32.2");
  assert.equal(sdkPackage.devDependencies["@modelcontextprotocol/sdk"], "1.32.2");
  assert.equal(sdkLock.packages[""].peerDependencies["@modelcontextprotocol/sdk"], "1.32.2");
  assert.equal(sdkLock.packages["node_modules/@modelcontextprotocol/sdk"].version, "1.32.2");
});

test("customer docs and the Turbopack configuration match the reviewed pins", async () => {
  const [typescriptDocs, referenceDocs, sdkReadme, nextConfig] = await Promise.all([
    readFile(path.join(appRoot, "src/app/docs/typescript/page.tsx"), "utf8"),
    readFile(path.join(appRoot, "src/app/docs/reference/page.tsx"), "utf8"),
    readFile(path.join(appRoot, "packages/typescript-sdk/README.md"), "utf8"),
    readFile(path.join(appRoot, "next.config.ts"), "utf8"),
  ]);

  for (const source of [typescriptDocs, referenceDocs, sdkReadme]) {
    assert.match(source, /1\.32\.2/);
    assert.doesNotMatch(source, /1\.30\.0/);
  }
  assert.match(typescriptDocs, /cross-origin[\s\S]{0,160}redirect/i);
  assert.match(referenceDocs, /cross-origin[\s\S]{0,160}redirect/i);
  assert.match(nextConfig, /turbopack:\s*\{[\s\S]*root:\s*path\.resolve\(__dirname\)/);
});
