/**
 * Table of Contents Generator
 * Extracts headings from markdown content and generates SEO-optimized TOC
 */

export interface TableOfContentsItem {
  id: string
  text: string
  level: number // 2 for H2, 3 for H3, 4 for H4
  children?: TableOfContentsItem[]
}

/**
 * Convert text to URL-safe slug
 * "Installation Guide" → "installation-guide"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Extract headings from markdown content
 * Only extracts H2, H3, H4 (skips H1 as it's page title)
 */
export function extractHeadingsFromMarkdown(content: string): TableOfContentsItem[] {
  const lines = content.split('\n')
  const headings: TableOfContentsItem[] = []
  let id = 0

  for (const line of lines) {
    let level: number | null = null
    let text = ''

    // Extract heading level and text
    if (line.startsWith('## ')) {
      level = 2
      text = line.slice(3).trim()
    } else if (line.startsWith('### ')) {
      level = 3
      text = line.slice(4).trim()
    } else if (line.startsWith('#### ')) {
      level = 4
      text = line.slice(5).trim()
    }

    // Skip if not a heading or text is empty
    if (!level || !text) continue

    // Clean up markdown formatting in heading text
    text = text
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/`([^`]+)`/g, '$1') // Remove inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .trim()

    // Skip if text is empty after cleanup
    if (!text) continue

    const item: TableOfContentsItem = {
      id: slugify(text),
      text,
      level,
    }

    headings.push(item)
    id++
  }

  return buildHierarchy(headings)
}

/**
 * Build hierarchical structure from flat heading list
 * Ensures proper nesting of H2 → H3 → H4
 */
function buildHierarchy(headings: TableOfContentsItem[]): TableOfContentsItem[] {
  const result: TableOfContentsItem[] = []
  const stack: { item: TableOfContentsItem; level: number }[] = []

  for (const heading of headings) {
    // Remove items from stack that are >= current level
    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop()
    }

    // If stack is empty, add to root
    if (stack.length === 0) {
      result.push(heading)
      stack.push({ item: heading, level: heading.level })
    } else {
      // Add as child to last item in stack
      const parent = stack[stack.length - 1].item
      if (!parent.children) {
        parent.children = []
      }
      parent.children.push(heading)
      stack.push({ item: heading, level: heading.level })
    }
  }

  return result
}

/**
 * Generate schema markup for table of contents
 * Helps search engines understand page structure
 */
export function generateTocSchema(toc: TableOfContentsItem[], pageUrl: string) {
  const itemListElement = flattenToc(toc).map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.text,
    url: `${pageUrl}#${item.id}`,
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Table of Contents',
    itemListElement,
  }
}

/**
 * Flatten hierarchical TOC for schema markup
 */
function flattenToc(toc: TableOfContentsItem[]): TableOfContentsItem[] {
  const result: TableOfContentsItem[] = []

  function flatten(items: TableOfContentsItem[]) {
    for (const item of items) {
      result.push(item)
      if (item.children) {
        flatten(item.children)
      }
    }
  }

  flatten(toc)
  return result
}

/**
 * Check if TOC is worth displaying
 * Don't show TOC if there are fewer than 3 headings
 */
export function shouldShowToc(toc: TableOfContentsItem[]): boolean {
  const count = flattenToc(toc).length
  return count >= 3
}

/**
 * Generate HTML IDs for headings to match TOC links
 * This is used in the markdown renderer
 */
export function generateHeadingId(text: string): string {
  return slugify(text)
}
