import assert from "node:assert/strict";
import test from "node:test";
import { MAX_ALERT_REQUEST_BYTES, readBoundedJson } from "./http.ts";

test("alert request bodies are rejected before parsing when over the hard bound", async () => {
  const body = "x".repeat(MAX_ALERT_REQUEST_BYTES + 1);
  const result = await readBoundedJson(new Request("https://test", { method: "POST", body }));
  assert.deepEqual(result, { error: "Request body exceeds the alert API limit.", code: "too_large" });
});

test("alert request body parser distinguishes malformed JSON", async () => {
  const result = await readBoundedJson(new Request("https://test", { method: "POST", body: "{" }));
  assert.deepEqual(result, { error: "Invalid JSON.", code: "invalid_json" });
});
