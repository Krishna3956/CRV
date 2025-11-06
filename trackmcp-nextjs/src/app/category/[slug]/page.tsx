import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CategoryToolsClient } from '@/components/category-tools-client'
import { MobileNav } from '@/components/mobile-nav'
import { SubmitToolDialog } from '@/components/SubmitToolDialog'

export const revalidate = 3600 // Revalidate every hour

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

// Generate static params for all categories
export async function generateStaticParams() {
  try {
    const supabase = createClient()

    // Fetch all categories with limit
    const { data: tools, error } = await supabase
      .from('mcp_tools')
      .select('category')
      .in('status', ['approved', 'pending'])
      .limit(10000)

    if (error) {
      console.error('Error fetching categories:', error)
      return []
    }

    if (!tools || tools.length === 0) {
      console.warn('No tools found for static params generation')
      return []
    }

    // Get unique categories
    const uniqueCategories = [...new Set(tools.map((t: any) => t.category))] as string[]

    // Convert to slugs
    const categoryParams = uniqueCategories.map((category) => ({
      slug: category.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'),
    }))

    console.log(`Generated static params for ${categoryParams.length} categories`)
    return categoryParams
  } catch (error) {
    console.error('Error generating static params:', error)
    // Return empty array if there's an error - pages will be generated on-demand
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    // Convert slug back to category name (replace hyphens with spaces, "and" with "&")
    let categoryName = params.slug
      .replace(/and/g, '&')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
    
    // Format AI properly
    categoryName = formatCategoryName(categoryName)

    return {
      title: `${categoryName} MCP Tools | TrackMCP`,
      description: `Browse all ${categoryName} MCP servers with descriptions, GitHub stars, and metadata. Find the best Model Context Protocol tools for your needs.`,
      openGraph: {
        title: `${categoryName} MCP Tools | TrackMCP`,
        description: `Browse all ${categoryName} MCP servers with descriptions, GitHub stars, and metadata.`,
        url: `https://www.trackmcp.com/category/${params.slug}`,
        type: 'website',
      },
      alternates: {
        canonical: `https://www.trackmcp.com/category/${params.slug}`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'MCP Tools | TrackMCP',
      description: 'Browse Model Context Protocol servers',
    }
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  try {
    const supabase = createClient()
    
    const page = parseInt(searchParams.page || '1', 10)
    const pageSize = 50
    const offset = (page - 1) * pageSize

    // Fetch all categories first to find the exact match
    const { data: allCategoriesData } = await supabase
      .from('mcp_tools')
      .select('category')
      .in('status', ['approved', 'pending'])
      .limit(5000) as any

    if (!allCategoriesData || allCategoriesData.length === 0) {
      notFound()
    }

    // Get unique categories
    const uniqueCategories = [...new Set(allCategoriesData.map((t: any) => t.category))] as string[]

    // Find matching category by comparing slugs
    const slug = params.slug.toLowerCase()
    const actualCategoryName = uniqueCategories.find((cat) => {
      const catSlug = cat.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')
      return catSlug === slug
    })

    if (!actualCategoryName) {
      console.error(`Category not found for slug: ${slug}`)
      notFound()
    }

    // Format the category name for display
    let categoryName = actualCategoryName
      .replace(/&/g, '& ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
    categoryName = formatCategoryName(categoryName)

    // Fetch tools in category with pagination
    const { data: tools, error: toolsError } = await supabase
      .from('mcp_tools')
      .select('id, repo_name, description, stars, last_updated')
      .eq('category', actualCategoryName)
      .in('status', ['approved', 'pending'])
      .order('last_updated', { ascending: false })
      .range(offset, offset + pageSize - 1)

    // Fetch total count
    const { count: totalCount } = await supabase
      .from('mcp_tools')
      .select('*', { count: 'exact', head: true })
      .eq('category', actualCategoryName)
      .in('status', ['approved', 'pending'])

    if (toolsError || !tools) {
      console.error('Tools error:', toolsError)
      notFound()
    }

    if (tools.length === 0 && page === 1) {
      notFound()
    }

    const totalPages = Math.ceil((totalCount || 0) / pageSize)
    const toolList = (tools || []) as Tool[]

  return (
    <div className="min-h-screen bg-background">
      <MobileNav title={categoryName} showBackButton={true} />
      <div className="container mx-auto px-4 py-12 md:py-12 pt-20 md:pt-12">
        {/* Header with Submit Button */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-12">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold mb-3"><span className="gradient-text">{categoryName}</span></h1>
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
      </div>
    </div>
  )
  } catch (error) {
    console.error('Error loading category page:', error)
    notFound()
  }
}
