import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const packageRoot = path.resolve(process.cwd(), "..", "packages", "python-sdk");
const dist = path.join(packageRoot, "dist");

fs.mkdirSync(dist, { recursive: true });
const artifacts = fs.readdirSync(dist);
const hasWheel = artifacts.some((name) => name.endsWith(".whl"));
const hasSourceDistribution = artifacts.some((name) => name.endsWith(".tar.gz"));

if (hasWheel && hasSourceDistribution) {
  console.log("Python package artifacts already exist; keeping the reviewed build output.");
  process.exit(0);
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
