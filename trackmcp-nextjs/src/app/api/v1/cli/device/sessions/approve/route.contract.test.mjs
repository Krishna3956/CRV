import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routeSource = await readFile(new URL("./route.ts", import.meta.url), "utf8");
const handlerSource = await readFile(new URL("./handlers.ts", import.meta.url), "utf8");
const source = `${routeSource}\n${handlerSource}`;

test("browser approval exposes the stable lifecycle contract without handling keys", () => {
  assert.match(source, /status: \"approved\"/);
  assert.match(source, /status: \"already_approved\"/);
  assert.match(source, /status: \"already_redeemed\"/);
  assert.match(source, /status: \"denied\"/);
  assert.match(source, /reason_category: \"user_denied\"/);
  assert.match(source, /status: \"expired\"/);
  assert.match(source, /status: \"invalid\"/);
  assert.doesNotMatch(source, /api_key|connection_key|createApiKey/i);
});

test("approval endpoint only accepts the bounded user code and workspace", () => {
  assert.match(source, /readBoundedJsonObject/);
  assert.match(source, /body\.user_code/);
  assert.match(source, /body\.workspace_id/);
  assert.match(source, /\^\[A-Z2-9\]\{4\}-\[A-Z2-9\]\{4\}\$/);
  assert.match(source, /\^\[0-9a-f-\]\{36\}\$/i);
});
