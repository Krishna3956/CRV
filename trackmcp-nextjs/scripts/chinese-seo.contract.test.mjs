import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(process.cwd());
const read = (path) => readFile(resolve(root, path), "utf8");

test("Chinese SEO has stable server-rendered route inventory", async () => {
  const seo = await read("src/lib/chinese-seo.ts");
  const page = await read("src/app/zh-cn/[[...slug]]/page.tsx");
  assert.match(seo, /CHINESE_SEO_PATHS/);
  assert.match(seo, /\"zh-CN\"/);
  assert.match(seo, /languages/);
  assert.match(page, /generateStaticParams/);
  assert.match(page, /dynamicParams = false/);
  assert.match(page, /data-locale=\"zh-CN\"/);
  assert.match(page, /inLanguage: \"zh-CN\"/);
});

test("Chinese sitemap includes reciprocal language annotations", async () => {
  const route = await read("src/app/zh-sitemap.xml/route.ts");
  assert.match(route, /xhtml:link/);
  assert.match(route, /hreflang=\"zh-CN\"/);
  assert.match(route, /hreflang=\"en\"/);
  assert.match(route, /CHINESE_SEO_PATHS/);
});

test("Chinese locale navigation preserves English counterparts", async () => {
  const switcher = await read("src/components/LanguageSwitcher.tsx");
  const locale = await read("src/components/site-locale.ts");
  const layout = await read("src/app/layout.tsx");
  assert.match(switcher, /localizedCounterpart/);
  assert.match(switcher, /window\.location\.assign/);
  assert.match(locale, /startsWith\(\"\/zh-cn\/\"\)/);
  assert.match(layout, /isChinesePath/);
});
