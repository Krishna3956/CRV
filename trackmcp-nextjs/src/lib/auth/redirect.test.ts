import assert from "node:assert/strict";
import test from "node:test";
import { authCallbackUrl, safeAuthNext } from "./redirect.ts";

test("safeAuthNext accepts internal paths and preserves their query", () => {
  assert.equal(safeAuthNext("/dashboard?tab=overview"), "/dashboard?tab=overview");
  assert.equal(safeAuthNext("/device?user_code=ABC"), "/device?user_code=ABC");
});

test("safeAuthNext rejects external and protocol-relative redirects", () => {
  assert.equal(safeAuthNext("https://evil.example/"), "/dashboard");
  assert.equal(safeAuthNext("//evil.example/"), "/dashboard");
  assert.equal(safeAuthNext("/\\evil.example/"), "/dashboard");
  assert.equal(safeAuthNext(undefined, "/signin"), "/signin");
});

test("authCallbackUrl carries only the bounded post-auth path", () => {
  assert.equal(
    authCallbackUrl("https://app.trackmcp.com", "/dashboard?tab=overview"),
    "https://app.trackmcp.com/auth/callback?next=%2Fdashboard%3Ftab%3Doverview",
  );
  assert.match(authCallbackUrl("http://localhost:3000", "https://evil.example"), /next=%2Fdashboard/);
});
