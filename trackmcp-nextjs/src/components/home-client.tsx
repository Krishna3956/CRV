'use client'

import { useState, useEffect, useMemo } from 'react'
import { SearchBar } from '@/components/SearchBar'
import { FilterBar } from '@/components/FilterBar'
import { ToolCard } from '@/components/ToolCard'
import { SubmitToolDialog } from '@/components/SubmitToolDialog'
import { StatsSection } from '@/components/StatsSection'
import { ErrorBoundary } from '@/components/error-boundary'
import { Footer } from '@/components/Footer'
import { Loader2, Sparkles, Package } from 'lucide-react'
import type { Database } from '@/types/database.types'

type McpTool = Database['public']['Tables']['mcp_tools']['Row']

interface HomeClientProps {
  initialTools: McpTool[]
  totalCount: number
}

export function HomeClient({ initialTools, totalCount }: HomeClientProps) {
  const [inputValue, setInputValue] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('stars')
  const [visibleCount, setVisibleCount] = useState(12)
  const [allTools, setAllTools] = useState<McpTool[]>(initialTools)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputValue)
    }, 300)

    return () => clearTimeout(timer)
  }, [inputValue])

  // List of blocked repos to hide from UI
  const blockedRepos = ['awesome-mcp-servers']

  const filteredAndSortedTools = useMemo(() => {
    return allTools
      .filter((tool) => {
        // Filter out blocked repos
        if (blockedRepos.includes(tool.repo_name?.toLowerCase() || '')) {
          return false
        }

        const searchLower = searchQuery.toLowerCase()
        return (
          tool.repo_name?.toLowerCase().includes(searchLower) ||
          tool.description?.toLowerCase().includes(searchLower) ||
          tool.topics?.some((topic) => topic.toLowerCase().includes(searchLower))
        )
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'stars':
            return (b.stars || 0) - (a.stars || 0)
          case 'recent':
            // Handle null/undefined dates - put them at the end
            if (!a.last_updated && !b.last_updated) return 0
            if (!a.last_updated) return 1
            if (!b.last_updated) return -1
            // Sort by most recent first (descending)
            const dateA = new Date(a.last_updated).getTime()
            const dateB = new Date(b.last_updated).getTime()
            return dateB - dateA
          case 'name':
            return (a.repo_name || '').localeCompare(b.repo_name || '')
          default:
            return 0
        }
      })
  }, [allTools, searchQuery, sortBy])

  const totalStars = useMemo(() => {
    return filteredAndSortedTools.reduce((sum, tool) => sum + (tool.stars || 0), 0)
  }, [filteredAndSortedTools])

  // Show visibleCount tools when no search query, show all when searching
  const displayedTools = searchQuery ? filteredAndSortedTools : filteredAndSortedTools.slice(0, visibleCount)
  
  const hasMoreToLoad = !searchQuery && visibleCount < filteredAndSortedTools.length
  const remainingCount = filteredAndSortedTools.length - visibleCount

  const loadMore = async () => {
    // If we have more tools in memory, just show them
    if (visibleCount < allTools.length) {
      setVisibleCount(prev => prev + 12)
      return
    }
    
    // Otherwise, fetch more from API
    if (allTools.length < totalCount && !isLoadingMore) {
      setIsLoadingMore(true)
      try {
        const response = await fetch(`/api/tools?offset=${allTools.length}&limit=100`)
        const data = await response.json()
        if (data.tools && data.tools.length > 0) {
          setAllTools(prev => [...prev, ...data.tools])
          setVisibleCount(prev => prev + 12)
        }
      } catch (error) {
        console.error('Error loading more tools:', error)
      } finally {
        setIsLoadingMore(false)
      }
    }
  }

  // Reset visible count when search query changes
  useEffect(() => {
    if (searchQuery) {
      setVisibleCount(15)
    }
  }, [searchQuery])

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-60"
          style={{ background: 'var(--gradient-mesh)' }}
        />
        
        {/* Gradient fade to background */}
        <div 
          className="absolute bottom-0 inset-x-0 h-32 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, var(--background))' }}
        />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-700" />
        
        <div className="container relative mx-auto px-4 py-4 md:py-8">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-card/50 backdrop-blur-sm mb-6 animate-fade-in">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Track MCP</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold gradient-text animate-fade-in leading-tight">
              World&apos;s Largest MCP Repository
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in">
              Discover, Track, and Explore Over 10,000+ Model Context Protocol Servers, Clients & Tools in One Centralized Platform
            </p>
            
            <div className="flex flex-col items-center gap-2 pt-6 animate-fade-in">
              <SearchBar
                value={inputValue}
                onChange={setInputValue}
                placeholder="Search by name, description, or tags..."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 mt-8 relative z-10">
        <StatsSection totalTools={searchQuery ? filteredAndSortedTools.length : totalCount} totalStars={totalStars} isSearching={!!searchQuery} />
        {/* Submit Tool button - visible on mobile only, centered below stats */}
        <div className="flex justify-center mt-6 sm:hidden">
          <SubmitToolDialog />
        </div>
      </section>

      {/* Directory Section */}
      <section className="container mx-auto px-4 py-6 pb-8">
        <div className="flex flex-col gap-4 mb-12">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold gradient-text">Browse Repository</h2>
                <p className="text-muted-foreground text-lg mt-1">
                  {searchQuery ? filteredAndSortedTools.length : (10000 + totalCount).toLocaleString()} available
                </p>
              </div>
              <div className="flex flex-row gap-2 w-auto">
                <FilterBar sortBy={sortBy} onSortChange={setSortBy} />
                {/* Submit Tool button - hidden on mobile, shown on desktop */}
                <div className="hidden sm:block">
                  <SubmitToolDialog />
                </div>
              </div>
            </div>
          </div>
        </div>

        {filteredAndSortedTools.length === 0 ? (
          <div className="text-center py-32 space-y-4">
            <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold">
              {searchQuery ? 'No tools found' : 'No tools yet'}
            </h3>
            <p className="text-xl text-muted-foreground max-w-md mx-auto">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Be the first to submit an MCP tool to the directory!'}
            </p>
          </div>
        ) : (
          <>
            <ErrorBoundary>
              <div 
                id="rows-container" 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr"
                aria-live="polite"
              >
                {displayedTools.map((tool, index) => (
                <div
                  key={tool.id}
                  className="animate-fade-in h-full"
                  style={{
                    animationDelay: index >= visibleCount - 15 ? `${(index % 15) * 30}ms` : '0ms'
                  }}
                >
                  <ToolCard
                    name={tool.repo_name || 'Unknown'}
                    description={tool.description || ''}
                    stars={tool.stars || 0}
                    githubUrl={tool.github_url}
                    language={tool.language || undefined}
                    topics={tool.topics || undefined}
                    lastUpdated={tool.last_updated || undefined}
                  />
                </div>
              ))}
              </div>
            </ErrorBoundary>
            
            {/* Explore More Button */}
            {hasMoreToLoad && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="group relative px-6 py-2.5 rounded-md font-bold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 hover:from-primary/20 hover:via-accent/20 hover:to-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ color: 'transparent' }}
                >
                  {isLoadingMore ? (
                    <span className="flex items-center gap-2 gradient-text">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    <span className="gradient-text">
                      Explore more
                    </span>
                  )}
                </button>
              </div>
            )}
            
            {!hasMoreToLoad && !searchQuery && filteredAndSortedTools.length > 15 && (
              <div className="flex justify-center mt-12">
                <div className="px-8 py-4 rounded-lg font-semibold text-base text-muted-foreground">
                  No more results
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </div>
  )
}
