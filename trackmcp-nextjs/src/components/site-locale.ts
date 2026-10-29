export type SiteLocale = "en" | "zh-CN";

const COOKIE_NAME = "trackmcp_locale";

function browserPrefersSimplifiedChinese(): boolean {
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
  return browserPrefersSimplifiedChinese() ? "zh-CN" : "en";
}

export function writeSiteLocale(locale: SiteLocale): void {
  document.cookie = `${COOKIE_NAME}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
