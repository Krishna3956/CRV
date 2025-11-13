import Link from 'next/link'
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
      {/* H1 - SEO Critical */}
      <h1 className="sr-only">Top 100 MCP Tools by Stars – Track MCP Rankings</h1>

      {/* CollectionPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Top 100 MCP Tools by Stars",
            "description": "Explore the most popular MCP tools ranked by GitHub stars. Find trending developers, frameworks, and protocols leading the MCP ecosystem.",
            "url": "https://trackmcp.com/top-mcp",
            "isPartOf": {
              "@type": "WebSite",
              "name": "Track MCP",
              "url": "https://trackmcp.com"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Track MCP",
              "url": "https://trackmcp.com"
            }
          })
        }}
      />

      {/* BreadcrumbList Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://trackmcp.com"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Top MCP Tools",
                "item": "https://trackmcp.com/top-mcp"
              }
            ]
          })
        }}
      />

      <MobileNav title="Top 100 MCP" showBackButton={true} />
      <div className="container mx-auto px-4 py-12 md:py-12 pt-20 md:pt-12">
        {/* Header with Submit Button */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-12">
          <div className="flex-1">
            <h2 className="text-4xl md:text-5xl font-bold mb-3"><span className="gradient-text">Top 100 MCP Tools by Stars</span></h2>
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

        {/* Bottom Sections Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Submit Your Tool */}
          <div className="p-6 rounded-lg bg-card/50 border border-border/50 hover:border-border transition-colors">
            <h3 className="text-lg font-semibold mb-3">Submit Your Tool</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Have an MCP tool that should be on this list? Submit your MCP tool to get it discovered by thousands of developers.
            </p>
            <Link href="/submit-mcp" className="text-primary hover:underline font-medium text-sm">
              Submit your tool →
            </Link>
          </div>

          {/* Why These Tools Stand Out */}
          <div className="p-6 rounded-lg bg-card/50 border border-border/50 hover:border-border transition-colors">
            <h3 className="text-lg font-semibold mb-3">Why These Tools Stand Out</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              The most popular and trusted MCP implementations. Ranked by GitHub stars, community engagement, and active maintenance.
            </p>
            <Link href="/category" className="text-primary hover:underline font-medium text-sm">
              Browse by category →
            </Link>
          </div>

          {/* How We Rank */}
          <div className="p-6 rounded-lg bg-card/50 border border-border/50 hover:border-border transition-colors">
            <h3 className="text-lg font-semibold mb-3">How We Rank</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Rankings based on GitHub stars, recent activity, community engagement, and maintenance status.
            </p>
            <Link href="/new" className="text-primary hover:underline font-medium text-sm">
              See recently added →
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
