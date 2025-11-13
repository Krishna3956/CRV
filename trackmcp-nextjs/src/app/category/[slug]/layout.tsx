import { Metadata } from 'next'

// Disable static generation for category pages to prevent build errors
export const dynamic = 'force-dynamic'

interface Props {
  params: {
    slug: string
  }
}

function formatCategoryName(category: string): string {
  return category.replace(/\bai\b/gi, 'AI')
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
      title: `${categoryName} MCP Tools | Track MCP`,
      description: `Browse all ${categoryName} MCP servers with descriptions, GitHub stars, and metadata. Find the best Model Context Protocol tools for your needs.`,
      keywords: [
        `${categoryName} MCP tools`,
        `${categoryName} MCP servers`,
        `best ${categoryName} MCP`,
        `${categoryName} MCP directory`,
        `MCP ${categoryName}`,
      ],
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
        },
      },
      openGraph: {
        title: `${categoryName} MCP Tools | Track MCP`,
        description: `Browse all ${categoryName} MCP servers with descriptions, GitHub stars, and metadata. Find the best Model Context Protocol tools for your needs.`,
        type: 'website',
        url: `https://trackmcp.com/category/${params.slug}`,
        siteName: 'Track MCP',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${categoryName} MCP Tools | Track MCP`,
        description: `Discover ${categoryName} MCP tools ranked by GitHub stars and community engagement.`,
        creator: '@trackmcp',
      },
      alternates: {
        canonical: `https://trackmcp.com/category/${params.slug}`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'MCP Tools | Track MCP',
      description: 'Browse Model Context Protocol servers',
    }
  }
}

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
