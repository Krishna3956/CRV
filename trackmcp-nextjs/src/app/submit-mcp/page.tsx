'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Sparkles, CheckCircle2, Zap, Users, Trophy, Rocket, GitBranch, Mail, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { fetchGitHub } from '@/utils/github'

// Community stats
const COMMUNITY_STATS = {
  tools: '14,739',
  developers: '50,000+',
  countries: '120+',
}

// Testimonials for social proof
const TESTIMONIALS = [
  { name: 'Alex Chen', role: 'Tool Creator', quote: 'Listed in 2 hours. Got 500+ stars in a week!' },
  { name: 'Jordan Lee', role: 'Developer', quote: 'Best way to discover MCP tools. Super active community.' },
  { name: 'Sam Rivera', role: 'Maintainer', quote: 'Featured option was worth every penny. Massive boost!' },
]

export default function SubmitMcpPage() {
  const [githubUrl, setGithubUrl] = useState('')
  const [email, setEmail] = useState('')
  const [wantsFeatured, setWantsFeatured] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [urlValid, setUrlValid] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % TESTIMONIALS.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Validate GitHub URL in real-time
  useEffect(() => {
    if (githubUrl) {
      const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/
      setUrlValid(githubRegex.test(githubUrl))
    } else {
      setUrlValid(false)
    }
  }, [githubUrl])

  const bannedRepos = [
    'https://github.com/punkpeye/awesome-mcp-servers',
    'https://github.com/habitoai/awesome-mcp-servers',
  ]

  const validateGithubUrl = (url: string) => {
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/
    if (!githubRegex.test(url)) return false
    const normalizedUrl = url.replace(/\/$/, '').toLowerCase()
    const isBanned = bannedRepos.some(banned => normalizedUrl === banned.toLowerCase())
    if (isBanned) throw new Error('This repository has been banned from submission')
    return true
  }

  const validateEmail = (emailAddress: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(emailAddress)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (!validateGithubUrl(githubUrl)) {
        toast({
          title: 'Invalid URL',
          description: 'Please enter a valid GitHub repository URL',
          variant: 'destructive',
        })
        return
      }

      if (!email || !validateEmail(email)) {
        toast({
          title: 'Invalid Email',
          description: 'Please enter a valid email address',
          variant: 'destructive',
        })
        return
      }
    } catch (error: any) {
      toast({
        title: 'Submission Blocked',
        description: error.message || 'This repository cannot be submitted',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const urlParts = githubUrl.replace(/\/$/, '').split('/')
      const owner = urlParts[urlParts.length - 2]
      const repo = urlParts[urlParts.length - 1]

      const response = await fetchGitHub(`https://api.github.com/repos/${owner}/${repo}`)
      
      if (!response.ok) throw new Error('Repository not found')

      const repoData = await response.json()

      const { error } = await supabase.from('mcp_tools').insert({
        github_url: githubUrl,
        repo_name: repoData.name.toLowerCase(),
        description: repoData.description || null,
        stars: repoData.stargazers_count || 0,
        language: repoData.language || null,
        topics: repoData.topics || [],
        last_updated: repoData.updated_at || new Date().toISOString(),
        status: 'pending',
        submitter_email: email,
      } as any)

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already exists',
            description: 'This tool has already been submitted',
            variant: 'destructive',
          })
        } else {
          throw error
        }
      } else {
        toast({
          title: '🚀 Tool submitted successfully!',
          description: 'We\'ll review it and send you an update within 24 hours',
        })
        setSubmitted(true)
        setTimeout(() => {
          setGithubUrl('')
          setEmail('')
          setWantsFeatured(false)
          setSubmitted(false)
        }, 3000)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit tool',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 border border-green-500/20">
            <CheckCircle2 className="h-8 w-8 text-green-500 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Thank you!</h2>
            <p className="text-muted-foreground">Your tool has been submitted. We&apos;ll review it within 24 hours and send you an email confirmation.</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Mobile Navigation Header */}
      <div className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="flex-1">
            <Button variant="outline" size="sm" className="w-full text-xs">
              ← Back
            </Button>
          </Link>
          <Link href="/category" className="flex-1">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              Browse Tools
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-12 pb-0">
        {/* H1 - SEO Critical */}
        <h1 className="sr-only">Submit Your MCP Tool to Track MCP - Get Discovered by 50,000+ Developers</h1>
        
        {/* Schema Markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "Submit MCP Servers, Tools & Clients",
              "description": "Easily submit your MCP server, client, or plugin to Track MCP. Get discovered by 50,000+ developers.",
              "url": "https://trackmcp.com/submit-mcp",
              "isPartOf": {
                "@type": "WebSite",
                "name": "Track MCP",
                "url": "https://trackmcp.com"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Track MCP",
                "url": "https://trackmcp.com"
              }
            })
          }}
        />
        
        {/* FAQ Schema Markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "How long does approval take?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Most submissions are reviewed and approved within 24 hours. We review every submission personally to ensure quality standards."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is there a cost to submit?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No! Submitting your tool is completely free. The featured option ($8/month) is optional and gives you premium placement."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What makes a good MCP tool?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A well-documented GitHub repository with clear instructions, examples, and a helpful README. We also check for active maintenance."
                  }
                }
              ]
            })
          }}
        />

        {/* ContactPage Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ContactPage",
              "name": "Submit Your MCP Tool - Contact Track MCP",
              "description": "Submit your MCP tool to Track MCP and get discovered by 50,000+ developers. Free submission or featured placement options available.",
              "url": "https://www.trackmcp.com/submit-mcp",
              "mainEntity": {
                "@type": "Organization",
                "name": "Track MCP",
                "contactPoint": {
                  "@type": "ContactPoint",
                  "contactType": "Customer Support",
                  "email": "support@trackmcp.com",
                  "url": "https://www.trackmcp.com/submit-mcp"
                }
              }
            })
          }}
        />

        {/* Service Schema - Featured Listing */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              "name": "Featured MCP Tool Listing",
              "description": "Get your MCP tool featured in front of 50,000+ active developers. Premium placement with increased visibility and engagement.",
              "provider": {
                "@type": "Organization",
                "name": "Track MCP",
                "url": "https://www.trackmcp.com"
              },
              "offers": {
                "@type": "Offer",
                "priceCurrency": "USD",
                "price": "8",
                "pricingModel": "Subscription",
                "availability": "https://schema.org/InStock",
                "description": "Monthly featured placement for your MCP tool"
              },
              "areaServed": "Worldwide",
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Track MCP Services",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "name": "Free Tool Submission",
                    "price": "0",
                    "priceCurrency": "USD",
                    "description": "Submit your MCP tool for free. Reviewed within 24 hours."
                  },
                  {
                    "@type": "Offer",
                    "name": "Featured Placement",
                    "price": "8",
                    "priceCurrency": "USD",
                    "description": "Monthly featured placement for maximum visibility"
                  }
                ]
              }
            })
          }}
        />

        {/* Pricing/Offer Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Offer",
              "name": "Featured MCP Tool Listing",
              "description": "Get your MCP tool featured and boost visibility with 50,000+ active developers",
              "priceCurrency": "USD",
              "price": "8",
              "pricingModel": "Subscription",
              "availability": "https://schema.org/InStock",
              "url": "https://www.trackmcp.com/submit-mcp",
              "seller": {
                "@type": "Organization",
                "name": "Track MCP",
                "url": "https://www.trackmcp.com"
              }
            })
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 lg:gap-16 max-w-7xl mx-auto">
          {/* Left Column - Value Proposition & Social Proof */}
          <div className="lg:col-span-5 space-y-8 flex flex-col justify-start order-2 lg:order-1">
            {/* Headline */}
            <div className="space-y-4">
              <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                <Rocket className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-primary">Join the community</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                Get discovered by {COMMUNITY_STATS.developers} developers
              </h2>
              <p className="text-muted-foreground leading-relaxed text-sm md:text-lg">
                Share your MCP tool and connect with an active, growing community of developers building the future of AI.
              </p>
            </div>

            {/* Community Stats */}
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <div className="space-y-2 p-3 md:p-4 rounded-lg bg-card/50 border-2 border-primary/30 hover:border-primary/50 transition-colors min-h-[100px] flex flex-col items-center justify-center text-center">
                <p className="text-lg md:text-2xl font-bold text-primary break-words">{COMMUNITY_STATS.tools}</p>
                <p className="text-xs md:text-xs text-muted-foreground leading-tight">Tools Listed</p>
              </div>
              <div className="space-y-2 p-3 md:p-4 rounded-lg bg-card/50 border-2 border-primary/30 hover:border-primary/50 transition-colors min-h-[100px] flex flex-col items-center justify-center text-center">
                <p className="text-lg md:text-2xl font-bold text-primary break-words">{COMMUNITY_STATS.developers}</p>
                <p className="text-xs md:text-xs text-muted-foreground leading-tight">Active Users</p>
              </div>
              <div className="space-y-2 p-3 md:p-4 rounded-lg bg-card/50 border-2 border-primary/30 hover:border-primary/50 transition-colors min-h-[100px] flex flex-col items-center justify-center text-center">
                <p className="text-lg md:text-2xl font-bold text-primary break-words">{COMMUNITY_STATS.countries}</p>
                <p className="text-xs md:text-xs text-muted-foreground leading-tight">Countries</p>
              </div>
            </div>

            {/* Why Submit */}
            <div className="space-y-4">
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-start gap-3 group">
                  <div className="h-7 md:h-8 w-7 md:w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Users className="h-3.5 md:h-4 w-3.5 md:w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-medium">Reach Active Developers</p>
                    <p className="text-xs text-muted-foreground">Connect with thousands of MCP users. <Link href="/top-mcp" className="text-primary hover:underline">See top MCP tools</Link> to understand the market.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 group">
                  <div className="h-7 md:h-8 w-7 md:w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Zap className="h-3.5 md:h-4 w-3.5 md:w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-medium">Instant Visibility</p>
                    <p className="text-xs text-muted-foreground">Listed within 24 hours of approval</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 group">
                  <div className="h-7 md:h-8 w-7 md:w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Trophy className="h-3.5 md:h-4 w-3.5 md:w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-medium">Stand Out</p>
                    <p className="text-xs text-muted-foreground">Get featured and boost discoverability</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial Carousel */}
            <div className="hidden md:block space-y-2 p-3 rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10">
              <div className="space-y-2 min-h-[80px] flex flex-col justify-between">
                <p className="text-sm italic text-foreground leading-relaxed break-words">{`"${TESTIMONIALS[currentTestimonial].quote}"`}</p>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{TESTIMONIALS[currentTestimonial].name}</p>
                    <p className="text-xs text-muted-foreground truncate">{TESTIMONIALS[currentTestimonial].role}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {TESTIMONIALS.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full transition-colors flex-shrink-0 ${
                          i === currentTestimonial ? 'bg-primary' : 'bg-border/50'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-7 flex flex-col justify-start order-1 lg:order-2">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-lg hover:shadow-xl transition-all h-fit md:sticky md:top-20">
              {/* Form Header with Free Badge */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900">Submit your tool</h3>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 border border-green-300">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-semibold text-green-700">Always Free</span>
                  </div>
                </div>
                <p className="text-slate-600 text-sm">Just 2 fields. Takes 2 minutes. We&apos;ll handle the rest.</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* GitHub URL */}
                <div className="space-y-2.5">
                  <Label htmlFor="github-url" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-blue-600" />
                    GitHub Repository <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <GitBranch className="h-5 w-5" />
                    </div>
                    <Input
                      id="github-url"
                      placeholder="https://github.com/username/repository"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      required
                      className="h-11 text-sm pl-10 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none bg-slate-50 text-gray-700 hover:border-slate-400"
                    />
                    {urlValid && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500 animate-in fade-in flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500">We&apos;ll fetch your repo details automatically</p>
                </div>

                {/* Email */}
                <div className="space-y-2.5">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Mail className="h-5 w-5" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11 text-sm pl-10 pr-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none bg-slate-50 text-gray-700 hover:border-slate-400"
                    />
                  </div>
                  <p className="text-xs text-slate-500">We&apos;ll send you updates and confirmation</p>
                </div>

                {/* Featured Upsell */}
                <div 
                  onClick={() => setWantsFeatured(!wantsFeatured)}
                  className="bg-blue-50 border border-blue-200 rounded-xl p-4 md:p-5 space-y-3 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  {/* Header with Checkbox */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="featured-checkbox"
                      checked={wantsFeatured}
                      onChange={(e) => setWantsFeatured(e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-blue-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <h4 className="text-sm font-bold text-gray-900">Get Featured</h4>
                        </div>
                        <span className="text-xs font-bold text-white bg-blue-600 px-3 py-1 rounded-full whitespace-nowrap shadow-sm">$8/mo</span>
                      </div>
                      <p className="text-xs text-blue-700 mt-1">
                        Get 3x more visibility & reach thousands of developers
                      </p>
                    </div>
                  </div>
                  
                  {/* Featured Benefits */}
                  <div className="space-y-2 ml-8 pt-1">
                    <div className="flex items-start gap-2">
                      <Trophy className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-700 font-medium">Top search placement</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-700 font-medium">Featured badge & highlight</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Zap className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-700 font-medium">3x more visibility</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-700 font-medium">Priority support</span>
                    </div>
                  </div>
                </div>

                {/* Primary CTA */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {wantsFeatured ? 'Processing...' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <Rocket className="mr-2 h-5 w-5" />
                      {wantsFeatured ? 'Submit & Start Featured ($8/mo)' : 'Submit MCP'}
                    </>
                  )}
                </Button>

                {/* Trust Badge */}
                <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span>Secure submission • No spam • Instant confirmation</span>
                </div>
              </form>

            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-8 pt-8 border-t border-border/50">
          <div className="space-y-8">
            <div className="space-y-3 text-center">
              <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Everything you need to know about submitting your MCP on our directory
              </p>
            </div>

            <div className="space-y-3">
              {/* FAQ Item 1 - Why Submit */}
              <details className="group border border-border/50 rounded-lg hover:border-primary/30 transition-colors">
                <summary className="flex cursor-pointer items-center justify-between p-5 font-semibold text-sm hover:bg-primary/5 transition-colors">
                  <span>Why should I submit my MCP tool?</span>
                  <span className="transition-transform group-open:rotate-180">
                    <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </span>
                </summary>
                <div className="border-t border-border/50 px-5 py-4 text-sm text-muted-foreground">
                  Track MCP is the largest MCP directory with 14,739+ tools and 50,000+ active developers. <Link href="/category" className="text-primary hover:underline font-medium">Browse our MCP categories</Link> to see where your tool fits. Submitting gets your tool discovered by thousands of developers worldwide.
                </div>
              </details>

              {/* FAQ Item 2 */}
              <details className="group border border-border/50 rounded-lg hover:border-primary/30 transition-colors">
                <summary className="flex cursor-pointer items-center justify-between p-5 font-semibold text-sm hover:bg-primary/5 transition-colors">
                  <span>How long does approval take?</span>
                  <span className="transition-transform group-open:rotate-180">
                    <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </span>
                </summary>
                <div className="border-t border-border/50 px-5 py-4 text-sm text-muted-foreground">
                  Most submissions are reviewed and approved within 24 hours. We review every submission personally to ensure quality standards.
                </div>
              </details>

              {/* FAQ Item 2 */}
              <details className="group border border-border/50 rounded-lg hover:border-primary/30 transition-colors">
                <summary className="flex cursor-pointer items-center justify-between p-5 font-semibold text-sm hover:bg-primary/5 transition-colors">
                  <span>What if my tool is rejected?</span>
                  <span className="transition-transform group-open:rotate-180">
                    <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </span>
                </summary>
                <div className="border-t border-border/50 px-5 py-4 text-sm text-muted-foreground">
                  We&apos;ll explain why and provide constructive feedback. Most tools get approved! Feel free to resubmit after making improvements.
                </div>
              </details>

              {/* FAQ Item 3 */}
              <details className="group border border-border/50 rounded-lg hover:border-primary/30 transition-colors">
                <summary className="flex cursor-pointer items-center justify-between p-5 font-semibold text-sm hover:bg-primary/5 transition-colors">
                  <span>Can I edit after submitting?</span>
                  <span className="transition-transform group-open:rotate-180">
                    <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </span>
                </summary>
                <div className="border-t border-border/50 px-5 py-4 text-sm text-muted-foreground">
                  Yes! You can edit your submission anytime before approval. Just reply to our email with the changes you&apos;d like to make.
                </div>
              </details>

              {/* FAQ Item 4 */}
              <details className="group border border-border/50 rounded-lg hover:border-primary/30 transition-colors">
                <summary className="flex cursor-pointer items-center justify-between p-5 font-semibold text-sm hover:bg-primary/5 transition-colors">
                  <span>Is there a cost to submit?</span>
                  <span className="transition-transform group-open:rotate-180">
                    <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </span>
                </summary>
                <div className="border-t border-border/50 px-5 py-4 text-sm text-muted-foreground">
                  No! Submitting your tool is completely free. The featured option ($8/month) is optional and gives you premium placement.
                </div>
              </details>

              {/* FAQ Item 5 - Submission Requirements */}
              <details className="group border border-border/50 rounded-lg hover:border-primary/30 transition-colors">
                <summary className="flex cursor-pointer items-center justify-between p-5 font-semibold text-sm hover:bg-primary/5 transition-colors">
                  <span>What are the submission requirements?</span>
                  <span className="transition-transform group-open:rotate-180">
                    <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </span>
                </summary>
                <div className="border-t border-border/50 px-5 py-4 text-sm text-muted-foreground space-y-3">
                  <p className="font-medium text-foreground">To ensure quality and consistency, your MCP tool should meet these requirements:</p>
                  <ul className="space-y-2 ml-4">
                    <li className="list-disc"><strong>Public GitHub Repository:</strong> Your MCP server, client, or plugin must be hosted on a public GitHub repository that anyone can access.</li>
                    <li className="list-disc"><strong>Clear Documentation:</strong> Include a comprehensive README with installation instructions, usage examples, and configuration details.</li>
                    <li className="list-disc"><strong>Active Maintenance:</strong> Your tool should be actively maintained with recent commits and responsive to issues.</li>
                    <li className="list-disc"><strong>Valid Contact Email:</strong> Provide a working email address so we can contact you about your submission or updates.</li>
                  </ul>
                  <p className="pt-2">After submission, your tool will be reviewed within 24 hours. <Link href="/new" className="text-primary hover:underline font-medium">Check newly added tools</Link> to see recently approved submissions.</p>
                </div>
              </details>

              {/* FAQ Item 6 */}
              <details className="group border border-border/50 rounded-lg hover:border-primary/30 transition-colors">
                <summary className="flex cursor-pointer items-center justify-between p-5 font-semibold text-sm hover:bg-primary/5 transition-colors">
                  <span>What makes a good MCP tool?</span>
                  <span className="transition-transform group-open:rotate-180">
                    <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </span>
                </summary>
                <div className="border-t border-border/50 px-5 py-4 text-sm text-muted-foreground">
                  A well-documented GitHub repository with clear instructions, examples, and a helpful README. We also check for active maintenance.
                </div>
              </details>

              {/* FAQ Item 6 */}
              <details className="group border border-border/50 rounded-lg hover:border-primary/30 transition-colors">
                <summary className="flex cursor-pointer items-center justify-between p-5 font-semibold text-sm hover:bg-primary/5 transition-colors">
                  <span>Can I remove my tool later?</span>
                  <span className="transition-transform group-open:rotate-180">
                    <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </span>
                </summary>
                <div className="border-t border-border/50 px-5 py-4 text-sm text-muted-foreground">
                  Yes, you can request removal anytime. Just contact us with your tool name and we&apos;ll remove it from the directory.
                </div>
              </details>

              {/* FAQ Item 7 */}
              <details className="group border border-border/50 rounded-lg hover:border-primary/30 transition-colors">
                <summary className="flex cursor-pointer items-center justify-between p-5 font-semibold text-sm hover:bg-primary/5 transition-colors">
                  <span>How is my tool ranked?</span>
                  <span className="transition-transform group-open:rotate-180">
                    <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </span>
                </summary>
                <div className="border-t border-border/50 px-5 py-4 text-sm text-muted-foreground">
                  Tools are ranked by stars, recent activity, and community engagement. Featured tools get a boost in visibility.
                </div>
              </details>

              {/* FAQ Item 8 */}
              <details className="group border border-border/50 rounded-lg hover:border-primary/30 transition-colors">
                <summary className="flex cursor-pointer items-center justify-between p-5 font-semibold text-sm hover:bg-primary/5 transition-colors">
                  <span>Do you accept private repositories?</span>
                  <span className="transition-transform group-open:rotate-180">
                    <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </span>
                </summary>
                <div className="border-t border-border/50 px-5 py-4 text-sm text-muted-foreground">
                  No, your repository must be public so developers can access and review your tool before using it.
                </div>
              </details>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
