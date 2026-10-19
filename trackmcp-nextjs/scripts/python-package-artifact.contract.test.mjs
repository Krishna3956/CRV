import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(process.cwd(), "..");
const packageRoot = path.join(repoRoot, "packages", "python-sdk");
const dist = path.join(packageRoot, "dist");
const wheel = fs.readdirSync(dist).find((name) => name.endsWith(".whl"));
const sdist = fs.readdirSync(dist).find((name) => name.endsWith(".tar.gz"));
assert.ok(wheel, "Python wheel artifact is required for release review");
assert.ok(sdist, "Python sdist artifact is required for release review");

const wheelFiles = execFileSync("unzip", ["-Z1", path.join(dist, wheel)], { encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
const sdistFiles = execFileSync("tar", ["-tzf", path.join(dist, sdist)], { encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
const forbidden = /(^|\/)(?:\.env(?:\.|$)|\.git(?:\/|$)|__pycache__(?:\/|$)|.*\.(?:pem|key|p12|csv|tsbuildinfo))$/i;

test("Python wheel contains only the runtime package and metadata", () => {
  assert.ok(wheelFiles.includes("trackmcp/__init__.py"));
  assert.ok(wheelFiles.includes("trackmcp/client.py"));
  assert.ok(wheelFiles.includes("trackmcp/privacy.py"));
  assert.equal(wheelFiles.some((file) => forbidden.test(file)), false);
  assert.equal(wheelFiles.some((file) => /(?:tests|egg-info|\.env|secret|credential)/i.test(file)), false);
});

test("Python source distribution contains no private or generated artifacts", () => {
  assert.equal(sdistFiles.some((file) => forbidden.test(file)), false);
  assert.equal(sdistFiles.some((file) => /(?:\.env|secret|credential|campaign)/i.test(file)), false);
  assert.ok(sdistFiles.some((file) => file.endsWith("/README.md")));
  assert.ok(sdistFiles.some((file) => file.endsWith("/pyproject.toml")));
});

test("Python package source has no literal credential assignments", () => {
  for (const file of ["trackmcp/client.py", "trackmcp/privacy.py", "trackmcp/__init__.py"]) {
    const source = fs.readFileSync(path.join(packageRoot, file), "utf8");
    assert.doesNotMatch(source, /(?:SUPABASE_SERVICE_ROLE_KEY|AWS_SECRET_ACCESS_KEY|BREVO_API_KEY)\s*=\s*['"][^'"]+['"]/);
  }
});
