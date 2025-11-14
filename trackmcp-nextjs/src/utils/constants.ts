/**
 * Application constants
 * Centralized configuration for easy maintenance
 */

// SEO Constants
export const SEO = {
  // Title constraints
  MAX_TITLE_CHARS: 55,
  MAX_TITLE_PIXELS: 600,
  
  // Description constraints
  MAX_DESC_CHARS: 155,
  MAX_DESC_PIXELS: 920,
  
  // Metadata
  SITE_NAME: 'Track MCP',
  SITE_URL: 'https://www.trackmcp.com',
  SITE_DESCRIPTION: 'World\'s Largest Model Context Protocol Repository',
} as const

// Character width estimation (for pixel-based truncation)
export const CHAR_WIDTHS = {
  NARROW: 4,      // i, I, l, 1, !, ., ,, ;, :, '
  WIDE: 9,        // m, M, w, W
  SPACE: 5,       // space character
  AVERAGE: 7,     // default for other characters
} as const

// Metadata generation
export const METADATA = {
  // Benefit extraction
  BENEFIT_MAX_LENGTH: 30,
  
  // Context additions
  STARS_THRESHOLD_POPULAR: 1000,
  STARS_THRESHOLD_TRENDING: 100,
  STARS_THRESHOLD_CONTEXT: 100,
  
  // Keywords
  MAX_KEYWORDS: 15,
  MAX_TOPICS_IN_KEYWORDS: 5,
} as const

// Database queries
export const DB = {
  // Default limits
  DEFAULT_LIMIT: 100,
  MAX_LIMIT: 10000,
  
  // Tool status
  APPROVED_STATUS: 'approved',
  PENDING_STATUS: 'pending',
  ALLOWED_STATUSES: ['approved', 'pending'],
  
  // Pagination
  DEFAULT_OFFSET: 0,
  DEFAULT_PAGE_SIZE: 100,
} as const

// GitHub API
export const GITHUB = {
  // Cache settings
  CACHE_TTL: 5 * 60 * 1000,           // 5 minutes
  RATE_LIMIT_CACHE_TTL: 60 * 60 * 1000, // 1 hour
  MAX_CACHE_SIZE: 1000,
  
  // Retry settings
  DEFAULT_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  
  // API endpoints
  API_BASE: 'https://api.github.com',
  ACCEPT_HEADER: 'application/vnd.github.v3.raw',
} as const

// ISR (Incremental Static Regeneration)
export const ISR = {
  HOMEPAGE_REVALIDATE: 3600,      // 1 hour
  TOOL_PAGE_REVALIDATE: 21600,    // 6 hours
  SITEMAP_REVALIDATE: 3600,       // 1 hour
  ROBOTS_REVALIDATE: 3600,        // 1 hour
} as const

// Related tools
export const RELATED_TOOLS = {
  DEFAULT_LIMIT: 8,
  SIMILARITY_WEIGHTS: {
    SAME_LANGUAGE: 3,
    TOPIC_OVERLAP: 2,
    SIMILAR_STARS: 1,
  },
  STAR_RATIO_MIN: 0.5,
  STAR_RATIO_MAX: 2,
} as const

// Freshness signaling
export const FRESHNESS = {
  STARS_THRESHOLD_MAJOR: 100,
  STARS_THRESHOLD_MINOR: 10,
  SIGNIFICANCE_LEVELS: {
    CRITICAL: 'critical',
    MAJOR: 'major',
    MINOR: 'minor',
    NONE: 'none',
  },
} as const

// Logging (disable in production)
export const LOGGING = {
  ENABLED: process.env.NODE_ENV !== 'production',
  VERBOSE: process.env.DEBUG === 'true',
} as const
