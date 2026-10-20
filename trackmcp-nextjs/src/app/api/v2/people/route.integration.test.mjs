import assert from "node:assert/strict";
import test from "node:test";
import { createPeopleHandler } from "./handlers.ts";

test("people returns the complete privacy-safe Founder OS read model", async () => {
  const analytics = async () => new Response(JSON.stringify({
    range_days: 7,
    clients: [{ name: "Claude", calls: 3 }],
    who_is_using_it: {
      active_accounts: 2,
      previous_period_active_accounts: 1,
      new_accounts: 1,
      returning_accounts: 1,
      classification_status: "available",
      growth: [{ period_start: "2026-10-13", active_accounts: 2 }],
      client_breakdown: [{ name: "Claude", calls: 3, share: 1, identity_source: "self_reported" }],
      top_accounts: [{ rank: 1, activity_count: 3, active_days: 2, identity_source: "resolver" }],
      identity_coverage: 1,
      limitation: "Account identity is resolver-linked and privacy-safe.",
    },
    account_summary: { active_account_keys: 2, active_account_keys_7d: 2, returning_account_keys: 1, account_activity_bands: { one_event: 0, repeat: 1, high_activity: 1 } },
    founder_os: { identity_coverage: { value: 1 }, identity_source_counts: { resolver: 3, unresolved: 0 } },
    data_trust: { generated_at: "2026-10-20T00:00:00.000Z", query_since: "2026-10-13T00:00:00.000Z", observed_through: "2026-10-20T00:00:00.000Z", source_event_count: 3, returned_event_count: 3, truncated: false },
  }), { status: 200, headers: { "content-type": "application/json" } });
  const response = await createPeopleHandler(analytics)(new Request("https://trackmcp.test/api/v2/people"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.who_is_using_it.active_accounts, 2);
  assert.equal(body.who_is_using_it.new_accounts, 1);
  assert.equal(body.who_is_using_it.top_accounts[0].activity_count, 3);
  assert.equal(body.scope.value, "authenticated");
  assert.equal(JSON.stringify(body).includes("account_key"), false);
});
