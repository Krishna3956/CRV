import { NextResponse } from "next/server";
import {
  translate,
  TranslationConfigurationError,
  TranslationInputError,
  translationLimits,
  type TranslationRequest,
} from "@/lib/translation";

export const runtime = "nodejs";
const MAX_BODY_BYTES = 100_000;
const RATE_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 120;
const MAX_RATE_BUCKETS = 10_000;
const rateBuckets = new Map<string, { startedAt: number; count: number }>();
const CORS_ORIGINS = new Set([
  "https://trackmcp.com",
  "https://www.trackmcp.com",
  "https://app.trackmcp.com",
]);

function withCors(response: NextResponse, request: Request): NextResponse {
  const origin = request.headers.get("origin");
  if (origin && CORS_ORIGINS.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    response.headers.set("Access-Control-Max-Age", "600");
    response.headers.set("Vary", "Origin");
  }
  return response;
}

export function OPTIONS(request: Request): NextResponse {
  return withCors(new NextResponse(null, { status: 204 }), request);
}

function requestKey(request: Request): string {
  // Forwarded addresses are only meaningful when the deployment's edge has
  // been configured to strip and rewrite them. Otherwise a caller can spoof
  // the header and evade the provider-cost rate limit.
  if (process.env.TRACKMCP_TRUST_PROXY !== "true") return "anonymous";
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
}

function isRateLimited(request: Request): boolean {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets) {
    if (now - bucket.startedAt >= RATE_WINDOW_MS) rateBuckets.delete(key);
  }
  const key = requestKey(request);
  if (!rateBuckets.has(key) && rateBuckets.size >= MAX_RATE_BUCKETS) {
    const oldest = rateBuckets.keys().next().value;
    if (oldest !== undefined) rateBuckets.delete(oldest);
  }
  const previous = rateBuckets.get(key);
  if (!previous || now - previous.startedAt >= RATE_WINDOW_MS) {
    rateBuckets.set(key, { startedAt: now, count: 1 });
    return false;
  }
  previous.count += 1;
  return previous.count > MAX_REQUESTS_PER_WINDOW;
}

export async function POST(request: Request) {
  if (isRateLimited(request)) {
    return withCors(NextResponse.json({ error: "Too many translation requests. Please try again shortly." }, {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(RATE_WINDOW_MS / 1000)) },
    }), request);
  }
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return withCors(NextResponse.json({ error: "Translation request is too large." }, { status: 413 }), request);
  }
  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Translation request is too large." }, { status: 413 });
    }
    body = JSON.parse(raw);
  } catch {
    return withCors(NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }), request);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return withCors(NextResponse.json({ error: "Invalid translation request." }, { status: 400 }), request);
  }

  const input = body as Partial<TranslationRequest>;
  if (input.targetLocale !== "zh-CN") {
    return withCors(NextResponse.json({ error: "Only English to Simplified Chinese is supported." }, { status: 400 }), request);
  }
  const payload: TranslationRequest = {
    texts: Array.isArray(input.texts) ? input.texts.filter((text): text is string => typeof text === "string") : [],
    sourceLocale: input.sourceLocale === "en" ? "en" : undefined,
    targetLocale: "zh-CN",
  };

  if (payload.texts.length === 0 || payload.targetLocale !== "zh-CN") {
    return withCors(NextResponse.json({ error: "Only English to Simplified Chinese is supported." }, { status: 400 }), request);
  }

  try {
    const result = await translate(payload);
    return withCors(NextResponse.json({ ...result, locale: "zh-CN" }, {
      headers: { "Cache-Control": "private, no-store" },
    }), request);
  } catch (error) {
    const inputError = error instanceof TranslationInputError;
    const configurationError = error instanceof TranslationConfigurationError;
    return withCors(NextResponse.json(
      {
        error: configurationError ? "Chinese translation is not configured for this deployment." : "Chinese translation is temporarily unavailable.",
        code: inputError ? "translation_input" : configurationError ? "translation_not_configured" : "translation_unavailable",
        limits: translationLimits,
      },
      { status: inputError ? 400 : configurationError ? 503 : 502 },
    ), request);
  }
}
