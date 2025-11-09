/**
 * Blog Metadata Fetcher
 * Extracts metadata from blog URLs for card generation
 */

export interface BlogMetadata {
  title: string
  author?: string
  authorAvatar?: string
  excerpt?: string
  featuredImage?: string
  favicon?: string
  domain?: string
  url: string
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return ''
  }
}

/**
 * Get favicon URL from domain
 */
function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`
  } catch {
    return ''
  }
}

/**
 * Fetch and parse Open Graph metadata from a URL
 * This runs on the server side
 */
export async function fetchBlogMetadata(url: string): Promise<BlogMetadata> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BlogMetadataBot/1.0)',
      },
      next: { revalidate: 86400 }, // Cache for 24 hours
    })

    if (!response.ok) {
      return {
        title: 'Blog Post',
        url,
        domain: extractDomain(url),
        favicon: getFaviconUrl(url),
      }
    }

    const html = await response.text()

    // Extract metadata using regex patterns
    const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)
    const descriptionMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)
    const imageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
    const authorMatch = html.match(/<meta\s+name=["']author["']\s+content=["']([^"']+)["']/i)

    // Fallback to regular meta tags if OG tags not found
    const titleFallback = html.match(/<title>([^<]+)<\/title>/i)
    const descriptionFallback = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)

    const title = titleMatch?.[1] || titleFallback?.[1] || 'Blog Post'
    const excerpt = descriptionMatch?.[1] || descriptionFallback?.[1] || ''
    const featuredImage = imageMatch?.[1]
    const author = authorMatch?.[1]

    return {
      title: decodeHTMLEntities(title).trim(),
      excerpt: decodeHTMLEntities(excerpt).trim().substring(0, 200),
      featuredImage,
      author: author ? decodeHTMLEntities(author).trim() : undefined,
      url,
      domain: extractDomain(url),
      favicon: getFaviconUrl(url),
    }
  } catch (error) {
    console.error(`Failed to fetch metadata for ${url}:`, error)
    return {
      title: 'Blog Post',
      url,
      domain: extractDomain(url),
      favicon: getFaviconUrl(url),
    }
  }
}

/**
 * Decode HTML entities
 */
function decodeHTMLEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
  }
  return text.replace(/&[^;]+;/g, (match) => entities[match] || match)
}
