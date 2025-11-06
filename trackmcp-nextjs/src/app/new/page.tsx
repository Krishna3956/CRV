import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { MobileNav } from '@/components/mobile-nav'
import { SubmitToolDialog } from '@/components/SubmitToolDialog'

export const revalidate = 3600 // Revalidate every hour

interface NewTool {
  id: string
  repo_name: string
  description: string
  category: string
  last_updated: string
  created_at: string
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'New & Recently Updated MCP Tools | TrackMCP',
    description: 'Discover the newest and most recently updated Model Context Protocol servers. Stay up-to-date with the latest MCP tools and improvements.',
    openGraph: {
      title: 'New & Recently Updated MCP Tools | TrackMCP',
      description: 'Discover the newest and most recently updated Model Context Protocol servers.',
      url: 'https://www.trackmcp.com/new',
      type: 'website',
    },
    alternates: {
      canonical: 'https://www.trackmcp.com/new',
    },
  }
}

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

export default async function NewPage() {
  const supabase = createClient()

  // Fetch recently updated tools
  const { data: tools, error } = await supabase
    .from('mcp_tools')
    .select('id, repo_name, description, category, last_updated, created_at')
    .in('status', ['approved', 'pending'])
    .order('last_updated', { ascending: false })
    .limit(200)

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-4">Error Loading Tools</h1>
          <p className="text-muted-foreground">Failed to load new tools. Please try again later.</p>
        </div>
      </div>
    )
  }

  const newTools = (tools || []) as NewTool[]

  return (
    <div className="min-h-screen bg-background">
      <MobileNav title="New & Updated" showBackButton={true} />
      <div className="container mx-auto px-4 py-8 md:py-8 pt-20 md:pt-8">
        {/* Header with Submit Button */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">New & Recently Updated</h1>
            <p className="text-base text-muted-foreground max-w-2xl">
              Discover the newest and most recently updated Model Context Protocol servers.
              Stay up-to-date with the latest MCP tools and improvements.
            </p>
          </div>
          {/* Submit Button - Mobile Only */}
          <div className="md:hidden w-full">
            <SubmitToolDialog variant="default" />
          </div>
        </div>

        {/* Tools List */}
        <div className="space-y-4">
          {newTools.map((tool) => {
            const isNewTool = isNew(tool.created_at)
            const isRecent = isRecentlyUpdated(tool.last_updated)

            return (
              <Link
                key={tool.id}
                href={`/tool/${encodeURIComponent(tool.repo_name)}`}
                className="group block p-6 rounded-lg border border-border bg-card hover:border-primary hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-lg font-semibold group-hover:text-primary transition-colors truncate">
                        {tool.repo_name}
                      </h2>
                      {isNewTool && (
                        <Badge variant="default" className="flex-shrink-0">
                          New
                        </Badge>
                      )}
                      {isRecent && !isNewTool && (
                        <Badge variant="secondary" className="flex-shrink-0">
                          Updated
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {tool.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="inline-block px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                        {tool.category}
                      </span>
                      <span>
                        Updated{' '}
                        {new Date(tool.last_updated).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Empty state */}
        {newTools.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tools found.</p>
          </div>
        )}

      </div>
    </div>
  )
}
