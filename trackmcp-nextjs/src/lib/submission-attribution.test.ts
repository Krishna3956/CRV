import assert from "node:assert/strict";
import test from "node:test";
import { classifySubmissionSource, normalizeSubmissionAttribution, normalizeReferrerHostname } from "./submission-attribution.ts";

const EVENT_ID = "123e4567-e89b-42d3-a456-426614174000";

test("classifies approved source families without retaining referrer URLs", () => {
  assert.equal(classifySubmissionSource({ utmSource: "google", captured: true }), "google");
  assert.equal(classifySubmissionSource({ referrerHostname: "https://chatgpt.com/share/abc", captured: true }), "chatgpt");
  assert.equal(classifySubmissionSource({ referrerHostname: "https://news.example.com/article", captured: true }), "other_website");
  assert.equal(classifySubmissionSource({ captured: true }), "direct_unknown");
  assert.equal(classifySubmissionSource({}), "unattributed");
});

test("normalizes hostname and rejects unsafe or oversized URL context", () => {
  assert.equal(normalizeReferrerHostname("https://WWW.Example.com/path?secret=value"), "example.com");
  assert.equal(normalizeReferrerHostname("not a hostname"), null);
  assert.equal(normalizeReferrerHostname("x".repeat(300)), null);
});

test("normalizes attribution, preserves first touch, and uses the server timestamp", () => {
  const result = normalizeSubmissionAttribution({
    first_touch_source: "google",
    last_touch_source: "other_website",
    referrer_hostname: "https://partner.example/path",
    utm_source: "partner",
    utm_medium: "article",
    utm_campaign: "launch",
    landing_pathname: "/submit-mcp?utm_source=partner",
  }, "2026-10-18T12:00:00.000Z", EVENT_ID);
  assert.deepEqual(result, {
    first_touch_source: "google",
    last_touch_source: "other_website",
    source_class: "other_website",
    referrer_hostname: "partner.example",
    utm_source: "partner",
    utm_medium: "article",
    utm_campaign: "launch",
    landing_pathname: "/submit-mcp",
    self_reported_source: null,
    self_reported_detail: null,
    submitted_at: "2026-10-18T12:00:00.000Z",
    submission_event_id: EVENT_ID,
  });
  assert.doesNotMatch(JSON.stringify(result), /secret|@|cookie|192\.168/);
});

test("missing attribution is explicitly unattributed and event IDs are random UUIDs", () => {
  const result = normalizeSubmissionAttribution(null, "2026-10-18T12:00:00.000Z", "invalid");
  assert.equal(result.source_class, "unattributed");
  assert.match(result.submission_event_id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});

test("normalizes bounded self-reported source context", () => {
  const result = normalizeSubmissionAttribution({
    self_reported_source: "community",
    self_reported_detail: "A private Discord community",
  }, "2026-10-29T12:00:00.000Z", EVENT_ID);
  assert.equal(result.self_reported_source, "community");
  assert.equal(result.self_reported_detail, "A private Discord community");
});

test("current campaign signals override stale direct client attribution", () => {
  const result = normalizeSubmissionAttribution({
    first_touch_source: "direct_unknown",
    last_touch_source: "direct_unknown",
    referrer_hostname: "trackmcp.com",
    utm_source: "brevo",
    utm_medium: "email",
    utm_campaign: "launch_october",
    landing_pathname: "/submit-mcp",
  }, "2026-10-29T12:00:00.000Z", EVENT_ID);
  assert.equal(result.first_touch_source, "direct_unknown");
  assert.equal(result.last_touch_source, "other_website");
  assert.equal(result.source_class, "other_website");
  assert.equal(result.utm_source, "brevo");
});

test("drops email and credential-shaped self-reported detail", () => {
  const email = normalizeSubmissionAttribution({ self_reported_source: "other", self_reported_detail: "alex@example.com" }, "2026-10-29T12:00:00.000Z", EVENT_ID);
  const token = normalizeSubmissionAttribution({ self_reported_source: "other", self_reported_detail: "api_key=sk-test_123456789012345" }, "2026-10-29T12:00:00.000Z", EVENT_ID);
  assert.equal(email.self_reported_detail, null);
  assert.equal(token.self_reported_detail, null);
});
