import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");

test("OAuth callback keeps the redirect origin canonical and provider errors bounded", () => {
  assert.match(source, /NEXT_PUBLIC_SITE_URL/);
  assert.match(source, /https:\/\/app\.trackmcp\.com/);
  assert.match(source, /AUTH_ERROR_CODES/);
  assert.match(source, /access_denied/);
  assert.match(source, /provider_error/);
  assert.match(source, /redirectToSignIn/);
  assert.doesNotMatch(source, /error_description/);
  assert.doesNotMatch(source, /encodeURIComponent\(providerError\)/);
});

test("OAuth callback does not turn a missing authorization code into a session", () => {
  assert.match(source, /if \(!code\)/);
  assert.match(source, /return redirectToSignIn\("provider_error"\)/);
  assert.match(source, /exchangeCodeForSession\(code\)/);
});
