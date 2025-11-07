'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Star, ArrowUpRight } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface TopTool {
  id: string
  repo_name: string
  description: string
  stars: number
  category: string
  last_updated: string
  forks?: number
  watchers?: number
}

interface TopToolsClientProps {
  initialTools: TopTool[]
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

export function TopToolsClient({ initialTools }: TopToolsClientProps) {
  const [sortBy, setSortBy] = useState('stars')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categoryTools, setCategoryTools] = useState<TopTool[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(initialTools.map(tool => tool.category))
    return Array.from(cats).sort()
  }, [initialTools])

  // Fetch top 100 tools for selected category
  useEffect(() => {
    if (selectedCategory === 'all') {
      setCategoryTools(initialTools)
      return
    }

    setIsLoading(true)
    
    // Fetch top 100 tools for this category from Supabase
    fetch(`/api/top-tools-by-category?category=${encodeURIComponent(selectedCategory)}`)
      .then(res => res.json())
      .then(data => {
        setCategoryTools(data.tools || [])
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Error fetching category tools:', err)
        setIsLoading(false)
      })
  }, [selectedCategory, initialTools])

  const sortedAndFilteredTools = useMemo(() => {
    let tools = [...categoryTools]
    
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
  }, [categoryTools, sortBy])

  return (
    <>
      {/* Filter Bar */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="text-xs sm:text-sm text-muted-foreground">
          <p>Showing <span className="font-semibold text-foreground">{sortedAndFilteredTools.length}</span> tools</p>
        </div>
        
        <div className="flex flex-row items-center gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-1/2 sm:w-40 md:w-44 h-9 text-xs sm:text-sm border border-border rounded-md px-3 py-2 bg-background hover:bg-muted/50 transition-colors">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent className="bg-popover border z-50">
              <SelectItem value="stars">⭐ Most Stars</SelectItem>
              <SelectItem value="recent">📅 Recently Updated</SelectItem>
              <SelectItem value="name">🔤 Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-1/2 sm:w-40 md:w-44 h-9 text-xs sm:text-sm border border-border rounded-md px-3 py-2 bg-background hover:bg-muted/50 transition-colors">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-popover border z-50 max-h-60">
              <SelectItem value="all">📂 All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading tools...</p>
          </div>
        </div>
      )}

      {/* Tools Table */}
      {!isLoading && (
      <div className="w-full rounded-lg border border-border overflow-hidden">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-semibold w-8 md:w-12">Rank</th>
              <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-semibold flex-1">Tool Name</th>
              <th className="hidden md:table-cell px-4 py-4 text-left text-sm font-semibold w-32">Category</th>
              <th className="hidden sm:table-cell px-2 md:px-4 py-3 md:py-4 text-right text-xs md:text-sm font-semibold w-20 md:w-28">Est. Views</th>
              <th className="px-2 md:px-4 py-3 md:py-4 text-right text-xs md:text-sm font-semibold w-16 md:w-20">Stars</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredTools.map((tool: TopTool, index: number) => {
              // Extract owner name from repo URL for avatar
              const ownerName = tool.repo_name.split('/')[0] || tool.repo_name
              const ownerAvatar = `https://github.com/${ownerName}.png?size=32`

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
                <td className="px-2 md:px-3 py-4 md:py-5 text-xs md:text-sm font-semibold text-muted-foreground whitespace-nowrap w-10 md:w-14">
                  #{index + 1}
                </td>
                <td className="px-2 md:px-3 py-4 md:py-5 overflow-hidden w-48 md:w-64">
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
                      <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </span>
                  </Link>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {tool.description}
                  </p>
                </td>
                <td className="hidden md:table-cell px-1 md:pr-8 py-4 md:py-5 text-sm">
                  <span className="inline-block px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium max-w-lg truncate">
                    {tool.category}
                  </span>
                </td>
                <td className="hidden sm:table-cell px-4 md:px-6 py-4 md:py-5 text-right whitespace-nowrap">
                  <span className="text-xs md:text-sm text-muted-foreground">{getEstimatedViews(tool.stars)}</span>
                </td>
                <td className="px-2 md:px-3 py-4 md:py-5 text-right whitespace-nowrap w-20 md:w-24">
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
      )}

      {/* Empty state */}
      {!isLoading && sortedAndFilteredTools.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No tools found.</p>
        </div>
      )}
    </>
  )
}
