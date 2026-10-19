import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
const scripts = Object.keys(packageJson.scripts)
  .filter((name) => name.startsWith("test:") || name.startsWith("seo:"))
  // These two audits intentionally exercise a running production server and
  // are run by the separate browser-smoke job when a server is available.
  .filter((name) => !["test:release-gate", "test:seo-breadcrumbs", "seo:audit"].includes(name))
  .sort();

for (const name of scripts) {
  console.log(`\n▶ npm run ${name}`);
  const result = spawnSync("npm", ["run", name], { stdio: "inherit", shell: process.platform === "win32" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    console.error(`\nRelease gate failed at ${name} (exit ${result.status ?? "signal"}).`);
    process.exit(result.status || 1);
  }
}

console.log(`\nRelease gate passed (${scripts.length} suites).`);
