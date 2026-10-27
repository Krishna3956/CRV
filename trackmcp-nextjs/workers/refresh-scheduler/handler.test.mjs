import assert from "node:assert/strict";
import test from "node:test";
import { handler } from "./handler.mjs";

const ENDPOINT = "https://i95pzq2xh7.ap-south-1.awsapprunner.com/api/internal/refresh/run";

async function withEnvironment(values, callback) {
  const previous = new Map(Object.keys(values).map((key) => [key, process.env[key]]));
  try {
    for (const [key, value] of Object.entries(values)) process.env[key] = value;
    return await callback();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("scheduler handler sends one bounded authenticated refresh request", async () => {
  const previousFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return { ok: true, status: 202 };
  };
  try {
    const result = await withEnvironment({
      TRACKMCP_REFRESH_WORKER_URL: ENDPOINT,
      TRACKMCP_REFRESH_WORKER_TOKEN: "test-token-is-never-logged",
    }, () => handler());
    assert.deepEqual(result, { statusCode: 202 });
    assert.equal(request.url, ENDPOINT);
    assert.equal(request.options.method, "POST");
    assert.equal(request.options.redirect, "manual");
    assert.equal(request.options.headers.authorization, "Bearer test-token-is-never-logged");
    assert.equal(request.options.headers["content-type"], "application/json");
    assert.deepEqual(JSON.parse(request.options.body), { max_jobs: 100 });
    assert.ok(request.options.signal instanceof AbortSignal);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("scheduler handler fails closed when configuration is incomplete", async () => {
  await withEnvironment({
    TRACKMCP_REFRESH_WORKER_URL: "",
    TRACKMCP_REFRESH_WORKER_TOKEN: "",
  }, async () => {
    await assert.rejects(handler(), /refresh worker is not configured/);
  });
});

test("scheduler handler reports upstream status without reading response content", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 503,
    get body() { throw new Error("response content must not be read"); },
  });
  try {
    await withEnvironment({
      TRACKMCP_REFRESH_WORKER_URL: ENDPOINT,
      TRACKMCP_REFRESH_WORKER_TOKEN: "test-token",
    }, async () => {
      await assert.rejects(handler(), /refresh worker returned HTTP 503/);
    });
  } finally {
    globalThis.fetch = previousFetch;
  }
});
