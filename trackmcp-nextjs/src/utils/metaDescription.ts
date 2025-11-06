/**
 * SEO Meta Description Generator
 * Generates keyword-rich, human-readable meta descriptions for MCP tools
 * No external AI APIs - uses intelligent text composition
 */

interface ToolData {
  repo_name?: string | null
  description?: string | null
  topics?: string[] | null
  language?: string | null
  readme?: string | null
}

/**
 * Creates a SEO-optimized meta description (max 160 characters)
 * Strategy: Combine tool name, description, key topics, and language
 * 
 * @param tool - Tool data object
 * @returns Meta description string (under 160 characters)
 */
export const createMetaDescription = (tool: ToolData): string => {
  // Validate input
  if (!tool) {
    return 'Discover Model Context Protocol (MCP) servers and tools for AI development.'
  }

  const toolName = tool.repo_name || ''
  const description = tool.description || ''
  const topics = tool.topics || []
  const language = tool.language || ''
  const readme = tool.readme || ''

  // Strategy 1: Use existing description if it's good (60-160 chars)
  if (description && description.length >= 60 && description.length <= 160) {
    return truncateToLength(description, 160)
  }

  // Strategy 2: Build from components
  let metaDesc = ''

  // Start with tool name
  if (toolName) {
    metaDesc = `${formatToolName(toolName)}`
  }

  // Add description if available
  if (description) {
    const cleanDesc = description.trim()
    if (metaDesc.length + cleanDesc.length + 2 <= 160) {
      metaDesc += ` - ${cleanDesc}`
    } else if (metaDesc.length < 160) {
      // Truncate description to fit
      const remaining = 160 - metaDesc.length - 3
      if (remaining > 20) {
        metaDesc += ` - ${truncateToLength(cleanDesc, remaining)}`
      }
    }
  }

  // If we have room, add key topics
  if (metaDesc.length < 140 && topics.length > 0) {
    const keyTopics = selectKeyTopics(topics, 2)
    if (keyTopics.length > 0) {
      const topicsStr = keyTopics.join(', ')
      const topicsWithPrefix = `. ${topicsStr}`
      
      if (metaDesc.length + topicsWithPrefix.length <= 160) {
        metaDesc += topicsWithPrefix
      }
    }
  }

  // If we have room, add language
  if (metaDesc.length < 150 && language) {
    const langStr = ` (${language})`
    if (metaDesc.length + langStr.length <= 160) {
      metaDesc += langStr
    }
  }

  // If description is still short, try to enhance it
  if (metaDesc.length < 80 && readme) {
    metaDesc = enhanceWithReadme(metaDesc, readme, 160)
  }

  // Fallback to generic description
  if (!metaDesc || metaDesc.length < 20) {
    metaDesc = buildFallbackDescription(toolName, topics, language)
  }

  // Final truncation and cleanup
  return truncateToLength(metaDesc, 160).trim()
}

/**
 * Format tool name for display
 * Converts kebab-case to Title Case and ensures MCP spacing
 */
function formatToolName(name: string): string {
  if (!name) return ''

  // Convert kebab-case to Title Case
  const titleCase = name
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

  // Ensure MCP has proper spacing
  return titleCase
    .replace(/([a-z])MCP/gi, '$1 MCP')
    .replace(/MCP/gi, 'MCP')
}

/**
 * Select most relevant topics (avoid generic ones)
 */
function selectKeyTopics(topics: string[], limit: number = 2): string[] {
  if (!topics || topics.length === 0) return []

  // Filter out generic/common topics
  const genericTopics = [
    'mcp',
    'mcp-server',
    'model-context-protocol',
    'tool',
    'server',
    'client',
    'protocol',
    'framework',
    'library',
    'package',
    'module',
    'plugin',
    'extension',
  ]

  const filtered = topics.filter(
    topic => !genericTopics.includes(topic.toLowerCase())
  )

  // Return top topics
  return filtered.slice(0, limit)
}

/**
 * Enhance description with content from README
 */
function enhanceWithReadme(
  currentDesc: string,
  readme: string,
  maxLength: number
): string {
  if (!readme || readme.length < 50) return currentDesc

  // Extract first meaningful sentence from README
  const sentences = readme
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 200)

  if (sentences.length === 0) return currentDesc

  const firstSentence = sentences[0]

  // Try to combine with current description
  if (currentDesc.length + firstSentence.length + 2 <= maxLength) {
    return `${currentDesc}. ${firstSentence}`
  }

  // If too long, use just the first sentence
  if (firstSentence.length <= maxLength) {
    return firstSentence
  }

  return currentDesc
}

/**
 * Build fallback description from available data
 */
function buildFallbackDescription(
  toolName: string,
  topics: string[],
  language: string
): string {
  let desc = ''

  if (toolName) {
    desc = `${formatToolName(toolName)} MCP server`
  } else {
    desc = 'Model Context Protocol (MCP) server'
  }

  // Add language if available
  if (language) {
    desc += ` for ${language}`
  }

  // Add topics if available
  const keyTopics = selectKeyTopics(topics, 1)
  if (keyTopics.length > 0) {
    desc += `. ${keyTopics[0]} support`
  }

  // Add generic MCP context
  if (desc.length < 140) {
    desc += '. Discover tools, servers, and connectors for AI development'
  }

  return desc
}

/**
 * Truncate string to specified length, preserving word boundaries
 */
function truncateToLength(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text
  }

  // Truncate to maxLength
  let truncated = text.substring(0, maxLength)

  // Remove incomplete word at the end
  const lastSpace = truncated.lastIndexOf(' ')
  if (lastSpace > maxLength - 20) {
    truncated = truncated.substring(0, lastSpace)
  }

  // Remove trailing punctuation if it's just a dash or comma
  truncated = truncated.replace(/[-,]\s*$/, '')

  // Add ellipsis if we truncated
  if (text.length > maxLength && !truncated.endsWith('.')) {
    truncated += '.'
  }

  return truncated.trim()
}

/**
 * Validate meta description
 * Checks length and content quality
 */
export const validateMetaDescription = (desc: string): boolean => {
  if (!desc || typeof desc !== 'string') return false
  if (desc.length < 20 || desc.length > 160) return false
  if (desc.split(' ').length < 3) return false // At least 3 words
  return true
}

/**
 * Batch create meta descriptions for multiple tools
 */
export const createMetaDescriptionsBatch = (
  tools: ToolData[]
): Record<string, string> => {
  const results: Record<string, string> = {}

  for (const tool of tools) {
    if (tool.repo_name) {
      results[tool.repo_name] = createMetaDescription(tool)
    }
  }

  return results
}

/**
 * Extract first N characters of README, removing markdown
 */
export const extractReadmePreview = (
  readme: string,
  maxChars: number = 150
): string => {
  if (!readme) return ''

  // Remove markdown formatting
  let cleaned = readme
    .replace(/^#+\s+/gm, '') // Remove headers
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert links to text
    .replace(/\*\*([^\*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^\*]+)\*/g, '$1') // Remove italics
    .replace(/`([^`]+)`/g, '$1') // Remove code formatting
    .replace(/^[-*]\s+/gm, '') // Remove bullet points
    .trim()

  // Get first sentence or first N characters
  const sentences = cleaned.split(/[.!?]+/)
  const firstSentence = sentences[0]?.trim() || ''

  if (firstSentence.length <= maxChars) {
    return firstSentence
  }

  // Truncate to maxChars
  return truncateToLength(cleaned, maxChars)
}
