import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./DashboardApp.tsx", import.meta.url), "utf8");

test("business views lead with short, scannable explanations", () => {
  for (const copy of [
    'title="Overview"',
    'title="The journey"',
    'title="What they\'re doing"',
    'title="Resources & prompts"',
    'title="Did it work"',
    'title="What\'s broken"',
    'title="Setup"',
  ]) {
    assert.match(source, new RegExp(copy.replace(/[.*+?^${}()|[\\]\\]/g, "\\\\$&")));
  }
  for (const removed of [
    'title="What you will see"',
    'title="Follow observed work"',
    'title="Start with adoption"',
    'title="Read information needs"',
    'title="Separate outcomes from reliability"',
    'title="Decide what to investigate"',
    'title="Read account-group activity"',
    'title="Use Evidence for detail"',
    'title="After setup"',
  ]) assert.doesNotMatch(source, new RegExp(removed.replace(/[.*+?^${}()|[\\]\\]/g, "\\\\$&")));
  assert.doesNotMatch(source, /TrackMCP shows your team who is using the MCP/);
  assert.doesNotMatch(source, /A technical teammate connects one server; after the first event/);
  assert.doesNotMatch(source, /This view shows privacy-safe account groups and the assistant applications/);
  assert.doesNotMatch(source, /Use Most-used features to see what people are trying to do/);
});

test("setup keeps the primary path visible and makes technical detail secondary", () => {
  assert.match(source, /npx @trackmcp\/cli init/);
  assert.match(source, /Create connection key/);
  assert.match(source, /Set <code className="font-mono text-ink">TRACKMCP_KEY<\/code>, restart the server, and make one tool call/);
  assert.match(source, /<details className=\"mt-6 rounded-2xl border border-line bg-white/);
  assert.match(source, /Other connection methods/);
});

test("evidence boundaries remain explicit after copy reduction", () => {
  assert.match(source, /Only outcomes your server explicitly reported count here/);
  assert.match(source, /A missing terminal event is not treated as abandonment/);
  assert.doesNotMatch(source, /Outcomes come from explicit server reports/);
  assert.match(source, /bounded, redacted evidence/);
});
