'use client'

import Link from 'next/link'
import { Zap, TrendingUp, Sparkles, ArrowRight, Star } from 'lucide-react'
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

interface ToolDiscoverySidebarProps {
  similar: McpTool[]
  trending: McpTool[]
  new: McpTool[]
  currentToolId?: string
  variant?: 'default' | 'sidebar'
}

const sectionConfig = {
  similar: {
    title: 'Similar MCP',
    subtitle: 'Based on tags & features',
    icon: Zap,
    color: 'text-slate-900 dark:text-slate-50',
    bgColor: 'bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl border border-slate-200/40 dark:border-slate-800/40',
    borderColor: 'border-slate-200/40 dark:border-slate-800/40',
    accentColor: 'hover:bg-slate-100/50 dark:hover:bg-slate-900/50',
    dotColor: 'bg-blue-100/80 dark:bg-blue-950/40',
    accentDot: 'text-blue-600 dark:text-blue-400',
    headerBg: 'bg-gradient-to-r from-blue-50/40 to-transparent dark:from-blue-950/20 dark:to-transparent',
  },
  trending: {
    title: 'Trending MCP',
    subtitle: 'Most active this week',
    icon: TrendingUp,
    color: 'text-slate-900 dark:text-slate-50',
    bgColor: 'bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl border border-slate-200/40 dark:border-slate-800/40',
    borderColor: 'border-slate-200/40 dark:border-slate-800/40',
    accentColor: 'hover:bg-slate-100/50 dark:hover:bg-slate-900/50',
    dotColor: 'bg-cyan-100/80 dark:bg-cyan-950/40',
    accentDot: 'text-cyan-600 dark:text-cyan-400',
    headerBg: 'bg-gradient-to-r from-cyan-50/40 to-transparent dark:from-cyan-950/20 dark:to-transparent',
  },
  new: {
    title: 'New',
    subtitle: 'Just arrived',
    icon: Sparkles,
    color: 'text-slate-900 dark:text-slate-50',
    bgColor: 'bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl border border-slate-200/40 dark:border-slate-800/40',
    borderColor: 'border-slate-200/40 dark:border-slate-800/40',
    accentColor: 'hover:bg-slate-100/50 dark:hover:bg-slate-900/50',
    dotColor: 'bg-emerald-100/80 dark:bg-emerald-950/40',
    accentDot: 'text-emerald-600 dark:text-emerald-400',
    headerBg: 'bg-gradient-to-r from-emerald-50/40 to-transparent dark:from-emerald-950/20 dark:to-transparent',
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

function ToolListSection({
  type,
  tools,
  currentToolId,
  variant = 'default',
}: {
  type: 'similar' | 'trending' | 'new'
  tools: McpTool[]
  currentToolId?: string
  variant?: 'default' | 'sidebar'
}) {
  if (!tools || tools.length === 0) return null

  const config = sectionConfig[type]
  const Icon = config.icon
  const isSidebar = variant === 'sidebar'
  // 5 items for both Similar and Trending on sidebar
  const maxItems = isSidebar ? 5 : 5

  // Filter out current tool
  const displayTools = currentToolId
    ? tools.filter(tool => tool.id !== currentToolId)
    : tools

  if (displayTools.length === 0) return null

  const visibleTools = displayTools.slice(0, maxItems)
  const hasMore = displayTools.length > maxItems

  return (
    <div className={`rounded-lg sm:rounded-xl border ${config.borderColor} ${config.bgColor} overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md`}>
      {/* Section Header - Modern SaaS Style */}
      <div className={`px-3 py-3 sm:px-4 md:px-5 lg:px-6 border-b ${config.borderColor} ${config.headerBg}`}>
        <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3 mb-1">
          <div className={`p-1.5 sm:p-1.5 md:p-2 rounded-lg ${config.dotColor}`}>
            <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4 md:w-4 lg:h-5 lg:w-5 ${config.accentDot} flex-shrink-0`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-sm sm:text-sm md:text-base ${config.color} tracking-tight`}>
              {config.title}
            </h3>
            <p className={`text-xs text-muted-foreground/70 mt-0.5 font-medium`}>
              {config.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Tool List - Minimal Design */}
      <ul className={`list-none divide-y divide-slate-200/40 dark:divide-slate-700/40`}>
        {visibleTools.map((tool, index) => (
          <li key={tool.id}>
            <Link
              href={`/tool/${encodeURIComponent(tool.repo_name || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`group block px-3 py-2 sm:py-2.5 md:py-3 lg:py-4 px-3 sm:px-4 md:px-5 lg:px-6 transition-colors duration-150 ${config.accentColor}`}
              aria-label={`View details for ${formatToolName(tool.repo_name || '')} (opens in new tab)`}
            >
              <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 min-w-0">
                {/* Avatar - Responsive */}
                <Avatar className={`flex-shrink-0 h-6 w-6 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 ring-1 ring-current ring-opacity-5`}>
                  <AvatarImage
                    src={`https://github.com/${tool.github_url?.split('/')[3]}.png`}
                    alt={`${formatToolName(tool.repo_name || '')} repository owner`}
                    loading="lazy"
                  />
                  <AvatarFallback className={`text-xs font-semibold ${config.color}`}>
                    {(tool.repo_name || '').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Tool Info - Compact */}
                <div className="flex-1 min-w-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h4 className={`font-medium truncate group-hover:text-primary transition-colors text-xs sm:text-xs md:text-sm`}>
                          {formatToolName(tool.repo_name || '')}
                        </h4>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        {formatToolName(tool.repo_name || '')}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Meta Row - Compact */}
                  <div className={`flex items-center gap-1 sm:gap-1 md:gap-1.5 mt-0.5 text-xs text-muted-foreground/60`}>
                    {tool.language && (
                      <span className="truncate font-medium text-xs">{tool.language}</span>
                    )}
                    {tool.language && tool.stars && (
                      <span className="text-current text-opacity-20 hidden sm:inline">·</span>
                    )}
                    {tool.stars && (
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <Star className="h-2 w-2 sm:h-2 sm:w-2 md:h-2.5 md:w-2.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                        <span className="font-semibold text-muted-foreground/70 text-xs">{formatStars(tool.stars)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Badge - Right Aligned */}
                <div className="flex items-center gap-1 sm:gap-1 md:gap-1.5 flex-shrink-0">
                  {type === 'new' && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">🆕</span>
                  )}
                  {!isSidebar && (
                    <ArrowRight className="h-2.5 w-2.5 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100" aria-hidden="true" />
                  )}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {/* View All Link - Modern SaaS Style */}
      {hasMore && (
        <div className={`px-3 py-2 sm:py-2.5 md:py-3 lg:py-4 px-3 sm:px-4 md:px-5 lg:px-6 border-t ${config.borderColor} bg-gradient-to-r from-white/20 to-transparent dark:from-slate-800/10 dark:to-transparent hover:${config.headerBg} transition-all duration-200`}>
          <Link
            href="/"
            className="inline-flex items-center gap-1 sm:gap-1 md:gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors group"
          >
            View all
            <ArrowRight className="h-2.5 w-2.5 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      )}
    </div>
  )
}

export function ToolDiscoverySidebar({
  similar,
  trending,
  new: newTools,
  currentToolId,
  variant = 'default',
}: ToolDiscoverySidebarProps) {
  const isSidebar = variant === 'sidebar'
  const hasAnyTools = similar.length > 0 || trending.length > 0 || newTools.length > 0

  if (!hasAnyTools) return null

  return (
    <div className={isSidebar ? '' : 'mt-12 pt-8 border-t'}>
      {/* Sections Container - No top margin on sidebar */}
      <div className={`${isSidebar ? 'space-y-4' : 'space-y-4 sm:space-y-5 mb-6 sm:mb-8'}`}>
        {similar.length > 0 && (
          <ToolListSection
            type="similar"
            tools={similar}
            currentToolId={currentToolId}
            variant={variant}
          />
        )}

        {trending.length > 0 && (
          <ToolListSection
            type="trending"
            tools={trending}
            currentToolId={currentToolId}
            variant={variant}
          />
        )}
      </div>

      {/* View All Button */}
      {!isSidebar && (
        <div className="flex justify-center pt-2">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/">
              View All MCP Servers
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
