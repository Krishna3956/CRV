import { NextResponse } from "next/server";
import { translate, translationLimits, type TranslationRequest } from "@/lib/translation";

export const runtime = "nodejs";
const MAX_BODY_BYTES = 100_000;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Translation request is too large." }, { status: 413 });
  }
  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Translation request is too large." }, { status: 413 });
    }
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid translation request." }, { status: 400 });
  }

  const input = body as Partial<TranslationRequest>;
  if (input.targetLocale !== "zh-CN") {
    return NextResponse.json({ error: "Only English to Simplified Chinese is supported." }, { status: 400 });
  }
  const payload: TranslationRequest = {
    texts: Array.isArray(input.texts) ? input.texts.filter((text): text is string => typeof text === "string") : [],
    sourceLocale: input.sourceLocale === "en" ? "en" : undefined,
    targetLocale: "zh-CN",
  };

  if (payload.texts.length === 0 || payload.targetLocale !== "zh-CN") {
    return NextResponse.json({ error: "Only English to Simplified Chinese is supported." }, { status: 400 });
  }

  try {
    const result = await translate(payload);
    return NextResponse.json({ ...result, locale: "zh-CN" }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Translation failed.";
    const configurationError = /not configured|must be deepl|Unsupported|out of bounds|too large|too long/i.test(message);
    return NextResponse.json(
      {
        error: configurationError ? "Chinese translation is not configured for this deployment." : "Chinese translation is temporarily unavailable.",
        code: configurationError ? "translation_not_configured" : "translation_unavailable",
        limits: translationLimits,
      },
      { status: configurationError ? 503 : 502 },
    );
  }
}
