import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy | Track MCP',
  description: 'Read our Privacy Policy to understand how Track MCP collects, uses, and protects your personal information.',
  openGraph: {
    title: 'Privacy Policy | Track MCP',
    description: 'Privacy Policy for Track MCP',
    url: 'https://www.trackmcp.com/privacy',
    type: 'website',
  },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="relative overflow-hidden pt-8 md:pt-12 pb-8 md:pb-12 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
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
                  TrackMCP.com (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) values your privacy and is committed to protecting your personal information. This Privacy Policy explains what information we collect, how we use it, and your rights relating to your information when you use our website.
                </p>
              </div>

              {/* Section 1 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">1. Information We Collect</h2>
                <p className="mb-4">We may collect and process the following information:</p>
                <ul className="space-y-3 ml-4">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>Personal details you provide when registering, submitting content, or contacting us (such as your name, email address, organization, etc.).</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>Usage data such as IP address, browser type, referring/exit pages, device information, and pages visited.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>Data collected through cookies, analytics, and similar tracking technologies.</span>
                  </li>
                </ul>
              </div>

              {/* Section 2 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">2. How We Use Your Information</h2>
                <p className="mb-4">We use your information to:</p>
                <ul className="space-y-3 ml-4">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>Provide, operate, and maintain TrackMCP.com and its services</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>Manage user accounts and submissions</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>Respond to your inquiries or requests</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>Improve website functionality, security, and user experience</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>Send important updates, service notifications, and information relating to your use of the website</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>Comply with legal obligations</span>
                  </li>
                </ul>
              </div>

              {/* Section 3 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">3. Cookies and Tracking</h2>
                <ul className="space-y-3 ml-4">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>Our website uses "cookies" and analytics tools to collect information on how visitors interact with our site.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>These cookies help us enhance your experience, analyze traffic, and personalize content.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>You can control or disable cookies through your browser settings, but this may affect your experience on our website.</span>
                  </li>
                </ul>
              </div>

              {/* Section 4 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">4. Sharing Your Information</h2>
                <p className="mb-4">We do not sell or rent your personal information. We may share your information with:</p>
                <ul className="space-y-3 ml-4">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>Service providers and partners who help us run and improve the website (such as analytics or hosting platforms), always under confidentiality agreements.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>Legal authorities, if required by law or to protect our legal rights and users&apos; safety.</span>
                  </li>
                </ul>
              </div>

              {/* Section 5 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">5. Third-Party Links</h2>
                <p>
                  TrackMCP.com may contain links to external websites. We are not responsible for the content or privacy practices of those sites. Please review the privacy policies of any third-party sites you visit.
                </p>
              </div>

              {/* Section 6 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">6. Data Security</h2>
                <p>
                  We employ reasonable administrative, technical, and physical safeguards to protect your information against unauthorized access, alteration, disclosure, or destruction.
                </p>
              </div>

              {/* Section 7 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">7. Your Rights</h2>
                <p className="mb-4">Depending on your jurisdiction, you may have the right to:</p>
                <ul className="space-y-3 ml-4">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>Access, correct, or delete your personal information</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>Object to or restrict certain uses of your data</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">•</span>
                    <span>Withdraw consent for data processing (where applicable)</span>
                  </li>
                </ul>
                <p className="mt-4">
                  To exercise any rights, please contact us at the email address below.
                </p>
              </div>

              {/* Section 8 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">8. Children's Privacy</h2>
                <p>
                  TrackMCP.com is not directed at children under 13. We do not knowingly collect personal data from children under 13. If you believe a child has provided us with their information, contact us to request its removal.
                </p>
              </div>

              {/* Section 9 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">9. Updates to This Privacy Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. Changes will be posted on this page, and the &quot;Effective Date&quot; will be updated accordingly. Continued use of TrackMCP.com after changes constitutes your acceptance of the revised policy.
                </p>
              </div>

              {/* Section 10 */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">10. Contact Us</h2>
                <p>
                  If you have any questions or requests regarding this Privacy Policy or your personal data, please contact us at:{' '}
                  <a href="mailto:support@trackmcp.com" className="text-primary hover:text-primary/80 font-medium transition-colors">
                    support@trackmcp.com
                  </a>
                </p>
              </div>

              {/* Footer Note */}
              <div className="pt-8 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  By using TrackMCP.com, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
