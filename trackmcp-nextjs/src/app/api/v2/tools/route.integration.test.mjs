import assert from "node:assert/strict";
import test from "node:test";
import { createToolsHandler } from "./handlers.ts";

test("tools projection filters a bounded capability without changing the envelope contract", async () => {
  const analytics = async () => new Response(JSON.stringify({
    range_days: 7,
    tools: [{ name: "lookup", calls: 3, private_payload: "do-not-return" }, { name: "write", calls: 1 }],
    catalog_tools: [{ name: "lookup" }, { name: "write" }],
    unused_tools: ["write"],
    insights: [{ title: "bounded", private_payload: "do-not-return" }],
    data_trust: { generated_at: "2026-10-18T00:00:00.000Z", query_since: "2026-10-11T00:00:00.000Z", observed_through: "2026-10-18T00:00:00.000Z", source_event_count: 4, returned_event_count: 4, truncated: false },
  }), { status: 200, headers: { "content-type": "application/json" } });
  const response = await createToolsHandler(analytics)(new Request("https://trackmcp.test/api/v2/tools?tool_name=lookup"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.filter, { tool_name: "lookup" });
  assert.deepEqual(body.tools.map((tool) => tool.name), ["lookup"]);
  assert.deepEqual(body.catalog_tools.map((tool) => tool.name), ["lookup"]);
  assert.deepEqual(body.unused_tools, []);
  assert.equal(body.scope.value, "authenticated");
  assert.equal(JSON.stringify(body).includes("private_payload"), false);
});

test("tools projection exposes additive opaque cursor pagination", async () => {
  const analytics = async () => new Response(JSON.stringify({
    range_days: 7,
    tools: [{ name: "a" }, { name: "b" }, { name: "c" }],
    catalog_tools: [{ name: "a" }, { name: "b" }, { name: "c" }],
    unused_tools: ["a", "b", "c"],
    data_trust: { generated_at: "2026-10-18T00:00:00.000Z", query_since: "2026-10-11T00:00:00.000Z", observed_through: "2026-10-18T00:00:00.000Z", source_event_count: 3, returned_event_count: 3, truncated: false },
  }), { status: 200 });
  const first = await createToolsHandler(analytics)(new Request("https://trackmcp.test/api/v2/tools?limit=2"));
  const firstBody = await first.json();
  assert.deepEqual(firstBody.tools.map((tool) => tool.name), ["a", "b"]);
  assert.equal(typeof firstBody.page.next_cursor, "string");
  const second = await createToolsHandler(analytics)(new Request(`https://trackmcp.test/api/v2/tools?limit=2&cursor=${encodeURIComponent(firstBody.page.next_cursor)}`));
  const secondBody = await second.json();
  assert.deepEqual(secondBody.tools.map((tool) => tool.name), ["c"]);
  assert.equal(secondBody.page.next_cursor, null);
});

test("malformed cursors stay bounded and never become arbitrary offsets", async () => {
  const analytics = async () => new Response(JSON.stringify({
    range_days: 7,
    tools: [{ name: "a" }, { name: "b" }],
    catalog_tools: [],
    unused_tools: [],
    data_trust: { generated_at: "2026-10-18T00:00:00.000Z", query_since: "2026-10-11T00:00:00.000Z", observed_through: "2026-10-18T00:00:00.000Z", source_event_count: 2, returned_event_count: 2, truncated: false },
  }), { status: 200 });
  const response = await createToolsHandler(analytics)(new Request("https://trackmcp.test/api/v2/tools?limit=1&cursor=not-a-cursor"));
  const body = await response.json();
  assert.deepEqual(body.tools.map((tool) => tool.name), ["a"]);
  assert.equal(body.page.limit, 1);
});
