import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ToolDetailClient } from '@/components/tool-detail-simple'
import { fetchReadmeForServer } from '@/utils/github'
import { createMetaDescription } from '@/utils/metaDescription'
import type { Database } from '@/types/database.types'

type McpTool = Database['public']['Tables']['mcp_tools']['Row']

interface Props {
  params: { name: string }
}

// Fetch tool data on server
async function getTool(name: string): Promise<McpTool | null> {
  const supabase = createClient()
  
  // Use ilike for case-insensitive matching
  // This handles URLs like /tool/ressl_mcp matching database entry "Ressl_MCP"
  const { data, error } = await supabase
    .from('mcp_tools')
    .select('*')
    .ilike('repo_name', decodeURIComponent(name))
    .single()
  
  if (error || !data) return null
  return data
}

// Fetch README on server for SEO indexing
async function getReadme(githubUrl: string): Promise<string | null> {
  return fetchReadmeForServer(githubUrl)
}

// Smart metadata generator
function generateSmartMetadata(tool: McpTool) {
  const toolName = tool.repo_name || 'Unknown Tool'
  const stars = tool.stars || 0
  const language = tool.language || ''
  const topics = tool.topics || []
  const description = tool.description || 'Model Context Protocol tool'
  
  // Helper: Convert to Title Case
  const toTitleCase = (str: string): string => {
    return str
      .split(/[-_\s]/)
      .map(word => {
        // Keep acronyms uppercase (MCP, API, SDK, etc.)
        if (word.toUpperCase() === word && word.length <= 4) return word
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      })
      .join(' ')
  }
  
  // Helper: Extract key benefit from description
  const extractBenefit = (desc: string): string => {
    // Clean up the description
    let benefit = desc
      .replace(/^(A |An |The )/i, '') // Remove articles
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
    
    // Capitalize first letter
    benefit = benefit.charAt(0).toUpperCase() + benefit.slice(1)
    
    // Truncate if too long (keep title under 50 chars total)
    // No ellipsis - clean truncation at word boundary
    if (benefit.length > 30) {
      benefit = benefit.slice(0, 30).trim()
    }
    
    return benefit
  }
  
  // Helper: Ensure MCP has space before it
  const ensureMcpSpacing = (name: string): string => {
    // Replace "MCP" or "mcp" without space before it with " MCP"
    return name
      .replace(/([a-z])MCP/gi, '$1 MCP')  // documcp → docu MCP
      .replace(/([a-z])Mcp/gi, '$1 MCP')  // docuMcp → docu MCP
      .replace(/MCP/gi, 'MCP')             // Ensure MCP is uppercase
      .replace(/\s+MCP/g, ' MCP')          // Normalize multiple spaces
  }
  
  // Format tool name in Title Case
  let formattedName = toTitleCase(toolName)
  
  // Ensure MCP has proper spacing
  formattedName = ensureMcpSpacing(formattedName)
  
  // Add "MCP" if not already in the name
  const nameLower = formattedName.toLowerCase()
  if (!nameLower.includes('mcp')) {
    formattedName = `${formattedName} MCP`
  }
  
  // Extract benefit from description
  const benefit = extractBenefit(description)
  
  // Generate title: [Tool Name + MCP] | [What It Does or Key Benefit]
  // Keep under 50 characters - no ellipsis
  let smartTitle = `${formattedName} | ${benefit}`
  
  // Ensure title stays under 50 characters for optimal SEO
  if (smartTitle.length > 50) {
    // Remove benefit if title is too long, just use tool name
    smartTitle = formattedName.length <= 50 ? formattedName : formattedName.slice(0, 50).trim()
  }
  
  // Generate targeted description (under 160 chars ideal)
  // Enhance description with context based on tool characteristics
  let smartDescription = description
  
  if (description.length > 160) {
    // Long description: truncate cleanly without ellipsis
    // Find last space before 160 chars for clean break
    let truncated = description.slice(0, 160)
    const lastSpace = truncated.lastIndexOf(' ')
    if (lastSpace > 100) {
      smartDescription = truncated.slice(0, lastSpace).trim()
    } else {
      smartDescription = truncated.trim()
    }
  } else if (description.length < 120) {
    // Short description: add valuable context
    const contextParts = []
    
    // Add star count for popular tools
    if (stars > 100) {
      contextParts.push(`⭐ ${stars.toLocaleString()} stars`)
    }
    
    // Add language context
    if (language && !description.toLowerCase().includes(language.toLowerCase())) {
      contextParts.push(`${language} implementation`)
    }
    
    // Add MCP context if not mentioned
    if (!description.toLowerCase().includes('mcp') && !description.toLowerCase().includes('model context protocol')) {
      contextParts.push('MCP tool for AI development')
    }
    
    // Combine description with context - keep under 160 chars
    const context = contextParts.length > 0 ? `. ${contextParts.join('. ')}` : ''
    let combined = `${description}${context}`
    if (combined.length > 160) {
      // Truncate without ellipsis
      let truncated = combined.slice(0, 160)
      const lastSpace = truncated.lastIndexOf(' ')
      if (lastSpace > 100) {
        smartDescription = truncated.slice(0, lastSpace).trim()
      } else {
        smartDescription = truncated.trim()
      }
    } else {
      smartDescription = combined
    }
  }
  // Medium length (120-155): use as-is, it's already good
  
  // Generate smart keywords (mix of specific and general)
  const smartKeywords = [
    toolName,
    `${toolName} MCP`,
    `${toolName} Model Context Protocol`,
    'MCP tool',
    'Model Context Protocol',
    language ? `${language} MCP` : '',
    language ? `${language} Model Context Protocol` : '',
    ...topics.slice(0, 5), // Top 5 topics
    stars > 1000 ? 'popular MCP tool' : '',
    stars > 100 ? 'trending MCP tool' : '',
    'AI development',
    'LLM integration',
    'MCP server',
    'MCP connector',
    language ? `${language} AI tools` : '',
  ].filter(Boolean)
  
  return { smartTitle, smartDescription, smartKeywords }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tool = await getTool(params.name)
  
  if (!tool) {
    return {
      title: 'MCP Tool Not Found | Track MCP',
      description: 'The MCP tool you\'re looking for doesn\'t exist. Browse 10,000+ Model Context Protocol tools, servers, and connectors on Track MCP.',
    }
  }
  
  const toolName = tool.repo_name || 'Unknown Tool'
  const { smartTitle, smartDescription, smartKeywords } = generateSmartMetadata(tool)
  
  // Use meta_description from database if available, otherwise generate it
  const metaDescription = (tool as any).meta_description || createMetaDescription({
    repo_name: tool.repo_name,
    description: tool.description,
    topics: tool.topics,
    language: tool.language,
  })
  
  return {
    title: smartTitle,
    description: metaDescription,
    keywords: smartKeywords,
    openGraph: {
      title: smartTitle,
      description: metaDescription,
      url: `https://www.trackmcp.com/tool/${encodeURIComponent(toolName)}`,
      type: 'website',
      images: [
        {
          url: `https://www.trackmcp.com/api/og?tool=${encodeURIComponent(toolName)}&stars=${tool.stars || 0}&description=${encodeURIComponent(metaDescription.slice(0, 150))}`,
          width: 1200,
          height: 630,
          alt: toolName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: smartTitle,
      description: metaDescription,
      images: [`https://www.trackmcp.com/api/og?tool=${encodeURIComponent(toolName)}&stars=${tool.stars || 0}&description=${encodeURIComponent(metaDescription.slice(0, 150))}`],
    },
    other: {
      // OpenAI / ChatGPT meta tags
      'openai:title': smartTitle,
      'openai:description': metaDescription,
      'openai:image': `https://www.trackmcp.com/api/og?tool=${encodeURIComponent(toolName)}&stars=${tool.stars || 0}&description=${encodeURIComponent(metaDescription.slice(0, 150))}`,
      'openai:url': `https://www.trackmcp.com/tool/${encodeURIComponent(toolName)}`,
      // Perplexity AI meta tags
      'perplexity:title': smartTitle,
      'perplexity:description': metaDescription,
      // AI-friendly content hints
      'ai:content_type': 'tool',
      'ai:primary_topic': 'Model Context Protocol',
      'ai:tool_name': toolName,
    },
    alternates: {
      canonical: `https://www.trackmcp.com/tool/${encodeURIComponent(toolName)}`,
      languages: {
        'en-US': `https://www.trackmcp.com/tool/${encodeURIComponent(toolName)}`,
        'x-default': `https://www.trackmcp.com/tool/${encodeURIComponent(toolName)}`,
      },
    },
  }
}

// Server Component - renders on server with full HTML!
export default async function ToolPage({ params }: Props) {
  const tool = await getTool(params.name)
  
  if (!tool) {
    notFound()
  }

  // Fetch README on server for SEO indexing
  const readme = await getReadme(tool.github_url || '')
  
  // Create SoftwareApplication schema (Google Rich Results compliant)
  // Build schema dynamically to avoid undefined values
  const softwareSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.repo_name,
    description: tool.description,
    url: `https://www.trackmcp.com/tool/${encodeURIComponent(tool.repo_name || '')}`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Cross-platform',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Organization',
      name: 'Track MCP',
      url: 'https://www.trackmcp.com',
    },
    datePublished: tool.created_at || new Date().toISOString(),
    dateModified: tool.last_updated || tool.created_at || new Date().toISOString(),
  }

  // Add optional fields only if they exist (avoid undefined)
  if (tool.language) {
    softwareSchema.programmingLanguage = tool.language
  }

  if (tool.topics && tool.topics.length > 0) {
    softwareSchema.keywords = tool.topics.join(', ')
  }

  // GitHub stars shown separately as popularity metric (not ratings)
  if (tool.stars) {
    softwareSchema.interactionStatistic = {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/LikeAction',
      userInteractionCount: tool.stars,
    }
  }

  // Add Breadcrumb schema for better navigation
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.trackmcp.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: tool.repo_name,
        item: `https://www.trackmcp.com/tool/${encodeURIComponent(tool.repo_name || '')}`,
      },
    ],
  }

  // Add Article schema for rich snippets
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${tool.repo_name} - Model Context Protocol Tool`,
    description: tool.description,
    image: `https://www.trackmcp.com/api/og?tool=${encodeURIComponent(tool.repo_name || '')}&stars=${tool.stars || 0}&description=${encodeURIComponent((tool.description || '').slice(0, 150))}`,
    datePublished: tool.created_at || new Date().toISOString(),
    dateModified: tool.last_updated || tool.created_at || new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: 'Track MCP',
      url: 'https://www.trackmcp.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Track MCP',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.trackmcp.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.trackmcp.com/tool/${encodeURIComponent(tool.repo_name || '')}`,
    },
    keywords: tool.topics?.join(', '),
    articleSection: 'Developer Tools',
    inLanguage: 'en-US',
  }

  return (
    <>
      {/* JSON-LD Schema for SoftwareApplication */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareSchema),
        }}
      />
      
      {/* JSON-LD Schema for Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      
      {/* JSON-LD Schema for Article (Rich Snippets) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema),
        }}
      />
      
      {/* Pass server-fetched data to client component */}
      <ToolDetailClient tool={tool} initialReadme={readme} />
    </>
  )
}

// Generate static pages at build time for top tools
export async function generateStaticParams() {
  // Use client-side Supabase for build-time generation (no cookies needed)
  const { createClient: createBrowserClient } = await import('@supabase/supabase-js')
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const { data: tools } = await supabase
    .from('mcp_tools')
    .select('repo_name')
    .order('stars', { ascending: false })
    .limit(100) // Pre-render top 100 tools at build time
  
  return tools?.map((tool) => ({
    name: encodeURIComponent(tool.repo_name || ''),
  })) || []
}

// Enable ISR - revalidate every hour
export const revalidate = 3600
