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

test("translation endpoint only accepts English to Simplified Chinese", async () => {
  const source = await readFile(resolve(root, "src/app/api/translation/route.ts"), "utf8");
  assert.match(source, /input\.targetLocale !== "zh-CN"/);
  assert.match(source, /sourceLocale: input\.sourceLocale === "en"/);
  assert.match(source, /targetLocale: "zh-CN"/);
  assert.match(source, /translation_not_configured/);
});

test("translation batches are bounded and use a configured provider", async () => {
  const source = await readFile(resolve(root, "src/lib/translation.ts"), "utf8");
  assert.match(source, /const MAX_TEXTS = 100/);
  assert.match(source, /const MAX_TOTAL_CHARS = 40_000/);
  assert.match(source, /process\.env\.DEEPL_API_KEY/);
  assert.match(source, /process\.env\.GOOGLE_TRANSLATE_API_KEY/);
  assert.match(source, /TRANSLATION_PROVIDER/);
});

test("runtime excludes code and user-editable content", async () => {
  const source = await readFile(resolve(root, "src/components/TranslationRuntime.tsx"), "utf8");
  assert.match(source, /data-no-translate/);
  assert.match(source, /pre, code/);
  assert.match(source, /contenteditable='true'/);
  assert.match(source, /MutationObserver/);
});
