import assert from "node:assert/strict";
import test from "node:test";
import { createProtocolActivityHandler } from "./handlers.ts";

test("protocol activity keeps family counts and provenance bounded", async () => {
  const handler = createProtocolActivityHandler(async () => new Response(JSON.stringify({
    range_days: 30,
    protocol_family_activity: [
      { family: "sampling", observations: 2 },
      { family: "roots", observations: 4 },
      { family: "logging", observations: 1 },
      { family: "private", observations: 999 },
      { family: "tasks", observations: 3, private_payload: "do-not-return" },
    ],
    protocol_family_outcomes: [
      { family: "sampling", observations: 2, completed: 1, errors: 0, input_required: 1, unknown: 0, matched_advertised: 1, matched_without_advertisement: 0, matched_unknown: 0 },
      { family: "roots", observations: 4, completed: 0, errors: 0, input_required: 0, unknown: 4 },
      { family: "logging", observations: 1, completed: 1, errors: 0, input_required: 0, unknown: 0 },
      { family: "private", observations: 999, completed: 999, errors: 0, input_required: 0, unknown: 0 },
      { family: "tasks", observations: 3, completed: 1, errors: 1, input_required: 0, unknown: 1, private_payload: "do-not-return" },
    ],
    protocol_family_outcome_source: "durable_facts",
    protocol_transport_outcomes: [
      { transport: "streamable_http", observations: 3, requests: 1, responses: 2, matched: 1, completed: 1, errors: 0, input_required: 1, unknown: 1 },
      { transport: "unsafe", observations: 999999, requests: 999999, responses: 999999, matched: 999999, completed: 999999, errors: 999999, input_required: 999999, unknown: 999999 },
    ],
    protocol_mrtr_linkage: { request_state_hashes: 3, interaction_hashes: 2, retry_links: 1, matched_pairs: 1, source: "durable_facts", limitation: "Same-scope explicit handles only.", private_payload: "do-not-return" },
    protocol_capability_gaps: [
      { family: "sampling", requests_without_advertisement: 2, limitation: "Client did not advertise sampling." },
      { family: "private", requests_without_advertisement: 999, limitation: "do-not-return" },
    ],
    protocol_decisions: {
      elicitation: { accept: 2, decline: 1, cancel: 0 },
      sampling: { accept: 1, decline: 0, cancel: 1 },
      limitation: "Explicit decisions only.",
      private_payload: "do-not-return",
    },
    completion_activity: {
      requests: 4,
      matched_requests: 3,
      unmatched_requests: 1,
      capability_advertised: true,
      responses_with_metadata: 3,
      with_suggestions: 2,
      empty_suggestions: 1,
      partial: 1,
      limitation: "Completion metadata only.",
      private_payload: "do-not-return",
    },
    data_trust: { generated_at: "2026-01-02T00:00:00.000Z", source_event_count: 4, private_payload: "do-not-return" },
  }), { status: 200 }));
  const response = await handler(new Request("https://example.test/api/v2/protocol-activity"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.protocol_family_activity, [
    { family: "roots", observations: 4 },
    { family: "tasks", observations: 3 },
    { family: "sampling", observations: 2 },
    { family: "logging", observations: 1 },
  ]);
  assert.deepEqual(body.protocol_family_outcomes, [
    { family: "roots", observations: 4, requests: 0, responses: 0, matched: 0, matched_advertised: 0, matched_without_advertisement: 0, matched_unknown: 0, completed: 0, errors: 0, input_required: 0, unknown: 4, capability_advertised: null },
    { family: "tasks", observations: 3, requests: 0, responses: 0, matched: 0, matched_advertised: 0, matched_without_advertisement: 0, matched_unknown: 0, completed: 1, errors: 1, input_required: 0, unknown: 1, capability_advertised: null },
    { family: "sampling", observations: 2, requests: 0, responses: 0, matched: 0, matched_advertised: 1, matched_without_advertisement: 0, matched_unknown: 0, completed: 1, errors: 0, input_required: 1, unknown: 0, capability_advertised: null },
    { family: "logging", observations: 1, requests: 0, responses: 0, matched: 0, matched_advertised: 0, matched_without_advertisement: 0, matched_unknown: 0, completed: 1, errors: 0, input_required: 0, unknown: 0, capability_advertised: null },
  ]);
  assert.equal(body.protocol_family_outcome_source, "durable_facts");
  assert.deepEqual(body.protocol_transport_outcomes, [
    { transport: "streamable_http", observations: 3, requests: 1, responses: 2, matched: 1, completed: 1, errors: 0, input_required: 1, unknown: 1 },
    { transport: "unknown", observations: 100000, requests: 100000, responses: 100000, matched: 100000, completed: 100000, errors: 100000, input_required: 100000, unknown: 100000 },
  ]);
  assert.deepEqual(body.protocol_mrtr_linkage, { request_state_hashes: 3, interaction_hashes: 2, retry_links: 1, matched_pairs: 1, source: "durable_facts", limitation: "Same-scope explicit handles only." });
  assert.deepEqual(body.protocol_capability_gaps, [{ family: "sampling", requests_without_advertisement: 2, limitation: "Client did not advertise sampling." }]);
  assert.deepEqual(body.protocol_decisions, {
    elicitation: { accept: 2, decline: 1, cancel: 0 },
    sampling: { accept: 1, decline: 0, cancel: 1 },
    limitation: "Explicit decisions only.",
  });
  assert.deepEqual(body.completion_activity, {
    requests: 4,
    matched_requests: 3,
    unmatched_requests: 1,
    capability_advertised: true,
    responses_with_metadata: 3,
    with_suggestions: 2,
    empty_suggestions: 1,
    partial: 1,
    limitation: "Completion metadata only.",
  });
  assert.ok(body.caveats.some((caveat) => caveat.includes("Completed is an explicit protocol result")));
  assert.equal(body.data_trust.source_event_count, 4);
  assert.equal("private_payload" in body.data_trust, false);
  assert.equal("private_payload" in body.protocol_mrtr_linkage, false);
  assert.equal("private_payload" in body.protocol_decisions, false);
  assert.equal("private_payload" in body.completion_activity, false);
});
