import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CategoryToolsClient } from '@/components/category-tools-client'
import { MobileNav } from '@/components/mobile-nav'
import { SubmitToolDialog } from '@/components/SubmitToolDialog'

// ISR is configured in layout.tsx (revalidate = 3600)

interface Tool {
  id: string
  repo_name: string
  description: string
  stars: number
  last_updated: string
  forks?: number
  watchers?: number
}

interface Props {
  params: {
    slug: string
  }
  searchParams: {
    page?: string
  }
}

// Function to format category name (capitalize AI properly)
function formatCategoryName(category: string): string {
  return category.replace(/\bai\b/gi, 'AI')
}

// Since we're using dynamic rendering, we don't need static params
// All category pages will be rendered on-demand
export async function generateStaticParams() {
  console.log('[generateStaticParams] Using dynamic rendering - returning empty array')
  return []
}


export default async function CategoryPage({ params, searchParams }: Props) {
  try {
    console.log(`[CategoryPage] Loading category page for slug: ${params.slug}`)
    
    // Create Supabase client - use try-catch to handle any initialization errors
    let supabase
    try {
      supabase = createClient()
    } catch (error) {
      console.error('[CategoryPage] Failed to create Supabase client:', error)
      notFound()
    }
    
    const page = parseInt(searchParams.page || '1', 10)
    const pageSize = 50
    const offset = (page - 1) * pageSize

    // Fetch all categories first to find the exact match
    console.log('[CategoryPage] Fetching all categories from database...')
    const { data: allCategoriesData, error: categoriesError } = await supabase
      .from('mcp_tools')
      .select('category')
      .in('status', ['approved', 'pending'])
      .limit(5000) as any

    if (categoriesError) {
      console.error('[CategoryPage] Error fetching categories:', categoriesError)
      notFound()
    }

    if (!allCategoriesData || allCategoriesData.length === 0) {
      console.error('[CategoryPage] No categories found in database')
      notFound()
    }

    console.log(`[CategoryPage] Found ${allCategoriesData.length} category entries`)

    // Get unique categories
    const uniqueCategories = [...new Set(allCategoriesData.map((t: any) => t.category))] as string[]
    console.log(`[CategoryPage] Found ${uniqueCategories.length} unique categories`)

    // Find matching category by comparing slugs
    const slug = params.slug.toLowerCase()
    console.log(`[CategoryPage] Looking for slug: ${slug}`)
    
    const actualCategoryName = uniqueCategories.find((cat) => {
      const catSlug = cat.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')
      return catSlug === slug
    })

    if (!actualCategoryName) {
      console.error(`[CategoryPage] Category not found for slug: ${slug}`)
      console.error(`[CategoryPage] Available categories: ${uniqueCategories.slice(0, 10).join(', ')}...`)
      notFound()
    }

    console.log(`[CategoryPage] Matched category: ${actualCategoryName}`)

    // Format the category name for display
    let categoryName = actualCategoryName
      .replace(/&/g, '& ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
    categoryName = formatCategoryName(categoryName)

    // Fetch tools in category with pagination
    console.log(`[CategoryPage] Fetching tools for category: ${actualCategoryName}`)
    const { data: tools, error: toolsError } = await supabase
      .from('mcp_tools')
      .select('id, repo_name, description, stars, last_updated')
      .eq('category', actualCategoryName)
      .in('status', ['approved', 'pending'])
      .order('last_updated', { ascending: false })
      .range(offset, offset + pageSize - 1)

    // Fetch total count
    console.log(`[CategoryPage] Fetching total count for category: ${actualCategoryName}`)
    const { count: totalCount, error: countError } = await supabase
      .from('mcp_tools')
      .select('*', { count: 'exact', head: true })
      .eq('category', actualCategoryName)
      .in('status', ['approved', 'pending'])

    if (toolsError) {
      console.error('[CategoryPage] Tools error:', toolsError)
      notFound()
    }

    if (countError) {
      console.error('[CategoryPage] Count error:', countError)
      notFound()
    }

    if (!tools) {
      console.error('[CategoryPage] No tools data returned')
      notFound()
    }

    console.log(`[CategoryPage] Found ${tools.length} tools, total count: ${totalCount}`)

    if (tools.length === 0 && page === 1) {
      console.warn(`[CategoryPage] No tools found for category: ${actualCategoryName}`)
      notFound()
    }

    const totalPages = Math.ceil((totalCount || 0) / pageSize)
    const toolList = (tools || []) as Tool[]

    // Fetch all categories for related categories section
    console.log('[CategoryPage] Fetching all categories for related section')
    const { data: relatedCategoriesData } = await supabase
      .from('mcp_tools')
      .select('category')
      .in('status', ['approved', 'pending'])
      .limit(1000)

    const allCategories = new Map<string, number>()
    if (relatedCategoriesData) {
      relatedCategoriesData.forEach((tool: any) => {
        if (tool.category) {
          allCategories.set(tool.category, (allCategories.get(tool.category) || 0) + 1)
        }
      })
    }

    // Get 5 random other categories (excluding current)
    const otherCategories = Array.from(allCategories.entries())
      .filter(([cat]) => cat !== actualCategoryName)
      .sort(() => Math.random() - 0.5)
      .slice(0, 5)
      .map(([cat, count]) => ({
        name: cat,
        count,
        slug: cat.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '-')
      }))

  return (
    <div className="min-h-screen bg-background">
      {/* H1 - SEO Critical */}
      <h1 className="sr-only">{categoryName} MCP Tools | Track MCP</h1>

      {/* CollectionPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": `${categoryName} MCP Tools`,
            "description": `Browse all ${categoryName} MCP servers with descriptions, GitHub stars, and metadata.`,
            "url": `https://trackmcp.com/category/${params.slug}`,
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
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": categoryName,
                "item": `https://trackmcp.com/category/${params.slug}`
              }
            ]
          })
        }}
      />

      <MobileNav title={categoryName} showBackButton={true} />
      <div className="container mx-auto px-4 py-12 md:py-12 pt-20 md:pt-12">
        {/* Header with Submit Button */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-12">
          <div className="flex-1">
            <h2 className="text-4xl md:text-5xl font-bold mb-3"><span className="gradient-text">{categoryName}</span></h2>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
              {totalCount} {totalCount === 1 ? 'tool' : 'tools'} in this category
            </p>
          </div>
          {/* Submit Button - Mobile Only */}
          <div className="md:hidden w-full">
            <SubmitToolDialog variant="default" />
          </div>
        </div>

        {/* Client Component with Sorting */}
        <CategoryToolsClient initialTools={toolList} />

        {/* Related Categories Section */}
        {otherCategories.length > 0 && (
          <div className="mt-16 pt-8 border-t border-border/50">
            <h3 className="text-2xl font-bold mb-6">Related Categories</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {otherCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className="group relative p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-card/80 transition-all duration-300 overflow-hidden hover:shadow-md"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <div className="relative z-10">
                    <h4 className="text-sm font-semibold group-hover:text-primary transition-colors mb-1">
                      {cat.name.replace(/&/g, '& ')}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {cat.count} {cat.count === 1 ? 'tool' : 'tools'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Sections Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Browse All Categories */}
          <div className="p-6 rounded-lg bg-card/50 border border-border/50 hover:border-border transition-colors">
            <h3 className="text-lg font-semibold mb-3">Browse All Categories</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Explore all MCP tool categories. Find tools organized by function and use case.
            </p>
            <Link href="/category" className="text-primary hover:underline font-medium text-sm">
              View all categories →
            </Link>
          </div>

          {/* Top Rated Tools */}
          <div className="p-6 rounded-lg bg-card/50 border border-border/50 hover:border-border transition-colors">
            <h3 className="text-lg font-semibold mb-3">Top Rated Tools</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Discover the most popular and trusted MCP tools ranked by GitHub stars and community engagement.
            </p>
            <Link href="/top-mcp" className="text-primary hover:underline font-medium text-sm">
              View top tools →
            </Link>
          </div>

          {/* Submit Your Tool */}
          <div className="p-6 rounded-lg bg-card/50 border border-border/50 hover:border-border transition-colors">
            <h3 className="text-lg font-semibold mb-3">Submit Your Tool</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Have an MCP tool? Submit it to Track MCP and get discovered by thousands of developers.
            </p>
            <Link href="/submit-mcp" className="text-primary hover:underline font-medium text-sm">
              Submit your tool →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
  } catch (error) {
    console.error('Error loading category page:', error)
    notFound()
  }
}
