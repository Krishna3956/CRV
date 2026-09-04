import type { MetadataRoute } from "next";
import { CATEGORIES, categorySlug } from "@/lib/repository/types";
import { posts } from "@/app/blog/posts";

export const revalidate = 3600;

const BASE = "https://trackmcp.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/features`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/mcp-server-analytics`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/mcp-server-analytics/quickstart`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/mcp-server-analytics/compare`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/mcp-observability`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/mcp-observability/remote-http`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/mcp-tool-analytics`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/blog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/docs`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/docs/typescript`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/docs/python`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/docs/api`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/docs/reference`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/repository`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/new`, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE}/top-mcp`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/categories`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/submit-mcp`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/about`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/security`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const blogRoutes: MetadataRoute.Sitemap = posts.map((p) => {
    const d = new Date(p.date);
    return {
      url: `${BASE}/blog/${p.slug}`,
      lastModified: Number.isNaN(d.getTime()) ? undefined : d,
      changeFrequency: "monthly",
      priority: 0.6,
    };
  });

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${BASE}/category/${categorySlug(c.id)}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes, ...categoryRoutes];
}
