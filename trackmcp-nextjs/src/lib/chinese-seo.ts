import type { Metadata } from "next";

export const SITE_URL = "https://trackmcp.com";

/**
 * These are the Chinese routes that have real server-rendered Simplified
 * Chinese content. Do not add a URL here until its Chinese page exists.
 */
export const CHINESE_SEO_PATHS = [
  "/",
  "/mcp-observability",
  "/mcp-server-analytics",
  "/mcp-tool-analytics",
  "/free-mcp-servers",
  "/docs",
  "/docs/protocol",
  "/docs/typescript",
  "/docs/python",
  "/blog",
] as const;

export type ChineseSeoPath = (typeof CHINESE_SEO_PATHS)[number];

export function chinesePath(path: ChineseSeoPath): string {
  return path === "/" ? "/zh-cn" : `/zh-cn${path}`;
}

export function chineseUrl(path: ChineseSeoPath): string {
  return `${SITE_URL}${chinesePath(path)}`;
}

export function englishUrl(path: ChineseSeoPath): string {
  return `${SITE_URL}${path}`;
}

export function chinesePageMeta({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: ChineseSeoPath;
}): Metadata {
  const url = chineseUrl(path);
  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: chinesePath(path),
      languages: {
        en: englishUrl(path),
        "zh-CN": url,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "TrackMCP",
      locale: "zh_CN",
      alternateLocale: ["en_US"],
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}

export function chineseAlternateLinks(path: ChineseSeoPath) {
  return {
    en: englishUrl(path),
    "zh-CN": chineseUrl(path),
  };
}
