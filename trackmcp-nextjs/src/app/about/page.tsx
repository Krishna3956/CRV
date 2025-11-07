import { Metadata } from 'next'
import Link from 'next/link'
import { Globe, Zap, Users, Sparkles, ArrowRight, Github, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SubmitToolDialog } from '@/components/SubmitToolDialog'
import { ActiveVisitorsCard } from '@/components/ActiveVisitorsCard'

export const metadata: Metadata = {
  title: 'About Track MCP | World\'s Largest MCP Platform',
  description: 'Learn about Track MCP - the world\'s largest directory of Model Context Protocol tools, servers, and integrations. Join 10,000+ daily visitors exploring MCP innovations.',
  openGraph: {
    title: 'About Track MCP',
    description: 'The world\'s largest MCP platform connecting developers with AI tools and integrations.',
    url: 'https://www.trackmcp.com/about',
    type: 'website',
  },
}

// Get total count of tools (same as homepage)
async function getTotalCount(): Promise<number> {
  const supabase = createClient()
  
  try {
    const { count, error } = await supabase
      .from('mcp_tools')
      .select('id', { count: 'exact', head: true })

    if (error) {
      console.error('Error fetching count:', error)
      return 0
    }

    return count || 0
  } catch (err) {
    console.error('Exception fetching count:', err)
    return 0
  }
}

export default async function AboutPage() {
  const totalCount = await getTotalCount()
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 md:pt-12 pb-8 md:pb-12">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -ml-48 -mb-48" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-yellow-500">👋 Hello</span> from <span className="gradient-text">Track MCP</span>
            </h1>
            
            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent mb-3" />
            
            {/* Live Stats Badge - Compact, Left-Aligned */}
            <div className="flex items-center gap-2 mb-5">
              <div className="relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/20 border border-green-500/50 backdrop-blur-sm">
                <div className="relative h-1.5 w-1.5 flex-shrink-0">
                  <div className="absolute inset-0 rounded-full bg-green-500 animate-pulse" />
                  <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-60" />
                  <div className="absolute -inset-1 rounded-full border border-green-500/30 animate-pulse" style={{ animationDelay: '0.3s' }} />
                </div>
                <span className="text-xs font-semibold text-green-600 dark:text-green-400 tracking-wide">Live Stats</span>
              </div>
            </div>
            
            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 mb-8">
              {/* Active Visitors Card - Green (Client Component with Real-time Updates) */}
              <ActiveVisitorsCard />

              {/* Tools Indexed Card - Blue */}
              <div className="group relative overflow-hidden rounded-lg border-2 border-blue-500/30 hover:border-blue-500/60 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 p-4 md:p-5">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
                     style={{ background: 'radial-gradient(circle at top right, hsl(217 91% 60% / 0.08), transparent 70%)' }} />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                
                <div className="relative z-10 text-center">
                  <div className="text-3xl md:text-4xl font-bold text-foreground mb-1 md:mb-2">14,894+</div>
                  <div className="text-xs md:text-xs font-semibold text-foreground">Tools Indexed</div>
                </div>
              </div>

              {/* Categories Card - Purple */}
              <div className="group relative overflow-hidden rounded-lg border-2 border-purple-500/30 hover:border-purple-500/60 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 p-4 md:p-5">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
                     style={{ background: 'radial-gradient(circle at top right, hsl(280 85% 67% / 0.08), transparent 70%)' }} />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                
                <div className="relative z-10 text-center">
                  <div className="text-3xl md:text-4xl font-bold text-foreground mb-1 md:mb-2">9</div>
                  <div className="text-xs md:text-xs font-semibold text-foreground">Categories</div>
                </div>
              </div>
            </div>

            <Link
              href="/category"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-gradient-to-r from-primary/20 via-accent/15 to-primary/20 hover:from-primary/30 hover:via-accent/25 hover:to-primary/30 border border-primary/40 hover:border-primary/60 text-foreground font-semibold transition-all duration-300 hover:shadow-lg"
            >
              Explore MCP
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* About Track MCP Section */}
      <section className="py-8 md:py-12 bg-card/30 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">About Track MCP</h2>
            
            <div className="space-y-6 text-sm md:text-base text-foreground/75 leading-relaxed font-normal">
              <p>
                Hi There,<br /><br />
                My name is <a href="https://www.linkedin.com/in/krishnaa-goyal/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/70 font-medium transition-colors">Krishna</a>, and I work as a product manager at Cisco. I don&apos;t know how to code, so this entire project has been brought to life with the help of Vibecoding. Together, we&apos;ve created the world&apos;s largest repository of MCP, with over 10,000 people visiting every day. I run this as a hobby project, and now that we have traffic coming to the site, I&apos;d be happy to help you get your project noticed.
              </p>

              <p>
                If you&apos;re working on something exciting in the MCP world, maybe a new tool, server, or integration, we want to help you get discovered. For a small fee, you can feature your project right here, in front of thousands of people eager to explore fresh MCP innovations.
              </p>

              <p>
                And if you&apos;re just starting out or don&apos;t want to pay right now, no worries. If you have something new and exciting in the MCP space, just ping me on <a href="https://www.linkedin.com/in/krishnaa-goyal/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/70 font-medium transition-colors">LinkedIn</a>, and I&apos;ll do my best to help you get it featured.
              </p>

              <p>
                If you&apos;re a company looking to reach this growing community, we also offer advertising options. You can connect directly with the audience that matters most, people who are passionate about AI and MCP technology.
              </p>

              <p>
                Bottom line? Track MCP is here to support the entire MCP community, showcase the best tools, and highlight what&apos;s trending in the world of AI connections. We&apos;re excited about the future, and we&apos;d love for you to be part of it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Get Featured Section */}
      <section className="py-16 md:py-24 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Get Your Tool Featured</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Are you building something cool in the MCP world? Get your project featured in front of thousands of developers and AI enthusiasts.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <div className="flex-shrink-0 p-1 rounded-full bg-primary/10">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <span>Showcase your innovation to 10,000+ daily visitors</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex-shrink-0 p-1 rounded-full bg-primary/10">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <span>Reach developers actively looking for MCP solutions</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex-shrink-0 p-1 rounded-full bg-primary/10">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <span>Boost visibility and adoption of your tool</span>
                  </li>
                </ul>
                <SubmitToolDialog variant="enhanced" buttonText="Submit Your MCP" />
              </div>
              <div className="p-8 rounded-lg bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border border-primary/20">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                    <div className="font-semibold mb-1">Quick Submission</div>
                    <p className="text-sm text-muted-foreground">Add your tool in minutes</p>
                  </div>
                  <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                    <div className="font-semibold mb-1">Featured Badge</div>
                    <p className="text-sm text-muted-foreground">Stand out with a featured label</p>
                  </div>
                  <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                    <div className="font-semibold mb-1">Affordable Pricing</div>
                    <p className="text-sm text-muted-foreground">Reasonable fees for maximum exposure</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advertising Section */}
      <section className="py-16 md:py-24 bg-card/30 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="p-8 rounded-lg bg-gradient-to-br from-accent/10 via-primary/5 to-accent/5 border border-accent/20 order-2 md:order-1">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                    <div className="font-semibold mb-1">Targeted Audience</div>
                    <p className="text-sm text-muted-foreground">Reach AI and MCP enthusiasts</p>
                  </div>
                  <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                    <div className="font-semibold mb-1">High Engagement</div>
                    <p className="text-sm text-muted-foreground">Active community of developers</p>
                  </div>
                  <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                    <div className="font-semibold mb-1">Flexible Options</div>
                    <p className="text-sm text-muted-foreground">Various advertising placements</p>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Advertising Opportunities</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Reach the MCP community directly. Our platform connects you with thousands of developers and companies actively building with the Model Context Protocol.
                </p>
                <p className="text-muted-foreground mb-8">
                  Whether you&apos;re launching a new product, promoting a service, or building brand awareness, Track MCP offers advertising options tailored to your goals.
                </p>
                <a
                  href="mailto:krishna@trackmcp.com"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent font-semibold transition-all duration-300"
                >
                  <Mail className="h-4 w-4" />
                  Contact Us to Advertise
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-24 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Mission</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              To support and grow the Model Context Protocol ecosystem by providing the world&apos;s most comprehensive directory of MCP tools, servers, and integrations. We&apos;re committed to connecting developers, fostering innovation, and making it easy for everyone to discover and build with MCP technology.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Explore?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of developers discovering the latest MCP tools and innovations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/category"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-primary/20 hover:bg-primary/30 text-foreground font-semibold transition-all duration-300"
              >
                Browse Categories
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-accent/20 hover:bg-accent/30 text-foreground font-semibold transition-all duration-300"
              >
                View All Tools
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
