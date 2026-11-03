import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./page.tsx", import.meta.url), "utf8");

test("signup asks only for optional name, email, and password", () => {
  assert.match(source, /Name <span className="font-normal text-faint">\(optional\)<\/span>/);
  assert.match(source, /autoComplete="name"/);
  assert.doesNotMatch(source, /Confirm password/);
  assert.doesNotMatch(source, /setConfirmPassword/);
  assert.match(source, /first_name: firstName/);
  assert.match(source, /full_name: name\.trim\(\)/);
});

test("signup keeps email verification and password policy explicit", () => {
  assert.match(source, /password\.length < 8/);
  assert.match(source, /We(?:&apos;|')ll verify your email before opening the dashboard/);
  assert.match(source, /Verify your email/);
});

test("signup query mode is applied after hydration without a window-dependent initializer", () => {
  assert.match(source, /useState<\"signin\" \| \"signup\">\(initialMode\)/);
  assert.match(source, /const requestedMode = new URLSearchParams\(window\.location\.search\)\.get\("mode"\);/);
  assert.match(source, /if \(requestedMode === "signup"\) setMode\("signup"\);/);
});
