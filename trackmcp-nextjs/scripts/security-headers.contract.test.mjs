import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");

test("global security headers are present without enabling an unreviewed CSP", () => {
  assert.match(source, /source: \"\/:path\*\"/);
  assert.match(source, /X-Content-Type-Options/);
  assert.match(source, /nosniff/);
  assert.match(source, /Referrer-Policy/);
  assert.match(source, /strict-origin-when-cross-origin/);
  assert.match(source, /X-Frame-Options/);
  assert.match(source, /SAMEORIGIN/);
  assert.match(source, /Permissions-Policy/);
  assert.match(source, /camera=\(\), microphone=\(\), geolocation=\(\)/);
  assert.match(source, /source: "\/api\/:path\*"/);
  assert.match(source, /Cache-Control.*no-store/);
  assert.doesNotMatch(source, /Content-Security-Policy/);
});
