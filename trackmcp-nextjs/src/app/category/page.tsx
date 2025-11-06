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

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Browse All MCP Categories | TrackMCP',
    description: 'Explore the largest repository of MCP servers by category, including AI, Developer, Automation, and more.',
    openGraph: {
      title: 'Browse All MCP Categories | TrackMCP',
      description: 'Explore the largest repository of MCP servers by category, including AI, Developer, Automation, and more.',
      url: 'https://www.trackmcp.com/category',
      type: 'website',
    },
    alternates: {
      canonical: 'https://www.trackmcp.com/category',
    },
  }
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

  return (
    <div className="min-h-screen bg-background">
      <MobileNav title="Categories" showBackButton={true} />
      <main className="container mx-auto px-4 py-8 md:py-8 pt-20 md:pt-8">
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
              className="group relative p-5 rounded-lg border border-border bg-card hover:border-primary/50 transition-all duration-300 overflow-hidden"
            >
              {/* Gradient background on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              
              {/* Shadow effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-lg" />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-base font-semibold group-hover:text-primary transition-colors flex-1">
                    {formatCategoryName(cat.category)}
                  </h2>
                  <div className="ml-3 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 group-hover:scale-110 transform duration-300">
                    {getCategoryIcon(cat.category)}
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {cat.count} {cat.count === 1 ? 'tool' : 'tools'} available
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground group-hover:text-primary transition-colors">
                  <span>Browse category</span>
                  <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
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
