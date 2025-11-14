import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cookie Policy – Track MCP',
  description: 'Learn how Track MCP uses cookies to enhance browsing experience and analyze site performance. Review cookie types and preferences.',
  openGraph: {
    title: 'Cookie Policy – Track MCP',
    description: 'Learn how Track MCP uses cookies to enhance browsing experience and analyze site performance. Review cookie types and preferences.',
    url: 'https://www.trackmcp.com/cookies',
    type: 'website',
    images: [
      {
        url: 'https://www.trackmcp.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Track MCP - App Store for MCP Servers, Clients, and Tools',
      },
    ],
  },
}

export default function CookiePage() {
  // Create WebPage schema for cookies page
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Cookie Policy – Track MCP',
    description: 'Learn how Track MCP uses cookies to enhance browsing experience and analyze site performance. Review cookie types and preferences.',
    url: 'https://www.trackmcp.com/cookies',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Track MCP',
      url: 'https://www.trackmcp.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Track MCP',
      url: 'https://www.trackmcp.com',
    },
    datePublished: '2024-11-01',
    dateModified: new Date().toISOString(),
  }

  // Create BreadcrumbList schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.trackmcp.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Cookie Policy',
        item: 'https://www.trackmcp.com/cookies',
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD Schema for WebPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageSchema),
        }}
      />
      
      {/* JSON-LD Schema for BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      {/* Header */}
      <section className="relative overflow-hidden pt-8 md:pt-12 pb-8 md:pb-12 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Cookie Policy</h1>
            <p className="text-lg text-muted-foreground">Effective Date: November 2024</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8 text-base text-foreground/80 leading-relaxed">
              {/* Introduction */}
              <div>
                <p>
                  At TrackMCP.com (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), we use cookies and similar tracking technologies to enhance your browsing experience and analyze site traffic. This Cookie Policy explains what cookies are, how we use them, and how you can manage your cookie preferences.
                </p>
              </div>

              {/* Section 1 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">1. What Are Cookies?</h2>
                <p>
                  Cookies are small text files stored on your device by your browser when you visit websites. They help websites remember your preferences, login details, and how you interact with the site to improve your overall experience.
                </p>
              </div>

              {/* Section 2 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">2. Types of Cookies We Use</h2>
                <ul className="space-y-4 ml-4">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <div>
                      <span className="font-semibold text-foreground">Essential Cookies (Required):</span>
                      <p className="text-foreground/80 mt-1">
                        <strong>Supabase Authentication Cookies:</strong> Used for user authentication and session management. These are necessary for basic website functionality and do not require your consent.
                      </p>
                      <p className="text-foreground/80 mt-2">
                        <strong>Cookie Consent Cookie:</strong> Stores your cookie preference choice in localStorage to remember whether you have accepted or rejected non-essential cookies.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <div>
                      <span className="font-semibold text-foreground">Analytics Cookies (Optional):</span>
                      <p className="text-foreground/80 mt-1">
                        <strong>Google Analytics:</strong> We use Google Analytics (ID: G-22HQQFNJ1F) to collect anonymous information about how visitors use our site, including page views, user interactions, and traffic patterns. This helps us understand user behavior and improve our website performance. These cookies require your explicit consent.
                      </p>
                      <p className="text-foreground/80 mt-2">
                        <strong>Vercel Analytics & Speed Insights:</strong> We use Vercel's analytics tools to monitor page performance, identify bottlenecks, and track visitor metrics. This data is anonymous and helps us optimize the user experience.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <div>
                      <span className="font-semibold text-foreground">Marketing Cookies (Optional):</span>
                      <p className="text-foreground/80 mt-1">Currently, we do not use marketing or advertising cookies. However, we reserve the right to implement them in the future with your consent.</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Section 3 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">3. Third-Party Services and Cookies</h2>
                <p className="mb-4">
                  We use the following third-party services that may set cookies on your device:
                </p>
                <ul className="space-y-3 ml-4">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <div>
                      <strong>Google Analytics</strong> – Collects anonymous usage data. Privacy Policy: <a href="https://policies.google.com/privacy" className="text-primary hover:text-primary/80" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy</a>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <div>
                      <strong>Vercel Analytics</strong> – Monitors site performance. Privacy Policy: <a href="https://vercel.com/legal/privacy-policy" className="text-primary hover:text-primary/80" target="_blank" rel="noopener noreferrer">https://vercel.com/legal/privacy-policy</a>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <div>
                      <strong>Supabase</strong> – Backend database and authentication. Privacy Policy: <a href="https://supabase.com/privacy" className="text-primary hover:text-primary/80" target="_blank" rel="noopener noreferrer">https://supabase.com/privacy</a>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Section 4 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">4. Managing Cookies</h2>
                <ul className="space-y-3 ml-4">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>You can control or disable cookies through your browser settings. However, disabling essential cookies might affect your ability to use certain features of the website.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>We provide a cookie consent banner on your first visit where you can accept or reject non-essential cookies.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>You can change or withdraw your cookie preferences anytime by clicking the &quot;Cookie Settings&quot; link usually found at the bottom of the website.</span>
                  </li>
                </ul>
              </div>

              {/* Section 5 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">5. Consent</h2>
                <p>
                  Where required by law (such as GDPR in the European Union), we obtain your explicit consent before placing non-essential cookies on your device. Refusing cookies may result in limited functionality.
                </p>
              </div>

              {/* Section 6 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">6. Updates to This Cookie Policy</h2>
                <p>
                  We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated effective date. Please review this policy periodically.
                </p>
              </div>

              {/* Section 7 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">7. Contact Us</h2>
                <p>
                  If you have any questions or concerns about our use of cookies, please contact us at:{' '}
                  <a href="mailto:support@trackmcp.com" className="text-primary hover:text-primary/80 font-medium transition-colors">
                    support@trackmcp.com
                  </a>
                </p>
              </div>

              {/* Footer Note */}
              <div className="pt-8 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  By continuing to use TrackMCP.com, you acknowledge that you have read and understood this Cookie Policy and agree to our use of cookies as described herein.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
