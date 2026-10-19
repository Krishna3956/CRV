import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const appRoot = process.cwd();
const repoRoot = path.resolve(appRoot, "..");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function packManifest(packageDir) {
  const output = execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
    cwd: packageDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  const [manifest] = JSON.parse(output);
  assert.ok(manifest, `npm pack returned no manifest for ${packageDir}`);
  return manifest;
}

const npmPackages = [
  {
    name: "@trackmcp/sdk",
    dir: path.join(appRoot, "packages/typescript-sdk"),
    required: ["README.md", "package.json", "dist/index.js", "dist/index.d.ts"],
  },
  {
    name: "@trackmcp/cli",
    dir: path.join(appRoot, "packages/cli"),
    required: ["README.md", "package.json", "bin/trackmcp.mjs", "lib/device-client.mjs"],
  },
];

for (const pkg of npmPackages) {
  const manifest = packManifest(pkg.dir);
  assert.equal(manifest.name, pkg.name);
  assert.match(manifest.version, /^0\.\d+\.\d+$/);
  const files = new Set(manifest.files.map(({ path: file }) => file));
  for (const required of pkg.required) assert.ok(files.has(required), `${pkg.name} tarball omits ${required}`);

  const packageJson = readJson(path.join(pkg.dir, "package.json"));
  assert.equal(packageJson.version, manifest.version);
  assert.ok(packageJson.repository?.url?.includes("github.com/Krishna3956/CRV"));
  assert.ok(!packageJson.scripts?.postinstall, `${pkg.name} must not use postinstall`);
  assert.ok(!packageJson.scripts?.preinstall, `${pkg.name} must not use preinstall`);
}

const pythonDir = path.join(repoRoot, "packages/python-sdk");
const pyproject = fs.readFileSync(path.join(pythonDir, "pyproject.toml"), "utf8");
assert.match(pyproject, /^name\s*=\s*"trackmcp"/m);
const version = pyproject.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
assert.match(version ?? "", /^0\.\d+\.\d+$/);
assert.match(pyproject, /Homepage\s*=\s*"https:\/\/trackmcp\.com/);
const sdkReadme = fs.readFileSync(path.join(appRoot, "packages/typescript-sdk/README.md"), "utf8");
assert.match(sdkReadme, /npm install @trackmcp\/sdk(?:[.`\s]|$)/);
assert.doesNotMatch(sdkReadme, /npm install @trackmcp\/sdk@0\.1\.1/);
const pythonReadme = fs.readFileSync(path.join(pythonDir, "README.md"), "utf8");
assert.match(pythonReadme, /python3 -m pip install trackmcp/);
assert.match(pythonReadme, /from mcp\.server\.fastmcp import FastMCP/);
assert.doesNotMatch(pythonReadme, /from mcp\.server import server/);
assert.doesNotMatch(pythonReadme, /pip install trackmcp==0\.1\.1/);
for (const required of ["README.md", "pyproject.toml", "trackmcp/__init__.py", "trackmcp/client.py"]) {
  assert.ok(fs.existsSync(path.join(pythonDir, required)), `Python package omits ${required}`);
}

console.log(`Package release audit passed: ${npmPackages.map(({ name }) => name).join(", ")} and trackmcp ${version}`);
