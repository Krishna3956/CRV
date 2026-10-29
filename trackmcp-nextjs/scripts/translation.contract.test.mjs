import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(process.cwd());

test("root layout exposes one global language switcher and runtime", async () => {
  const source = await readFile(resolve(root, "src/app/layout.tsx"), "utf8");
  assert.match(source, /<LanguageSwitcher\s*\/>/);
  assert.match(source, /<TranslationRuntime\s*\/>/);
});

test("route audit covers static and dynamic page families", async () => {
  const source = await readFile(resolve(root, "scripts/translation-route-audit.mjs"), "utf8");
  assert.match(source, /tool\/\[name\]/);
  assert.match(source, /blog\/\[slug\]/);
  assert.match(source, /category\/\[slug\]/);
  assert.match(source, /apiRoutesExcluded/);
  assert.match(source, /sourcePublicUrlInventory/);
  assert.match(source, /blogPostEntries/);
  assert.match(source, /categoryEntries/);
});

test("Chinese browser preferences are detected without overriding an explicit cookie", async () => {
  const source = await readFile(resolve(root, "src/components/site-locale.ts"), "utf8");
  assert.match(source, /navigator\.languages/);
  assert.match(source, /zh-CN/);
  assert.match(source, /trackmcp_locale/);
  assert.match(source, /browserPrefersSimplifiedChinese/);
});

test("new submissions stay inside the shared translation runtime", async () => {
  const submit = await readFile(resolve(root, "src/app/api/repository/submit/route.ts"), "utf8");
  assert.match(submit, /from\("mcp_tools"\)\.insert/);
  assert.match(submit, /revalidatePath\("\/tool-sitemap\.xml"\)/);
  assert.match(submit, /revalidatePath\("\/new", "page"\)/);
  const runtime = await readFile(resolve(root, "src/components/TranslationRuntime.tsx"), "utf8");
  assert.match(runtime, /MutationObserver/);
  assert.match(runtime, /readSiteLocale/);
});

test("translation endpoint only accepts English to Simplified Chinese", async () => {
  const source = await readFile(resolve(root, "src/app/api/translation/route.ts"), "utf8");
  assert.match(source, /input\.targetLocale !== "zh-CN"/);
  assert.match(source, /sourceLocale: input\.sourceLocale === "en"/);
  assert.match(source, /targetLocale: "zh-CN"/);
  assert.match(source, /translation_not_configured/);
  assert.match(source, /MAX_REQUESTS_PER_WINDOW/);
  assert.match(source, /status: 429/);
});

test("translation batches are bounded and use a configured provider", async () => {
  const source = await readFile(resolve(root, "src/lib/translation.ts"), "utf8");
  assert.match(source, /const MAX_TEXTS = 100/);
  assert.match(source, /const MAX_TOTAL_CHARS = 40_000/);
  assert.match(source, /process\.env\.DEEPL_API_KEY/);
  assert.match(source, /process\.env\.GOOGLE_TRANSLATE_API_KEY/);
  assert.match(source, /DEEPL_GLOSSARY_ID/);
  assert.match(source, /TRANSLATION_ENABLE_MACHINE_TRANSLATION/);
  assert.match(source, /TRANSLATION_PROVIDER/);
});

test("runtime excludes code and user-editable content", async () => {
  const source = await readFile(resolve(root, "src/components/TranslationRuntime.tsx"), "utf8");
  assert.match(source, /data-no-translate/);
  assert.match(source, /pre, code/);
  assert.match(source, /contenteditable='true'/);
  assert.match(source, /MutationObserver/);
  assert.match(source, /translationGeneration/);
  assert.match(source, /translationCache/);
});
