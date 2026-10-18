import { spawn } from "node:child_process";

const LOCAL_DEVELOPMENT_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function browserCommand(platform = process.platform) {
  if (platform === "darwin") return { command: "open", args: [] };
  if (platform === "win32") return { command: "rundll32", args: ["url.dll,FileProtocolHandler"] };
  return { command: "xdg-open", args: [] };
}

/** Open a trusted HTTPS device URL without shell interpolation. */
export function openBrowser(url, { platform = process.platform, spawnImpl = spawn, allowLocalDevelopment = false } = {}) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return Promise.resolve(false);
  }
  const localHttp = allowLocalDevelopment && parsed.protocol === "http:" && LOCAL_DEVELOPMENT_HOSTS.has(parsed.hostname);
  if ((parsed.protocol !== "https:" && !localHttp) || parsed.username || parsed.password) return Promise.resolve(false);
  const { command, args } = browserCommand(platform);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    try {
      const child = spawnImpl(command, [...args, parsed.toString()], { detached: true, stdio: "ignore", shell: false });
      child.once?.("error", () => finish(false));
      child.once?.("spawn", () => finish(true));
      child.unref?.();
      if (!child.once) finish(true);
    } catch {
      finish(false);
    }
  });
}
