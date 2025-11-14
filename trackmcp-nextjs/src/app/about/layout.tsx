import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Track MCP – Mission, Team & Purpose',
  description: 'Learn how Track MCP became the global hub for MCP tools and servers. Explore our mission to organize Model Context Protocol data and empower the MCP developer community.',
  keywords: ['about Track MCP', 'MCP tools directory', 'Model Context Protocol', 'Track MCP mission', 'MCP community', 'AI tools platform'],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: 'About Track MCP – Mission, Team & Purpose',
    description: 'Learn how Track MCP became the global hub for MCP tools and servers. Explore our mission to organize Model Context Protocol data and empower the MCP developer community.',
    type: 'website',
    url: 'https://trackmcp.com/about',
    siteName: 'Track MCP',
    images: [
      {
        url: 'https://www.trackmcp.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Track MCP - App Store for MCP Servers, Clients, and Tools',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Track MCP – Mission, Team & Purpose',
    description: 'Discover Track MCP\'s mission to organize the MCP ecosystem and connect developers with AI tools.',
    creator: '@trackmcp',
  },
  alternates: {
    canonical: 'https://trackmcp.com/about',
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
