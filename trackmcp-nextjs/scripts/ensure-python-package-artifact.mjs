import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const packageRoot = path.resolve(process.cwd(), "..", "packages", "python-sdk");
const dist = path.join(packageRoot, "dist");

fs.mkdirSync(dist, { recursive: true });
const pyproject = fs.readFileSync(path.join(packageRoot, "pyproject.toml"), "utf8");
const expectedVersion = pyproject.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
if (!expectedVersion) throw new Error("Python package version is missing from pyproject.toml");
const artifacts = fs.readdirSync(dist);
const hasWheel = artifacts.some((name) => name === `trackmcp-${expectedVersion}-py3-none-any.whl`);
const hasSourceDistribution = artifacts.some((name) => name === `trackmcp-${expectedVersion}.tar.gz`);

if (hasWheel && hasSourceDistribution) {
  console.log(`Python package artifacts for ${expectedVersion} already exist; keeping the reviewed build output.`);
  process.exit(0);
}

// Do not let an ignored artifact from an older release satisfy the gate or get
// selected by a later audit. Only generated package outputs are removed here;
// source files and tracked release metadata are untouched.
for (const name of artifacts) {
  if (/^trackmcp-.*\.(?:whl|tar\.gz)$/.test(name)) fs.rmSync(path.join(dist, name), { force: true });
}

const result = spawnSync(
  process.env.PYTHON ?? "python3",
  ["-m", "build", "--wheel", "--sdist", "--outdir", dist, packageRoot],
  { stdio: "inherit", timeout: 180_000, killSignal: "SIGTERM" },
);

if (result.error) {
  console.error(`Python package artifact build could not complete: ${result.error.message}`);
  process.exit(1);
}
if (result.status !== 0) {
  console.error("Python package artifact build failed. Install the Python `build` package and retry.");
  process.exit(result.status || 1);
}
