import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient()
  
  // Fetch all tools with category
  let allTools: Array<{ repo_name: string | null; last_updated: string | null; category: string | null }> = []
  let from = 0
  const batchSize = 1000
  let hasMore = true

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
      hasMore = false
    } else {
      allTools = [...allTools, ...data]
      from += batchSize
      if (data.length < batchSize) {
        hasMore = false
      }
    }
  }

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
      url: 'https://www.trackmcp.com/submit-mcp',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
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
    .filter(tool => tool.repo_name && tool.repo_name.trim().length > 0)
    .map((tool) => {
      // Safely encode tool name for URL
      const encodedName = encodeURIComponent(tool.repo_name!.trim())
      return {
        url: `https://www.trackmcp.com/tool/${encodedName}`,
        lastModified: tool.last_updated ? new Date(tool.last_updated) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }
    })
    .filter(page => {
      // Validate URL is properly formed
      try {
        new URL(page.url)
        return true
      } catch {
        console.error(`Invalid URL in sitemap: ${page.url}`)
        return false
      }
    })

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
    .map(([category, data]) => {
      // Safely encode category name for URL (convert & to "and", spaces to hyphens)
      const encodedCategory = category.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '-')
      return {
        url: `https://www.trackmcp.com/category/${encodedCategory}`,
        lastModified: new Date(data.lastUpdated),
        changeFrequency: 'weekly' as const,
        priority: 0.85,
      }
    })
    .filter(page => {
      // Validate URL is properly formed
      try {
        new URL(page.url)
        return true
      } catch {
        console.error(`Invalid URL in sitemap: ${page.url}`)
        return false
      }
    })

  return [...staticPages, ...toolPages, ...categoryPages]
}
