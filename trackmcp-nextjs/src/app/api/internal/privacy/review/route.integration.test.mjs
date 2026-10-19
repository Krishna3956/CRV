import assert from "node:assert/strict";
import test from "node:test";
import { createPrivacyReviewHandlers } from "./handlers.ts";

const requestId = "11111111-1111-4111-8111-111111111111";

function fakeAdmin() {
  const rows = [{ id: requestId, request_type: "delete", status: "requested", workspace_id: "workspace-1", reason_category: "user_requested", requested_at: "2026-10-19T00:00:00.000Z", reviewed_at: null, approved_at: null, completed_at: null, cancelled_at: null, review_note: null, idempotency_key: "secret-idempotency-value" }];
  return {
    rows,
    from() {
      const filters = {};
      let updatePayload = null;
      const query = {
        select() { return this; },
        eq(column, value) { filters[column] = value; return this; },
        order() { return this; },
        limit() { return this; },
        update(payload) { updatePayload = payload; return this; },
        async maybeSingle() {
          const row = rows.find((candidate) => Object.entries(filters).every(([key, value]) => candidate[key] === value)) || null;
          if (row && updatePayload) Object.assign(row, updatePayload);
          return { data: row, error: null };
        },
        then(resolve, reject) {
          Promise.resolve({ data: rows.filter((candidate) => Object.entries(filters).every(([key, value]) => candidate[key] === value)), error: null }).then(resolve, reject);
        },
      };
      return query;
    },
  };
}

const authorized = { authorization: "Bearer review-secret" };

test("privacy review queue requires the operator secret and never returns idempotency material", async () => {
  const admin = fakeAdmin();
  const { GET } = createPrivacyReviewHandlers({ getAdmin: () => admin, expectedSecret: "review-secret" });
  const denied = await GET(new Request("https://app.test/api/internal/privacy/review"));
  assert.equal(denied.status, 401);
  const response = await GET(new Request("https://app.test/api/internal/privacy/review?status=requested", { headers: authorized }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.requests.length, 1);
  assert.equal("idempotency_key" in body.requests[0], false);
  assert.equal("requester_user_id" in body.requests[0], false);
});

test("privacy review transitions are optimistic, bounded, and completion stays closed", async () => {
  const admin = fakeAdmin();
  const { POST } = createPrivacyReviewHandlers({ getAdmin: () => admin, expectedSecret: "review-secret" });
  const transition = (status, note = "") => POST(new Request("https://app.test/api/internal/privacy/review", { method: "POST", headers: { ...authorized, "content-type": "application/json" }, body: JSON.stringify({ request_id: requestId, status, note }) }));
  assert.equal((await transition("under_review")).status, 200);
  assert.equal((await transition("approved")).status, 200);
  const completed = await transition("completed");
  assert.equal(completed.status, 409);
  const invalid = await transition("rejected", "this transition is no longer valid");
  assert.equal(invalid.status, 409);
  assert.equal(admin.rows[0].status, "approved");
});
