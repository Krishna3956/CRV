import assert from "node:assert/strict";

const endpoint = process.env.TRACKMCP_REFRESH_SMOKE_URL;
if (!endpoint) throw new Error("TRACKMCP_REFRESH_SMOKE_URL is required");
const parsed = new URL(endpoint);
assert.equal(parsed.protocol, "https:", "refresh smoke requires HTTPS");
assert.match(parsed.pathname, /\/api\/internal\/refresh\/run$/, "unexpected refresh endpoint path");

async function probe(headers) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: "{}",
    redirect: "manual",
    signal: AbortSignal.timeout(10_000),
  });
  return response.status;
}

const unauthenticated = await probe({});
const invalidToken = await probe({ authorization: "Bearer invalid-test-token" });
assert.equal(unauthenticated, 401, "unauthenticated refresh requests must be rejected");
assert.equal(invalidToken, 401, "invalid refresh tokens must be rejected");
console.log(JSON.stringify({ endpoint_path: parsed.pathname, unauthenticated, invalid_token: invalidToken }));
