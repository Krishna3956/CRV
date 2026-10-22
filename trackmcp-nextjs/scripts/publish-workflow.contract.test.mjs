import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(new URL("../../.github/workflows/publish.yml", import.meta.url), "utf8");
const ciWorkflow = await readFile(new URL("../../.github/workflows/ci.yml", import.meta.url), "utf8");

test("web CI blocks high-severity production dependency advisories", () => {
  assert.match(ciWorkflow, /web-and-javascript:[\s\S]*?timeout-minutes:\s*30/);
  assert.match(ciWorkflow, /go:[\s\S]*?timeout-minutes:\s*10/);
  assert.match(ciWorkflow, /dotnet:[\s\S]*?timeout-minutes:\s*10/);
  assert.match(ciWorkflow, /npm audit --omit=dev --audit-level=high/);
  assert.match(ciWorkflow, /actions\/setup-python@v5/);
  assert.match(ciWorkflow, /python3 -m build/);
  assert.match(ciWorkflow, /python3 -m twine check dist\/\*/);
});

test("npm publication requires provenance and package preflight tests", () => {
  assert.doesNotMatch(workflow, /^\s*push:/m, "package publication must be deliberate, not push-triggered");
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /attestations:\s*write/);
  assert.match(workflow, /actions\/attest-build-provenance@v2/);
  assert.match(workflow, /Attest TypeScript SDK artifact/);
  assert.match(workflow, /Attest TrackMCP CLI artifact/);
  assert.match(workflow, /npm pack --pack-destination "\$RUNNER_TEMP"/);
  assert.match(workflow, /Audit all release artifacts before publishing/);
  assert.match(workflow, /npm run test:package-release-audit/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run test:packed-consumer/);
  assert.match(workflow, /npm audit --audit-level=high/);
  assert.match(workflow, /npm view "@trackmcp\/sdk@\$\{PACKAGE_VERSION\}" version/);
  assert.match(workflow, /npm view "@trackmcp\/cli@\$\{PACKAGE_VERSION\}" version/);
  assert.match(workflow, /npm publish --provenance --access public/);
  assert.match(workflow, /Verify TypeScript SDK registry publication/);
  assert.match(workflow, /npm view "@trackmcp\/sdk@\$\{PACKAGE_VERSION\}" --json/);
  assert.match(workflow, /sha512-\[A-Za-z0-9\+\/=/);
  assert.match(workflow, /registry\.npmjs\.org/);
  assert.match(workflow, /Registry propagation pending/);
  assert.match(workflow, /confirm:[\s\S]*?RELEASE_TRAIN_APPROVED/);
  assert.match(workflow, /Require reviewed release-train confirmation/);
  assert.match(workflow, /inputs\.confirm.*RELEASE_TRAIN_APPROVED/);
  assert.match(workflow, /options: \[typescript, python, cli, all\]/);
  assert.match(workflow, /inputs\.package == 'typescript' \|\| inputs\.package == 'all'/);
  assert.match(workflow, /inputs\.package == 'cli' \|\| inputs\.package == 'all'/);
  assert.match(workflow, /inputs\.package == 'python' \|\| inputs\.package == 'all'/);
  assert.match(workflow, /Preflight all release-train registry versions/);
  assert.match(workflow, /if: inputs\.package == 'all'/);
  assert.match(workflow, /All release-train versions are absent from npm\/PyPI/);
});

test("Python publication is deliberate and confirmation-gated", async () => {
  const pythonWorkflow = await readFile(new URL("../../.github/workflows/publish-python.yml", import.meta.url), "utf8");
  assert.match(pythonWorkflow, /workflow_dispatch:/);
  assert.match(pythonWorkflow, /description:.*RELEASE_TRAIN_APPROVED/);
  assert.match(pythonWorkflow, /if: inputs\.confirm == 'RELEASE_TRAIN_APPROVED'/);
  assert.doesNotMatch(pythonWorkflow, /^\s*push:/m);
  assert.match(pythonWorkflow, /Audit all release artifacts before publishing/);
  assert.match(pythonWorkflow, /npm run test:package-release-audit/);
  assert.match(pythonWorkflow, /attestations:\s*write/);
  assert.match(pythonWorkflow, /actions\/attest-build-provenance@v2/);
});

test("PyPI publication runs tests and validates built artifacts", () => {
  assert.match(workflow, /working-directory: packages\/python-sdk[\s\S]*?python -m unittest discover -s tests -v/);
  assert.match(workflow, /python -m unittest discover -s tests -v/);
  assert.match(workflow, /python -m build/);
  assert.match(workflow, /python -m twine check dist\/\*/);
  assert.match(workflow, /https:\/\/pypi\.org\/pypi\/trackmcp\/\$\{PACKAGE_VERSION\}\/json/);
  assert.match(workflow, /Attest Python SDK artifacts/);
  assert.match(workflow, /packages\/python-sdk\/dist\/\*/);
});

test("Python publication refuses an immutable duplicate version", async () => {
  const pythonWorkflow = await readFile(new URL("../../.github/workflows/publish-python.yml", import.meta.url), "utf8");
  assert.match(pythonWorkflow, /https:\/\/pypi\.org\/pypi\/trackmcp\/\$\{PACKAGE_VERSION\}\/json/);
  assert.match(pythonWorkflow, /already exists on PyPI; bump the package version before publishing/);
  assert.match(pythonWorkflow, /python -m twine check dist\/\*/);
});
