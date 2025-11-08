'use client'

import Link from 'next/link'
import { Star, TrendingUp, Sparkles, ArrowRight } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Database } from '@/types/database.types'

type McpTool = Database['public']['Tables']['mcp_tools']['Row']

interface RelatedToolsSectionProps {
  type: 'similar' | 'trending' | 'new'
  tools: McpTool[]
  currentToolId?: string
  variant?: 'default' | 'sidebar'
}

const sectionConfig = {
  similar: {
    title: 'Similar MCP Tools',
    description: 'Based on tags & features',
    icon: TrendingUp,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
  },
  trending: {
    title: 'Trending MCPs',
    description: 'Most active this week',
    icon: Star,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
  },
  new: {
    title: 'New MCP Servers',
    description: 'Just arrived',
    icon: Sparkles,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950',
  },
}

function formatToolName(name: string): string {
  return name
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function formatStars(stars: number | null): string {
  if (!stars) return '0'
  if (stars >= 1000) return `${(stars / 1000).toFixed(1)}k`
  return stars.toString()
}

export function RelatedToolsSection({
  type,
  tools,
  currentToolId,
  variant = 'default',
}: RelatedToolsSectionProps) {
  if (!tools || tools.length === 0) {
    return null
  }

  const config = sectionConfig[type]
  const Icon = config.icon
  const isSidebar = variant === 'sidebar'

  // Filter out current tool if provided
  const displayTools = currentToolId
    ? tools.filter(tool => tool.id !== currentToolId).slice(0, isSidebar ? 5 : 6)
    : tools.slice(0, isSidebar ? 5 : 6)

  if (displayTools.length === 0) {
    return null
  }

  return (
    <div className={isSidebar ? '' : 'mt-12 pt-8 border-t'}>
      {/* Section Header */}
      <div className={`rounded-lg ${config.bgColor} p-4 sm:p-5 mb-4 sm:mb-5 border border-transparent hover:border-primary/20 transition-colors`}>
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${config.color} flex-shrink-0`} />
          <h2 className={`font-bold ${isSidebar ? 'text-sm' : 'text-lg'}`}>
            {config.title}
          </h2>
        </div>
        <p className={`${isSidebar ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
          {config.description}
        </p>
      </div>

      {/* Desktop: Grid Layout (or Sidebar Compact) */}
      <ul className={`hidden md:grid gap-3 mb-5 list-none ${
        isSidebar
          ? 'grid-cols-1'
          : 'md:grid-cols-2 lg:grid-cols-3 gap-4'
      }`}>
        {displayTools.map(tool => (
          <li key={tool.id}>
            <Link
              href={`/tool/${encodeURIComponent(tool.repo_name || '')}`}
              className="group block h-full"
              aria-label={`View details for ${formatToolName(tool.repo_name || '')}`}
            >
              <div className={`h-full rounded-lg border border-border transition-all duration-200 bg-card ${
                isSidebar 
                  ? 'p-2.5 hover:border-primary/50 hover:shadow-sm hover:bg-accent/5 hover:-translate-y-0.5' 
                  : 'p-4 hover:border-primary/50 hover:shadow-lg hover:bg-accent/5 hover:-translate-y-1'
              }`}>
                <div className="flex items-start gap-2 mb-2">
                  <Avatar className={`flex-shrink-0 ${isSidebar ? 'h-6 w-6' : 'h-8 w-8'}`}>
                    <AvatarImage
                      src={`https://github.com/${
                        tool.github_url?.split('/')[3]
                      }.png`}
                      alt={`${formatToolName(tool.repo_name || '')} repository owner`}
                      loading="lazy"
                    />
                    <AvatarFallback className="text-xs font-semibold">
                      {(tool.repo_name || '').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <h3 className={`font-semibold truncate group-hover:text-primary transition-colors ${
                            isSidebar ? 'text-xs' : 'text-sm'
                          }`}>
                            {formatToolName(tool.repo_name || '')}
                          </h3>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          {formatToolName(tool.repo_name || '')}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {tool.language && !isSidebar && (
                      <p className="text-xs text-muted-foreground">
                        {tool.language}
                      </p>
                    )}
                  </div>
                </div>

                {tool.description && !isSidebar && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 cursor-help">
                          {tool.description}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        {tool.description}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                <div className={`flex items-center ${isSidebar ? 'justify-between gap-1' : 'justify-between'}`}>
                  <div className="flex items-center gap-1">
                    <Star className={`fill-amber-400 text-amber-400 ${
                      isSidebar ? 'h-3 w-3' : 'h-3.5 w-3.5'
                    }`} aria-hidden="true" />
                    <span className={`font-semibold ${isSidebar ? 'text-xs' : 'text-xs'}`}>
                      {formatStars(tool.stars)}
                    </span>
                  </div>
                  {tool.topics && tool.topics.length > 0 && !isSidebar && (
                    <Badge variant="secondary" className="text-xs">
                      {tool.topics[0]}
                    </Badge>
                  )}
                  {!isSidebar && (
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100" aria-hidden="true" />
                  )}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {/* Mobile: Horizontal Scroll */}
      <div className="md:hidden -mx-4 px-4 mb-6">
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
          {displayTools.map(tool => (
            <Link
              key={tool.id}
              href={`/tool/${encodeURIComponent(tool.repo_name || '')}`}
              className="flex-shrink-0 w-64 snap-start"
            >
              <div className="h-full p-4 rounded-lg border border-border bg-card active:bg-accent/10 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage
                      src={`https://github.com/${
                        tool.github_url?.split('/')[3]
                      }.png`}
                      alt={tool.repo_name || 'Tool'}
                      loading="lazy"
                    />
                    <AvatarFallback className="text-xs">
                      {(tool.repo_name || '').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">
                      {formatToolName(tool.repo_name || '')}
                    </h3>
                    {tool.language && (
                      <p className="text-xs text-muted-foreground">
                        {tool.language}
                      </p>
                    )}
                  </div>
                </div>

                {tool.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {tool.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-semibold">
                      {formatStars(tool.stars)}
                    </span>
                  </div>
                  {tool.topics && tool.topics.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {tool.topics[0]}
                    </Badge>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* View All Link */}
      {!isSidebar && (
        <div className="flex justify-center">
          <Button asChild variant="outline" size="sm">
            <Link href="/">View All MCP Servers</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
