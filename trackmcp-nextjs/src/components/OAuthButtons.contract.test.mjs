import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const component = await readFile(new URL("./OAuthButtons.tsx", import.meta.url), "utf8");
const signInPage = await readFile(new URL("../app/signin/page.tsx", import.meta.url), "utf8");

test("social auth offers the configured Google and GitHub OAuth flows", () => {
  assert.match(component, /type OAuthProvider = \"google\" \| \"github\"/);
  assert.match(component, /signInWithOAuth/);
  assert.match(component, /authCallbackUrl/);
  assert.match(component, /safeAuthNext/);
  assert.match(component, /type=\"button\"/g);
});

test("Google keeps the official multicolor mark independent of the TrackMCP theme", () => {
  assert.match(component, /#4285F4/);
  assert.match(component, /#34A853/);
  assert.match(component, /#FBBC05/);
  assert.match(component, /#EA4335/);
  const googleIcon = component.match(/function GoogleIcon\(\)[\s\S]*?\n}\n/)
    ?.at(0) || "";
  assert.doesNotMatch(googleIcon, /fill-current|currentColor/);
});

test("sign-in and sign-up share the same social auth surface", () => {
  assert.match(signInPage, /<OAuthButtons/);
  assert.match(signInPage, /mode=\{mode\}/);
  assert.doesNotMatch(signInPage, /canContinue=/);
  assert.match(component, /useState<\{ google: boolean; github: boolean \} \| null>\(null\)/);
});

test("social auth is not blocked by a late terms checkbox render", () => {
  assert.doesNotMatch(component, /acceptedTerms|canContinue/);
  assert.match(signInPage, /<OAuthButtons\s+next=\{authNext\}\s+mode=\{mode\}/);
  assert.doesNotMatch(signInPage, /type="checkbox"/);
  assert.match(signInPage, /By continuing, you agree to the/);
});

test("social discovery failures fail closed without causing a layout shift", () => {
  assert.match(component, /discoverAuthProviders/);
  assert.match(component, /setProviders\(value\)/);
  assert.match(component, /aria-busy="true"/);
  assert.match(component, /Loading sign-in options/);
  assert.match(component, /skeletonClass = .*cursor-default/);
  assert.match(component, /<GoogleIcon \/>/);
  assert.match(component, /<GitHubIcon \/>/);
});

test("social provider icons are visible before provider discovery completes", () => {
  assert.match(component, /aria-busy="true"/);
  assert.match(component, /disabled className=\{skeletonClass\}/);
  assert.doesNotMatch(component, /Loading…<\/span>/);
});

test("provider discovery uses the bounded transient retry helper", () => {
  assert.match(component, /provider-discovery\.mjs/);
});
