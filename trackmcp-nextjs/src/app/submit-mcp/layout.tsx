import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Submit MCP Servers, Tools & Clients',
  description: 'Easily submit your MCP server, client, or plugin to Track MCP. AI\'s largest MCP App Store. Get discovered by 50,000+ developers. Free submissions. Boost visibility with Featured options.',
  keywords: ['submit MCP', 'MCP server submission', 'MCP tool directory', 'MCP client', 'submit MCP plugin', 'MCP server listing', 'submit MCP tool'],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: 'Submit MCP Servers, Tools & Clients',
    description: 'Easily submit your MCP server, client, or plugin to Track MCP. AI\'s largest MCP App Store. Get discovered by 50,000+ developers. Free submissions. Boost visibility with Featured options.',
    type: 'website',
    url: 'https://trackmcp.com/submit-mcp',
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
    title: 'Submit MCP Servers, Tools & Clients',
    description: 'Get discovered by 50,000+ developers. Free MCP submission to Track MCP.',
    creator: '@trackmcp',
  },
  alternates: {
    canonical: 'https://trackmcp.com/submit-mcp',
  },
}

export default function SubmitMcpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
