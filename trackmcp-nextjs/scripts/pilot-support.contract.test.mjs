import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "..");
const doc = fs.readFileSync(path.join(root, "docs/FOUNDER-OS-PILOT-SUPPORT.md"), "utf8");
const includes = (phrase) => assert.ok(doc.toLowerCase().includes(phrase.toLowerCase()), `missing support contract phrase: ${phrase}`);

test("pilot support script covers activation, first event, and escalation", () => {
  for (const phrase of [
    "npx @trackmcp/cli init",
    "--no-browser",
    "doctor --non-interactive",
    "one real tool call",
    "TRACKMCP_KEY",
    "OTLP/HTTP JSON",
    "Escalation packet",
    "do not delete rows manually",
  ]) includes(phrase);
});

test("support script forbids secret collection and unsafe deletion shortcuts", () => {
  for (const phrase of [
    "Never ask for an API",
    "Raw API keys, device codes",
    "do not ask them to paste",
    "must remain silent",
    "Do not delete rows manually",
    "Unknown retention or legal state is a blocker",
  ]) includes(phrase);
});

