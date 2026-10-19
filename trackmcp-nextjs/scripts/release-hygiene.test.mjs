import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve("..");

function trackedFiles() {
  return execFileSync("git", ["ls-files", "-z"], { cwd: repoRoot })
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
}

test("release tree excludes private and campaign artifacts", () => {
  const forbidden = trackedFiles().filter((file) =>
    /(^|\/)(?:campaigns?|.*\.csv|\.env(?:\..*)?|.*\.(?:pem|key|p12))$/i.test(file),
  );
  assert.deepEqual(forbidden, []);
});

test("tracked text does not contain common credential assignments", () => {
  const assignment = /(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ACCESS_TOKEN|BREVO_API_KEY|AWS_SECRET_ACCESS_KEY|(?:OPENAI|ANTHROPIC)_API_KEY)\s*=\s*(?![<$\\{])[^\s"']+/;
  const findings = [];
  for (const relative of trackedFiles()) {
    const file = path.join(repoRoot, relative);
    if (!fs.existsSync(file) || !/\.(?:js|mjs|ts|tsx|py|md|sql|json|yml|yaml|sh|env)$/i.test(relative)) continue;
    const text = fs.readFileSync(file, "utf8");
    if (assignment.test(text)) findings.push(relative);
  }
  assert.deepEqual(findings, []);
});
