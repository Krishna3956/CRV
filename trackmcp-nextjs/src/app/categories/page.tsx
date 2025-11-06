import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
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

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Browse All MCP Categories | TrackMCP',
    description: 'Explore the largest repository of MCP servers by category, including AI, Developer, Automation, and more.',
    openGraph: {
      title: 'Browse All MCP Categories | TrackMCP',
      description: 'Explore the largest repository of MCP servers by category, including AI, Developer, Automation, and more.',
      url: 'https://www.trackmcp.com/categories',
      type: 'website',
    },
    alternates: {
      canonical: 'https://www.trackmcp.com/categories',
    },
  }
}

export default async function CategoriesPage() {
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

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Browse All Categories</h1>
          <p className="text-base text-muted-foreground max-w-2xl">
            Explore Model Context Protocol servers organized by category. Find tools for your specific use case.
          </p>
        </div>

        {/* Categories Grid - 3 columns matching ToolCard layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryList.map((cat) => (
            <Link
              key={cat.category}
              href={`/category/${cat.category.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')}`}
              className="group p-5 rounded-lg border border-border bg-card hover:border-primary hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-base font-semibold group-hover:text-primary transition-colors flex-1">
                  {cat.category}
                </h2>
                <div className="ml-3 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0">
                  {getCategoryIcon(cat.category)}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                Explore {cat.category.toLowerCase()} MCP tools and servers
              </p>
              
              <div className="flex items-center text-xs text-muted-foreground group-hover:text-primary transition-colors">
                <span>Browse category</span>
                <svg className="w-3 h-3 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty state */}
        {categoryList.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No categories found.</p>
          </div>
        )}
      </main>
    </div>
  )
}
