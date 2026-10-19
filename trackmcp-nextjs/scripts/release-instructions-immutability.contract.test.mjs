import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(process.cwd(), "..");
const candidates = [
  ...fs.readdirSync(repoRoot).filter((name) => /^FOUNDER-OS-.*\.md$/.test(name)).map((name) => path.join(repoRoot, name)),
  ...fs.readdirSync(path.join(repoRoot, "docs")).filter((name) => /^FOUNDER-OS-.*\.md$/.test(name)).map((name) => path.join(repoRoot, "docs", name)),
  path.join(repoRoot, "trackmcp-nextjs", "deploy", "README.md"),
];

const codeLine = /^\s*(?:```|[$#]|(?:git|docker|npm|pip|python|node|bash|sh)\b)/;
const findings = [];
for (const file of candidates) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!codeLine.test(line)) return;
    if (/\bgit\s+(?:checkout|switch)\s+(?:main|master|develop)\b|\bgit\s+pull\s+(?!--ff-only)/i.test(line)) findings.push(`${file}:${index + 1}:${line.trim()}`);
    if (/(?:npm|pnpm|yarn)\s+(?:install|add)\s+[^\n]*@latest\b|\bpip\s+install\s+[^\n]*==latest\b|:\s*latest\b/i.test(line)) findings.push(`${file}:${index + 1}:${line.trim()}`);
  });
}

test("release instructions do not use floating branches, tags, or image versions", () => {
  assert.deepEqual(findings, []);
});
