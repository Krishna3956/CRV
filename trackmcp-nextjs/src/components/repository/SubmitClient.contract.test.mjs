import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("./SubmitClient.tsx", import.meta.url), "utf8");
const tracker = await readFile(new URL("../MarketingAttributionTracker.tsx", import.meta.url), "utf8");
const analytics = await readFile(new URL("../../lib/marketing-analytics.ts", import.meta.url), "utf8");

test("submission funnel emits form, attempt, failure, and completion events", () => {
  for (const eventName of [
    "submission_form_started",
    "submission_attempted",
    "submission_field_error",
    "submission_failed",
    "submission_completed",
  ]) {
    assert.match(source, new RegExp(`trackMarketingEvent\\(\\"${eventName}\\"`));
  }
  assert.match(source, /form_session_id/);
});

test("submission analytics uses only a boolean email-presence signal", () => {
  assert.match(source, /has_email:\s*Boolean\(email\)/);
  assert.doesNotMatch(source, /trackMarketingEvent\(\"submission_attempted\"[\s\S]{0,300}email:\s*email/);
});

test("submit page preserves the three-step flow and Web3Forms attribution", () => {
  const emailField = source.indexOf('id="em"');
  const sourceReveal = source.indexOf("{email.trim().length > 0 && (");
  assert.ok(emailField >= 0, "email field is present");
  assert.ok(sourceReveal > emailField, "source field is revealed after the email field");
  assert.doesNotMatch(source, /source-detail|selfReportedDetail|Get featured|FEATURED_BENEFITS/);
  assert.match(source, /how_did_you_hear_about_trackmcp:\s*selfReportedSource/);
  assert.match(source, /wantsFeatured:\s*false/);
});

test("page attribution and identity stitching remain privacy-safe", () => {
  assert.match(tracker, /marketing_pageview/);
  assert.match(tracker, /captureSubmissionAttribution/);
  assert.match(analytics, /identifyPostHog\(userId/);
  assert.match(analytics, /registerPostHog\(attributionProperties\(snapshot\)\)/);
  assert.doesNotMatch(analytics, /\bemail\s*:/);
  assert.doesNotMatch(tracker, /document\.cookie|navigator\.userAgent/);
});
