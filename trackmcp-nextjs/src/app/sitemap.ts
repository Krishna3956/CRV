import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient()
  
  // Fetch all tools
  let allTools: Array<{ repo_name: string | null; last_updated: string | null }> = []
  let from = 0
  const batchSize = 1000
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('mcp_tools')
      .select('repo_name, last_updated')
      .in('status', ['approved', 'pending']) // Only include approved and pending tools
      .range(from, from + batchSize - 1)

    if (error || !data || data.length === 0) {
      hasMore = false
    } else {
      allTools = [...allTools, ...data]
      from += batchSize
      if (data.length < batchSize) {
        hasMore = false
      }
    }
  }

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: 'https://www.trackmcp.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ]

  // Dynamic tool pages
  const toolPages: MetadataRoute.Sitemap = allTools
    .filter(tool => tool.repo_name)
    .map((tool) => ({
      url: `https://www.trackmcp.com/tool/${encodeURIComponent(tool.repo_name!.toLowerCase())}`,
      lastModified: tool.last_updated ? new Date(tool.last_updated) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

  return [...staticPages, ...toolPages]
}
