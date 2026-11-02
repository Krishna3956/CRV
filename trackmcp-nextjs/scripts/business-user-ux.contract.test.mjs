import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dashboard = await readFile(new URL("../src/components/dashboard/DashboardApp.tsx", import.meta.url), "utf8");
const apiDocs = await readFile(new URL("../src/app/docs/api/page.tsx", import.meta.url), "utf8");
const target = await readFile(new URL("../../docs/FOUNDER-OS-BUSINESS-USER-UX-TARGET.md", import.meta.url), "utf8");
const strategy = await readFile(new URL("../../docs/FOUNDER-OS-BUSINESS-USER-UX-STRATEGY.md", import.meta.url), "utf8");
const research = await readFile(new URL("../../docs/FOUNDER-OS-BUSINESS-USER-UX-RESEARCH.md", import.meta.url), "utf8");
const queue = await readFile(new URL("../../docs/FOUNDER-OS-BUSINESS-USER-UX-WORK-QUEUE.md", import.meta.url), "utf8");

test("new-user setup explains the business outcome before technical detail", () => {
  assert.match(dashboard, /What you will get after setup/);
  assert.match(dashboard, /A technical teammate usually completes this page/);
  assert.match(dashboard, /Create a key, connect one server, make one real tool call/);
  assert.match(target, /The user is told what will appear after the first event/);
  assert.match(dashboard, /const setupSteps = !workspaceId/);
  assert.match(dashboard, /Create a workspace.*Keep your server connections and analytics together/);
});

test("activated-user dashboard is organized around business questions", () => {
  for (const phrase of [
    "who is showing up",
    "what are they trying to do",
    "did it work",
    "what needs attention",
  ]) assert.match(dashboard, new RegExp(phrase));
  assert.match(strategy, /Every top-level page must answer one question/);
  assert.match(strategy, /Technical detail belongs in/);
  assert.match(dashboard, /data-range-summary/);
  assert.match(dashboard, /Showing \{selectedLabel\.toLowerCase\(\)\}/);
  assert.match(dashboard, /View daily values as a table/);
  assert.match(dashboard, /Daily observed work, events, calls, and errors/);
  assert.match(dashboard, /View weekly account values as a table/);
  assert.match(dashboard, /No comparable prior-period activity/);
  assert.match(dashboard, /Technical protocol evidence/);
  assert.match(dashboard, /Optional detail for engineering teams/);
  assert.match(dashboard, /label="Prior-period actions"/);
  assert.match(dashboard, /label="Error rate"/);
});

test("customer-facing docs use TrackMCP product language", () => {
  assert.match(apiDocs, /Versioned TrackMCP analytics reads/);
  assert.match(apiDocs, /the TrackMCP dashboard/);
  assert.doesNotMatch(apiDocs, /Founder OS/);
});

test("uncertainty and technical evidence remain explicit", () => {
  assert.match(dashboard, /N\/A means there is not enough evidence yet/);
  assert.match(dashboard, /Why this signal is shown/);
  assert.match(dashboard, /Show technical rule details/);
  assert.match(target, /Do not infer abandonment or completion from a missing event/);
});

test("research principles are translated into TrackMCP decisions", () => {
  assert.match(research, /PostHog/);
  assert.match(research, /Amplitude/);
  assert.match(research, /Progressive disclosure/);
  assert.match(research, /Do not add period comparisons/);
  assert.match(research, /Source-to-change mapping/);
  assert.match(queue, /Research PostHog, Amplitude, GA4/);
});

test("the work queue records this UX slice and its remaining scope", () => {
  assert.match(queue, /\[x\] ✅ Add business-question orientation/);
  assert.match(queue, /\[x\] ✅ Keep issue evidence/);
  assert.match(queue, /Slice-by-slice follow-up/);
  assert.match(queue, /No formula or read-model changes without metric-contract review/);
});
