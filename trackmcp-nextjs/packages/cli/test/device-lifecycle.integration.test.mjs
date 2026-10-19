import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { createDeviceClient, pollDeviceSession, createRedeemer } from "../lib/device-client.mjs";

const key = "tmcp_lifecycle_test_key_12345678901234567890";

function json(res, status, body, headers = {}) {
  res.writeHead(status, { "content-type": "application/json", ...headers });
  res.end(JSON.stringify(body));
}

test("device lifecycle contract: start, browser approval, poll, redeem, replay", async (t) => {
  const state = { status: "pending", pollCount: 0, redemptionId: null };
  const server = createServer(async (req, res) => {
    let body = {};
    for await (const chunk of req) body = JSON.parse(String(chunk || "{}"));
    if (req.url === "/api/v1/cli/device/sessions" && req.method === "POST") {
      return json(res, 201, { device_code: "device-secret-for-fixture-12345678901234567890", user_code: "F7KQ-2M9D", verification_uri: "http://127.0.0.1/device", expires_in: 600, interval: 1 });
    }
    if (req.url === "/api/v1/cli/device/sessions/approve" && req.method === "POST") {
      assert.deepEqual(body, { user_code: "F7KQ-2M9D", workspace_id: "00000000-0000-4000-8000-000000000001" });
      if (state.status === "approved") return json(res, 200, { status: "already_approved" });
      state.status = "approved";
      return json(res, 200, { status: "approved" });
    }
    if (req.url === "/api/v1/cli/device/sessions/poll" && req.method === "POST") {
      state.pollCount += 1;
      return json(res, 200, state.status === "approved" ? { status: "approved" } : { status: "authorization_pending", interval: 1 });
    }
    if (req.url === "/api/v1/cli/device/sessions/redeem" && req.method === "POST") {
      assert.equal(body.device_code, "device-secret-for-fixture-12345678901234567890");
      assert.match(body.redemption_id, /^[a-f0-9]{32}$/);
      if (state.status === "redeemed") return json(res, 409, { status: "already_redeemed" });
      state.redemptionId = body.redemption_id;
      state.status = "redeemed";
      return json(res, 201, { api_key: key, workspace: { id: "00000000-0000-4000-8000-000000000001", name: "Fixture Workspace", slug: "fixture" } });
    }
    return json(res, 404, { error: "not found" });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());
  const { port } = server.address();
  const client = createDeviceClient({ apiBaseUrl: `http://127.0.0.1:${port}`, allowInsecureLocalDevelopment: true, allowInsecureVerificationUrl: true, retrySleep: async () => {} });

  const session = await client.startSession();
  assert.equal(session.userCode, "F7KQ-2M9D");
  assert.equal((await client.poll(session.deviceCode)).status, "authorization_pending");
  const approval = await fetch(`http://127.0.0.1:${port}/api/v1/cli/device/sessions/approve`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ user_code: session.userCode, workspace_id: "00000000-0000-4000-8000-000000000001" }) });
  assert.equal((await approval.json()).status, "approved");
  const polled = await pollDeviceSession(client, session, { sleep: async () => {}, now: () => Date.now() });
  assert.equal(polled.status, "approved");
  const redeemer = createRedeemer(client);
  const redeemed = await redeemer(session.deviceCode, "fixture-cli");
  assert.equal(redeemed.status, "approved");
  assert.equal(redeemed.apiKey, key);
  assert.equal((await redeemer(session.deviceCode, "fixture-cli")).status, "already_redeemed");
  assert.equal(state.pollCount >= 2, true);
});
