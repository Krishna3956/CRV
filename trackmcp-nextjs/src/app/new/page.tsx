import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { MobileNav } from '@/components/mobile-nav'
import { NewToolsClient } from '@/components/new-tools-client'
import { Sparkles, TrendingUp, Brain, Code2, Zap as ZapIcon, Database, Globe, Shield, Workflow, MessageSquare, BarChart3, Cpu, FileText, Settings, Briefcase, Users, Layers } from 'lucide-react'

// Category to icon mapping
const categoryIcons: { [key: string]: React.ReactNode } = {
  'ai': <Brain className="h-5 w-5" />,
  'developer': <Code2 className="h-5 w-5" />,
  'automation': <ZapIcon className="h-5 w-5" />,
  'database': <Database className="h-5 w-5" />,
  'web': <Globe className="h-5 w-5" />,
  'security': <Shield className="h-5 w-5" />,
  'workflow': <Workflow className="h-5 w-5" />,
  'communication': <MessageSquare className="h-5 w-5" />,
  'analytics': <BarChart3 className="h-5 w-5" />,
  'infrastructure': <Cpu className="h-5 w-5" />,
  'documentation': <FileText className="h-5 w-5" />,
  'configuration': <Settings className="h-5 w-5" />,
  'business': <Briefcase className="h-5 w-5" />,
  'collaboration': <Users className="h-5 w-5" />,
  'integration': <Layers className="h-5 w-5" />,
}

// Function to get icon for category
function getCategoryIcon(category: string): React.ReactNode {
  const categoryLower = category.toLowerCase()
  
  // Try exact match first
  if (categoryIcons[categoryLower]) {
    return categoryIcons[categoryLower]
  }
  
  // Try partial match
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (categoryLower.includes(key) || key.includes(categoryLower.split(' ')[0])) {
      return icon
    }
  }
  
  // Default icon
  return <Layers className="h-5 w-5" />
}

export const revalidate = 3600 // Revalidate every hour

interface NewTool {
  id: string
  repo_name: string
  description: string
  category: string
  last_updated: string
  created_at: string
  stars?: number
  github_url?: string
}

// Helper function to extract owner from github_url and get avatar
function getGitHubOwnerAvatar(repoName: string): string {
  try {
    // Extract owner from repo_name (format: owner/repo)
    const owner = repoName.split('/')[0]
    return `https://github.com/${owner}.png?size=40`
  } catch {
    return ''
  }
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

  // Fetch recently updated tools - fetch more to support pagination
  const { data: tools, error } = await supabase
    .from('mcp_tools')
    .select('id, repo_name, description, category, last_updated, created_at, stars, github_url')
    .in('status', ['approved', 'pending'])
    .order('last_updated', { ascending: false })
    .limit(300)

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
      <main className="container mx-auto px-4 py-8 md:py-12 pt-20 md:pt-8">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border border-primary/20 p-8 md:p-12">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -ml-48 -mb-48" />
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
                <span className="text-sm font-semibold text-primary">Latest Additions</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
                New & Recently Updated
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mb-6">
                Discover the newest and most recently updated Model Context Protocol servers. Stay up-to-date with the latest MCP tools, improvements, and innovations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span>{newTools.length} tools available</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tools Grid with Reveal More */}
        {newTools.length > 0 ? (
          <NewToolsClient
            tools={newTools}
          />
        ) : (
          /* Empty state */
          <div className="text-center py-16">
            <div className="mb-4">
              <Sparkles className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No new tools yet</h3>
            <p className="text-muted-foreground mb-6">
              Check back soon for the latest MCP tools and updates.
            </p>
          </div>
        )}

      </main>
    </div>
  )
}
