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
  // Featured MCP and AI-related blog posts
  {
    url: 'https://blog.neosage.io/p/why-every-ai-builder-needs-to-understand',
    isFeatured: true,
  },
  {
    url: 'https://www.linkedin.com/pulse/model-context-protocol-bridge-between-ai-potential-harsh-chaudhary-measc/?trackingId=lMKbck7tT%2BC%2FkLH%2FBMQhXw%3D%3D',
    isFeatured: true,
  },
]
