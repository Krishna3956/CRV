/**
 * Centralized database queries
 * Eliminates code duplication and improves maintainability
 */

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

type McpTool = Database['public']['Tables']['mcp_tools']['Row']

// Common select fields to avoid repetition
const TOOL_SELECT_FIELDS = 'id, repo_name, description, stars, github_url, language, topics, last_updated, category, created_at'
const TOOL_SELECT_ALL = '*'

/**
 * Get tool count
 */
export async function getToolCount(): Promise<number> {
  const supabase = createClient()
  
  try {
    const { count, error } = await supabase
      .from('mcp_tools')
      .select('id', { count: 'exact', head: true })
      .in('status', ['approved', 'pending'])

    if (error) {
      console.error('Error fetching tool count:', error)
      return 0
    }

    return count || 0
  } catch (err) {
    console.error('Exception fetching tool count:', err)
    return 0
  }
}

/**
 * Get all tools with pagination
 */
export async function getAllTools(limit: number = 10000): Promise<McpTool[]> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('mcp_tools')
      .select(TOOL_SELECT_FIELDS)
      .in('status', ['approved', 'pending'])
      .order('stars', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching tools:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Exception fetching tools:', err)
    return []
  }
}

/**
 * Get single tool by name
 * Excludes markdown files and documentation files
 */
export async function getToolByName(name: string): Promise<McpTool | null> {
  const supabase = createClient()
  
  try {
    const decodedName = decodeURIComponent(name)
    
    // Reject markdown and documentation files
    if (decodedName.endsWith('.md') || 
        decodedName.endsWith('.txt') ||
        decodedName === 'LICENSE' ||
        decodedName === 'CONTRIBUTING' ||
        decodedName === 'README') {
      return null
    }
    
    const { data, error } = await supabase
      .from('mcp_tools')
      .select(TOOL_SELECT_ALL)
      .ilike('repo_name', decodedName)
      .single()
    
    if (error || !data) return null
    return data
  } catch (err) {
    console.error('Error fetching tool:', err)
    return null
  }
}

/**
 * Get tools by category
 * Fetches in batches of 1000 to work around Supabase free plan limits
 */
export async function getToolsByCategory(category: string, limit: number = 10000): Promise<McpTool[]> {
  const supabase = createClient()
  let allTools: McpTool[] = []
  let offset = 0
  const batchSize = 1000

  try {
    while (allTools.length < limit) {
      const { data, error } = await supabase
        .from('mcp_tools')
        .select(TOOL_SELECT_FIELDS)
        .in('status', ['approved', 'pending'])
        .eq('category', category)
        .order('stars', { ascending: false })
        .range(offset, offset + batchSize - 1)

      if (error) {
        console.error('Error fetching tools by category:', error)
        break
      }

      if (!data || data.length === 0) {
        break
      }

      allTools = [...allTools, ...data]
      offset += batchSize

      // Stop if we got fewer results than requested (end of data)
      if (data.length < batchSize) {
        break
      }
    }

    return allTools.slice(0, limit)
  } catch (err) {
    console.error('Exception fetching tools by category:', err)
    return []
  }
}

/**
 * Search tools
 * Fetches in batches of 1000 to work around Supabase free plan limits
 */
export async function searchTools(query: string, limit: number = 100): Promise<McpTool[]> {
  const supabase = createClient()
  let allTools: McpTool[] = []
  let offset = 0
  const batchSize = 1000

  try {
    // Fetch all matching tools in batches
    while (allTools.length < 10000) {
      const { data, error } = await supabase
        .from('mcp_tools')
        .select(TOOL_SELECT_FIELDS)
        .in('status', ['approved', 'pending'])
        .or(`repo_name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('stars', { ascending: false })
        .range(offset, offset + batchSize - 1)

      if (error) {
        console.error('Error searching tools:', error)
        break
      }

      if (!data || data.length === 0) {
        break
      }

      allTools = [...allTools, ...data]
      offset += batchSize

      // Stop if we got fewer results than requested (end of data)
      if (data.length < batchSize) {
        break
      }
    }

    // Return top results limited by the limit parameter
    return allTools.slice(0, limit)
  } catch (err) {
    console.error('Exception searching tools:', err)
    return []
  }
}

/**
 * Get tools with pagination (offset/limit)
 */
export async function getToolsWithPagination(offset: number, limit: number = 100): Promise<McpTool[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('mcp_tools')
      .select(TOOL_SELECT_FIELDS)
      .in('status', ['approved', 'pending'])
      .order('stars', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching tools with pagination:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Exception fetching tools with pagination:', err)
    return []
  }
}

/**
 * Get approved tools only
 */
export async function getApprovedTools(limit: number = 100): Promise<McpTool[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('mcp_tools')
      .select(TOOL_SELECT_FIELDS)
      .eq('status', 'approved')
      .order('stars', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching approved tools:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Exception fetching approved tools:', err)
    return []
  }
}

/**
 * Get recently updated tools
 */
export async function getRecentlyUpdatedTools(limit: number = 100): Promise<McpTool[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('mcp_tools')
      .select(TOOL_SELECT_FIELDS)
      .in('status', ['approved', 'pending'])
      .order('last_updated', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recently updated tools:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Exception fetching recently updated tools:', err)
    return []
  }
}

/**
 * Get newly created tools
 */
export async function getNewlyCreatedTools(limit: number = 100): Promise<McpTool[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('mcp_tools')
      .select(TOOL_SELECT_FIELDS)
      .in('status', ['approved', 'pending'])
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching newly created tools:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Exception fetching newly created tools:', err)
    return []
  }
}
