import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Latest MCPs – Newest Tools on Track MCP',
  description: 'Explore the newest tools and updates in the MCP ecosystem. Discover fresh repositories, feature releases, and active development updates.',
  keywords: ['new MCP tools', 'latest MCP updates', 'MCP tools new releases', 'recently added MCP', 'newest MCP servers', 'MCP tools fresh additions', 'trending MCP updates'],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: 'Latest MCPs – Newest Tools on Track MCP',
    description: 'Explore the newest tools and updates in the MCP ecosystem. Discover fresh repositories, feature releases, and active development updates.',
    type: 'website',
    url: 'https://trackmcp.com/new',
    siteName: 'Track MCP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Latest MCPs – Newest Tools on Track MCP',
    description: 'Discover the newest MCP tools and latest updates in the ecosystem.',
    creator: '@trackmcp',
  },
  alternates: {
    canonical: 'https://trackmcp.com/new',
  },
}

export default function NewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
