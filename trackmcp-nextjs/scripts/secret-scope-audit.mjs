import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(process.cwd(), "..");
const scope = JSON.parse(execFileSync(process.execPath, ["scripts/release-scope-audit.mjs", "--json"], { encoding: "utf8" }));
const findings = [];
const fixtures = [];

function isFixture(file, line) {
  return /(?:test|spec|fixture|example|docs|README|deploy|harness)/i.test(file) || /(?:test|fixture|example|placeholder|dummy|secret)/i.test(line);
}

for (const row of scope.files.filter((entry) => entry.classification === "intended-release-scope")) {
  const file = path.join(repoRoot, row.file);
  if (!fs.existsSync(file) || !/\.(?:js|mjs|ts|tsx|py|md|sql|json|yml|yaml|sh|toml)$/i.test(file)) continue;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const lineNo = index + 1;
    const assignment = /(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ACCESS_TOKEN|BREVO_API_KEY|AWS_SECRET_ACCESS_KEY|NPM_TOKEN|PYPI_TOKEN|(?:OPENAI|ANTHROPIC)_API_KEY)\s*=\s*(?![<$\{])["']?([^\s"'`]+)["']?/i.exec(line);
    const bearer = /Bearer\s+[A-Za-z0-9._-]{24,}/i.exec(line);
    const apiKey = /\btmcp_[A-Za-z0-9_-]{20,}/i.exec(line);
    const deviceCode = /\bdevice_code\s*[:=]\s*["'][A-Za-z0-9_-]{20,}["']/i.exec(line);
    const userCode = /\buser_code\s*[:=]\s*["'][A-Z0-9]{4,8}-[A-Z0-9]{4,8}["']/i.exec(line);
    const redemptionId = /\bredemption_id\s*[:=]\s*["'][a-f0-9]{32,}["']/i.exec(line);
    if (assignment || bearer || apiKey || deviceCode || userCode || redemptionId) {
      const match = assignment?.[0] || bearer?.[0] || apiKey?.[0] || deviceCode?.[0] || userCode?.[0] || redemptionId?.[0] || "credential-shaped value";
      const finding = {
        file: row.file,
        line: lineNo,
        kind: assignment ? "assignment" : bearer ? "bearer" : apiKey ? "trackmcp-key" : deviceCode ? "device-code" : userCode ? "user-code" : "redemption-id",
        value: match.slice(0, 96),
      };
      if (isFixture(row.file, line)) fixtures.push(finding);
      else findings.push(finding);
    }
  });
}

const report = { scanned_intended_paths: scope.files.filter((entry) => entry.classification === "intended-release-scope").length, findings, fixtures };
if (process.argv.includes("--json")) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`Secret-scope audit: ${report.scanned_intended_paths} intended paths scanned`);
  console.log(`Unexpected findings: ${findings.length}; approved fixture/example matches: ${fixtures.length}`);
  for (const finding of findings) console.log(`UNEXPECTED ${finding.file}:${finding.line} ${finding.kind}`);
}
if (process.argv.includes("--strict") && findings.length) process.exitCode = 1;
