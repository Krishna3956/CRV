import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { TopToolsClient } from '@/components/top-tools-client'
import { MobileNav } from '@/components/mobile-nav'
import { SubmitToolDialog } from '@/components/SubmitToolDialog'

export const revalidate = 3600 // Revalidate every hour

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

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Top 100 MCP Tools by Stars | TrackMCP',
    description: 'Discover the most starred and popular Model Context Protocol servers. See which MCP tools are trusted by thousands of developers worldwide.',
    openGraph: {
      title: 'Top 100 MCP Tools by Stars | TrackMCP',
      description: 'Discover the most starred and popular Model Context Protocol servers.',
      url: 'https://www.trackmcp.com/top-tools',
      type: 'website',
    },
    alternates: {
      canonical: 'https://www.trackmcp.com/top-tools',
    },
  }
}

export default async function TopToolsPage() {
  const supabase = createClient()

  // Fetch top 100 tools by stars
  const { data: tools, error } = await supabase
    .from('mcp_tools')
    .select('id, repo_name, description, stars, category, last_updated')
    .in('status', ['approved', 'pending'])
    .order('stars', { ascending: false })
    .limit(100)

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-4">Error Loading Tools</h1>
          <p className="text-muted-foreground">Failed to load top tools. Please try again later.</p>
        </div>
      </div>
    )
  }

  const topTools = (tools || []) as TopTool[]

  return (
    <div className="min-h-screen bg-background">
      <MobileNav title="Top 100 MCP" showBackButton={true} />
      <div className="container mx-auto px-4 py-12 md:py-12 pt-20 md:pt-12">
        {/* Header with Submit Button */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-12">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold mb-3"><span className="gradient-text">Top 100 MCP</span></h1>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
              The most starred and popular Model Context Protocol servers. These tools are trusted by thousands of developers worldwide.
            </p>
          </div>
          {/* Submit Button - Mobile Only */}
          <div className="md:hidden w-full">
            <SubmitToolDialog variant="default" />
          </div>
        </div>

        {/* Client Component with Sorting */}
        <TopToolsClient initialTools={topTools} />

      </div>
    </div>
  )
}
