import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ToolDetailClient } from '@/components/tool-detail-simple'
import type { Database } from '@/types/database.types'

type McpTool = Database['public']['Tables']['mcp_tools']['Row']

interface Props {
  params: { name: string }
}

// Fetch tool data on server
async function getTool(name: string): Promise<McpTool | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('mcp_tools')
    .select('*')
    .eq('repo_name', decodeURIComponent(name))
    .single()
  
  if (error || !data) return null
  return data
}

// Smart metadata generator
function generateSmartMetadata(tool: McpTool) {
  const toolName = tool.repo_name || 'Unknown Tool'
  const stars = tool.stars || 0
  const language = tool.language || ''
  const topics = tool.topics || []
  const description = tool.description || 'Model Context Protocol tool'
  
  // Generate smart, SEO-optimized title (50-60 chars ideal)
  const smartTitle = stars > 1000 
    ? `${toolName} - ${stars.toLocaleString()}⭐ MCP Tool`
    : stars > 100
    ? `${toolName} - Popular MCP Tool (${stars.toLocaleString()}⭐)`
    : `${toolName} - MCP Tool for ${language || 'Developers'}`
  
  // Generate targeted description (150-160 chars ideal)
  // Enhance description with context based on tool characteristics
  let smartDescription = description
  
  if (description.length > 155) {
    // Long description: truncate cleanly
    smartDescription = `${description.slice(0, 152)}...`
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
    
    // Combine description with context
    const context = contextParts.length > 0 ? `. ${contextParts.join('. ')}.` : ''
    smartDescription = `${description}${context}`.slice(0, 160)
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
      title: 'Tool Not Found',
    }
  }
  
  const toolName = tool.repo_name || 'Unknown Tool'
  const { smartTitle, smartDescription, smartKeywords } = generateSmartMetadata(tool)
  
  return {
    title: smartTitle,
    description: smartDescription,
    keywords: smartKeywords,
    openGraph: {
      title: smartTitle,
      description: smartDescription,
      url: `https://www.trackmcp.com/tool/${encodeURIComponent(toolName)}`,
      type: 'website',
      images: [
        {
          url: `https://www.trackmcp.com/api/og?tool=${encodeURIComponent(toolName)}&stars=${tool.stars || 0}&description=${encodeURIComponent(smartDescription.slice(0, 150))}`,
          width: 1200,
          height: 630,
          alt: toolName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: smartTitle,
      description: smartDescription,
      images: [`https://www.trackmcp.com/api/og?tool=${encodeURIComponent(toolName)}&stars=${tool.stars || 0}&description=${encodeURIComponent(smartDescription.slice(0, 150))}`],
    },
    other: {
      // OpenAI / ChatGPT meta tags
      'openai:title': `${toolName} - Model Context Protocol Tool`,
      'openai:description': smartDescription,
      'openai:image': `https://www.trackmcp.com/api/og?tool=${encodeURIComponent(toolName)}&stars=${tool.stars || 0}&description=${encodeURIComponent(smartDescription.slice(0, 150))}`,
      'openai:url': `https://www.trackmcp.com/tool/${encodeURIComponent(toolName)}`,
      // Perplexity AI meta tags
      'perplexity:title': `${toolName} - MCP Tool`,
      'perplexity:description': smartDescription,
      // AI-friendly content hints
      'ai:content_type': 'tool',
      'ai:primary_topic': 'Model Context Protocol',
      'ai:tool_name': toolName,
    },
    alternates: {
      canonical: `https://www.trackmcp.com/tool/${encodeURIComponent(params.name)}`,
    },
  }
}

// Server Component - renders on server with full HTML!
export default async function ToolPage({ params }: Props) {
  const tool = await getTool(params.name)
  
  if (!tool) {
    notFound()
  }
  
  // Create SoftwareApplication schema
  const softwareSchema = {
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
    aggregateRating: tool.stars ? {
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      ratingCount: tool.stars,
    } : undefined,
    programmingLanguage: tool.language || undefined,
    keywords: tool.topics?.join(', '),
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
      <ToolDetailClient tool={tool} />
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
