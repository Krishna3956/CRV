import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { dirname, resolve } from "node:path";

const execFileAsync = promisify(execFile);

export const SDK_PACKAGE_NAME = "@trackmcp/sdk";

const PACKAGE_MANAGERS = {
  npm: { command: process.platform === "win32" ? "npm.cmd" : "npm", args: ["install", SDK_PACKAGE_NAME] },
  pnpm: { command: process.platform === "win32" ? "pnpm.cmd" : "pnpm", args: ["add", SDK_PACKAGE_NAME] },
  yarn: { command: process.platform === "win32" ? "yarn.cmd" : "yarn", args: ["add", SDK_PACKAGE_NAME] },
  bun: { command: process.platform === "win32" ? "bun.exe" : "bun", args: ["add", SDK_PACKAGE_NAME] },
};

const LOCKFILES = [
  ["pnpm", "pnpm-lock.yaml"],
  ["yarn", "yarn.lock"],
  ["bun", "bun.lock"],
  ["bun", "bun.lockb"],
  ["npm", "package-lock.json"],
];

export async function detectPackageManager(cwd = process.cwd()) {
  for (const [manager, file] of LOCKFILES) {
    try {
      await readFile(resolve(cwd, file));
      return manager;
    } catch {
      // Try the next lockfile.
    }
  }
  return "npm";
}

export async function findInstalledSdkPackage({ cwd = process.cwd() } = {}) {
  let directory = resolve(cwd);
  while (true) {
    try {
      const packageJson = JSON.parse(await readFile(resolve(directory, "node_modules", "@trackmcp", "sdk", "package.json"), "utf8"));
      if (packageJson?.name === SDK_PACKAGE_NAME) return packageJson;
    } catch {
      // Check the next workspace parent.
    }
    const parent = dirname(directory);
    if (parent === directory) return undefined;
    directory = parent;
  }
}

export async function isSdkInstalled({ cwd = process.cwd() } = {}) {
  try {
    return Boolean(await findInstalledSdkPackage({ cwd }));
  } catch {
    return false;
  }
}

export async function installSdk({ cwd = process.cwd(), packageManager = "npm", execFileImpl = execFileAsync, env = process.env } = {}) {
  const spec = PACKAGE_MANAGERS[packageManager] || PACKAGE_MANAGERS.npm;
  try {
    await execFileImpl(spec.command, spec.args, {
      cwd,
      env,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    });
  } catch (error) {
    const detail = typeof error?.stderr === "string" ? error.stderr.trim().split("\n").slice(-1)[0] : undefined;
    throw new Error(`Could not install ${SDK_PACKAGE_NAME} with ${packageManager}.${detail ? ` ${detail}` : " Check that the package manager is installed and try again."}`);
  }
}

export async function ensureSdkInstalled({
  cwd = process.cwd(),
  packageManager,
  install = true,
  execFileImpl = execFileAsync,
  isSdkInstalledImpl = isSdkInstalled,
  installSdkImpl = installSdk,
  outputLog = console.log,
  env = process.env,
} = {}) {
  if (await isSdkInstalledImpl({ cwd })) return { installed: true, alreadyPresent: true, packageManager: packageManager || await detectPackageManager(cwd) };
  if (!install) return { installed: false, skipped: true, packageManager: packageManager || await detectPackageManager(cwd) };

  const manager = packageManager || await detectPackageManager(cwd);
  outputLog(`${SDK_PACKAGE_NAME} is not installed. Installing with ${manager}…`);
  await installSdkImpl({ cwd, packageManager: manager, execFileImpl, env });
  if (!(await isSdkInstalledImpl({ cwd }))) throw new Error(`${SDK_PACKAGE_NAME} did not appear in node_modules after installation. Run the install command manually and try again.`);
  outputLog(`Installed ${SDK_PACKAGE_NAME}.`);
  return { installed: true, alreadyPresent: false, packageManager: manager };
}

export { PACKAGE_MANAGERS };
