import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(new URL("../../.github/workflows/publish.yml", import.meta.url), "utf8");
const ciWorkflow = await readFile(new URL("../../.github/workflows/ci.yml", import.meta.url), "utf8");

test("web CI blocks high-severity production dependency advisories", () => {
  assert.match(ciWorkflow, /npm audit --omit=dev --audit-level=high/);
  assert.match(ciWorkflow, /actions\/setup-python@v5/);
  assert.match(ciWorkflow, /python3 -m build/);
  assert.match(ciWorkflow, /python3 -m twine check dist\/\*/);
});

test("npm publication requires provenance and package preflight tests", () => {
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /Audit all release artifacts before publishing/);
  assert.match(workflow, /npm run test:package-release-audit/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run test:packed-consumer/);
  assert.match(workflow, /npm audit --audit-level=high/);
  assert.match(workflow, /npm view "@trackmcp\/sdk@\$\{PACKAGE_VERSION\}" version/);
  assert.match(workflow, /npm view "@trackmcp\/cli@\$\{PACKAGE_VERSION\}" version/);
  assert.match(workflow, /npm publish --provenance --access public/);
});

test("PyPI publication runs tests and validates built artifacts", () => {
  assert.match(workflow, /python -m unittest discover -s tests -v/);
  assert.match(workflow, /python -m build/);
  assert.match(workflow, /python -m twine check dist\/\*/);
  assert.match(workflow, /https:\/\/pypi\.org\/pypi\/trackmcp\/\$\{PACKAGE_VERSION\}\/json/);
});
