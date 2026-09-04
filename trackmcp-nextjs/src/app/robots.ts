import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = "https://trackmcp.com";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: ["/admin", "/api/"] },
    ],
    sitemap: [`${base}/sitemap.xml`, `${base}/tool-sitemap.xml`],
    host: base,
  };
}
