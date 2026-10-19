#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createDeviceClient, createRedeemer, pollDeviceSession } from "../lib/device-client.mjs";
import { openBrowser } from "../lib/browser.mjs";
import { findEnvironment, isGitTracked, logout, readConfiguredKey, writeEnvKey } from "../lib/storage.mjs";
import { detectPackageManager, ensureSdkInstalled, findInstalledSdkPackage } from "../lib/sdk-installer.mjs";

function parseArgs(argv) {
  const [commandArg = "init", ...rest] = argv;
  const command = commandArg === "setup" ? "init" : commandArg;
  if (!["init", "doctor", "logout"].includes(command)) throw new Error("Usage: npx @trackmcp/cli init|doctor|logout");
  const flags = { browser: true, installSdk: true, nonInteractive: false, envFile: process.env.TRACKMCP_ENV_FILE || ".env.local" };
  for (const arg of rest) {
    if (arg === "--no-browser" || arg === "--browser=false") flags.browser = false;
    else if (arg === "--browser=true") flags.browser = true;
    else if (arg === "--no-install") flags.installSdk = false;
    else if (arg === "--non-interactive") flags.nonInteractive = true;
    else if (arg.startsWith("--env-file=")) flags.envFile = arg.slice("--env-file=".length);
    else if (arg.startsWith("--")) throw new Error(`Unknown option: ${arg.split("=", 1)[0]}`);
    else throw new Error("API keys must not be passed as command-line arguments. Use TRACKMCP_KEY or the browser flow.");
  }
  return { command, flags };
}

function isInteractive(flags) {
  return !flags.nonInteractive && process.env.CI !== "true" && Boolean(input.isTTY && output.isTTY);
}

async function sdkVersion(cwd) {
  const packageJson = await findInstalledSdkPackage({ cwd });
  return typeof packageJson?.version === "string" ? packageJson.version : undefined;
}

export async function runDoctor({ cwd = process.cwd(), envFile, client = createDeviceClient(), env = process.env, outputLog = console.log } = {}) {
  const files = await findEnvironment({ cwd, envFile });
  const configured = await readConfiguredKey({ cwd, envFile, env });
  const checks = {
    node: process.versions.node,
    sdk: (await sdkVersion(cwd)) || "not found",
    packageManager: await detectPackageManager(cwd),
    environmentFiles: files.map((file) => ({ path: file.path, hasKey: file.hasKey })),
    key: configured.key ? "present" : env.TRACKMCP_KEY ? "malformed" : "missing",
  };
  const reachability = await client.ingestReachability();
  checks.ingest = reachability.reachable ? "reachable" : "network_error";
  if (configured.key) {
    const keyStatus = await client.keyStatus(configured.key);
    checks.keyStatus = keyStatus.category;
    checks.workspace = keyStatus.workspaceAvailable ? "available" : "unavailable";
    checks.service = keyStatus.serviceAvailable ? "available" : "unavailable";
  } else {
    checks.keyStatus = "not_checked";
    checks.workspace = "not_checked";
    checks.service = "not_checked";
  }
  const lines = [
    `Node.js: ${checks.node}`,
    `@trackmcp/sdk: ${checks.sdk}`,
    `Package manager: ${checks.packageManager}`,
    `Environment files: ${checks.environmentFiles.length ? checks.environmentFiles.map((file) => file.path).join(", ") : "none found"}`,
    `TRACKMCP_KEY: ${checks.key}`,
    `Ingest endpoint: ${checks.ingest}`,
    `Key status: ${checks.keyStatus}`,
    `Workspace: ${checks.workspace}`,
    `Service: ${checks.service}`,
  ];
  for (const line of lines) outputLog(line);
  if (configured.key && checks.keyStatus === "no_accepted_telemetry") outputLog("Next step: restart the MCP server and make one real tool call; doctor never sends fake telemetry.");
  return { checks, lines };
}

async function askOverwrite() {
  if (!(input.isTTY && output.isTTY) || process.env.CI === "true") return false;
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question("TRACKMCP_KEY already exists. Overwrite it? [y/N] ");
    return /^y(?:es)?$/i.test(answer.trim());
  } finally { rl.close(); }
}

export async function runInit({ cwd = process.cwd(), flags = {}, client = createDeviceClient(), env = process.env, outputLog = console.log, errorLog = console.error, sleep, now, interactive, openBrowserImpl = openBrowser, confirmOverwrite, ensureSdkInstalledImpl = ensureSdkInstalled } = {}) {
  const resolvedFlags = { browser: true, installSdk: true, envFile: ".env.local", nonInteractive: false, ...flags };
  await ensureSdkInstalledImpl({ cwd, install: resolvedFlags.installSdk, outputLog, env });
  const existing = await readConfiguredKey({ cwd, envFile: resolvedFlags.envFile, env });
  if (existing.key) {
    let keyStatus;
    try { keyStatus = await client.keyStatus(existing.key); } catch { keyStatus = { category: "network_error" }; }
    const valid = keyStatus?.category === "accepted_telemetry" || keyStatus?.category === "no_accepted_telemetry";
    if (valid && keyStatus.workspaceAvailable !== false && keyStatus.serviceAvailable !== false) {
      outputLog(`TrackMCP is already connected (${existing.source}). No browser authorization was needed.`);
      return { status: "existing_key", source: existing.source, keyStatus: keyStatus.category };
    }
    if (!["invalid", "revoked", "malformed", "unauthorized"].includes(keyStatus?.category)) {
      errorLog(`TrackMCP could not verify the existing key (${keyStatus?.category || "unknown"}). No credential was changed; retry when the service is reachable.`);
      return { status: "key_unverified", source: existing.source, keyStatus: keyStatus?.category || "unknown" };
    }
    outputLog("The existing TrackMCP key is not valid anymore. Starting a new browser authorization.");
  }
  if (!(interactive ?? isInteractive(resolvedFlags))) {
    errorLog("No usable TRACKMCP_KEY was found. init needs an interactive terminal; set TRACKMCP_KEY in CI or run init locally.");
    return { status: "non_interactive" };
  }
  const session = await client.startSession();
  const verificationUrl = session.verificationUriComplete || session.verificationUri;
  outputLog(`\nOpen this URL to authorize TrackMCP:\n${verificationUrl}\n\nYour verification code: ${session.userCode}\n`);
  if (resolvedFlags.browser) {
    const opened = await openBrowserImpl(verificationUrl);
    if (!opened) outputLog("The browser could not be opened. Use the URL and code above on another device.");
  }
  outputLog("Waiting for browser approval (press Ctrl-C to cancel)…");
  const result = await pollDeviceSession(client, session, { sleep, now });
  if (result.status !== "approved") {
    if (result.status === "denied") errorLog(`TrackMCP authorization was denied (${result.reasonCategory || "user_denied"}). Run npx @trackmcp/cli init to try again.`);
    else if (result.status === "expired") errorLog("The TrackMCP device session expired. Run npx @trackmcp/cli init to try again.");
    else if (result.status === "timeout") errorLog("TrackMCP authorization timed out. Run npx @trackmcp/cli init to try again.");
    else errorLog("TrackMCP authorization was cancelled. No credential was written.");
    return result;
  }
  const redeemed = await createRedeemer(client)(session.deviceCode);
  if (redeemed.status === "retryable") {
    errorLog("TrackMCP redemption could not be completed after bounded retries. Run init again to retry with a new device session.");
    return redeemed;
  }
  if (redeemed.status === "expired") {
    errorLog("The TrackMCP device session expired before redemption. Run npx @trackmcp/cli init to try again.");
    return redeemed;
  }
  if (redeemed.status === "denied") {
    errorLog("TrackMCP authorization was denied. No credential was written.");
    return redeemed;
  }
  if (redeemed.status === "already_redeemed" || !redeemed.apiKey) {
    errorLog("This TrackMCP device session has already been redeemed. Run init again for a new session.");
    return { status: "already_redeemed" };
  }
  const target = resolve(cwd, resolvedFlags.envFile);
  const tracked = await isGitTracked(target, { cwd });
  if (tracked) outputLog(`Warning: ${resolvedFlags.envFile} is tracked by Git. Add it to .gitignore before committing.`);
  await writeEnvKey(target, redeemed.apiKey, { confirmOverwrite: confirmOverwrite || askOverwrite });
  outputLog(`Saved TRACKMCP_KEY to ${resolvedFlags.envFile} with restrictive permissions.`);
  outputLog("\nTrackMCP is ready. Next, wrap your MCP server and make one real tool call:");
  outputLog('import { withTrackMCP } from "@trackmcp/sdk";\n\nexport default withTrackMCP(server, {\n  apiKey: process.env.TRACKMCP_KEY,\n  service: "my-mcp-server",\n});');
  return { status: "completed", path: target, workspace: redeemed.workspace };
}

export async function main(argv = process.argv.slice(2), dependencies = {}) {
  const { command, flags } = parseArgs(argv);
  if (command === "logout") {
    await logout({ sessionFile: resolve(dependencies.cwd || process.cwd(), ".trackmcp-session.json") });
    (dependencies.outputLog || console.log)("Removed local TrackMCP CLI session metadata. Environment keys were not changed.");
    return 0;
  }
  const client = dependencies.client || createDeviceClient();
  if (command === "doctor") {
    await runDoctor({ ...dependencies, flags, client });
    return 0;
  }
  const result = await runInit({ ...dependencies, flags, client });
  return result.status === "completed" || result.status === "existing_key" ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : "TrackMCP CLI failed.");
    process.exitCode = 1;
  }
}
