'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

type McpTool = Database['public']['Tables']['mcp_tools']['Row']

/**
 * Server action to fetch more tools on demand
 * Called when user clicks "Load More" button
 */
export async function fetchMoreTools(offset: number, limit: number = 100): Promise<McpTool[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('mcp_tools')
      .select('id, repo_name, description, stars, github_url, language, topics, last_updated, category')
      .in('status', ['approved', 'pending'])
      .order('stars', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching more tools:', error)
      return []
    }

    console.log(`Fetched ${data?.length || 0} more tools (offset: ${offset})`)
    return data || []
  } catch (err) {
    console.error('Exception fetching more tools:', err)
    return []
  }
}

/**
 * Server action to fetch tools by category
 * Called when user selects a category filter
 */
export async function fetchToolsByCategory(category: string, limit: number = 1000): Promise<McpTool[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('mcp_tools')
      .select('id, repo_name, description, stars, github_url, language, topics, last_updated, category')
      .in('status', ['approved', 'pending'])
      .eq('category', category)
      .order('stars', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching tools by category:', error)
      return []
    }

    console.log(`Found ${data?.length || 0} tools in category "${category}"`)
    return data || []
  } catch (err) {
    console.error('Exception fetching tools by category:', err)
    return []
  }
}

/**
 * Server action to search tools
 * Called when user searches for a tool
 */
export async function searchTools(query: string, limit: number = 100): Promise<McpTool[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('mcp_tools')
      .select('id, repo_name, description, stars, github_url, language, topics, last_updated, category')
      .in('status', ['approved', 'pending'])
      .or(`repo_name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('stars', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error searching tools:', error)
      return []
    }

    console.log(`Found ${data?.length || 0} tools matching "${query}"`)
    return data || []
  } catch (err) {
    console.error('Exception searching tools:', err)
    return []
  }
}
