/**
 * Metadata generation helpers
 * Consolidated utilities for title, description, and keyword generation
 */

import { CHAR_WIDTHS, METADATA, SEO } from './constants'

/**
 * Estimate pixel width of text (for Google truncation prevention)
 */
export function estimatePixelWidth(text: string): number {
  let width = 0
  for (const char of text) {
    if (/[iIl1!.,;:'"]/.test(char)) {
      width += CHAR_WIDTHS.NARROW
    } else if (/[mMwW]/.test(char)) {
      width += CHAR_WIDTHS.WIDE
    } else if (char === ' ') {
      width += CHAR_WIDTHS.SPACE
    } else {
      width += CHAR_WIDTHS.AVERAGE
    }
  }
  return width
}

/**
 * Convert string to Title Case
 */
export function toTitleCase(str: string): string {
  return str
    .split(/[-_\s]/)
    .map(word => {
      // Keep acronyms uppercase (MCP, API, SDK, etc.)
      if (word.toUpperCase() === word && word.length <= 4) return word
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

/**
 * Extract key benefit from description
 */
export function extractBenefit(desc: string): string {
  let benefit = desc
    .replace(/^(A |An |The )/i, '') // Remove articles
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
  
  // Capitalize first letter
  benefit = benefit.charAt(0).toUpperCase() + benefit.slice(1)
  
  // Truncate if too long
  if (benefit.length > METADATA.BENEFIT_MAX_LENGTH) {
    benefit = benefit.slice(0, METADATA.BENEFIT_MAX_LENGTH).trim()
  }
  
  return benefit
}

/**
 * Ensure MCP has proper spacing
 */
export function ensureMcpSpacing(name: string): string {
  return name
    .replace(/([a-z])MCP/gi, '$1 MCP')  // documcp → docu MCP
    .replace(/([a-z])Mcp/gi, '$1 MCP')  // docuMcp → docu MCP
    .replace(/MCP/gi, 'MCP')             // Ensure MCP is uppercase
    .replace(/\s+MCP/g, ' MCP')          // Normalize multiple spaces
}

/**
 * Truncate text to max chars and pixels
 */
export function truncateText(
  text: string,
  maxChars: number,
  maxPixels: number
): string {
  if (text.length <= maxChars && estimatePixelWidth(text) <= maxPixels) {
    return text
  }

  let truncated = text
  while (
    truncated.length > 1 &&
    (truncated.length > maxChars || estimatePixelWidth(truncated) > maxPixels)
  ) {
    truncated = truncated.slice(0, -1).trim()
  }

  return truncated
}

/**
 * Truncate at word boundary
 */
export function truncateAtWordBoundary(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text

  let truncated = text.slice(0, maxChars)
  const lastSpace = truncated.lastIndexOf(' ')
  
  if (lastSpace > maxChars * 0.6) {
    return truncated.slice(0, lastSpace).trim()
  }
  
  return truncated.trim()
}

/**
 * Generate smart title
 */
export function generateSmartTitle(
  toolName: string,
  description: string
): string {
  const formattedName = ensureMcpSpacing(toTitleCase(toolName))
  const benefit = extractBenefit(description)
  
  let smartTitle = `${formattedName} | ${benefit}`
  
  // Ensure title stays under limits
  if (
    smartTitle.length > SEO.MAX_TITLE_CHARS ||
    estimatePixelWidth(smartTitle) > SEO.MAX_TITLE_PIXELS
  ) {
    // Try just the tool name
    smartTitle = formattedName
    
    // If still too long, truncate
    if (
      smartTitle.length > SEO.MAX_TITLE_CHARS ||
      estimatePixelWidth(smartTitle) > SEO.MAX_TITLE_PIXELS
    ) {
      smartTitle = truncateText(smartTitle, SEO.MAX_TITLE_CHARS, SEO.MAX_TITLE_PIXELS)
    }
  }
  
  return smartTitle
}

/**
 * Generate smart description
 */
export function generateSmartDescription(
  description: string,
  stars: number = 0,
  language: string = ''
): string {
  let smartDescription = description

  if (description.length > SEO.MAX_DESC_CHARS || estimatePixelWidth(description) > SEO.MAX_DESC_PIXELS) {
    // Long description: truncate cleanly
    smartDescription = truncateAtWordBoundary(description, SEO.MAX_DESC_CHARS)
    
    // Double-check pixel width
    smartDescription = truncateText(smartDescription, SEO.MAX_DESC_CHARS, SEO.MAX_DESC_PIXELS)
  } else if (description.length < 120) {
    // Short description: add valuable context
    const contextParts: string[] = []
    
    if (stars > METADATA.STARS_THRESHOLD_CONTEXT) {
      contextParts.push(`⭐ ${stars.toLocaleString()} stars`)
    }
    
    if (language && !description.toLowerCase().includes(language.toLowerCase())) {
      contextParts.push(`${language} implementation`)
    }
    
    if (!description.toLowerCase().includes('mcp') && !description.toLowerCase().includes('model context protocol')) {
      contextParts.push('MCP tool for AI development')
    }
    
    if (contextParts.length > 0) {
      const context = `. ${contextParts.join('. ')}`
      let combined = `${description}${context}`
      
      if (combined.length > 160) {
        smartDescription = truncateAtWordBoundary(combined, 160)
      } else {
        smartDescription = combined
      }
    }
  }

  return smartDescription
}

/**
 * Generate smart keywords
 */
export function generateSmartKeywords(
  toolName: string,
  language: string = '',
  topics: string[] = [],
  stars: number = 0
): string[] {
  const keywords = [
    toolName,
    `${toolName} MCP`,
    `${toolName} Model Context Protocol`,
    'MCP tool',
    'Model Context Protocol',
    language ? `${language} MCP` : '',
    language ? `${language} Model Context Protocol` : '',
    ...topics.slice(0, METADATA.MAX_TOPICS_IN_KEYWORDS),
    stars > METADATA.STARS_THRESHOLD_POPULAR ? 'popular MCP tool' : '',
    stars > METADATA.STARS_THRESHOLD_TRENDING ? 'trending MCP tool' : '',
    'AI development',
    'LLM integration',
    'MCP server',
    'MCP connector',
    language ? `${language} AI tools` : '',
  ]

  return keywords.filter(Boolean).slice(0, METADATA.MAX_KEYWORDS)
}
