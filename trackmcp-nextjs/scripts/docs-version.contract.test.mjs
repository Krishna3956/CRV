import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(process.cwd(), "..");
const read = (relative) => readFile(resolve(root, relative), "utf8");
const [docs, traceExplorer, sdkManifest, cliManifest, tsDocs, pythonDocs, goDocs, dotnetDocs, pilotRunbook, executionPlan, gapLedger] = await Promise.all([
  read("trackmcp-nextjs/src/app/docs/page.tsx"),
  read("trackmcp-nextjs/src/components/dashboard/TraceExplorer.tsx"),
  read("trackmcp-nextjs/packages/typescript-sdk/package.json"),
  read("trackmcp-nextjs/packages/cli/package.json"),
  read("trackmcp-nextjs/src/app/docs/typescript/page.tsx"),
  read("trackmcp-nextjs/src/app/docs/python/page.tsx"),
  read("trackmcp-nextjs/src/app/docs/go/page.tsx"),
  read("trackmcp-nextjs/src/app/docs/dotnet/page.tsx"),
  read("docs/FOUNDER-OS-100-CUSTOMER-PILOT-RUNBOOK.md"),
  read("docs/FOUNDER-OS-100-CUSTOMER-PILOT-MASTER-EXECUTION-PLAN.md"),
  read("docs/FOUNDER-OS-PILOT-GAP-LEDGER.md"),
]);
const sdkVersion = JSON.parse(sdkManifest).version;
const cliVersion = JSON.parse(cliManifest).version;
const pythonVersion = /version = "([^"]+)"/.exec(await read("packages/python-sdk/pyproject.toml"))?.[1];

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

test("CLI device metadata defaults to its package manifest version", async () => {
  const clientSource = await read("trackmcp-nextjs/packages/cli/lib/device-client.mjs");
  assert.match(clientSource, /const CLI_VERSION = require\("\.\.\/package\.json"\)\.version/);
  assert.match(clientSource, /clientVersion = CLI_VERSION/);
  assert.match(docs, new RegExp(`current CLI is ${cliVersion}`));
});

test("SDK documentation examples stay aligned with package versions", () => {
  assert.ok(pythonVersion);
  assert.match(docs, new RegExp(`sdk_version: "${sdkVersion}"`));
  assert.match(tsDocs, new RegExp(`sdk_version: "${sdkVersion}"`));
  assert.match(goDocs, new RegExp(`SDKVersion: "${sdkVersion}"`));
  assert.match(dotnetDocs, new RegExp(`SdkVersion: "${sdkVersion}"`));
  assert.match(pythonDocs, new RegExp(`sdk_version="${pythonVersion}"`));
});

test("active pilot documents stay aligned without rewriting historical snapshots", () => {
  const currentTrain = `@trackmcp/sdk@${sdkVersion}`;
  const currentCli = `@trackmcp/cli@${cliVersion}`;
  const currentPython = `trackmcp==${pythonVersion}`;
  for (const source of [pilotRunbook, executionPlan]) {
    assert.match(source, new RegExp(currentTrain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(source, new RegExp(currentCli.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(source, new RegExp(currentPython.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(gapLedger, new RegExp("(?:published|release candidate) `" + sdkVersion + "`"));
  assert.match(gapLedger, new RegExp("(?:published|release candidate) `" + pythonVersion + "`"));
  const activeRunbook = pilotRunbook.slice(pilotRunbook.indexOf("## 9. Package publication"), pilotRunbook.indexOf("## 10. Load and failure recovery"));
  assert.ok(activeRunbook.length > 0);
  assert.doesNotMatch(activeRunbook, /0\.1\.16|0\.1\.7/);
  const activePlan = executionPlan.slice(executionPlan.indexOf("## Workstream 12 Packages and public claims"));
  assert.doesNotMatch(activePlan, /reviewed release line is `@trackmcp\/sdk@0\.1\.16`/);
});
