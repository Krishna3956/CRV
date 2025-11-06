/**
 * Freshness Signaling Utility
 * Detects meaningful changes in tool data and updates lastmod for AI/RAG systems
 * 
 * Critical for AEO (AI Engine Optimization):
 * - AI systems prioritize fresh content
 * - Stale lastmod = "un-citable" within months
 * - Fresh dates = +50-100% AI/RAG citation potential
 */

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

type McpTool = Database['public']['Tables']['mcp_tools']['Row']

interface ChangeDetectionResult {
  hasChanges: boolean
  changes: string[]
  significance: 'critical' | 'major' | 'minor' | 'none'
}

interface FreshnessUpdateResult {
  updated: boolean
  toolId: string
  reason: string
  previousLastModified: string | null
  newLastModified: string
}

/**
 * Detect meaningful changes in tool data
 * Returns true if changes warrant a lastmod update
 */
export function detectMeaningfulChanges(
  current: Partial<McpTool>,
  updated: Partial<McpTool>
): ChangeDetectionResult {
  const changes: string[] = []
  let significance: 'critical' | 'major' | 'minor' | 'none' = 'none'

  // CRITICAL CHANGES: Always update lastmod
  if (current.description !== updated.description) {
    changes.push('description')
    significance = 'critical'
  }

  if (current.topics !== updated.topics) {
    changes.push('topics')
    if (significance !== 'critical') significance = 'major'
  }

  // MAJOR CHANGES: Significant metric changes
  const starsDiff = Math.abs((current.stars || 0) - (updated.stars || 0))
  if (starsDiff > 100) {
    // More than 100 new stars = significant
    changes.push(`stars (${starsDiff} change)`)
    if (significance !== 'critical') significance = 'major'
  }

  if (current.language !== updated.language) {
    changes.push('language')
    if (significance !== 'critical') significance = 'major'
  }

  // MINOR CHANGES: Small metric changes
  if (starsDiff > 10 && starsDiff <= 100) {
    changes.push(`stars (${starsDiff} change)`)
    if (significance === 'none') significance = 'minor'
  }

  if (current.repo_name !== updated.repo_name) {
    changes.push('repo_name')
    if (significance !== 'critical' && significance !== 'major') significance = 'minor'
  }

  return {
    hasChanges: changes.length > 0,
    changes,
    significance,
  }
}

/**
 * Update tool's lastmod if meaningful changes detected
 * Logs all updates for monitoring
 */
export async function updateToolLastModIfChanged(
  toolId: string,
  currentData: Partial<McpTool>,
  updatedData: Partial<McpTool>
): Promise<FreshnessUpdateResult> {
  const supabase = createClient()
  const now = new Date().toISOString()

  // Detect changes
  const changeResult = detectMeaningfulChanges(currentData, updatedData)

  if (!changeResult.hasChanges) {
    return {
      updated: false,
      toolId,
      reason: 'No meaningful changes detected',
      previousLastModified: currentData.last_updated || null,
      newLastModified: currentData.last_updated || now,
    }
  }

  // Only update for critical or major changes
  if (changeResult.significance === 'none' || changeResult.significance === 'minor') {
    return {
      updated: false,
      toolId,
      reason: `Minor changes only: ${changeResult.changes.join(', ')}`,
      previousLastModified: currentData.last_updated || null,
      newLastModified: currentData.last_updated || now,
    }
  }

  // Update lastmod
  const { error } = await supabase
    .from('mcp_tools')
    .update({ last_updated: now })
    .eq('id', toolId)

  if (error) {
    console.error(`Failed to update lastmod for tool ${toolId}:`, error)
    return {
      updated: false,
      toolId,
      reason: `Error: ${error.message}`,
      previousLastModified: currentData.last_updated || null,
      newLastModified: currentData.last_updated || now,
    }
  }

  // Log the update
  const logMessage = `[FRESHNESS] Updated tool ${toolId} lastmod. Changes: ${changeResult.changes.join(', ')} (${changeResult.significance})`
  console.log(logMessage)

  // TODO: Send to analytics/monitoring service
  // await logToMonitoring({ toolId, changes: changeResult.changes, significance: changeResult.significance })

  return {
    updated: true,
    toolId,
    reason: `${changeResult.significance} changes: ${changeResult.changes.join(', ')}`,
    previousLastModified: currentData.last_updated || null,
    newLastModified: now,
  }
}

/**
 * Bulk update lastmod for tools (for editorial reviews)
 * Used for quarterly reviews where editors meaningfully update content
 */
export async function bulkUpdateToolsLastMod(
  toolIds: string[],
  reason: string
): Promise<{
  success: number
  failed: number
  results: FreshnessUpdateResult[]
}> {
  const supabase = createClient()
  const now = new Date().toISOString()
  const results: FreshnessUpdateResult[] = []

  console.log(`[FRESHNESS] Bulk updating ${toolIds.length} tools. Reason: ${reason}`)

  for (const toolId of toolIds) {
    const { error } = await supabase
      .from('mcp_tools')
      .update({ last_updated: now })
      .eq('id', toolId)

    if (error) {
      console.error(`Failed to update tool ${toolId}:`, error)
      results.push({
        updated: false,
        toolId,
        reason: `Error: ${error.message}`,
        previousLastModified: null,
        newLastModified: now,
      })
    } else {
      results.push({
        updated: true,
        toolId,
        reason,
        previousLastModified: null,
        newLastModified: now,
      })
    }
  }

  const success = results.filter(r => r.updated).length
  const failed = results.filter(r => !r.updated).length

  console.log(`[FRESHNESS] Bulk update complete. Success: ${success}, Failed: ${failed}`)

  return { success, failed, results }
}

/**
 * Get freshness statistics for monitoring
 */
export async function getFreshnessStats(): Promise<{
  totalTools: number
  recentlyUpdated: number
  staleTools: number
  averageAge: number
}> {
  const supabase = createClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  // Get total tools
  const { count: totalTools } = await supabase
    .from('mcp_tools')
    .select('*', { count: 'exact', head: true })
    .in('status', ['approved', 'pending'])

  // Get recently updated (last 30 days)
  const { count: recentlyUpdated } = await supabase
    .from('mcp_tools')
    .select('*', { count: 'exact', head: true })
    .in('status', ['approved', 'pending'])
    .gte('last_updated', thirtyDaysAgo)

  // Get stale tools (older than 90 days)
  const { count: staleTools } = await supabase
    .from('mcp_tools')
    .select('*', { count: 'exact', head: true })
    .in('status', ['approved', 'pending'])
    .lt('last_updated', ninetyDaysAgo)

  return {
    totalTools: totalTools || 0,
    recentlyUpdated: recentlyUpdated || 0,
    staleTools: staleTools || 0,
    averageAge: totalTools ? Math.round((staleTools || 0) / (totalTools || 1) * 100) : 0,
  }
}

/**
 * Check if tool needs editorial review
 * Returns true if tool hasn't been meaningfully updated in 90+ days
 */
export function needsEditorialReview(lastUpdated: string | null): boolean {
  if (!lastUpdated) return true

  const lastUpdateDate = new Date(lastUpdated)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

  return lastUpdateDate < ninetyDaysAgo
}
