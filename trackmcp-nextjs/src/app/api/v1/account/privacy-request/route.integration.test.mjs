import assert from "node:assert/strict";
import test from "node:test";
import { createPrivacyRequestHandlers } from "./handlers.ts";

const user = { id: "user-a" };
const workspace = "11111111-1111-4111-8111-111111111111";

function fakeAdmin() {
  const rows = [];
  return {
    rows,
    from(table) {
      if (table === "trackmcp_workspace_members") return { select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: { workspace_id: workspace }, error: null }) };
      const filters = {};
      const query = {
        select() { return this; },
        eq(column, value) { filters[column] = value; return this; },
        async maybeSingle() { return { data: rows.find((row) => Object.entries(filters).every(([key, value]) => row[key] === value)) ?? null, error: null }; },
        insert(payload) {
          const row = { id: `request-${rows.length + 1}`, status: "requested", requested_at: "2026-10-18T00:00:00.000Z", reviewed_at: null, completed_at: null, ...payload };
          return { select() { return this; }, single: async () => { rows.push(row); return { data: row, error: null }; } };
        },
      };
      return query;
    },
  };
}

test("privacy request route is idempotent, caller-scoped, and secret-free", async () => {
  const admin = fakeAdmin();
  const { POST, GET } = createPrivacyRequestHandlers({ getUser: async () => user, getAdmin: () => admin });
  const request = () => new Request("https://app.test/api/v1/account/privacy-request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ request_type: "delete", workspace_id: workspace, idempotency_key: "delete-1", reason_category: "user_requested" }) });
  const first = await POST(request());
  assert.equal(first.status, 201);
  const firstBody = await first.json();
  assert.equal(firstBody.idempotent_replay, false);
  assert.equal(firstBody.request.status, "requested");
  assert.equal("idempotency_key" in firstBody.request, false);
  assert.equal("audit_metadata" in firstBody.request, false);
  const replay = await POST(request());
  assert.equal(replay.status, 200);
  assert.equal((await replay.json()).idempotent_replay, true);
  assert.equal(admin.rows.length, 1);
  const own = await GET(new Request(`https://app.test/api/v1/account/privacy-request?request_id=${encodeURIComponent(firstBody.request.id)}`));
  assert.equal(own.status, 200);

  const other = createPrivacyRequestHandlers({ getUser: async () => ({ id: "user-b" }), getAdmin: () => admin });
  const denied = await other.GET(new Request(`https://app.test/api/v1/account/privacy-request?request_id=${encodeURIComponent(firstBody.request.id)}`));
  assert.equal(denied.status, 404);
});

test("privacy request route rejects oversized and non-object bodies before persistence", async () => {
  const admin = fakeAdmin();
  const { POST } = createPrivacyRequestHandlers({ getUser: async () => user, getAdmin: () => admin });
  const oversized = await POST(new Request("https://app.test/api/v1/account/privacy-request", {
    method: "POST",
    body: "x".repeat(4097),
  }));
  assert.equal(oversized.status, 413);
  const arrayBody = await POST(new Request("https://app.test/api/v1/account/privacy-request", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify([]),
  }));
  assert.equal(arrayBody.status, 400);
  assert.equal(admin.rows.length, 0);
});
