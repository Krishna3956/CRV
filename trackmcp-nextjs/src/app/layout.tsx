import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './globals.css'
import { LayoutWrapper } from '@/components/layout-wrapper'
import { CookieConsent } from '@/components/CookieConsent'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'App Store for MCP Servers, Clients, and Tools | World\'s Largest MCP Marketplace',
    template: '%s'
  },
  description: 'Discover the world\'s largest MCP Marketplace for Model Context Protocol servers, clients, and tools. Effortlessly search, find, and install thousands of MCP integrations to power your AI agents and workflows—fast, seamless, and all in one place.',
  keywords: ['MCP', 'Model Context Protocol', 'MCP Marketplace', 'MCP servers', 'MCP clients', 'MCP tools', 'AI tools', 'LLM tools', 'developer tools', 'AI development', 'Claude MCP', 'OpenAI tools', 'AI integration', 'MCP directory'],
  authors: [{ name: 'Krishna Goyal' }],
  creator: 'Krishna Goyal',
  publisher: 'Track MCP',
  applicationName: 'Track MCP',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.trackmcp.com',
    siteName: 'Track MCP',
    title: 'App Store for MCP Servers, Clients, and Tools | World\'s Largest MCP Marketplace',
    description: 'Discover the world\'s largest MCP Marketplace for Model Context Protocol servers, clients, and tools. Effortlessly search, find, and install thousands of MCP integrations to power your AI agents and workflows.',
    images: [
      {
        url: 'https://www.trackmcp.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'App Store for MCP Servers, Clients, and Tools | World\'s Largest MCP Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@trackmcp',
    creator: '@trackmcp',
    title: 'App Store for MCP Servers, Clients, and Tools | World\'s Largest MCP Marketplace',
    description: 'Discover the world\'s largest MCP Marketplace. Effortlessly search, find, and install thousands of MCP integrations.',
    images: ['https://www.trackmcp.com/og-image.png'],
  },
  other: {
    // OpenAI / ChatGPT meta tags
    'openai:title': 'App Store for MCP Servers, Clients, and Tools | World\'s Largest MCP Marketplace',
    'openai:description': 'Discover the world\'s largest MCP Marketplace for Model Context Protocol servers, clients, and tools. Effortlessly search, find, and install thousands of MCP integrations to power your AI agents and workflows—fast, seamless, and all in one place.',
    'openai:image': 'https://www.trackmcp.com/og-image.png',
    'openai:url': 'https://www.trackmcp.com/',
    // Perplexity AI meta tags
    'perplexity:title': 'App Store for MCP Servers, Clients, and Tools | World\'s Largest MCP Marketplace',
    'perplexity:description': 'Discover the world\'s largest MCP Marketplace. Effortlessly search, find, and install thousands of MCP integrations to power your AI agents and workflows.',
    // AI-friendly content hints
    'ai:content_type': 'directory',
    'ai:primary_topic': 'Model Context Protocol',
    // Google site name (fixes LinkedIn issue)
    'application-name': 'Track MCP',
    'apple-mobile-web-app-title': 'Track MCP',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // No alternates here - let each page set its own canonical
  verification: {
    google: 'your-google-verification-code', // Add your Google Search Console verification
    // yandex: 'your-yandex-verification-code', // Optional: Yandex verification
    // bing: 'your-bing-verification-code', // Optional: Bing Webmaster verification
  },
  category: 'technology',
  classification: 'Developer Tools',
  referrer: 'strict-origin-when-cross-origin',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon and App Icons */}
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />
        <link rel="dns-prefetch" href="https://api.github.com" />
        
        
        {/* Microsoft Clarity - Deferred for performance */}
        <script
          defer
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('load', function() {
                (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "tsoodirahp");
              });
            `,
          }}
        />
        
        {/* JSON-LD Structured Data - WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              url: 'https://www.trackmcp.com/',
              name: 'Track MCP',
              alternateName: 'TrackMCP',
              description: 'World\'s Largest Model Context Protocol Repository',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://www.trackmcp.com/?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        
        {/* JSON-LD Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              '@id': 'https://www.trackmcp.com/#organization',
              'name': 'Track MCP',
              'alternateName': 'TrackMCP',
              'url': 'https://www.trackmcp.com',
              'logo': {
                '@type': 'ImageObject',
                'url': 'https://www.trackmcp.com/og-image.png',
                'width': 1200,
                'height': 630
              },
              'image': {
                '@type': 'ImageObject',
                'url': 'https://www.trackmcp.com/og-image.png',
                'width': 1200,
                'height': 630
              },
              'description': 'The world\'s largest MCP tools directory connecting developers with AI tools and integrations. Discover 10,000+ Model Context Protocol servers.',
              'foundingDate': '2025-04-09',
              'foundingLocation': {
                '@type': 'Place',
                'name': 'India'
              },
              'founder': {
                '@type': 'Person',
                '@id': 'https://www.trackmcp.com/#founder',
                'name': 'Krishna',
                'jobTitle': 'Product Manager',
                'url': 'https://www.linkedin.com/in/krishnaa-goyal/'
              },
              'contactPoint': {
                '@type': 'ContactPoint',
                'contactType': 'Customer Support',
                'email': 'support@trackmcp.com',
                'url': 'https://www.trackmcp.com/submit-mcp'
              },
              'address': {
                '@type': 'PostalAddress',
                'addressCountry': 'IN'
              },
              'sameAs': [
                'https://x.com/trackmcp',
                'https://github.com/trackmcp',
                'https://www.linkedin.com/company/trackmcp'
              ],
              'numberOfEmployees': {
                '@type': 'QuantitativeValue',
                'value': '2'
              },
              'knowsAbout': [
                'Model Context Protocol',
                'MCP Tools',
                'AI Integration',
                'Developer Tools',
                'Open Source'
              ]
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        {/* Google Analytics 4 - Official Setup */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-PSZBQBCRQX"
          strategy="beforeInteractive"
        />
        <Script id="ga-config" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-PSZBQBCRQX');
            
            // Send test events to activate GA4 data collection
            gtag('event', 'page_view', {
              page_title: document.title,
              page_location: window.location.href,
            });
            
            gtag('event', 'test_activation', {
              event_category: 'system',
              event_label: 'GA4 Activation',
            });
          `}
        </Script>

        <LayoutWrapper>
          {children}
        </LayoutWrapper>
        
        {/* Cookie Consent Banner */}
        <CookieConsent />
        
        {/* Vercel Analytics for page views and visitor tracking */}
        <Analytics />
        
        {/* Vercel Speed Insights for performance metrics */}
        <SpeedInsights />
      </body>
    </html>
  )
}
