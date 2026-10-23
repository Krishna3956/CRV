import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

const distDir = process.env.NEXT_DIST_DIR || ".next";
const serverPath = path.resolve(process.cwd(), distDir, "standalone", "server.js");

// Match `next start` for local QA while keeping production deployment
// configuration explicit through the container environment.
loadEnvConfig(process.cwd());

try {
  await access(serverPath);
} catch {
  console.error(`Standalone server not found at ${serverPath}. Run npm run build first.`);
  process.exit(1);
}

const child = spawn(process.execPath, [serverPath], {
  stdio: "inherit",
  env: {
    ...process.env,
    HOSTNAME: process.env.HOSTNAME || "0.0.0.0",
    PORT: process.env.PORT || "3000",
    NODE_ENV: process.env.NODE_ENV || "production",
  },
});

const forwardSignal = (signal) => child.kill(signal);
process.on("SIGINT", () => forwardSignal("SIGINT"));
process.on("SIGTERM", () => forwardSignal("SIGTERM"));
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
