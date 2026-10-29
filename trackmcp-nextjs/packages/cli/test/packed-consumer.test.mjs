import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, writeFile, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("packed CLI installs cleanly and executes through the npm bin symlink", async () => {
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
    // npm exposes bin entries through node_modules/.bin symlinks. Running the
    // symlink is the production path used by npx and catches entrypoint guards
    // that compare the symlink path without resolving it.
    const helpRun = spawnSync("node", ["node_modules/.bin/trackmcp", "--help"], { cwd: consumer, env: { ...process.env }, encoding: "utf8", timeout: 15_000 });
    assert.equal(helpRun.status, 0);
    assert.equal(helpRun.error, undefined);
    assert.match(helpRun.stdout, /TrackMCP CLI/);

    // npm exec is the exact invocation used by the documented `npx` flow. It
    // resolves the package's .bin entry itself, so keep this path covered in
    // addition to invoking the symlink through node directly.
    const npmExecHelpRun = spawnSync("npm", ["exec", "--yes", "--", "trackmcp", "--help"], { cwd: consumer, env: { ...npmEnv, npm_config_loglevel: "error" }, encoding: "utf8", timeout: 15_000 });
    assert.equal(npmExecHelpRun.status, 0);
    assert.equal(npmExecHelpRun.error, undefined);
    assert.match(npmExecHelpRun.stdout, /TrackMCP CLI/);

    const initHelpRun = spawnSync("node", ["node_modules/.bin/trackmcp", "init", "--help"], { cwd: consumer, env: { ...process.env }, encoding: "utf8", timeout: 15_000 });
    assert.equal(initHelpRun.status, 0);
    assert.match(initHelpRun.stdout, /Usage: npx @trackmcp\/cli init/);

    const doctorRun = spawnSync("node", ["node_modules/.bin/trackmcp", "doctor", "--non-interactive"], { cwd: consumer, env: { ...process.env, TRACKMCP_INGEST_URL: "https://127.0.0.1:1" }, encoding: "utf8", timeout: 15_000 });
    assert.equal(doctorRun.status, 0);
    assert.equal(doctorRun.error, undefined);
    assert.match(doctorRun.stdout, /Node\.js:/);

    // This consumer check validates the packed CLI's deterministic
    // non-interactive boundary. Disable the optional SDK installer so a
    // registry outage cannot hang the release gate before that assertion.
    const resultRun = spawnSync("node", ["node_modules/.bin/trackmcp", "init", "--non-interactive", "--no-install"], { cwd: consumer, env: { ...process.env }, encoding: "utf8", timeout: 15_000 });
    assert.equal(resultRun.status, 1);
    assert.equal(resultRun.error, undefined);
    assert.match(resultRun.stderr, /No usable TRACKMCP_KEY/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
