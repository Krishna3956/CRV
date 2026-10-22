import { spawnSync } from "node:child_process";
import path from "node:path";

const appRoot = process.cwd();
const repoRoot = path.resolve(appRoot, "..");

function run(label, command, args, cwd) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
    // Package installation and consumer tests must not leave the release gate
    // waiting forever on a registry, child process, or leaked test handle.
    timeout: 180_000,
    killSignal: "SIGTERM",
  });
  if (result.error) {
    if (result.error.code === "ETIMEDOUT") throw new Error(`${label} timed out after 180 seconds`);
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${label} failed (exit ${result.status ?? "signal"})`);
  }
}

const typescript = path.join(appRoot, "packages/typescript-sdk");
const cli = path.join(appRoot, "packages/cli");
const python = path.join(repoRoot, "packages/python-sdk");

run("Install TypeScript SDK dependencies", "npm", ["ci"], typescript);
run("Install CLI dependencies", "npm", ["ci"], cli);
run("TypeScript SDK unit tests", "npm", ["test"], typescript);
run("TypeScript SDK packed consumer", "npm", ["run", "test:packed-consumer"], typescript);
run("CLI unit and lifecycle tests", "npm", ["test"], cli);
run("CLI packed consumer", "npm", ["run", "test:packed-consumer"], cli);
run("Python SDK unittest suite", "python3", ["-m", "unittest", "discover", "-s", "tests", "-v"], python);

console.log("\nPackage consumer gate passed (TypeScript SDK, CLI, and Python SDK).");
