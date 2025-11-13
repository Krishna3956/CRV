'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { ToolDiscoverySidebar } from '@/components/ToolDiscoverySidebar'
import { TableOfContents } from '@/components/TableOfContents'
import { Star, GitBranch, Calendar, ExternalLink, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { fetchGitHub } from '@/utils/github'
import { extractHeadingsFromMarkdown } from '@/utils/toc'
import type { Database } from '@/types/database.types'
import type { TableOfContentsItem } from '@/utils/toc'

type McpTool = Database['public']['Tables']['mcp_tools']['Row']

interface ToolDetailClientProps {
  tool: McpTool
  initialReadme?: string | null
  relatedTools?: {
    similar: McpTool[]
    trending: McpTool[]
    new: McpTool[]
  }
  toc?: TableOfContentsItem[]
}

// Helper: Format tool name for display (Title Case with spaces)
function formatToolName(name: string): string {
  return name
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function ToolDetailClient({ tool, initialReadme, relatedTools, toc }: ToolDetailClientProps) {
  const [readme, setReadme] = useState<string>(initialReadme || '')
  const [ownerAvatar, setOwnerAvatar] = useState<string>('')
  const [ownerName, setOwnerName] = useState<string>('')
  const [isLoadingReadme, setIsLoadingReadme] = useState(!initialReadme)
  const [tableOfContents, setTableOfContents] = useState<TableOfContentsItem[]>(toc || [])

  useEffect(() => {
    fetchOwnerAndReadme()
  }, [tool.github_url, initialReadme])

  const fetchOwnerAndReadme = async () => {
    // If we already have README from server, just fetch owner info
    if (initialReadme) {
      if (tool?.github_url) {
        try {
          const urlParts = tool.github_url.replace(/\/$/, '').split('/')
          const owner = urlParts[urlParts.length - 2]
          setOwnerName(owner)
          
          // Fetch owner info
          const ownerResponse = await fetchGitHub(`https://api.github.com/users/${owner}`)
          if (ownerResponse.ok) {
            const ownerData = await ownerResponse.json()
            setOwnerAvatar(ownerData.avatar_url)
          }
        } catch (err) {
          console.error('Error fetching owner info:', err)
        }
      }
      return
    }

    // Otherwise, fetch both README and owner info (fallback for client-side)
    setIsLoadingReadme(true)

    if (tool?.github_url) {
      try {
        const urlParts = tool.github_url.replace(/\/$/, '').split('/')
        const owner = urlParts[urlParts.length - 2]
        setOwnerName(owner)
        
        // Fetch owner info
        const ownerResponse = await fetchGitHub(`https://api.github.com/users/${owner}`)
        if (ownerResponse.ok) {
          const ownerData = await ownerResponse.json()
          setOwnerAvatar(ownerData.avatar_url)
        }

        // Fetch README (client-side fallback)
        const repoPath = tool.github_url.replace('https://github.com/', '').replace(/\/$/, '')
        console.log('Client: Fetching README for:', repoPath)
        const readmeResponse = await fetchGitHub(`https://api.github.com/repos/${repoPath}/readme`)
        
        console.log('Client: README response status:', readmeResponse.status)
        if (readmeResponse.ok) {
          const contentType = readmeResponse.headers.get('Content-Type')
          
          // Check if response is JSON (base64 encoded) or raw text
          if (contentType?.includes('application/json')) {
            const data = await readmeResponse.json()
            // Decode base64 content
            if (data.content && data.encoding === 'base64') {
              const decodedContent = atob(data.content.replace(/\n/g, ''))
              console.log('Client: README decoded from base64, length:', decodedContent.length)
              setReadme(decodedContent)
            }
          } else {
            // Raw text response
            const readmeText = await readmeResponse.text()
            console.log('Client: README fetched as text, length:', readmeText.length)
            setReadme(readmeText)
          }
        } else {
          console.error('Client: Failed to fetch README:', readmeResponse.status, readmeResponse.statusText)
        }
      } catch (err) {
        console.error('Client: Error fetching GitHub data:', err)
      }
    }

  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <main className="flex-1">
          {/* Grid Layout with precise alignment */}
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 max-w-7xl mx-auto">
              {/* Main Content - 7 columns on desktop */}
              <article className="lg:col-span-7">
                {/* Back Button - Hidden on desktop, optimized on mobile */}
                <Link href="/">
                  <Button size="sm" className="mb-6 lg:hidden gap-2 mt-4 w-fit bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4 py-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to directory
                  </Button>
                </Link>

              {/* Header Section */}
              <section className="mb-8 pb-8 border-b mt-8 lg:mt-16">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={ownerAvatar} 
                    alt={`${ownerName} - ${tool.repo_name} repository owner avatar`}
                    loading="lazy" 
                    width="40" 
                    height="40" 
                  />
                  <AvatarFallback className="text-sm">{ownerName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h1 className="text-2xl sm:text-4xl font-bold">{formatToolName(tool.repo_name || '')}</h1>
              </div>
              <Button asChild size="sm" className="w-fit gap-1">
                <a 
                  href={tool.github_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-1"
                  aria-label={`View ${tool.repo_name} on GitHub`}
                >
                  <svg 
                    className="h-4 w-4 fill-current" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                    aria-label="GitHub logo"
                    role="img"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>

            {tool.description && (
              <p className="text-lg text-muted-foreground mb-6">{tool.description}</p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-accent text-accent" />
                <span className="font-semibold">{tool.stars?.toLocaleString() || 0} stars</span>
              </div>
              
              {tool.language && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GitBranch className="h-4 w-4" />
                  <span>{tool.language}</span>
                </div>
              )}
              
              {tool.last_updated && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Updated {format(new Date(tool.last_updated), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>

            {/* Topics */}
            {tool.topics && tool.topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {tool.topics.map((topic) => (
                  <Badge key={topic} variant="secondary">
                    {topic}
                  </Badge>
                ))}
              </div>
            )}
            </section>

            {/* Table of Contents Section - Above Documentation */}
            {tableOfContents && tableOfContents.length > 0 && (
              <section className="mb-8 pb-8 border-b border-border/50">
                <div className="lg:hidden">
                  {/* Mobile: Inline TOC */}
                  <TableOfContents 
                    items={tableOfContents} 
                    pageUrl={`https://www.trackmcp.com/tool/${encodeURIComponent(tool.repo_name || '')}`}
                  />
                </div>
                <div className="hidden lg:block">
                  {/* Desktop: Full-width TOC */}
                  <TableOfContents 
                    items={tableOfContents} 
                    pageUrl={`https://www.trackmcp.com/tool/${encodeURIComponent(tool.repo_name || '')}`}
                  />
                </div>
              </section>
            )}

            {/* Documentation Section */}
            <section className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Documentation</h2>
            {isLoadingReadme ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Loading README...</div>
              </div>
            ) : readme ? (
              <MarkdownRenderer content={readme} githubUrl={tool.github_url} />
            ) : (
              <div className="text-muted-foreground py-8 text-center">
                No README available for this tool.
              </div>
            )}
            </section>

            {/* Discovery Sidebar - Mobile Only (Below main content) */}
            {relatedTools && (
              <div className="lg:hidden">
                <ToolDiscoverySidebar
                  similar={relatedTools.similar}
                  trending={relatedTools.trending}
                  new={[]}
                  currentToolId={tool.id}
                />
              </div>
            )}
            </article>

            {/* Sidebar - Desktop Only (5 columns, right-aligned with submit button) */}
            {relatedTools && (
              <aside className="hidden lg:block lg:col-span-5 lg:ml-auto -mr-8">
                <div className="sticky top-24 space-y-4">
                  <ToolDiscoverySidebar
                    similar={relatedTools.similar}
                    trending={relatedTools.trending}
                    new={[]}
                    currentToolId={tool.id}
                    variant="sidebar"
                  />
                </div>
              </aside>
            )}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
