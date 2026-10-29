const HAN_CHARACTERS = /[\u3400-\u9fff]/;
const PROTECTED_TOKEN = /https?:\/\/[^\s)]+|`[^`]+`/g;

function expectsNaturalLanguage(source: string): boolean {
  // Acronyms and product identifiers such as MCP, API, GitHub, and TrackMCP
  // may correctly remain Latin. Ordinary words should produce at least one
  // Han character in a Simplified Chinese response.
  return source.split(/\s+/).some((word) => /^[A-Z]?[a-z]{3,}[.,!?;:)]*$/.test(word));
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
