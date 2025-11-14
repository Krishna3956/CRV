'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Star, ArrowUpRight, TrendingUp } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface Tool {
  id: string
  repo_name: string
  description: string
  stars: number
  last_updated: string
  forks?: number
  watchers?: number
}

interface CategoryToolsClientProps {
  initialTools: Tool[]
  categoryName?: string
  currentPage?: number
  totalPages?: number
  totalCount?: number | null
}

// Helper: Format tool name for display (Title Case with spaces)
function formatToolName(name: string): string {
  return name
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// Helper: Calculate estimated views based on stars
function getEstimatedViews(stars: number): string {
  if (stars >= 10000) return `~${Math.round(stars * 50 / 1000)}K`
  if (stars >= 1000) return `~${Math.round(stars * 30 / 1000)}K`
  if (stars >= 100) return `~${Math.round(stars * 20 / 100)}K`
  return `~${stars * 10}`
}

export function CategoryToolsClient({ 
  initialTools, 
  categoryName = '', 
  currentPage = 1, 
  totalPages = 1,
  totalCount = 0 
}: CategoryToolsClientProps) {
  const [sortBy, setSortBy] = useState('stars')
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)
  const hasNextPage = currentPage < totalPages

  const sortedTools = useMemo(() => {
    let tools = [...initialTools]
    
    // Sort
    switch (sortBy) {
      case 'stars':
        return tools.sort((a, b) => b.stars - a.stars)
      case 'recent':
        return tools.sort((a, b) => 
          new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
        )
      case 'name':
        return tools.sort((a, b) => a.repo_name.localeCompare(b.repo_name))
      default:
        return tools
    }
  }, [initialTools, sortBy])

  return (
    <>
      {/* Filter Bar */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="text-xs sm:text-sm text-muted-foreground">
          <p>Showing <span className="font-semibold text-foreground">{sortedTools.length}</span> tools</p>
        </div>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-auto h-9 text-xs sm:text-sm border border-border rounded-md px-3 py-2 bg-background hover:bg-muted/50 transition-colors">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent className="bg-popover border z-50">
            <SelectItem value="stars">⭐ Most Stars</SelectItem>
            <SelectItem value="recent">📅 Recently Updated</SelectItem>
            <SelectItem value="name">🔤 Name (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tools Table */}
      <div className="w-full rounded-lg border border-border overflow-hidden">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-semibold w-8 md:w-12">Rank</th>
              <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-semibold flex-1">Tool Name</th>
              <th className="hidden sm:table-cell px-2 md:px-4 py-3 md:py-4 text-right text-xs md:text-sm font-semibold w-20 md:w-28">Est. Views</th>
              <th className="px-2 md:px-4 py-3 md:py-4 text-right text-xs md:text-sm font-semibold w-16 md:w-20">Stars</th>
            </tr>
          </thead>
          <tbody>
            {sortedTools.map((tool: Tool, index: number) => {
              // Extract owner name from repo URL for avatar
              const ownerName = tool.repo_name.split('/')[0] || tool.repo_name
              const ownerAvatar = `https://github.com/${ownerName}.png?size=32`
              
              // Check if this tool is in top 5 (only when sorted by stars)
              const isTopTrending = sortBy === 'stars' && index < 5

              return (
              <tr
                key={tool.id}
                className={`border-b border-border transition-all duration-200 group ${
                  hoveredRowId === tool.id 
                    ? 'bg-gradient-to-r from-primary/5 to-primary/10' 
                    : 'hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10'
                }`}
                onMouseEnter={() => setHoveredRowId(tool.id)}
                onMouseLeave={() => setHoveredRowId(null)}
                onTouchStart={() => setHoveredRowId(tool.id)}
                onTouchEnd={() => setHoveredRowId(null)}
              >
                <td className="px-2 md:px-4 py-3 md:py-4 text-xs md:text-sm font-semibold text-muted-foreground whitespace-nowrap w-8 md:w-12">
                  #{index + 1}
                </td>
                <td className="px-2 md:px-4 py-3 md:py-4 overflow-hidden">
                  <Link
                    href={`/tool/${encodeURIComponent(tool.repo_name)}`}
                    className="flex items-center gap-1 md:gap-2 font-medium hover:text-primary transition-colors"
                  >
                    <Avatar className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0">
                      <AvatarImage src={ownerAvatar} alt={ownerName} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                        {ownerName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex items-center gap-1 text-xs md:text-sm min-w-0">
                      <span className="truncate">{formatToolName(tool.repo_name)}</span>
                      {isTopTrending && (
                        <span className="inline-flex items-center gap-0.5 md:px-1.5 md:py-0.5 md:rounded-full md:bg-gradient-to-r md:from-orange-500/20 md:to-red-500/20 md:border md:border-orange-500/30 flex-shrink-0">
                          <TrendingUp className="h-2.5 w-2.5 text-orange-600 dark:text-orange-400" />
                          <span className="hidden md:inline text-xs font-semibold text-orange-600 dark:text-orange-400">Trending</span>
                        </span>
                      )}
                      <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </span>
                  </Link>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {tool.description}
                  </p>
                </td>
                <td className="hidden sm:table-cell px-2 md:px-4 py-3 md:py-4 text-right whitespace-nowrap w-20 md:w-28">
                  <span className="text-xs md:text-sm text-muted-foreground">{getEstimatedViews(tool.stars)}</span>
                </td>
                <td className="px-1 md:px-3 py-3 md:py-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1 h-6">
                    <Star className="h-3 w-3 md:h-4 md:w-4 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                    <span className="font-semibold text-xs md:text-sm">{tool.stars.toLocaleString()}</span>
                  </div>
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {sortedTools.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No tools found.</p>
        </div>
      )}
    </>
  )
}
