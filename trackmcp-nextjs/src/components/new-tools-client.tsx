'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Sparkles, Zap, ChevronDown, Loader2 } from 'lucide-react'

interface Tool {
  id: string
  repo_name: string
  description: string
  category: string
  last_updated: string
  created_at: string
  stars?: number
  github_url?: string
}

interface NewToolsClientProps {
  tools: Tool[]
}

const INITIAL_DISPLAY = 15
const PREVIEW_COUNT = 3

// Helper functions
function isNew(createdAt: string): boolean {
  const created = new Date(createdAt)
  const now = new Date()
  const daysSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  return daysSinceCreation < 7
}

function isRecentlyUpdated(lastUpdated: string): boolean {
  const updated = new Date(lastUpdated)
  const now = new Date()
  const daysSinceUpdate = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24)
  return daysSinceUpdate < 7
}

function getGitHubOwnerAvatar(repoName: string): string {
  try {
    const owner = repoName.split('/')[0]
    return `https://github.com/${owner}.png?size=40`
  } catch {
    return ''
  }
}

const categoryIcons: { [key: string]: string } = {
  'ai': '🧠',
  'developer': '💻',
  'automation': '⚡',
  'database': '🗄️',
  'web': '🌐',
  'security': '🔒',
  'workflow': '🔄',
  'communication': '💬',
  'analytics': '📊',
  'infrastructure': '🖥️',
  'documentation': '📄',
  'configuration': '⚙️',
  'business': '💼',
  'collaboration': '👥',
  'integration': '🔗',
}

function getCategoryIcon(category: string): string {
  const categoryLower = category.toLowerCase()
  return categoryIcons[categoryLower] || '🔗'
}

// Helper: Format tool name for display (Title Case with spaces)
function formatToolName(name: string): string {
  return name
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function NewToolsClient({
  tools,
}: NewToolsClientProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_DISPLAY)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef(0)

  const displayedTools = tools.slice(0, visibleCount)
  const previewTools = tools.slice(visibleCount, visibleCount + PREVIEW_COUNT)
  const hasMoreToLoad = visibleCount < tools.length

  const handleRevealMore = () => {
    // Save current scroll position
    scrollPositionRef.current = window.scrollY
    
    setIsLoadingMore(true)
    // Simulate loading delay for smooth animation
    setTimeout(() => {
      setVisibleCount((prev) => prev + INITIAL_DISPLAY)
      setIsLoadingMore(false)
    }, 300)
  }

  // Restore scroll position after state update
  useEffect(() => {
    if (!isLoadingMore && scrollPositionRef.current > 0) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPositionRef.current)
        scrollPositionRef.current = 0
      })
    }
  }, [isLoadingMore, visibleCount])

  const ToolCard = ({ tool }: { tool: Tool }) => {
    const isNewTool = isNew(tool.created_at)
    const isRecent = isRecentlyUpdated(tool.last_updated)
    const updatedDate = new Date(tool.last_updated).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

    return (
      <Link
        href={`/tool/${encodeURIComponent(tool.repo_name)}`}
        className="group relative overflow-hidden rounded-lg border border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
      >
        {/* Gradient overlay on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at top right, hsl(243 75% 59% / 0.05), transparent 70%)',
          }}
        />

        {/* Colored accent strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Content */}
        <div className="relative p-6 space-y-4">
          {/* Header with GitHub avatar and title */}
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 flex-shrink-0 border border-border/50">
              <AvatarImage src={getGitHubOwnerAvatar(tool.repo_name)} alt={tool.repo_name.split('/')[0]} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {tool.repo_name.split('/')[0].slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2">
                {formatToolName(tool.repo_name)}
              </h3>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {isNewTool && (
              <Badge variant="default" className="flex items-center gap-1 h-6">
                <Sparkles className="h-3 w-3" />
                New
              </Badge>
            )}
            {isRecent && !isNewTool && (
              <Badge variant="secondary" className="flex items-center gap-1 h-6">
                <Zap className="h-3 w-3" />
                Updated
              </Badge>
            )}
            <Badge variant="outline" className="h-6">
              {tool.category}
            </Badge>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {tool.description || 'No description available'}
          </p>

          {/* Footer with metadata */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
            <span>Updated {updatedDate}</span>
            {tool.stars !== undefined && tool.stars > 0 && (
              <span className="flex items-center gap-1">
                ⭐ {tool.stars.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <>
      {/* Displayed Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedTools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>

      {/* Preview Section with Cropped Cards */}
      {hasMoreToLoad && (
        <div className="space-y-2 mt-8">
          {/* Preview Container with Fade Mask */}
          <div 
            ref={previewContainerRef}
            className={`relative overflow-hidden transition-all duration-600 ease-out will-change-max-height ${
              isLoadingMore ? 'max-h-[3000px]' : 'max-h-[280px] md:max-h-[280px]'
            }`}
            style={{
              transitionProperty: 'max-height',
              transitionDuration: '600ms',
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Gradient Fade Mask */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/70 via-background/40 to-transparent pointer-events-none z-10" />

            {/* Glassy Depth Layer */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/80 via-background/40 to-transparent pointer-events-none z-20" />

            {/* Preview Cards Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-600 ease-out ${
              isLoadingMore ? 'opacity-100 blur-0' : 'opacity-70 blur-[0.5px]'
            }`}>
              {previewTools.map((tool, index) => (
                <div
                  key={`preview-${tool.id}`}
                  className={`transition-all duration-600 ease-out ${
                    isLoadingMore ? 'opacity-100 translate-y-0' : 'opacity-70 translate-y-6'
                  }`}
                  style={{
                    transitionDelay: isLoadingMore ? `${index * 120}ms` : '0ms',
                  }}
                >
                  <ToolCard tool={tool} />
                </div>
              ))}
            </div>
          </div>

          {/* Reveal More Button */}
          <div className="flex justify-center">
            <button
              onClick={handleRevealMore}
              disabled={isLoadingMore}
              className={`group relative px-8 py-3 rounded-lg font-bold text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                isLoadingMore
                  ? 'bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 hover:from-primary/20 hover:via-accent/20 hover:to-primary/20 border border-primary/20 hover:border-primary/40'
                  : 'bg-gradient-to-r from-primary/20 via-accent/15 to-primary/20 hover:from-primary/30 hover:via-accent/25 hover:to-primary/30 border-2 border-primary hover:border-primary shadow-lg hover:shadow-xl ring-2 ring-primary/30'
              }`}
            >
              {isLoadingMore ? (
                <span className="flex items-center gap-2 gradient-text text-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading more...
                </span>
              ) : (
                <span className="flex items-center gap-2 gradient-text text-foreground group-hover:gap-3 transition-all">
                  Reveal more
                  <ChevronDown className={`h-5 w-5 text-foreground transition-all duration-300 flex-shrink-0 ${
                    isLoadingMore ? 'rotate-180' : 'group-hover:translate-y-1'
                  }`} />
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
