/**
 * Featured Blogs Data
 * Curated third-party blog posts about MCP and related topics
 * 
 * To add a new blog:
 * 1. Add the blog URL to this array
 * 2. Set isFeatured: true for "Community Pick" badge
 * 3. Metadata will be auto-fetched on page load
 */

export interface FeaturedBlog {
  url: string
  isFeatured?: boolean
}

export const FEATURED_BLOGS: FeaturedBlog[] = [
  // Static featured blogs can be added here
  // All blogs from the database will be shown first
]
