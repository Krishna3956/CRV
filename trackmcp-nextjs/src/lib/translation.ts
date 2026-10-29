import "server-only";

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

function assertRequest(request: TranslationRequest): void {
  if (request.sourceLocale && request.sourceLocale !== "en") throw new Error("Unsupported source locale.");
  if (request.targetLocale !== "zh-CN") throw new Error("Unsupported target locale.");
  if (!Array.isArray(request.texts) || request.texts.length < 1 || request.texts.length > MAX_TEXTS) {
    throw new Error("Translation batch size is out of bounds.");
  }
  if (request.texts.some((text) => typeof text !== "string" || text.length > MAX_TEXT_LENGTH)) {
    throw new Error("A translation item is too long.");
  }
  if (request.texts.reduce((total, text) => total + text.length, 0) > MAX_TOTAL_CHARS) {
    throw new Error("Translation batch is too large.");
  }
}

async function translateWithDeepL(texts: string[]): Promise<TranslationResult> {
  const key = process.env.DEEPL_API_KEY;
  if (!key) throw new Error("DEEPL_API_KEY is not configured.");
  const endpoint = process.env.DEEPL_API_URL || "https://api.deepl.com/v2/translate";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `DeepL-Auth-Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text: texts, source_lang: "EN", target_lang: "ZH-HANS" }),
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
  if (!key) throw new Error("GOOGLE_TRANSLATE_API_KEY is not configured.");
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
  const provider = process.env.TRANSLATION_PROVIDER || (process.env.DEEPL_API_KEY ? "deepl" : "google");
  if (provider === "deepl") return translateWithDeepL(request.texts);
  if (provider === "google") return translateWithGoogle(request.texts);
  throw new Error("TRANSLATION_PROVIDER must be deepl or google.");
}

export const translationLimits = {
  maxTexts: MAX_TEXTS,
  maxTextLength: MAX_TEXT_LENGTH,
  maxTotalChars: MAX_TOTAL_CHARS,
} as const;
