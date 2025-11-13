import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service – Track MCP',
  description: 'Read the terms and conditions for using Track MCP. Learn about user rights, repository listings, and content usage policies.',
  openGraph: {
    title: 'Terms of Service – Track MCP',
    description: 'Read the terms and conditions for using Track MCP. Learn about user rights, repository listings, and content usage policies.',
    url: 'https://www.trackmcp.com/terms',
    type: 'website',
  },
}

export default function TermsPage() {
  // Create WebPage schema for terms page
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Terms of Service – Track MCP',
    description: 'Read the terms and conditions for using Track MCP. Learn about user rights, repository listings, and content usage policies.',
    url: 'https://www.trackmcp.com/terms',
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
        name: 'Terms of Service',
        item: 'https://www.trackmcp.com/terms',
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-lg text-muted-foreground">Last updated: November 2024</p>
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
                  Welcome to TrackMCP.com. By accessing or using our website, you agree to comply with and be bound by the following terms and conditions. Please read them carefully.
                </p>
              </div>

              {/* Section 1 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
                <p>
                  By using TrackMCP.com (&quot;Site&quot;), you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree, please do not use our Site.
                </p>
              </div>

              {/* Section 2 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">2. Use of Content</h2>
                <p>
                  All information and content provided on this Site, including MCP tools, server listings, articles, and user submissions, are for informational purposes only. We do not guarantee the accuracy, completeness, or reliability of any content and are not responsible for any errors or omissions.
                </p>
              </div>

              {/* Section 3 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">3. User Accounts and Submissions</h2>
                <ul className="space-y-3 ml-4">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>You may submit MCP tools, servers, or related content for listing or featuring on TrackMCP.com.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>You warrant that all content you submit is your original work or that you have rights or permission to submit it.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>TrackMCP.com reserves the right to review, edit, or remove any submissions that violate our guidelines, are inappropriate, or infringe on others&apos; rights.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your submission.</span>
                  </li>
                </ul>
              </div>

              {/* Section 4 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">4. Fees and Payments</h2>
                <ul className="space-y-3 ml-4">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>Certain services like featured listings or advertising may require payment of fees.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>All fees are non-refundable unless otherwise stated.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>We reserve the right to change fees and payment terms at any time.</span>
                  </li>
                </ul>
              </div>

              {/* Section 5 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">5. Advertising</h2>
                <ul className="space-y-3 ml-4">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>Advertising on TrackMCP.com is available subject to approval.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>Advertisers are responsible for the content and legality of their ads.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>We reserve the right to reject or remove ads that do not meet our standards or violate laws.</span>
                  </li>
                </ul>
              </div>

              {/* Section 6 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">6. Intellectual Property</h2>
                <ul className="space-y-3 ml-4">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>The Site, including its design, graphics, logos, and software, are owned or licensed by TrackMCP.com and protected by copyright and intellectual property laws.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>You agree not to reproduce, duplicate, copy, sell, or exploit any portion of the Site without prior written permission.</span>
                  </li>
                </ul>
              </div>

              {/* Section 7 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">7. Limitation of Liability</h2>
                <ul className="space-y-3 ml-4">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>TrackMCP.com is provided &quot;as is&quot; without warranties of any kind.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>We do not assume responsibility for any damages arising from your use of the Site or reliance on its content.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>Your use of the Site is at your sole risk.</span>
                  </li>
                </ul>
              </div>

              {/* Section 8 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">8. Indemnification</h2>
                <p>
                  You agree to indemnify and hold harmless TrackMCP.com and its affiliates from any claims, damages, liabilities, costs, or expenses arising out of your breach of these Terms or misuse of the Site.
                </p>
              </div>

              {/* Section 9 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">9. Modifications to Terms</h2>
                <p>
                  We may update these Terms and Conditions from time to time. Your continued use of the Site after changes indicates your acceptance of the revised terms.
                </p>
              </div>

              {/* Section 10 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">10. Governing Law</h2>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the jurisdiction where TrackMCP.com operates.
                </p>
              </div>

              {/* Section 11 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">11. Contact Us</h2>
                <p>
                  For any questions or concerns about these Terms, please contact us at{' '}
                  <a href="mailto:support@trackmcp.com" className="text-primary hover:text-primary/80 font-medium transition-colors">
                    support@trackmcp.com
                  </a>
                </p>
              </div>

              {/* Footer Note */}
              <div className="pt-8 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  By using TrackMCP.com, you acknowledge that you have read and understood these Terms of Service and agree to be bound by them.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
