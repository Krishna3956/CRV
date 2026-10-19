import { chmod, mkdir, open, readFile, rename, rm } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomBytes } from "node:crypto";

const execFileAsync = promisify(execFile);
const KEY_PATTERN = /^tmcp_[A-Za-z0-9_-]{20,}$/;

export function isUsableKey(value) {
  return typeof value === "string" && KEY_PATTERN.test(value.trim());
}

export function parseEnv(content) {
  const match = content.match(/^\s*TRACKMCP_KEY\s*=\s*(.*)\s*$/m);
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, "") || undefined;
}

export function environmentFiles({ cwd = process.cwd(), envFile } = {}) {
  const candidates = [envFile || ".env.local", ".env"];
  return [...new Set(candidates.map((file) => resolve(cwd, file)))];
}

export async function findEnvironment({ cwd = process.cwd(), envFile } = {}) {
  const files = [];
  for (const path of environmentFiles({ cwd, envFile })) {
    try {
      const content = await readFile(path, "utf8");
      files.push({ path, hasKey: Boolean(parseEnv(content)), key: parseEnv(content) });
    } catch (error) {
      if (error?.code !== "ENOENT") files.push({ path, hasKey: false, error: "unreadable" });
    }
  }
  return files;
}

export async function readConfiguredKey({ cwd = process.cwd(), envFile, env = process.env } = {}) {
  if (isUsableKey(env.TRACKMCP_KEY)) return { key: env.TRACKMCP_KEY.trim(), source: "process" };
  for (const file of await findEnvironment({ cwd, envFile })) {
    if (isUsableKey(file.key)) return { key: file.key.trim(), source: file.path };
  }
  return { key: undefined, source: undefined };
}

export async function isGitTracked(path, { cwd = process.cwd(), execFileImpl = execFileAsync } = {}) {
  try {
    await execFileImpl("git", ["ls-files", "--error-unmatch", "--", relative(cwd, resolve(path))], { cwd });
    return true;
  } catch {
    return false;
  }
}

export async function writeEnvKey(path, key, { confirmOverwrite = async () => false } = {}) {
  if (!isUsableKey(key)) throw new Error("TrackMCP returned an invalid API key.");
  const target = resolve(path);
  let existing = "";
  try {
    existing = await readFile(target, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw new Error("The environment file could not be read.");
  }
  const hasExistingKey = /^\s*TRACKMCP_KEY\s*=\s*/m.test(existing);
  if (hasExistingKey && !(await confirmOverwrite())) throw new Error("TRACKMCP_KEY already exists; nothing was changed.");
  const line = `TRACKMCP_KEY=${key}`;
  const updated = hasExistingKey ? existing.replace(/^\s*TRACKMCP_KEY\s*=.*$/m, line) : `${existing.trimEnd()}${existing.trimEnd() ? "\n" : ""}${line}\n`;
  await mkdir(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
  let committed = false;
  try {
    const handle = await open(temporary, "wx", 0o600);
    try {
      await handle.writeFile(updated, "utf8");
      await handle.chmod(0o600);
    } finally {
      await handle.close();
    }
    await rename(temporary, target);
    committed = true;
  } finally {
    // A failed write must not leave a secret-bearing temporary file behind.
    if (!committed) await rm(temporary, { force: true }).catch(() => {});
  }
  await chmod(target, 0o600).catch(() => {});
  return target;
}

export async function logout({ sessionFile = resolve(process.cwd(), ".trackmcp-session.json") } = {}) {
  await rm(sessionFile, { force: true });
  return sessionFile;
}

export { KEY_PATTERN };
