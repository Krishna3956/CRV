import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, writeFile, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("packed CLI installs cleanly and exposes init, setup, doctor, and logout", async () => {
  const root = await mkdtemp(join(tmpdir(), "trackmcp-cli-pack-"));
  const packDir = join(root, "pack");
  const consumer = join(root, "consumer");
  const npmEnv = { ...process.env, npm_config_cache: join(root, "npm-cache") };
  await Promise.all([mkdir(packDir), mkdir(consumer)]);
  try {
    const result = JSON.parse(execFileSync("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", packDir], { cwd: new URL("..", import.meta.url), env: npmEnv, encoding: "utf8" }))[0];
    const tarball = join(packDir, result.filename);
    await writeFile(join(consumer, "package.json"), JSON.stringify({ name: "trackmcp-cli-consumer", private: true, type: "module", dependencies: { "@trackmcp/cli": `file:${tarball}` } }));
    execFileSync("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund"], { cwd: consumer, env: npmEnv, stdio: "pipe" });
    const resultRun = spawnSync("node", ["node_modules/@trackmcp/cli/bin/trackmcp.mjs", "init", "--non-interactive", "--no-install"], { cwd: consumer, env: { ...process.env }, encoding: "utf8" });
    assert.equal(resultRun.status, 1);
    assert.match(resultRun.stderr, /No usable TRACKMCP_KEY/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
