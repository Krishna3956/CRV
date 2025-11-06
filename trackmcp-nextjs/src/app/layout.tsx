import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Track MCP | World\'s Largest Model Context Protocol Directory',
    template: '%s'
  },
  description: 'Explore 10,000+ Model Context Protocol tools, servers, and connectors. The world\'s largest MCP directory for AI development and LLM integration.',
  keywords: ['MCP', 'Model Context Protocol', 'AI tools', 'LLM tools', 'GitHub MCP', 'developer tools', 'MCP servers', 'MCP connectors', 'AI development', 'Claude MCP', 'OpenAI tools', 'AI integration', 'MCP directory', 'MCP repository'],
  authors: [{ name: 'Krishna Goyal' }],
  creator: 'Krishna Goyal',
  publisher: 'Track MCP',
  applicationName: 'Track MCP',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.trackmcp.com',
    siteName: 'Track MCP',
    title: 'Track MCP - Discover 10,000+ Model Context Protocol Tools & Servers',
    description: 'Explore the world\'s largest directory of Model Context Protocol (MCP) tools, servers, and connectors.',
    images: [
      {
        url: 'https://www.trackmcp.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Track MCP - Model Context Protocol Directory',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@trackmcp',
    creator: '@trackmcp',
    title: 'Track MCP - Discover 10,000+ Model Context Protocol Tools & Servers',
    description: 'Explore the world\'s largest directory of MCP tools for AI development',
    images: ['https://www.trackmcp.com/og-image.png'],
  },
  other: {
    // OpenAI / ChatGPT meta tags
    'openai:title': 'Track MCP - World\'s Largest Model Context Protocol Directory',
    'openai:description': 'Comprehensive directory of 10,000+ Model Context Protocol (MCP) tools, servers, and connectors for AI development. Find GitHub repositories, integration guides, and developer resources.',
    'openai:image': 'https://www.trackmcp.com/og-image.png',
    'openai:url': 'https://www.trackmcp.com/',
    // Perplexity AI meta tags
    'perplexity:title': 'Track MCP - Model Context Protocol Tools Directory',
    'perplexity:description': 'Search and discover 10,000+ MCP tools, servers, and connectors. Find GitHub repositories, documentation, and integration guides for AI development.',
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
              url: 'https://www.trackmcp.com',
              name: 'Track MCP',
              alternateName: 'TrackMCP',
              logo: 'https://www.trackmcp.com/og-image.png',
              description: 'World\'s Largest Model Context Protocol Repository',
              sameAs: [
                'https://x.com/trackmcp',
                'https://github.com/trackmcp',
              ],
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        {/* Google Analytics - Lazy loaded for better performance */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-22HQQFNJ1F"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-22HQQFNJ1F', {
              page_path: window.location.pathname,
            });
          `}
        </Script>

        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
