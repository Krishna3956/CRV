import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MCP Categories – Browse All MCP Tool Categories',
  description: 'Explore all categories of MCP projects including AI, servers, automation, and communication. Find tools by category to match your use case.',
  keywords: ['MCP categories', 'MCP tools by category', 'browse MCP tools', 'MCP tool categories', 'MCP AI tools', 'MCP automation tools', 'MCP infrastructure'],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: 'MCP Categories – Browse All MCP Tool Categories',
    description: 'Explore all categories of MCP projects including AI, servers, automation, and communication. Find tools by category to match your use case.',
    type: 'website',
    url: 'https://trackmcp.com/category',
    siteName: 'Track MCP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MCP Categories – Browse All MCP Tool Categories',
    description: 'Discover MCP tools organized by category. Find the perfect tool for your use case.',
    creator: '@trackmcp',
  },
  alternates: {
    canonical: 'https://trackmcp.com/category',
  },
}

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
