import { createClient } from '@/lib/supabase/server'
import { HomeClient } from '@/components/home-client'
import type { Database } from '@/types/database.types'

type McpTool = Database['public']['Tables']['mcp_tools']['Row']

// Get total count of tools (cached with longer revalidation)
async function getTotalCount(): Promise<number> {
  const supabase = createClient()
  
  try {
    const { count, error } = await supabase
      .from('mcp_tools')
      .select('id', { count: 'exact', head: true }) // Only count id column, not all columns
      .in('status', ['approved', 'pending'])

    if (error) {
      console.error('Error fetching count:', error)
      return 0
    }

    return count || 0
  } catch (err) {
    console.error('Exception fetching count:', err)
    return 0
  }
}

// Fetch ALL tools for proper search functionality
async function getTools(): Promise<McpTool[]> {
  const supabase = createClient()
  
  try {
    // Fetch all tools in batches to avoid timeout
    let allTools: McpTool[] = []
    let from = 0
    const batchSize = 1000
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabase
        .from('mcp_tools')
        .select('id, repo_name, description, stars, github_url, language, topics, last_updated')
        .in('status', ['approved', 'pending'])
        .order('stars', { ascending: false })
        .range(from, from + batchSize - 1)

      if (error) {
        console.error('Error fetching tools:', error)
        break
      }

      if (!data || data.length === 0) {
        hasMore = false
      } else {
        allTools = [...allTools, ...data]
        from += batchSize
        if (data.length < batchSize) {
          hasMore = false
        }
      }
    }

    console.log(`Fetched ${allTools.length} tools`)
    return allTools
  } catch (err) {
    console.error('Exception fetching tools:', err)
    return []
  }
}

// Use static metadata to match original site SEO
export const metadata = {
  title: 'Track MCP - World\'s Largest MCP Repository',
  description: 'Explore the world\'s largest directory of Model Context Protocol (MCP) tools, servers, and connectors. Search 10,000+ GitHub repositories for AI development, LLM integration, and developer tools.',
  alternates: {
    canonical: 'https://www.trackmcp.com',
    languages: {
      'en-US': 'https://www.trackmcp.com',
      'x-default': 'https://www.trackmcp.com',
    },
  },
}

// Enable ISR - revalidate every hour for fresh data (reduced from 5 min)
export const revalidate = 3600

// Server Component - renders on server with full HTML
export default async function HomePage() {
  // Parallel fetch for better performance
  const [tools, totalCount] = await Promise.all([getTools(), getTotalCount()])
  
  // Create ItemList schema for top tools
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'Model Context Protocol Tools',
    'description': 'A comprehensive directory of MCP tools, servers, and connectors',
    'numberOfItems': totalCount,
    'itemListElement': tools.slice(0, 10).map((tool, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@type': 'SoftwareApplication',
        'name': tool.repo_name,
        'description': tool.description,
        'url': `https://www.trackmcp.com/tool/${encodeURIComponent(tool.repo_name || '')}`,
        'applicationCategory': 'DeveloperApplication',
      },
    })),
  }

  // Add FAQ schema for common questions
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'What is Model Context Protocol (MCP)?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Model Context Protocol (MCP) is an open standard that enables seamless integration between AI applications and external data sources. It provides a unified way for AI models to access tools, databases, and services.'
        }
      },
      {
        '@type': 'Question',
        'name': 'How many MCP tools are available?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `Track MCP currently lists over ${totalCount.toLocaleString()} Model Context Protocol tools, servers, and connectors from GitHub repositories worldwide.`
        }
      },
      {
        '@type': 'Question',
        'name': 'Are these MCP tools free to use?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Most MCP tools listed on Track MCP are open-source and free to use. Each tool page links to its GitHub repository where you can find licensing information and installation instructions.'
        }
      },
      {
        '@type': 'Question',
        'name': 'How do I submit my MCP tool?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'You can submit your MCP tool by clicking the "Submit Tool" button on the homepage and providing your GitHub repository URL. Tools are reviewed and added to the directory automatically.'
        }
      }
    ]
  }

  return (
    <>
      {/* JSON-LD Schema for ItemList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListSchema),
        }}
      />
      
      {/* JSON-LD Schema for FAQ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      
      {/* Pass server-fetched data to client component */}
      <HomeClient initialTools={tools} totalCount={totalCount} />
    </>
  )
}
