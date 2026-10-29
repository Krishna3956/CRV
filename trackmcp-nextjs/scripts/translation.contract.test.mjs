import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(process.cwd());

test("root layout exposes one global language switcher and runtime", async () => {
  const source = await readFile(resolve(root, "src/app/layout.tsx"), "utf8");
  assert.match(source, /<LanguageSwitcher\s*\/>/);
  assert.match(source, /<TranslationRuntime\s*\/>/);
  const nav = await readFile(resolve(root, "src/components/Nav.tsx"), "utf8");
  assert.match(nav, /import \{ LanguageSwitcher \} from "\.\/LanguageSwitcher"/);
  assert.match(nav, /<LanguageSwitcher\s*\/>/);
});

test("route audit covers static and dynamic page families", async () => {
  const source = await readFile(resolve(root, "scripts/translation-route-audit.mjs"), "utf8");
  assert.match(source, /tool\/\[name\]/);
  assert.match(source, /blog\/\[slug\]/);
  assert.match(source, /category\/\[slug\]/);
  assert.match(source, /apiRoutesExcluded/);
  assert.match(source, /sourcePublicUrlInventory/);
  assert.match(source, /staticPageEntrypoints/);
  assert.match(source, /sitemapStaticCoverageGaps/);
  assert.match(source, /blogPostEntries/);
  assert.match(source, /categoryEntries/);
});

test("live runtime audit checks static, blog, category, tool, and endpoint behavior", async () => {
  const source = await readFile(resolve(root, "scripts/live-translation-runtime-audit.mjs"), "utf8");
  for (const marker of ["Language: English", "/sitemap.xml", "/tool-sitemap.xml", "/api/translation", "representativeBlog", "representativeCategory"]) {
    assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(source, /rejectsUnsupportedLocale/);
  assert.match(source, /TRANSLATION_AUDIT_TRANSLATE/);
  assert.match(source, /TRANSLATION_AUDIT_ALL_SITEMAP_ROUTES/);
  assert.match(source, /sitemapAuditUrls/);
  assert.match(source, /providerProbePassed/);
  assert.match(source, /AUDIT_USER_AGENT/);
});

test("live sitemap audit identifies itself to edge protection", async () => {
  const source = await readFile(resolve(root, "scripts/live-translation-sitemap-audit.mjs"), "utf8");
  assert.match(source, /AUDIT_USER_AGENT/);
  assert.match(source, /User-Agent/);
});

test("Chinese browser preferences are detected without overriding an explicit cookie", async () => {
  const source = await readFile(resolve(root, "src/components/site-locale.ts"), "utf8");
  assert.match(source, /navigator\.languages/);
  assert.match(source, /zh-CN/);
  assert.match(source, /trackmcp_locale/);
  assert.match(source, /browserPrefersSimplifiedChinese/);
  const switcher = await readFile(resolve(root, "src/components/LanguageSwitcher.tsx"), "utf8");
  assert.match(switcher, /useSyncExternalStore/);
  assert.match(switcher, /getServerLocale/);
  assert.match(switcher, /writeSiteLocale\(next\)/);
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
  assert.match(source, /MAX_RATE_BUCKETS/);
  assert.match(source, /rateBuckets\.delete/);
  assert.match(source, /status: 429/);
  assert.match(source, /TRACKMCP_TRUST_PROXY/);
  assert.match(source, /!== "true"/);
});

test("translation batches are bounded and use a configured provider", async () => {
  const source = await readFile(resolve(root, "src/lib/translation.ts"), "utf8");
  assert.match(source, /const MAX_TEXTS = 100/);
  assert.match(source, /const MAX_TOTAL_CHARS = 40_000/);
  assert.match(source, /const PROVIDER_TIMEOUT_MS = 15_000/);
  assert.match(source, /AbortSignal\.timeout/);
  assert.match(source, /process\.env\.DEEPL_API_KEY/);
  assert.match(source, /process\.env\.GOOGLE_TRANSLATE_API_KEY/);
  assert.match(source, /DEEPL_GLOSSARY_ID/);
  assert.match(source, /TRANSLATION_ENABLE_MACHINE_TRANSLATION/);
  assert.match(source, /TRANSLATION_PROVIDER/);
  assert.match(source, /translateWithAws/);
  assert.match(source, /AWS_CONTAINER_CREDENTIALS_RELATIVE_URI/);
  assert.match(source, /translate:TranslateText|AWSShineFrontendService_20170701\.TranslateText/);
  const quality = await readFile(resolve(root, "src/lib/translation-quality.ts"), "utf8");
  assert.match(quality, /HAN_CHARACTERS/);
  assert.match(quality, /PROTECTED_TOKEN/);
  assert.match(source, /assertTranslationBatchQuality/);
  assert.match(source, /unstable_cache/);
  assert.match(source, /trackmcp-translation-cache/);
  assert.match(source, /createHash\("sha256"\)/);
});

test("runtime excludes code and user-editable content", async () => {
  const source = await readFile(resolve(root, "src/components/TranslationRuntime.tsx"), "utf8");
  assert.match(source, /data-no-translate/);
  assert.match(source, /pre, code/);
  assert.match(source, /contenteditable='true'/);
  assert.match(source, /placeholder/);
  assert.match(source, /aria-label/);
  assert.match(source, /document-title/);
  assert.match(source, /document\.title/);
  assert.match(source, /attributeFilter/);
  assert.match(source, /pruneDisconnectedRecords/);
  assert.match(source, /MutationObserver/);
  assert.match(source, /characterData: true/);
  assert.match(source, /translationGeneration/);
  assert.match(source, /translationCache/);
  const logo = await readFile(resolve(root, "src/components/TrackMCPLogo.tsx"), "utf8");
  assert.match(logo, /data-no-translate/);
});

test("the real App Runner rollout reconciles translation configuration before deployment", async () => {
  const script = await readFile(resolve(root, "scripts/reconcile-translation-runtime.sh"), "utf8");
  const workflow = await readFile(resolve(root, "../.github/workflows/deploy.yml"), "utf8");
  assert.match(workflow, /Reconcile Chinese translation runtime/);
  assert.match(workflow, /vars\.TRACKMCP_TRANSLATION_PROVIDER/);
  assert.match(workflow, /vars\.TRACKMCP_TRANSLATION_ENABLE_MACHINE_TRANSLATION/);
  assert.match(workflow, /secrets\.TRACKMCP_TRANSLATION_SECRETS_ARN/);
  assert.match(workflow, /bash scripts\/reconcile-translation-runtime\.sh/);
  assert.match(script, /describe-service/);
  assert.match(script, /RuntimeEnvironmentVariables/);
  assert.match(script, /RuntimeEnvironmentSecrets/);
  assert.match(script, /DEEPL_API_KEY/);
  assert.match(script, /GOOGLE_TRANSLATE_API_KEY/);
  assert.match(script, /current_provider.*aws/);
  assert.match(script, /update-service/);
  assert.match(script, /stopped before building or deploying an image/);
  assert.doesNotMatch(script, /DEEPL_API_KEY=\"/);
  assert.doesNotMatch(script, /GOOGLE_TRANSLATE_API_KEY=\"/);
});
