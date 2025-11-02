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

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tool = await getTool(params.name)
  
  if (!tool) {
    return {
      title: 'Tool Not Found',
    }
  }
  
  const toolName = tool.repo_name || 'Unknown Tool'
  const description = tool.description || 'Model Context Protocol tool'
  
  return {
    title: toolName,
    description: description,
    keywords: [
      toolName,
      'MCP',
      'Model Context Protocol',
      tool.language || '',
      ...(tool.topics || []),
    ].filter(Boolean),
    openGraph: {
      title: `${toolName} - Track MCP`,
      description: description,
      url: `https://www.trackmcp.com/tool/${encodeURIComponent(toolName)}`,
      type: 'website',
      images: [
        {
          url: 'https://www.trackmcp.com/og-image.png',
          width: 1200,
          height: 630,
          alt: toolName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${toolName} - Track MCP`,
      description: description,
      images: ['https://www.trackmcp.com/og-image.png'],
    },
    other: {
      'openai:title': `${toolName} - Model Context Protocol Tool`,
      'openai:description': description,
      'openai:image': 'https://www.trackmcp.com/og-image.png',
      'openai:url': `https://www.trackmcp.com/tool/${encodeURIComponent(toolName)}`,
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
