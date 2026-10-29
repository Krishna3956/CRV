import "server-only";
import { createHash, createHmac } from "node:crypto";
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
  provider: "aws" | "deepl" | "google";
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

type AwsCredentials = {
  AccessKeyId?: unknown;
  SecretAccessKey?: unknown;
  Token?: unknown;
  SessionToken?: unknown;
};

function awsRegion(): string {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "ap-south-1";
}

async function getAwsCredentials(): Promise<{ accessKeyId: string; secretAccessKey: string; sessionToken?: string }> {
  const envAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const envSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (envAccessKeyId && envSecretAccessKey) {
    return {
      accessKeyId: envAccessKeyId,
      secretAccessKey: envSecretAccessKey,
      ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {}),
    };
  }
  const relativeUri = process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI;
  const fullUri = process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI;
  const endpoint = relativeUri ? `http://169.254.170.2${relativeUri}` : fullUri;
  if (!endpoint) throw new TranslationConfigurationError("AWS container credentials are not configured.");
  const response = await fetch(endpoint, { cache: "no-store", signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`AWS container credentials returned ${response.status}.`);
  const body = (await response.json()) as AwsCredentials;
  const accessKeyId = typeof body.AccessKeyId === "string" ? body.AccessKeyId : "";
  const secretAccessKey = typeof body.SecretAccessKey === "string" ? body.SecretAccessKey : "";
  const sessionToken = typeof body.Token === "string" ? body.Token : typeof body.SessionToken === "string" ? body.SessionToken : undefined;
  if (!accessKeyId || !secretAccessKey) throw new TranslationConfigurationError("AWS container credentials are incomplete.");
  return { accessKeyId, secretAccessKey, ...(sessionToken ? { sessionToken } : {}) };
}

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac("sha256", key).update(value).digest();
}

async function translateWithAws(texts: string[]): Promise<TranslationResult> {
  const credentials = await getAwsCredentials();
  const region = awsRegion();
  const host = `translate.${region}.amazonaws.com`;
  const endpoint = `https://${host}/`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const service = "translate";
  const target = "AWSShineFrontendService_20170701.TranslateText";
  const translateOne = async (text: string): Promise<string> => {
    const body = JSON.stringify({ Text: text, SourceLanguageCode: "en", TargetLanguageCode: "zh" });
    const payloadHash = createHash("sha256").update(body).digest("hex");
    const headers: Record<string, string> = {
      "content-type": "application/x-amz-json-1.1",
      host,
      "x-amz-date": amzDate,
      "x-amz-target": target,
    };
    if (credentials.sessionToken) headers["x-amz-security-token"] = credentials.sessionToken;
    const signedHeaderNames = Object.keys(headers).sort();
    const canonicalHeaders = signedHeaderNames.map((name) => `${name}:${headers[name].trim()}\n`).join("");
    const canonicalRequest = ["POST", "/", "", canonicalHeaders, signedHeaderNames.join(";"), payloadHash].join("\n");
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      createHash("sha256").update(canonicalRequest).digest("hex"),
    ].join("\n");
    const kDate = hmac(`AWS4${credentials.secretAccessKey}`, dateStamp);
    const kRegion = hmac(kDate, region);
    const kService = hmac(kRegion, service);
    const kSigning = hmac(kService, "aws4_request");
    const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex");
    const authorization = `AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaderNames.join(";")}, Signature=${signature}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { ...headers, authorization },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`AWS Translate returned ${response.status}.`);
    const result = (await response.json()) as { TranslatedText?: unknown };
    const translated = typeof result.TranslatedText === "string" ? result.TranslatedText : "";
    if (!translated) throw new Error("AWS Translate returned an incomplete translation.");
    return translated;
  };

  // TranslateText accepts one string per request. Keep a small bounded fan-out
  // so a full 100-item page does not exceed the request timeout or throttle the
  // account with an unbounded burst.
  const translations: string[] = [];
  for (let offset = 0; offset < texts.length; offset += 5) {
    const batch = texts.slice(offset, offset + 5);
    translations.push(...(await Promise.all(batch.map(translateOne))));
  }
  return { translations, provider: "aws" };
}

async function translateProviderCached(
  provider: "aws" | "deepl" | "google",
  texts: string[],
  deeplEndpoint: string,
  glossaryId: string,
): Promise<TranslationResult> {
  const cacheDigest = createHash("sha256")
    .update(JSON.stringify({ provider, texts, deeplEndpoint, glossaryId, targetLocale: "zh-CN" }))
    .digest("hex");
  const cached = unstable_cache(
    async () => {
      if (provider === "aws") return translateWithAws(texts);
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
  if (provider !== "aws" && provider !== "deepl" && provider !== "google") {
    throw new TranslationConfigurationError("TRANSLATION_PROVIDER must be aws, deepl, or google.");
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
