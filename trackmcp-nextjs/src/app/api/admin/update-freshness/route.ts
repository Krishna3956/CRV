/**
 * Admin API: Update Tool Freshness Signals
 * 
 * Endpoints:
 * POST /api/admin/update-freshness/bulk - Bulk update lastmod for multiple tools
 * GET /api/admin/update-freshness/stats - Get freshness statistics
 * 
 * Used for:
 * - Quarterly editorial reviews
 * - Bulk freshness updates
 * - Monitoring freshness signals
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { bulkUpdateToolsLastMod, getFreshnessStats } from '@/utils/freshnessSignaling'

/**
 * Verify admin authentication
 * TODO: Implement proper authentication (API key, JWT, etc.)
 */
function verifyAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const adminKey = process.env.ADMIN_API_KEY

  if (!adminKey) {
    console.warn('[ADMIN API] ADMIN_API_KEY not set - allowing all requests (DEV MODE)')
    return true // Allow in development
  }

  return authHeader === `Bearer ${adminKey}`
}

/**
 * POST /api/admin/update-freshness/bulk
 * Bulk update lastmod for multiple tools
 * 
 * Request body:
 * {
 *   toolIds: string[],
 *   reason: string (e.g., "Quarterly editorial review Q4 2024")
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin auth
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { toolIds, reason } = body

    // Validate input
    if (!Array.isArray(toolIds) || toolIds.length === 0) {
      return NextResponse.json(
        { error: 'toolIds must be a non-empty array' },
        { status: 400 }
      )
    }

    if (!reason || typeof reason !== 'string') {
      return NextResponse.json(
        { error: 'reason must be a non-empty string' },
        { status: 400 }
      )
    }

    // Limit to 1000 tools per request
    if (toolIds.length > 1000) {
      return NextResponse.json(
        { error: 'Maximum 1000 tools per request' },
        { status: 400 }
      )
    }

    console.log(`[ADMIN API] Bulk update request: ${toolIds.length} tools, reason: ${reason}`)

    // Perform bulk update
    const result = await bulkUpdateToolsLastMod(toolIds, reason)

    return NextResponse.json({
      success: true,
      message: `Updated ${result.success} tools, ${result.failed} failed`,
      stats: {
        total: toolIds.length,
        success: result.success,
        failed: result.failed,
      },
      results: result.results,
    })
  } catch (error) {
    console.error('[ADMIN API] Error in bulk update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/update-freshness/stats
 * Get freshness statistics for monitoring
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin auth
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const stats = await getFreshnessStats()

    return NextResponse.json({
      success: true,
      stats,
      recommendations: generateRecommendations(stats),
    })
  } catch (error) {
    console.error('[ADMIN API] Error getting stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Generate recommendations based on freshness stats
 */
function generateRecommendations(stats: {
  totalTools: number
  recentlyUpdated: number
  staleTools: number
  averageAge: number
}): string[] {
  const recommendations: string[] = []

  const recentlyUpdatedPercent = Math.round((stats.recentlyUpdated / stats.totalTools) * 100)
  const stalePercent = Math.round((stats.staleTools / stats.totalTools) * 100)

  if (recentlyUpdatedPercent < 20) {
    recommendations.push('⚠️ Less than 20% of tools updated in last 30 days - consider quarterly review')
  }

  if (stalePercent > 50) {
    recommendations.push('⚠️ More than 50% of tools stale (>90 days) - schedule editorial review')
  }

  if (stalePercent > 80) {
    recommendations.push('🚨 Critical: More than 80% of tools stale - immediate action needed for AEO')
  }

  if (recentlyUpdatedPercent > 50) {
    recommendations.push('✅ Good: More than 50% of tools recently updated - freshness signals strong')
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Freshness signals are healthy')
  }

  return recommendations
}
