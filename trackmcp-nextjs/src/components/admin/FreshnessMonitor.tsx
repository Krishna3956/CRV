'use client'

/**
 * Freshness Monitoring Dashboard
 * Displays freshness statistics and allows bulk updates
 * 
 * Shows:
 * - Total tools
 * - Recently updated (30 days)
 * - Stale tools (>90 days)
 * - Recommendations
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, TrendingUp } from 'lucide-react'

interface FreshnessStats {
  totalTools: number
  recentlyUpdated: number
  staleTools: number
  averageAge: number
}

interface FreshnessMonitorProps {
  adminKey?: string
}

export function FreshnessMonitor({ adminKey }: FreshnessMonitorProps) {
  const [stats, setStats] = useState<FreshnessStats | null>(null)
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  // Fetch freshness stats
  useEffect(() => {
    fetchStats()
    // Refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  async function fetchStats() {
    try {
      setLoading(true)
      const headers: HeadersInit = {}
      if (adminKey) {
        headers['Authorization'] = `Bearer ${adminKey}`
      }

      const response = await fetch('/api/admin/update-freshness/stats', { headers })
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
        setRecommendations(data.recommendations)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch stats')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats')
    } finally {
      setLoading(false)
    }
  }

  async function handleBulkUpdate(reason: string) {
    if (!stats) return

    try {
      setUpdating(true)

      // Get tools that need updating (stale tools)
      const toolIds = [] // TODO: Fetch stale tool IDs from API

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (adminKey) {
        headers['Authorization'] = `Bearer ${adminKey}`
      }

      const response = await fetch('/api/admin/update-freshness/bulk', {
        method: 'POST',
        headers,
        body: JSON.stringify({ toolIds, reason }),
      })

      const data = await response.json()

      if (data.success) {
        // Refresh stats
        await fetchStats()
      } else {
        setError(data.error || 'Failed to update tools')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tools')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Freshness Monitor</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-900">Freshness Monitor - Error</CardTitle>
          <CardDescription className="text-red-700">{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Freshness Monitor</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const recentlyUpdatedPercent = Math.round((stats.recentlyUpdated / stats.totalTools) * 100)
  const stalePercent = Math.round((stats.staleTools / stats.totalTools) * 100)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Freshness Signals Monitor</CardTitle>
          <CardDescription>
            Track lastmod dates for AI/RAG system optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Total Tools</div>
              <div className="text-2xl font-bold">{stats.totalTools.toLocaleString()}</div>
            </div>

            <div className="p-4 border rounded-lg bg-green-50">
              <div className="text-sm text-muted-foreground">Recently Updated (30d)</div>
              <div className="text-2xl font-bold text-green-700">{stats.recentlyUpdated.toLocaleString()}</div>
              <div className="text-xs text-green-600 mt-1">{recentlyUpdatedPercent}%</div>
            </div>

            <div className="p-4 border rounded-lg bg-yellow-50">
              <div className="text-sm text-muted-foreground">Stale (>90d)</div>
              <div className="text-2xl font-bold text-yellow-700">{stats.staleTools.toLocaleString()}</div>
              <div className="text-xs text-yellow-600 mt-1">{stalePercent}%</div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Average Age</div>
              <div className="text-2xl font-bold">{stats.averageAge}%</div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-2">
            <h3 className="font-semibold">Recommendations</h3>
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                {rec.includes('✅') ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : rec.includes('🚨') ? (
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                )}
                <p className="text-sm">{rec}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <h3 className="font-semibold">Actions</h3>
            <div className="flex gap-2">
              <Button
                onClick={() => handleBulkUpdate('Quarterly editorial review Q4 2024')}
                disabled={updating}
                variant="default"
              >
                {updating ? 'Updating...' : 'Update Stale Tools'}
              </Button>
              <Button
                onClick={fetchStats}
                disabled={loading}
                variant="outline"
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="p-3 bg-blue-50 rounded-lg text-sm text-muted-foreground">
            <p>
              <strong>Freshness signals</strong> are critical for AI/RAG systems. Tools with recent lastmod dates
              are more likely to be re-crawled, trusted, and cited in AI responses.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
