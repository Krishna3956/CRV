import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const layout = await readFile(new URL("../src/app/layout.tsx", import.meta.url), "utf8");

test("optional GA4 analytics stays out of the initial article render path", () => {
  const gaScript = layout.match(/<Script src=\{`https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=\$\{GA_ID\}`\} strategy="([^"]+)"\s*\/>/);
  const gaConfig = layout.match(/<Script id="ga4" strategy="([^"]+)">/);
  assert.equal(gaScript?.[1], "lazyOnload");
  assert.equal(gaConfig?.[1], "lazyOnload");
  assert.doesNotMatch(layout, /googletagmanager\.com\/gtag\/js[^\n]*strategy="afterInteractive"/);
});
