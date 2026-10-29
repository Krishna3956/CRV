import "server-only";
import { createHash } from "node:crypto";
import { assertTranslationBatchQuality } from "./translation-quality";
import { unstable_cache } from "next/cache";

export const SUPPORTED_LOCALES = ["en", "zh-CN"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export type TranslationRequest = {
  texts: string[];
  sourceLocale?: "en";
  targetLocale: "zh-CN";
};

export type TranslationResult = {
  translations: string[];
  provider: "deepl" | "google";
};

const MAX_TEXTS = 100;
const MAX_TEXT_LENGTH = 4_000;
const MAX_TOTAL_CHARS = 40_000;
const PROVIDER_TIMEOUT_MS = 15_000;

export class TranslationInputError extends Error {
  readonly code = "translation_input";
}

export class TranslationConfigurationError extends Error {
  readonly code = "translation_configuration";
}

function assertRequest(request: TranslationRequest): void {
  if (request.sourceLocale && request.sourceLocale !== "en") throw new TranslationInputError("Unsupported source locale.");
  if (request.targetLocale !== "zh-CN") throw new TranslationInputError("Unsupported target locale.");
  if (!Array.isArray(request.texts) || request.texts.length < 1 || request.texts.length > MAX_TEXTS) {
    throw new TranslationInputError("Translation batch size is out of bounds.");
  }
  if (request.texts.some((text) => typeof text !== "string" || text.length > MAX_TEXT_LENGTH)) {
    throw new TranslationInputError("A translation item is too long.");
  }
  if (request.texts.reduce((total, text) => total + text.length, 0) > MAX_TOTAL_CHARS) {
    throw new TranslationInputError("Translation batch is too large.");
  }
}

async function translateWithDeepL(texts: string[], endpoint = process.env.DEEPL_API_URL || "https://api.deepl.com/v2/translate", glossaryId = process.env.DEEPL_GLOSSARY_ID): Promise<TranslationResult> {
  const key = process.env.DEEPL_API_KEY;
  if (!key) throw new TranslationConfigurationError("DEEPL_API_KEY is not configured.");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `DeepL-Auth-Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      text: texts,
      source_lang: "EN",
      target_lang: "ZH-HANS",
      ...(glossaryId ? { glossary_id: glossaryId } : {}),
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`DeepL returned ${response.status}.`);
  const body = (await response.json()) as { translations?: { text?: unknown }[] };
  const translations = body.translations?.map((item) => (typeof item.text === "string" ? item.text : "")) || [];
  if (translations.length !== texts.length || translations.some((text) => !text)) {
    throw new Error("DeepL returned an incomplete translation batch.");
  }
  return { translations, provider: "deepl" };
}

async function translateWithGoogle(texts: string[]): Promise<TranslationResult> {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!key) throw new TranslationConfigurationError("GOOGLE_TRANSLATE_API_KEY is not configured.");
  const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: texts, source: "en", target: "zh-CN", format: "text" }),
    cache: "no-store",
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Google Cloud Translation returned ${response.status}.`);
  const body = (await response.json()) as { data?: { translations?: { translatedText?: unknown }[] } };
  const translations = body.data?.translations?.map((item) => (typeof item.translatedText === "string" ? item.translatedText : "")) || [];
  if (translations.length !== texts.length || translations.some((text) => !text)) {
    throw new Error("Google Cloud Translation returned an incomplete translation batch.");
  }
  return { translations, provider: "google" };
}

async function translateProviderCached(
  provider: "deepl" | "google",
  texts: string[],
  deeplEndpoint: string,
  glossaryId: string,
): Promise<TranslationResult> {
  const cacheDigest = createHash("sha256")
    .update(JSON.stringify({ provider, texts, deeplEndpoint, glossaryId, targetLocale: "zh-CN" }))
    .digest("hex");
  const cached = unstable_cache(
    async () => {
      if (provider === "deepl") return translateWithDeepL(texts, deeplEndpoint, glossaryId || undefined);
      return translateWithGoogle(texts);
    },
    ["trackmcp-translation-provider-v1", cacheDigest],
    { revalidate: 86_400, tags: ["trackmcp-translation-cache"] },
  );
  return cached();
}

export async function translate(request: TranslationRequest): Promise<TranslationResult> {
  assertRequest(request);
  if (process.env.TRANSLATION_ENABLE_MACHINE_TRANSLATION !== "true") {
    throw new TranslationConfigurationError("Machine translation is disabled until explicitly approved.");
  }
  const provider = process.env.TRANSLATION_PROVIDER || (process.env.DEEPL_API_KEY ? "deepl" : "google");
  if (provider !== "deepl" && provider !== "google") {
    throw new TranslationConfigurationError("TRANSLATION_PROVIDER must be deepl or google.");
  }
  const result = await translateProviderCached(
    provider,
    request.texts,
    process.env.DEEPL_API_URL || "https://api.deepl.com/v2/translate",
    process.env.DEEPL_GLOSSARY_ID || "",
  );
  assertTranslationBatchQuality(request.texts, result.translations);
  return result;
}

export const translationLimits = {
  maxTexts: MAX_TEXTS,
  maxTextLength: MAX_TEXT_LENGTH,
  maxTotalChars: MAX_TOTAL_CHARS,
  providerTimeoutMs: PROVIDER_TIMEOUT_MS,
} as const;
