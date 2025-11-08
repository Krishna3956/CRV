import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

type McpTool = Database['public']['Tables']['mcp_tools']['Row']

interface RelatedToolsResult {
  similar: McpTool[]
  trending: McpTool[]
  new: McpTool[]
}

/**
 * Fetch related tools based on:
 * 1. Similar tools: Same category/tags
 * 2. Popular tools: Highest stars
 * 3. New tools: Recently added
 */
export async function getRelatedTools(
  currentTool: McpTool,
  limit: number = 8
): Promise<RelatedToolsResult> {
  const supabase = createClient()

  try {
    // Get all tools for comparison
    const { data: allTools, error } = await supabase
      .from('mcp_tools')
      .select('*')
      .eq('status', 'approved')
      .neq('id', currentTool.id)
      .limit(100)

    if (error || !allTools) {
      console.error('Error fetching related tools:', error)
      return { similar: [], trending: [], new: [] }
    }

    // Calculate similarity score for each tool
    const toolsWithScore = allTools.map((tool: McpTool) => {
      let score = 0

      // Same language: +3 points
      if (tool.language === currentTool.language) {
        score += 3
      }

      // Overlapping topics: +2 points per match
      if (tool.topics && currentTool.topics) {
        const overlap = (tool.topics as string[]).filter((t: string) =>
          (currentTool.topics as string[])?.includes(t)
        ).length
        score += overlap * 2
      }

      // Similar star count (within 50%): +1 point
      if (currentTool.stars && tool.stars) {
        const ratio = tool.stars / currentTool.stars
        if (ratio > 0.5 && ratio < 2) {
          score += 1
        }
      }

      return { tool, score }
    })

    // Sort by similarity score
    const similarTools = toolsWithScore
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.tool)

    // Get trending tools (by stars - recent activity proxy)
    const trendingTools = allTools
      .sort((a: McpTool, b: McpTool) => (b.stars || 0) - (a.stars || 0))
      .slice(0, limit)

    // Get new tools (by creation date)
    const newTools = allTools
      .sort((a: McpTool, b: McpTool) => {
        const dateA = new Date((a.created_at as string) || 0).getTime()
        const dateB = new Date((b.created_at as string) || 0).getTime()
        return dateB - dateA
      })
      .slice(0, limit)

    return {
      similar: similarTools,
      trending: trendingTools,
      new: newTools,
    }
  } catch (error) {
    console.error('Error in getRelatedTools:', error)
    return { similar: [], trending: [], new: [] }
  }
}

/**
 * Get section title and description based on type
 */
export function getSectionMetadata(type: 'similar' | 'trending' | 'new') {
  const metadata = {
    similar: {
      title: 'Similar MCP Tools',
      description: 'Based on tags & features',
      icon: '🔗',
    },
    trending: {
      title: 'Trending MCPs',
      description: 'Most active this week',
      icon: '🔥',
    },
    new: {
      title: 'New MCP Servers',
      description: 'Just arrived',
      icon: '✨',
    },
  }

  return metadata[type]
}
