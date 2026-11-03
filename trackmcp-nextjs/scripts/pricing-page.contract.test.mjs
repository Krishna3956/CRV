import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync(new URL("../src/app/pricing/page.tsx", import.meta.url), "utf8");

test("pricing page presents the proposed three-tier early-access model", () => {
  assert.match(page, /name: "Free"/);
  assert.match(page, /name: "Hobby"/);
  assert.match(page, /name: "Enterprise"/);
  assert.match(page, /100,000 captured events \/ month/);
  assert.match(page, /1,000,000 captured events \/ month/);
  assert.match(page, /price: "\$29"/);
  assert.match(page, /paid billing is not active yet/);
});

test("pricing page does not present the old unsupported Pro packaging", () => {
  assert.doesNotMatch(page, /name: "Pro"/);
  assert.doesNotMatch(page, /\$49/);
  assert.match(page, /Features marked Planned are not available as paid entitlements yet/);
});

test("pricing page keeps planned capabilities explicitly labeled", () => {
  assert.match(page, /Saved views and scheduled exports/);
  assert.match(page, /Email, webhook, and Slack alerts/);
  assert.match(page, /vals: \["Planned", "Planned", "Planned"\]/);
});
