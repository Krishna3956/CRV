import { createClient } from '@/lib/supabase/server'
import { HomeClient } from '@/components/home-client'
import type { Database } from '@/types/database.types'

type McpTool = Database['public']['Tables']['mcp_tools']['Row']

// Get total count of tools
async function getTotalCount(): Promise<number> {
  const supabase = createClient()
  
  try {
    const { count, error } = await supabase
      .from('mcp_tools')
      .select('*', { count: 'exact', head: true })
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

// Fetch only top 100 tools initially for faster load
async function getTools(): Promise<McpTool[]> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('mcp_tools')
      .select('id, repo_name, description, stars, github_url, language, topics, last_updated')
      .in('status', ['approved', 'pending'])
      .order('stars', { ascending: false })
      .limit(100) // Only fetch top 100 for initial load

    if (error) {
      console.error('Error fetching tools:', error)
      return []
    }

    console.log(`Fetched ${data?.length || 0} tools`)
    return data || []
  } catch (err) {
    console.error('Exception fetching tools:', err)
    return []
  }
}

// Use static metadata to match original site SEO
export const metadata = {
  title: 'Track MCP - Discover 10,000+ Model Context Protocol Tools & Servers',
  description: 'Explore the world\'s largest directory of Model Context Protocol (MCP) tools, servers, and connectors. Search 10,000+ GitHub repositories for AI development, LLM integration, and developer tools.',
}

// Enable ISR - revalidate every hour for fresh data (reduced from 5 min)
export const revalidate = 3600

// Server Component - renders on server with full HTML
export default async function HomePage() {
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

  return (
    <>
      {/* JSON-LD Schema for ItemList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListSchema),
        }}
      />
      
      {/* Pass server-fetched data to client component */}
      <HomeClient initialTools={tools} totalCount={totalCount} />
    </>
  )
}
