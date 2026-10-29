const HAN_CHARACTERS = /[\u3400-\u9fff]/;
const PROTECTED_TOKEN = /https?:\/\/[^\s)]+|`[^`]+`/g;
const OPAQUE_TECHNICAL_LABEL = /^(?:[A-Za-z]+(?:\s+(?:SDK|API|CLI|MCP|HTTP|SSE|OTel|JSON|OAuth|URL|ID)))+$/;

function expectsNaturalLanguage(source: string): boolean {
  const normalized = source.trim();

  // A page contains short protocol/product tokens and shell/package labels
  // alongside prose. AWS Translate can legitimately return those unchanged,
  // so they must not make an otherwise valid batch fail quality validation.
  // This also covers values such as `@trackmcp/cli init`, which are code-like
  // even when a caller did not mark the surrounding DOM node as code.
  if (
    /^(?:mcp|track|trackmcp|npx|en|sdk|api|cli|http|sse|otel|json|oauth|url|id)$/i.test(normalized) ||
    OPAQUE_TECHNICAL_LABEL.test(normalized) ||
    /^\$\s+[A-Za-z0-9@._/+:-]+(?:\s+[A-Za-z0-9@._/+:-]+)*$/.test(normalized) ||
    (/[\/@._:+-]/.test(normalized) && /^[A-Za-z0-9@._/+:-]+(?:\s+[A-Za-z0-9@._/+:-]+)*$/.test(normalized))
  ) {
    return false;
  }

  // Acronyms and product identifiers such as MCP, API, GitHub, and TrackMCP
  // may correctly remain Latin. Ordinary words should produce at least one
  // Han character in a Simplified Chinese response.
  return normalized.split(/\s+/).some((word) => /^[A-Z]?[a-z]{3,}[.,!?;:)]*$/.test(word));
}

export function translationQualityError(source: string, translated: string): string | null {
  if (!translated.trim()) return "Translation provider returned an empty item.";
  if (expectsNaturalLanguage(source) && !HAN_CHARACTERS.test(translated)) {
    return "Translation provider returned an untranslated Latin-language item.";
  }
  for (const token of source.match(PROTECTED_TOKEN) || []) {
    if (!translated.includes(token)) return "Translation provider changed a protected token.";
  }
  return null;
}

export function assertTranslationBatchQuality(source: string[], translated: string[]): void {
  if (source.length !== translated.length) throw new Error("Translation provider returned an incomplete batch.");
  source.forEach((item, index) => {
    const error = translationQualityError(item, translated[index] || "");
    if (error) throw new Error(error);
  });
}
