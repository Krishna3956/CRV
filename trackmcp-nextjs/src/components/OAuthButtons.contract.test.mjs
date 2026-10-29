import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const component = await readFile(new URL("./OAuthButtons.tsx", import.meta.url), "utf8");
const signInPage = await readFile(new URL("../app/signin/page.tsx", import.meta.url), "utf8");

test("social auth offers branded Google identity-token and GitHub OAuth flows", () => {
  assert.match(component, /type OAuthProvider = \"google\" \| \"github\"/);
  assert.match(component, /signInWithIdToken/);
  assert.match(component, /accounts\.google\.com\/gsi\/client/);
  assert.match(component, /signInWithOAuth/);
  assert.match(component, /authCallbackUrl/);
  assert.match(component, /safeAuthNext/);
  assert.match(component, /type=\"button\"/g);
});

test("sign-in and sign-up share the same social auth surface", () => {
  assert.match(signInPage, /<OAuthButtons/);
  assert.match(signInPage, /mode=\{mode\}/);
  assert.match(signInPage, /canContinue=\{mode === \"signin\" \|\| acceptedTerms\}/);
});
