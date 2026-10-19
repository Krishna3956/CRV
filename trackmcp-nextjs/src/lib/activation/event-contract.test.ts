import assert from "node:assert/strict";
import { test } from "node:test";
import { validateActivationEventBody } from "./event-contract.ts";

const validEvent = {
  event_id: "event_123456789012",
  event_type: "api_key_copied",
  source: "sdk_docs",
  workspace_id: "123e4567-e89b-12d3-a456-426614174000",
  package_name: "@trackmcp/sdk",
  package_version: "0.2.0",
  content_path: "/docs/typescript",
};

test("accepts bounded authenticated activation events", () => {
  assert.deepEqual(validateActivationEventBody(validEvent), {
    eventId: "event_123456789012",
    eventType: "api_key_copied",
    source: "sdk_docs",
    workspaceId: "123e4567-e89b-12d3-a456-426614174000",
    packageName: "@trackmcp/sdk",
    packageVersion: "0.2.0",
    contentPath: "/docs/typescript",
    resultCategory: null,
  });
});

test("rejects raw secrets and arbitrary payload fields", () => {
  assert.equal(validateActivationEventBody({ ...validEvent, api_key: "tmcp_secret" }), null);
  assert.equal(validateActivationEventBody({ ...validEvent, payload: { secret: "value" } }), null);
  assert.equal(validateActivationEventBody({ ...validEvent, email: "user@example.com" }), null);
});

test("rejects malformed workspace IDs and unbounded properties", () => {
  assert.equal(validateActivationEventBody({ ...validEvent, workspace_id: "not-a-uuid" }), null);
  assert.equal(validateActivationEventBody({ ...validEvent, content_path: "x".repeat(257) }), null);
  assert.equal(validateActivationEventBody({ ...validEvent, event_type: "cli_device_auth_approved" }), null);
});
