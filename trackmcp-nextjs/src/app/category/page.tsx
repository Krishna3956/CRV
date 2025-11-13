import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MobileNav } from '@/components/mobile-nav'
import { SubmitToolDialog } from '@/components/SubmitToolDialog'
import { 
  Brain, 
  Code2, 
  Zap, 
  Database, 
  Globe, 
  Shield, 
  Workflow, 
  MessageSquare,
  BarChart3,
  Cpu,
  FileText,
  Settings,
  Briefcase,
  Users,
  Layers
} from 'lucide-react'

// Category to icon mapping
const categoryIcons: { [key: string]: React.ReactNode } = {
  'ai': <Brain className="w-6 h-6" />,
  'developer': <Code2 className="w-6 h-6" />,
  'automation': <Zap className="w-6 h-6" />,
  'database': <Database className="w-6 h-6" />,
  'web': <Globe className="w-6 h-6" />,
  'security': <Shield className="w-6 h-6" />,
  'workflow': <Workflow className="w-6 h-6" />,
  'communication': <MessageSquare className="w-6 h-6" />,
  'analytics': <BarChart3 className="w-6 h-6" />,
  'infrastructure': <Cpu className="w-6 h-6" />,
  'documentation': <FileText className="w-6 h-6" />,
  'configuration': <Settings className="w-6 h-6" />,
  'business': <Briefcase className="w-6 h-6" />,
  'collaboration': <Users className="w-6 h-6" />,
  'integration': <Layers className="w-6 h-6" />,
}

// Function to format category name (capitalize AI properly)
function formatCategoryName(category: string): string {
  return category.replace(/\bai\b/gi, 'AI')
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
  return <Layers className="w-6 h-6" />
}

export const revalidate = 3600 // Revalidate every hour

interface Category {
  category: string
  count: number
}


export default async function CategoryPage() {
  const supabase = createClient()

  // Fetch all categories with tool counts
  let allTools: any[] = []
  let from = 0
  const batchSize = 1000
  let hasMore = true

  // Fetch all tools in batches to get complete count
  while (hasMore) {
    const { data, error } = await supabase
      .from('mcp_tools')
      .select('category')
      .in('status', ['approved', 'pending'])
      .range(from, from + batchSize - 1)

    if (error || !data) {
      hasMore = false
    } else if (data.length === 0) {
      hasMore = false
    } else {
      allTools = [...allTools, ...data]
      from += batchSize
      if (data.length < batchSize) {
        hasMore = false
      }
    }
  }

  // Group by category and count
  const categoryMap = new Map<string, number>()
  allTools.forEach((tool: any) => {
    if (tool.category) {
      categoryMap.set(tool.category, (categoryMap.get(tool.category) || 0) + 1)
    }
  })

  // Convert to array and sort by count
  const categories = Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  const { error } = { error: null }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-4">Error Loading Categories</h1>
          <p className="text-muted-foreground">Failed to load categories. Please try again later.</p>
        </div>
      </div>
    )
  }

  const categoryList = categories || []
  
  // Identify featured categories (top 3 by count)
  const featuredCategories = categoryList.slice(0, 3)
  const otherCategories = categoryList.slice(3)
  
  // Get gradient colors for featured categories
  const gradientColors = [
    'from-blue-500/20 via-blue-400/10 to-blue-500/5',
    'from-purple-500/20 via-purple-400/10 to-purple-500/5',
    'from-pink-500/20 via-pink-400/10 to-pink-500/5',
  ]
  
  const borderColors = [
    'border-blue-500/30 hover:border-blue-500/60',
    'border-purple-500/30 hover:border-purple-500/60',
    'border-pink-500/30 hover:border-pink-500/60',
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* H1 - SEO Critical */}
      <h1 className="sr-only">MCP Categories – Browse All MCP Tool Categories</h1>

      {/* CollectionPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "MCP Categories – Browse All MCP Tool Categories",
            "description": "Explore all categories of MCP projects including AI, servers, automation, and communication. Find tools by category to match your use case.",
            "url": "https://trackmcp.com/category",
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
                "name": "Categories",
                "item": "https://trackmcp.com/category"
              }
            ]
          })
        }}
      />

      <MobileNav title="Categories" showBackButton={true} />
      <main className="container mx-auto px-4 py-8 md:py-12 pt-20 md:pt-8">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border border-primary/20 p-8 md:p-12">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -ml-48 -mb-48" />
            
            {/* Content */}
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
                Explore MCP Categories
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mb-6">
                Discover the world&apos;s largest repository of Model Context Protocol servers organized by category. Find the perfect tools for your AI development needs.
              </p>
              <Link
                href="/top-mcp"
                className="inline-flex px-6 py-2.5 rounded-lg bg-gradient-to-r from-primary/20 via-accent/15 to-primary/20 hover:from-primary/30 hover:via-accent/25 hover:to-primary/30 border border-primary/40 hover:border-primary/60 text-foreground hover:text-primary transition-all duration-300 font-medium text-sm shadow-lg hover:shadow-xl"
              >
                View Top Tools
              </Link>
            </div>
          </div>
        </div>

        {/* Featured Categories - Larger cards */}
        {featuredCategories.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Featured Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredCategories.map((cat, idx) => (
                <Link
                  key={cat.category}
                  href={`/category/${cat.category.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')}`}
                  className={`group relative p-8 rounded-xl border transition-all duration-300 overflow-hidden hover:shadow-xl ${borderColors[idx]}`}
                >
                  {/* Gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors[idx]} opacity-60 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold group-hover:text-primary transition-colors mb-1">
                          {formatCategoryName(cat.category)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {cat.count} {cat.count === 1 ? 'tool' : 'tools'}
                        </p>
                      </div>
                      <div className="text-4xl opacity-20 group-hover:opacity-40 transition-opacity flex-shrink-0">
                        {getCategoryIcon(cat.category)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-primary transition-colors mt-6">
                      <span>Explore</span>
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All Categories - Smaller grid */}
        {otherCategories.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">All Categories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {otherCategories.map((cat) => (
                <Link
                  key={cat.category}
                  href={`/category/${cat.category.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')}`}
                  className="group relative p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-card/80 transition-all duration-300 overflow-hidden hover:shadow-md"
                >
                  {/* Gradient background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-semibold group-hover:text-primary transition-colors flex-1">
                        {formatCategoryName(cat.category)}
                      </h3>
                      <div className="ml-2 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 group-hover:scale-110 transform duration-300">
                        {getCategoryIcon(cat.category)}
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      {cat.count} {cat.count === 1 ? 'tool' : 'tools'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {categoryList.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No categories found.</p>
          </div>
        )}

        {/* Bottom Sections Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Browse by Category */}
          <div className="p-6 rounded-lg bg-card/50 border border-border/50 hover:border-border transition-colors">
            <h3 className="text-lg font-semibold mb-3">Browse by Category</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Find MCP tools organized by category. Whether you need AI, automation, security, or infrastructure tools, categories help you discover exactly what you're looking for.
            </p>
            <Link href="/category" className="text-primary hover:underline font-medium text-sm">
              Explore all categories →
            </Link>
          </div>

          {/* Top Rated Tools */}
          <div className="p-6 rounded-lg bg-card/50 border border-border/50 hover:border-border transition-colors">
            <h3 className="text-lg font-semibold mb-3">Top Rated Tools</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Discover the most popular and trusted MCP tools ranked by GitHub stars and community engagement. See what developers are using most.
            </p>
            <Link href="/top-mcp" className="text-primary hover:underline font-medium text-sm">
              View top tools →
            </Link>
          </div>

          {/* Submit Your Tool */}
          <div className="p-6 rounded-lg bg-card/50 border border-border/50 hover:border-border transition-colors">
            <h3 className="text-lg font-semibold mb-3">Submit Your Tool</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Built an MCP tool? Submit it to Track MCP and get discovered by thousands of developers. Get your tool featured in the right category.
            </p>
            <Link href="/submit-mcp" className="text-primary hover:underline font-medium text-sm">
              Submit your tool →
            </Link>
          </div>
        </div>

      </main>
    </div>
  )
}
