import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
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

const credentialPatterns = [
  { kind: "assignment", pattern: /(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ACCESS_TOKEN|BREVO_API_KEY|AWS_SECRET_ACCESS_KEY|NPM_TOKEN|PYPI_TOKEN|(?:OPENAI|ANTHROPIC)_API_KEY)\s*=\s*(?![<$\{])["']?([^\s"'`]+)["']?/i },
  { kind: "bearer", pattern: /Bearer\s+[A-Za-z0-9._-]{24,}/i },
  { kind: "trackmcp-key", pattern: /\btmcp_[A-Za-z0-9_-]{20,}/i },
  { kind: "device-code", pattern: /\bdevice_code\s*[:=]\s*["'][A-Za-z0-9_-]{20,}["']/i },
  { kind: "user-code", pattern: /\buser_code\s*[:=]\s*["'][A-Z0-9]{4,8}-[A-Z0-9]{4,8}["']/i },
  { kind: "redemption-id", pattern: /\bredemption_id\s*[:=]\s*["'][a-f0-9]{32,}["']/i },
];

function scanArtifactTree(root) {
  const findings = [];
  const textExtensions = /\.(?:cjs|d\.ts|hbs|js|json|md|mjs|py|rst|sh|toml|ts|tsx|txt|yml|yaml)$/i;
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile() && textExtensions.test(entry.name) && fs.statSync(file).size <= 2 * 1024 * 1024) {
        const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
        lines.forEach((line, index) => {
          for (const { kind, pattern } of credentialPatterns) {
            const match = pattern.exec(line);
            if (!match) continue;
            const relativeFile = path.relative(root, file);
            // Published packages may carry bounded test/example fixtures. They
            // are intentionally allowed to contain credential-shaped literals,
            // but real package/runtime files must remain clean.
            if (!/(?:test|spec|fixture|example|docs|README)/i.test(relativeFile)) {
              findings.push({ file: relativeFile, line: index + 1, kind });
            }
            break;
          }
        });
      }
    }
  };
  visit(root);
  return findings;
}

function inspectNpmArtifact(packageDir, tempRoot) {
  const output = execFileSync("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", tempRoot], {
    cwd: packageDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  const [manifest] = JSON.parse(output);
  assert.ok(manifest?.filename, `npm pack returned no artifact for ${packageDir}`);
  const archive = path.join(tempRoot, manifest.filename);
  const extracted = path.join(tempRoot, `${manifest.name.replace(/[^a-z0-9]+/gi, "-")}-${manifest.version}`);
  fs.mkdirSync(extracted);
  execFileSync("tar", ["-xzf", archive, "-C", extracted]);
  return { manifest, findings: scanArtifactTree(extracted) };
}

function inspectPythonArtifacts(packageRoot, tempRoot) {
  const dist = path.join(packageRoot, "dist");
  const wheel = fs.readdirSync(dist).find((name) => name.endsWith(".whl"));
  const sdist = fs.readdirSync(dist).find((name) => name.endsWith(".tar.gz"));
  assert.ok(wheel, "Python wheel artifact is required for release review");
  assert.ok(sdist, "Python sdist artifact is required for release review");
  const wheelDir = path.join(tempRoot, "python-wheel");
  const sdistDir = path.join(tempRoot, "python-sdist");
  fs.mkdirSync(wheelDir);
  fs.mkdirSync(sdistDir);
  execFileSync("unzip", ["-q", path.join(dist, wheel), "-d", wheelDir]);
  execFileSync("tar", ["-xzf", path.join(dist, sdist), "-C", sdistDir]);
  return [
    ...scanArtifactTree(wheelDir),
    ...scanArtifactTree(sdistDir),
  ];
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

const artifactTempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "trackmcp-package-release-audit-"));
const artifactFindings = [];
let artifactFileCount = 0;

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
  const packed = inspectNpmArtifact(pkg.dir, artifactTempRoot);
  artifactFindings.push(...packed.findings.map((finding) => ({ ...finding, package: pkg.name })));
  artifactFileCount += packed.manifest.files.length;
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

const pythonFindings = inspectPythonArtifacts(pythonDir, artifactTempRoot);
artifactFindings.push(...pythonFindings.map((finding) => ({ ...finding, package: "trackmcp" })));
assert.deepEqual(artifactFindings, [], `Published package artifacts contain credential-shaped values: ${JSON.stringify(artifactFindings)}`);
fs.rmSync(artifactTempRoot, { recursive: true, force: true });

console.log(`Package release audit passed: ${npmPackages.map(({ name }) => name).join(", ")} and trackmcp ${version}; scanned ${artifactFileCount + pythonFindings.length} artifact files for credential-shaped values`);
