import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(process.cwd(), "..");
const manifest = fs.readFileSync(path.join(repoRoot, "FOUNDER-OS-FILE-OWNERSHIP.md"), "utf8");
const scope = JSON.parse(execFileSync(process.execPath, ["scripts/release-scope-audit.mjs", "--json"], { encoding: "utf8" }));

const owners = [
  [".github/workflows/", "deployment"],
  ["trackmcp-nextjs/.github/workflows/", "deployment"],
  ["trackmcp-nextjs/deploy/", "deployment"],
  ["trackmcp-nextjs/workers/", "deployment"],
  ["trackmcp-nextjs/packages/typescript-sdk/", "sdk"],
  ["trackmcp-nextjs/packages/cli/", "sdk"],
  ["packages/python-sdk/", "python"],
  ["supabase/", "schema"],
  ["trackmcp-nextjs/src/lib/telemetry/", "telemetry"],
  ["trackmcp-nextjs/src/lib/", "shared-lib"],
  ["trackmcp-nextjs/src/proxy.ts", "shared-lib"],
  ["trackmcp-nextjs/src/app/api/v2/", "api"],
  ["trackmcp-nextjs/src/app/api/v1/", "api"],
  ["trackmcp-nextjs/src/components/dashboard/", "dashboard"],
  ["trackmcp-nextjs/src/components/DeviceApprovalClient.tsx", "dashboard"],
  ["trackmcp-nextjs/src/app/dashboard/", "dashboard"],
  ["trackmcp-nextjs/src/app/device/", "dashboard"],
  ["trackmcp-nextjs/src/app/", "website"],
  ["trackmcp-nextjs/src/components/", "website"],
  ["trackmcp-nextjs/docs/", "website"],
  ["trackmcp-nextjs/scripts/", "tests"],
  ["trackmcp-nextjs/package", "tests"],
  ["trackmcp-nextjs/next.config.ts", "deployment"],
  ["trackmcp-nextjs/eslint.config.mjs", "deployment"],
  [".gitignore", "tests"],
  ["trackmcp-nextjs/.gitignore", "tests"],
  ["FOUNDER-OS-", "founder-docs"],
  // The release gate normalizes root-level pilot manifests relative to the
  // trackmcp-nextjs working directory.
  ["trackmcp-nextjs/FOUNDER-OS-", "founder-docs"],
  ["docs/FOUNDER-OS-", "founder-docs"],
  ["docs/architecture.md", "founder-docs"],
  ["docs/getting-started.md", "founder-docs"],
];

function ownerFor(file) {
  const normalized = file.replaceAll("\\", "/");
  return owners.find(([prefix]) => normalized.startsWith(prefix))?.[1] || null;
}

test("ownership map documents every primary feature bucket", () => {
  for (const bucket of ["Ingest and telemetry", "Versioned read APIs", "Shared application libraries", "Auth, workspaces, and CLI activation", "Dashboard and customer UI", "Website and content", "SDK and CLI", "Python SDK", "Schema and SQL", "Deployment and CI", "Tests and release tooling", "Founder OS documentation"]) {
    assert.match(manifest, new RegExp(`\\| ${bucket.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")} \\|`));
  }
});

test("every intended current path has a deterministic ownership bucket", () => {
  const unmapped = scope.files.filter((row) => row.classification === "intended-release-scope" && !ownerFor(row.file));
  assert.deepEqual(unmapped, [], `unmapped intended paths: ${unmapped.map((row) => row.file).join(", ")}`);
});
