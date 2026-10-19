import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDeviceClient, createRedeemer, pollDeviceSession } from "../lib/device-client.mjs";
import { openBrowser } from "../lib/browser.mjs";
import { ensureSdkInstalled } from "../lib/sdk-installer.mjs";
import { isUsableKey, readConfiguredKey, writeEnvKey } from "../lib/storage.mjs";
import { main, runDoctor, runInit } from "../bin/trackmcp.mjs";

const key = "tmcp_cli_test_key_12345678901234567890";
const response = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...extraHeaders } });

test("device start uses bounded non-secret metadata and prints no device code", async () => {
  let request;
  const client = createDeviceClient({ apiBaseUrl: "https://app.trackmcp.test", fetchImpl: async (_url, init) => { request = JSON.parse(init.body); return response({ device_code: "opaque-device-secret", user_code: "F7KQ-2M9D", verification_uri: "https://app.trackmcp.test/device", verification_uri_complete: "https://app.trackmcp.test/device?user_code=F7KQ-2M9D", expires_in: 600, interval: 5 }); } });
  const session = await client.startSession();
  assert.deepEqual(request, { client_version: "0.1.0", platform: `${process.platform}-${process.arch}`, package_manager: "npm", sdk_package: "@trackmcp/sdk" });
  assert.equal(session.deviceCode, "opaque-device-secret");
  assert.equal(session.userCode, "F7KQ-2M9D");
});

test("verification URLs require HTTPS unless explicitly enabled for local tests", async () => {
  const fetchImpl = async () => response({ device_code: "opaque-device-secret", user_code: "F7KQ-2M9D", verification_uri: "http://localhost:3000/device", expires_in: 600, interval: 5 }, 201);
  await assert.rejects(() => createDeviceClient({ apiBaseUrl: "https://app.trackmcp.test", fetchImpl }).startSession(), /invalid verification URL/);
  const local = await createDeviceClient({ apiBaseUrl: "https://app.trackmcp.test", fetchImpl, allowInsecureVerificationUrl: true }).startSession();
  assert.equal(local.verificationUri, "http://localhost:3000/device");
});

test("API base and browser opener require HTTPS outside localhost development", async () => {
  assert.throws(() => createDeviceClient({ apiBaseUrl: "http://app.trackmcp.test", fetchImpl: async () => response({}) }), /must use HTTPS/);
  assert.doesNotThrow(() => createDeviceClient({ apiBaseUrl: "http://localhost:3000", allowInsecureLocalDevelopment: true, fetchImpl: async () => response({}) }));
  assert.equal(await openBrowser("http://app.trackmcp.test/device", { spawnImpl: () => { throw new Error("must not spawn"); } }), false);
  const child = new EventEmitter();
  const local = await openBrowser("http://localhost:3000/device", { allowLocalDevelopment: true, spawnImpl: () => { queueMicrotask(() => child.emit("spawn")); return child; } });
  assert.equal(local, true);
});

test("browser opener handles success and failure without shell interpolation", async () => {
  const calls = [];
  const success = await openBrowser("https://app.trackmcp.test/device?user_code=F7KQ-2M9D", { platform: "linux", spawnImpl: (command, args, options) => { calls.push({ command, args, options }); const child = new EventEmitter(); queueMicrotask(() => child.emit("spawn")); return child; } });
  assert.equal(success, true);
  assert.equal(calls[0].command, "xdg-open");
  assert.equal(calls[0].options.shell, false);
  assert.equal(calls[0].args[0], "https://app.trackmcp.test/device?user_code=F7KQ-2M9D");
  const failure = await openBrowser("https://app.trackmcp.test/device", { spawnImpl: () => { const child = new EventEmitter(); queueMicrotask(() => child.emit("error", new Error("blocked"))); return child; } });
  assert.equal(failure, false);
});

test("polling follows server-directed intervals, approval, denial, expiry, and slow-down", async () => {
  let now = 0;
  const waits = [];
  const statuses = [{ status: "authorization_pending", interval: 2 }, { status: "slow_down", interval: 4 }, { status: "approved" }];
  const client = { poll: async () => statuses.shift() };
  const result = await pollDeviceSession(client, { deviceCode: "opaque", interval: 1, expiresIn: 30 }, { now: () => now, sleep: async (ms) => { waits.push(ms); now += ms; } });
  assert.equal(result.status, "approved");
  assert.deepEqual(waits, [1000, 2000, 4000]);
  for (const terminal of ["denied", "expired", "cancelled"]) {
    const output = await pollDeviceSession({ poll: async () => ({ status: terminal }) }, { deviceCode: "opaque", interval: 1, expiresIn: 30 }, { now: () => 0, sleep: async () => {} });
    assert.equal(output.status, terminal);
  }
});

test("polling has a local timeout and redemption is replay protected", async () => {
  let now = 0;
  const timeout = await pollDeviceSession({ poll: async () => ({ status: "authorization_pending" }) }, { deviceCode: "opaque", interval: 1, expiresIn: 30 }, { now: () => now, sleep: async (ms) => { now += ms; } , maxWaitMs: 1000 });
  assert.equal(timeout.status, "timeout");
  let calls = 0;
  const redeem = createRedeemer({ redeem: async () => { calls += 1; return { status: "approved", apiKey: key }; } });
  assert.equal((await redeem("opaque")).apiKey, key);
  assert.equal((await redeem("opaque")).status, "already_redeemed");
  assert.equal(calls, 1);
});

test("polling parses expiry and retries rate limits and network failures", async () => {
  const sleeps = [];
  let calls = 0;
  const client = createDeviceClient({
    apiBaseUrl: "https://app.trackmcp.test",
    maxRetries: 1,
    retrySleep: async (milliseconds) => sleeps.push(milliseconds),
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) return response({ error: "slow down" }, 429, { "retry-after": "2" });
      if (calls === 2) return response({ status: "authorization_pending", interval: 5 });
      return response({ status: "expired" }, 410);
    },
  });
  assert.equal((await client.poll("opaque-device-secret")).status, "authorization_pending");
  assert.equal((await client.poll("opaque-device-secret")).status, "expired");
  assert.deepEqual(sleeps, [2000]);

  let networkCalls = 0;
  const network = createDeviceClient({
    apiBaseUrl: "https://app.trackmcp.test",
    maxRetries: 2,
    retrySleep: async (milliseconds) => sleeps.push(milliseconds),
    fetchImpl: async () => {
      networkCalls += 1;
      if (networkCalls < 3) throw new Error("offline");
      return response({ status: "approved" });
    },
  });
  assert.equal((await network.poll("opaque-device-secret")).status, "approved");
  assert.equal(networkCalls, 3);
});

test("redemption keeps one identity across lost-response recovery and parses replay statuses", async () => {
  const requestBodies = [];
  let calls = 0;
  const client = createDeviceClient({
    apiBaseUrl: "https://app.trackmcp.test",
    maxRetries: 1,
    retrySleep: async () => {},
    fetchImpl: async (_url, init) => {
      requestBodies.push(JSON.parse(init.body));
      calls += 1;
      if (calls === 1) throw new Error("lost response");
      return response({ api_key: key, workspace: { id: "w", name: "Workspace", slug: "workspace" } }, 201);
    },
  });
  const recovered = await client.redeem("opaque-device-secret");
  assert.equal(recovered.status, "approved");
  assert.equal(requestBodies.length, 2);
  assert.equal(requestBodies[0].redemption_id, requestBodies[1].redemption_id);
  assert.match(requestBodies[0].redemption_id, /^[a-f0-9]{32}$/);

  const replay = createDeviceClient({ apiBaseUrl: "https://app.trackmcp.test", fetchImpl: async () => response({ status: "already_redeemed" }, 409) });
  assert.deepEqual(await replay.redeem("opaque-device-secret"), { status: "already_redeemed" });
  const expired = createDeviceClient({ apiBaseUrl: "https://app.trackmcp.test", fetchImpl: async () => response({ status: "expired" }, 410) });
  assert.deepEqual(await expired.redeem("opaque-device-secret"), { status: "expired" });

  const rateLimitBodies = [];
  let rateLimitCalls = 0;
  const rateLimited = createDeviceClient({
    apiBaseUrl: "https://app.trackmcp.test",
    maxRetries: 1,
    retrySleep: async () => {},
    fetchImpl: async (_url, init) => {
      rateLimitBodies.push(JSON.parse(init.body));
      rateLimitCalls += 1;
      if (rateLimitCalls === 1) return response({ error: "retry" }, 429, { "retry-after": "1" });
      return response({ api_key: key }, 201);
    },
  });
  assert.equal((await rateLimited.redeem("opaque-device-secret")).status, "approved");
  assert.equal(rateLimitBodies[0].redemption_id, rateLimitBodies[1].redemption_id);
});

test("redeemer preserves identity when a caller retries after a lost response", async () => {
  const calls = [];
  let attempt = 0;
  const redeemer = createRedeemer({
    redeem: async (_deviceCode, _keyName, options) => {
      calls.push(options.redemptionId);
      attempt += 1;
      if (attempt === 1) throw new Error("lost response");
      return { status: "approved", apiKey: key };
    },
  });
  await assert.rejects(() => redeemer("opaque-device-secret"), /lost response/);
  assert.equal((await redeemer("opaque-device-secret")).apiKey, key);
  assert.equal(calls.length, 2);
  assert.equal(calls[0], calls[1]);
});

test("init installs the SDK, skips the browser for an existing key, and prints the next step", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "trackmcp-cli-"));
  const logs = [];
  let installed = 0;
  const result = await runInit({
    cwd,
    env: { TRACKMCP_KEY: key },
    interactive: true,
    client: { keyStatus: async () => ({ category: "no_accepted_telemetry", workspaceAvailable: true, serviceAvailable: true }) },
    outputLog: (line) => logs.push(String(line)),
    ensureSdkInstalledImpl: async () => { installed += 1; return { installed: true, alreadyPresent: false, packageManager: "npm" }; },
  });
  assert.equal(result.status, "existing_key");
  assert.equal(installed, 1);
  assert.equal(logs.some((line) => line.includes("No browser authorization was needed")), true);
});

test("init does not trust revoked keys or overwrite keys when status is unavailable", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "trackmcp-cli-"));
  const logs = [];
  let started = 0;
  const revoked = await runInit({
    cwd,
    env: { TRACKMCP_KEY: key },
    interactive: false,
    flags: { nonInteractive: true, installSdk: false },
    client: { keyStatus: async () => ({ category: "revoked" }), startSession: async () => { started += 1; } },
    outputLog: (line) => logs.push(String(line)),
    errorLog: (line) => logs.push(String(line)),
    ensureSdkInstalledImpl: async () => ({ installed: true }),
  });
  assert.equal(revoked.status, "non_interactive");
  assert.equal(started, 0);

  const unavailable = await runInit({
    cwd,
    env: { TRACKMCP_KEY: key },
    interactive: true,
    flags: { installSdk: false },
    client: { keyStatus: async () => ({ category: "network_error" }), startSession: async () => { started += 1; } },
    outputLog: (line) => logs.push(String(line)),
    errorLog: (line) => logs.push(String(line)),
    ensureSdkInstalledImpl: async () => ({ installed: true }),
  });
  assert.equal(unavailable.status, "key_unverified");
  assert.equal(started, 0);
});

test("SDK installer uses the detected package manager and verifies the package", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "trackmcp-cli-"));
  await writeFile(join(cwd, "pnpm-lock.yaml"), "lockfileVersion: 9\n");
  let call;
  const result = await ensureSdkInstalled({
    cwd,
    execFileImpl: async (command, args, options) => {
      call = { command, args, options };
      await mkdir(join(cwd, "node_modules", "@trackmcp", "sdk"), { recursive: true });
      await writeFile(join(cwd, "node_modules", "@trackmcp", "sdk", "package.json"), JSON.stringify({ name: "@trackmcp/sdk", version: "0.1.2" }));
    },
    outputLog: () => {},
  });
  assert.equal(result.installed, true);
  assert.equal(result.alreadyPresent, false);
  assert.equal(call.command, "pnpm");
  assert.deepEqual(call.args, ["add", "@trackmcp/sdk"]);
  assert.equal(call.options.cwd, cwd);
});

test("init prints URL before browser open, supports no-browser, writes an atomic env file, and prints the SDK snippet", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "trackmcp-cli-"));
  const logs = [];
  let browserCalls = 0;
  const client = {
    startSession: async () => ({ deviceCode: "opaque", userCode: "CODE-1234", verificationUri: "https://app.trackmcp.test/device", expiresIn: 30, interval: 1 }),
    poll: async () => ({ status: "approved" }),
    redeem: async () => ({ status: "approved", apiKey: key }),
  };
  const result = await runInit({ cwd, client, interactive: true, flags: { browser: false, installSdk: false, envFile: ".env.local" }, outputLog: (line) => logs.push(String(line)), errorLog: (line) => logs.push(String(line)), sleep: async () => {}, now: () => 0, openBrowserImpl: async () => { browserCalls += 1; return true; }, confirmOverwrite: async () => false });
  assert.equal(result.status, "completed");
  assert.equal(logs.some((line) => line.includes("CODE-1234")), true);
  assert.equal(logs.some((line) => line.includes("opaque")), false);
  assert.equal(browserCalls, 0);
  assert.equal(logs.some((line) => line.includes("withTrackMCP")), true);
  assert.equal(await readFile(join(cwd, ".env.local"), "utf8"), `TRACKMCP_KEY=${key}\n`);
  assert.equal((await stat(join(cwd, ".env.local"))).mode & 0o077, 0);
});

test("existing environment values are preserved and existing keys are protected", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "trackmcp-cli-"));
  const path = join(cwd, ".env.local");
  await writeFile(path, "OTHER=value\nTRACKMCP_KEY=tmcp_old_key_12345678901234567890\n");
  assert.equal(isUsableKey("tmcp_old_key_12345678901234567890"), true);
  await assert.rejects(() => writeEnvKey(path, key), /already exists/);
  await writeEnvKey(path, key, { confirmOverwrite: async () => true });
  const content = await readFile(path, "utf8");
  assert.match(content, /OTHER=value/);
  assert.match(content, new RegExp(`TRACKMCP_KEY=${key}`));
  assert.equal((await readConfiguredKey({ cwd })).key, key);
});

test("CI/non-TTY init refuses to start a browser flow and positional keys are rejected", async () => {
  let started = false;
  const result = await runInit({ env: {}, flags: { browser: true, installSdk: false, nonInteractive: true }, client: { startSession: async () => { started = true; } }, errorLog: () => {} });
  assert.equal(result.status, "non_interactive");
  assert.equal(started, false);
  await assert.rejects(() => main(["init", key]), /must not be passed/);
});

test("setup remains an alias for init in non-interactive environments", async () => {
  let started = false;
  const result = await main(["setup", "--non-interactive", "--no-install"], {
    env: {},
    client: { startSession: async () => { started = true; } },
    errorLog: () => {},
  });
  assert.equal(result, 1);
  assert.equal(started, false);
});

test("doctor uses key-status and reachability only, never fake telemetry", async () => {
  const logs = [];
  const result = await runDoctor({ cwd: await mkdtemp(join(tmpdir(), "trackmcp-cli-")), env: { TRACKMCP_KEY: key }, client: { ingestReachability: async () => ({ reachable: true }), keyStatus: async (value) => { assert.equal(value, key); return { category: "no_accepted_telemetry", workspaceAvailable: true, serviceAvailable: true }; } }, outputLog: (line) => logs.push(line) });
  assert.equal(result.checks.keyStatus, "no_accepted_telemetry");
  assert.equal(result.checks.workspace, "available");
  assert.equal(result.checks.service, "available");
  assert.equal(logs.some((line) => String(line).includes("fake telemetry")), true);
});

test("doctor key-status categories cover accepted, revoked, unauthorized, permission, retryable, and network states", async () => {
  for (const [status, body, expected] of [
    [200, { status: "valid", accepted_telemetry: true }, "accepted_telemetry"],
    [200, { status: "revoked" }, "revoked"],
    [401, {}, "unauthorized"],
    [403, {}, "permission_denied"],
    [429, {}, "retryable"],
    [500, {}, "retryable"],
  ]) {
    const client = createDeviceClient({ fetchImpl: async () => response(body, status) });
    assert.equal((await client.keyStatus(key)).category, expected);
  }
  const network = createDeviceClient({ fetchImpl: async () => { throw new Error("network"); } });
  assert.equal((await network.keyStatus(key)).category, "network_error");
});

test("key-status preserves invalid and revoked responses and availability fields", async () => {
  const invalid = createDeviceClient({ fetchImpl: async () => response({ status: "invalid", workspace_available: false, service_available: true }, 401) });
  assert.deepEqual(await invalid.keyStatus(key), { category: "invalid", status: "invalid", workspaceAvailable: false, serviceAvailable: true });
  const revoked = createDeviceClient({ fetchImpl: async () => response({ status: "revoked", workspace_available: false, service_available: true }, 401) });
  assert.deepEqual(await revoked.keyStatus(key), { category: "revoked", status: "revoked", workspaceAvailable: false, serviceAvailable: true });
});
