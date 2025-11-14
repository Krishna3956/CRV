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
 */
export async function getToolByName(name: string): Promise<McpTool | null> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('mcp_tools')
      .select(TOOL_SELECT_ALL)
      .ilike('repo_name', decodeURIComponent(name))
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
 */
export async function getToolsByCategory(category: string, limit: number = 1000): Promise<McpTool[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('mcp_tools')
      .select(TOOL_SELECT_FIELDS)
      .in('status', ['approved', 'pending'])
      .eq('category', category)
      .order('stars', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching tools by category:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Exception fetching tools by category:', err)
    return []
  }
}

/**
 * Search tools
 */
export async function searchTools(query: string, limit: number = 100): Promise<McpTool[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('mcp_tools')
      .select(TOOL_SELECT_FIELDS)
      .in('status', ['approved', 'pending'])
      .or(`repo_name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('stars', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error searching tools:', error)
      return []
    }

    return data || []
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
