export type SiteLocale = "en" | "zh-CN";

const COOKIE_NAME = "trackmcp_locale";
export const LANGUAGE_SUGGESTION_DISMISSED_COOKIE = "trackmcp_locale_suggestion_dismissed";

export function browserPrefersSimplifiedChinese(): boolean {
  if (typeof navigator === "undefined") return false;
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  return languages.some((language) => {
    const normalized = language.toLowerCase();
    return normalized === "zh" || normalized.startsWith("zh-cn") || normalized.startsWith("zh-hans") || normalized.startsWith("zh-sg");
  });
}

export function readSiteLocale(): SiteLocale {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]+)`));
  if (match?.[1] === "zh-CN") return "zh-CN";
  if (match?.[1] === "en") return "en";
  // English is the deterministic default. Browser language is only a signal
  // for the optional, non-blocking suggestion; it must never silently change
  // the page language or override an explicit URL/cookie choice.
  return "en";
}

export function writeSiteLocale(locale: SiteLocale): void {
  document.cookie = `${COOKIE_NAME}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function hasDismissedLanguageSuggestion(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((entry) => entry === `${LANGUAGE_SUGGESTION_DISMISSED_COOKIE}=1`);
}

export function dismissLanguageSuggestion(): void {
  document.cookie = `${LANGUAGE_SUGGESTION_DISMISSED_COOKIE}=1; Path=/; Max-Age=31536000; SameSite=Lax`;
}
