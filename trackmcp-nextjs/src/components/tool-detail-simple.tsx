'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { Footer } from '@/components/Footer'
import { Star, GitBranch, Calendar, ExternalLink, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { fetchGitHub } from '@/utils/github'
import type { Database } from '@/types/database.types'

type McpTool = Database['public']['Tables']['mcp_tools']['Row']

interface ToolDetailClientProps {
  tool: McpTool
}

export function ToolDetailClient({ tool }: ToolDetailClientProps) {
  const [readme, setReadme] = useState<string>('')
  const [ownerAvatar, setOwnerAvatar] = useState<string>('')
  const [ownerName, setOwnerName] = useState<string>('')
  const [isLoadingReadme, setIsLoadingReadme] = useState(true)

  useEffect(() => {
    fetchReadmeAndOwner()
  }, [tool.github_url])

  const fetchReadmeAndOwner = async () => {
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

        // Fetch README
        const repoPath = tool.github_url.replace('https://github.com/', '').replace(/\/$/, '')
        const readmeResponse = await fetchGitHub(`https://api.github.com/repos/${repoPath}/readme`)
        
        if (readmeResponse.ok) {
          const readmeText = await readmeResponse.text()
          setReadme(readmeText)
        }
      } catch (err) {
        console.error('Error fetching GitHub data:', err)
      }
    }

    setIsLoadingReadme(false)
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Link href="/">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to directory
            </Button>
          </Link>

          {/* Header */}
          <div className="mb-8 pb-8 border-b">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={ownerAvatar} alt={ownerName} loading="lazy" width="40" height="40" />
                  <AvatarFallback className="text-sm">{ownerName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h1 className="text-2xl sm:text-4xl font-bold">{tool.repo_name}</h1>
              </div>
              <Button asChild size="sm" className="w-fit gap-2">
                <a href={tool.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <span>View on</span>
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
          </div>

          {/* README */}
          {readme && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Documentation</h2>
              <MarkdownRenderer content={readme} githubUrl={tool.github_url} />
            </div>
          )}
        </main>
      </div>
      
      <Footer />
    </>
  )
}
