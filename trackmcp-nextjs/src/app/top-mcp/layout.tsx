import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Top 100 MCP Tools by Stars – Track MCP Rankings',
  description: 'Explore the most popular MCP tools ranked by GitHub stars. Find trending developers, frameworks, and protocols leading the MCP ecosystem.',
  keywords: ['top MCP tools', 'best MCP servers', 'MCP tools ranked', 'popular MCP tools', 'MCP tools by stars', 'trending MCP tools', 'highest rated MCP'],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: 'Top 100 MCP Tools by Stars – Track MCP Rankings',
    description: 'Explore the most popular MCP tools ranked by GitHub stars. Find trending developers, frameworks, and protocols leading the MCP ecosystem.',
    type: 'website',
    url: 'https://trackmcp.com/top-mcp',
    siteName: 'Track MCP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Top 100 MCP Tools by Stars – Track MCP Rankings',
    description: 'Discover the most popular MCP tools ranked by GitHub stars.',
    creator: '@trackmcp',
  },
  alternates: {
    canonical: 'https://trackmcp.com/top-mcp',
  },
}

export default function TopMcpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
