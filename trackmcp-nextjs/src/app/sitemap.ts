import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient()
  
  // Fetch all tools with category
  let allTools: Array<{ repo_name: string | null; last_updated: string | null; category: string | null }> = []
  let from = 0
  const batchSize = 1000
  let hasMore = true

  console.log('Starting sitemap generation...')

  while (hasMore) {
    const { data, error } = await supabase
      .from('mcp_tools')
      .select('repo_name, last_updated, category')
      .in('status', ['approved', 'pending']) // Only include approved and pending tools
      .range(from, from + batchSize - 1)

    if (error) {
      console.error(`Error fetching batch at ${from}:`, error)
      hasMore = false
    } else if (!data || data.length === 0) {
      console.log(`No more data at offset ${from}`)
      hasMore = false
    } else {
      console.log(`Fetched ${data.length} tools (offset: ${from}, total so far: ${allTools.length + data.length})`)
      allTools = [...allTools, ...data]
      from += batchSize
      if (data.length < batchSize) {
        console.log(`Last batch had ${data.length} items, stopping`)
        hasMore = false
      }
    }
  }

  console.log(`Total tools fetched for sitemap: ${allTools.length}`)

  // Get the most recent tool update for freshness signal
  const mostRecentUpdate = allTools
    .filter(tool => tool.last_updated)
    .map(tool => new Date(tool.last_updated!))
    .sort((a, b) => b.getTime() - a.getTime())[0] || new Date()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: 'https://www.trackmcp.com',
      lastModified: mostRecentUpdate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: 'https://www.trackmcp.com/about',
      lastModified: new Date('2025-01-01'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://www.trackmcp.com/category',
      lastModified: mostRecentUpdate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://www.trackmcp.com/categories',
      lastModified: mostRecentUpdate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://www.trackmcp.com/top-mcp',
      lastModified: mostRecentUpdate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: 'https://www.trackmcp.com/new',
      lastModified: mostRecentUpdate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: 'https://www.trackmcp.com/new/featured-blogs',
      lastModified: mostRecentUpdate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://www.trackmcp.com/privacy',
      lastModified: new Date('2025-01-01'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://www.trackmcp.com/terms',
      lastModified: new Date('2025-01-01'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://www.trackmcp.com/cookies',
      lastModified: new Date('2025-01-01'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Dynamic tool pages
  const toolPages: MetadataRoute.Sitemap = allTools
    .filter(tool => tool.repo_name)
    .map((tool) => ({
      url: `https://www.trackmcp.com/tool/${encodeURIComponent(tool.repo_name!)}`,
      lastModified: tool.last_updated ? new Date(tool.last_updated) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

  // Dynamic category pages (top 10 categories)
  // Map category to its most recent tool update
  const categoryMap = new Map<string, { count: number; lastUpdated: string }>()
  allTools.forEach(tool => {
    if (tool.category) {
      const existing = categoryMap.get(tool.category)
      const toolDate = tool.last_updated || new Date().toISOString()
      
      if (!existing) {
        categoryMap.set(tool.category, { count: 1, lastUpdated: toolDate })
      } else {
        existing.count += 1
        // Keep the most recent date
        if (new Date(toolDate) > new Date(existing.lastUpdated)) {
          existing.lastUpdated = toolDate
        }
      }
    }
  })

  const categoryPages: MetadataRoute.Sitemap = Array.from(categoryMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([category, data]) => ({
      url: `https://www.trackmcp.com/category/${category.toLowerCase().replace(/\s+/g, '-')}`,
      lastModified: new Date(data.lastUpdated),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }))

  return [...staticPages, ...toolPages, ...categoryPages]
}
