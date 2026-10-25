import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "./route.ts";

test("health exposes only bounded non-secret runtime identity", async () => {
  const previous = process.env.TRACKMCP_RELEASE_SHA;
  process.env.TRACKMCP_RELEASE_SHA = "a".repeat(40);
  try {
    const response = await GET();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { status: "ok", release_sha: "a".repeat(40) });
  } finally {
    if (previous === undefined) delete process.env.TRACKMCP_RELEASE_SHA;
    else process.env.TRACKMCP_RELEASE_SHA = previous;
  }
});

test("health does not claim an invalid or missing release identity", async () => {
  const previous = process.env.TRACKMCP_RELEASE_SHA;
  delete process.env.TRACKMCP_RELEASE_SHA;
  try {
    assert.deepEqual(await (await GET()).json(), { status: "ok", release_sha: "unknown" });
  } finally {
    if (previous === undefined) delete process.env.TRACKMCP_RELEASE_SHA;
    else process.env.TRACKMCP_RELEASE_SHA = previous;
  }
});
