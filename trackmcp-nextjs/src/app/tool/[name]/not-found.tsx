import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Search, Home, TrendingUp } from 'lucide-react'

export default function ToolNotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        {/* 404 Header */}
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-3xl font-bold mb-4">MCP Tool Not Found</h2>
          <p className="text-lg text-muted-foreground">
            The Model Context Protocol tool you&apos;re looking for doesn&apos;t exist or has been removed from our directory.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button asChild size="lg">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Browse All Tools
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="/#search">
              <Search className="mr-2 h-4 w-4" />
              Search Tools
            </Link>
          </Button>
        </div>

        {/* Helpful Information */}
        <div className="bg-muted/50 rounded-lg p-6 text-left">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            What you can do:
          </h3>
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Browse our directory of <strong>10,000+ MCP tools</strong></span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Use the search to find similar tools</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Check if the tool name has changed on GitHub</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Submit a new tool if it&apos;s not in our directory</span>
            </li>
          </ul>
        </div>

        {/* Popular Tools Section */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold mb-4">Popular MCP Tools</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link 
              href="/tool/github-mcp-server" 
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <div className="font-medium">github-mcp-server</div>
              <div className="text-sm text-muted-foreground">GitHub&apos;s official MCP Server</div>
            </Link>
            <Link 
              href="/tool/cline" 
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <div className="font-medium">cline</div>
              <div className="text-sm text-muted-foreground">Autonomous coding agent in your IDE</div>
            </Link>
            <Link 
              href="/tool/context7" 
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <div className="font-medium">context7</div>
              <div className="text-sm text-muted-foreground">Up-to-date code documentation for LLMs</div>
            </Link>
            <Link 
              href="/tool/browser-use" 
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <div className="font-medium">browser-use</div>
              <div className="text-sm text-muted-foreground">Make websites accessible for AI agents</div>
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-12">
          <Link 
            href="/" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
