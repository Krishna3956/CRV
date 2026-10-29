import "server-only";
import { assertTranslationBatchQuality } from "./translation-quality";

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

async function translateWithDeepL(texts: string[]): Promise<TranslationResult> {
  const key = process.env.DEEPL_API_KEY;
  if (!key) throw new TranslationConfigurationError("DEEPL_API_KEY is not configured.");
  const endpoint = process.env.DEEPL_API_URL || "https://api.deepl.com/v2/translate";
  const glossaryId = process.env.DEEPL_GLOSSARY_ID;
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
  });
  if (!response.ok) throw new Error(`Google Cloud Translation returned ${response.status}.`);
  const body = (await response.json()) as { data?: { translations?: { translatedText?: unknown }[] } };
  const translations = body.data?.translations?.map((item) => (typeof item.translatedText === "string" ? item.translatedText : "")) || [];
  if (translations.length !== texts.length || translations.some((text) => !text)) {
    throw new Error("Google Cloud Translation returned an incomplete translation batch.");
  }
  return { translations, provider: "google" };
}

export async function translate(request: TranslationRequest): Promise<TranslationResult> {
  assertRequest(request);
  if (process.env.TRANSLATION_ENABLE_MACHINE_TRANSLATION !== "true") {
    throw new TranslationConfigurationError("Machine translation is disabled until explicitly approved.");
  }
  const provider = process.env.TRANSLATION_PROVIDER || (process.env.DEEPL_API_KEY ? "deepl" : "google");
  let result: TranslationResult;
  if (provider === "deepl") result = await translateWithDeepL(request.texts);
  else if (provider === "google") result = await translateWithGoogle(request.texts);
  else throw new TranslationConfigurationError("TRANSLATION_PROVIDER must be deepl or google.");
  assertTranslationBatchQuality(request.texts, result.translations);
  return result;
}

export const translationLimits = {
  maxTexts: MAX_TEXTS,
  maxTextLength: MAX_TEXT_LENGTH,
  maxTotalChars: MAX_TOTAL_CHARS,
} as const;
