#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { exec } from "node:child_process";

const dashboard = process.env.TRACKMCP_DASHBOARD_URL || "https://trackmcp.com/dashboard";
const envFile = process.env.TRACKMCP_ENV_FILE || ".env.local";
const command = process.argv[2] || "setup";

function open(url) {
  const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  exec(`${opener} "${url}"`, () => {});
}

function saveKey(key) {
  const line = `TRACKMCP_KEY=${key}`;
  if (existsSync(envFile)) {
    const current = readFileSync(envFile, "utf8");
    const updated = current.match(/^TRACKMCP_KEY=.*$/m) ? current.replace(/^TRACKMCP_KEY=.*$/m, line) : `${current.trimEnd()}\n${line}\n`;
    writeFileSync(envFile, updated);
  } else {
    writeFileSync(envFile, `${line}\n`);
  }
}

if (!["setup", "init"].includes(command)) {
  console.error("Usage: npx @trackmcp/cli setup");
  process.exit(1);
}

console.log("\nTrackMCP setup\n==============\n");
console.log("1. We’ll open your TrackMCP dashboard.");
console.log("2. Sign in with your email and create a workspace API key.");
console.log("3. Paste the key here; we’ll save it only in your local environment file.\n");
open(dashboard);
const rl = createInterface({ input, output });
const answer = await rl.question("Paste your TrackMCP API key (or press Enter to finish in the browser): ");
rl.close();
if (!answer.trim()) {
  console.log(`\nFinish setup in the browser: ${dashboard}`);
  process.exit(0);
}
if (!/^tmcp_[A-Za-z0-9_-]{20,}$/.test(answer.trim())) {
  console.error("That does not look like a TrackMCP key. Keys begin with tmcp_. Nothing was changed.");
  process.exit(1);
}
saveKey(answer.trim());
console.log(`\nSaved TRACKMCP_KEY to ${envFile}.`);
console.log("Next, wrap your server:\n\n  import { withTrackMCP } from \"@trackmcp/sdk\";\n  export default withTrackMCP(server, { apiKey: process.env.TRACKMCP_KEY, service: \"my-mcp-server\" });\n");
