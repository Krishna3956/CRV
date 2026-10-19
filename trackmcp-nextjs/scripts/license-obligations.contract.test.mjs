import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const appRoot = process.cwd();
const repoRoot = path.resolve(appRoot, "..");
const webPackage = JSON.parse(fs.readFileSync(path.join(appRoot, "package.json"), "utf8"));
const lock = JSON.parse(fs.readFileSync(path.join(appRoot, "package-lock.json"), "utf8"));

test("direct web production dependencies declare license metadata", () => {
  for (const name of Object.keys(webPackage.dependencies || {})) {
    const entry = lock.packages?.[`node_modules/${name}`];
    assert.ok(entry, `lockfile is missing direct dependency ${name}`);
    assert.ok(entry.license || entry.licenses, `${name} has no declared license metadata in package-lock.json`);
  }
});

test("published package manifests carry an explicit license and repository", () => {
  for (const relative of ["trackmcp-nextjs/packages/typescript-sdk/package.json", "trackmcp-nextjs/packages/cli/package.json"]) {
    const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, relative), "utf8"));
    assert.equal(pkg.license, "MIT", `${pkg.name} license must remain explicit`);
    assert.match(pkg.repository?.url || "", /github\.com\/Krishna3956\/CRV/);
  }
  const pyproject = fs.readFileSync(path.join(repoRoot, "packages/python-sdk/pyproject.toml"), "utf8");
  assert.match(pyproject, /^license\s*=\s*"MIT"$/m);
  assert.match(pyproject, /^Repository\s*=\s*"https:\/\/github\.com\/Krishna3956\/CRV/m);
});

test("license audit does not silently permit checked-in private notice material", () => {
  const tracked = fs.readdirSync(path.join(repoRoot, "packages/python-sdk"), { withFileTypes: true }).map((entry) => entry.name);
  assert.equal(tracked.some((name) => /^(?:LICENSE|NOTICE)\.private$/i.test(name)), false);
});
