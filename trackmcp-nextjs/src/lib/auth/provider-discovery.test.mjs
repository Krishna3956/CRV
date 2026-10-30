import assert from "node:assert/strict";
import test from "node:test";
import { discoverAuthProviders } from "./provider-discovery.mjs";

const response = (status, body) => new Response(body === undefined ? null : JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json" },
});

test("provider discovery retries a transient 503 and returns enabled providers", async () => {
  let calls = 0;
  const delays = [];
  const providers = await discoverAuthProviders({
    fetchImpl: async () => {
      calls += 1;
      return calls === 1 ? response(503) : response(200, { google: true, github: true });
    },
    sleepImpl: async (ms) => delays.push(ms),
  });
  assert.deepEqual(providers, { google: true, github: true });
  assert.equal(calls, 2);
  assert.deepEqual(delays, [150]);
});

test("provider discovery is bounded after repeated transient failures", async () => {
  let calls = 0;
  const providers = await discoverAuthProviders({
    fetchImpl: async () => {
      calls += 1;
      return response(502);
    },
    sleepImpl: async () => {},
  });
  assert.deepEqual(providers, { google: false, github: false });
  assert.equal(calls, 3);
});

test("provider discovery does not retry permanent or malformed responses", async () => {
  let calls = 0;
  const unauthorized = await discoverAuthProviders({
    fetchImpl: async () => {
      calls += 1;
      return response(401);
    },
    sleepImpl: async () => { throw new Error("unexpected retry"); },
  });
  assert.deepEqual(unauthorized, { google: false, github: false });
  assert.equal(calls, 1);

  calls = 0;
  const malformed = await discoverAuthProviders({
    fetchImpl: async () => {
      calls += 1;
      return response(200, { google: true });
    },
  });
  assert.deepEqual(malformed, { google: false, github: false });
  assert.equal(calls, 1);
});
