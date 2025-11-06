import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t bg-card/30 backdrop-blur-sm mt-16">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-12 mb-8">
          {/* Brand Section - Left */}
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-3">TrackMCP</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              The world&apos;s largest repository of Model Context Protocol servers.
            </p>
          </div>

          {/* Navigation Links - Right */}
          <div className="flex-shrink-0">
            <h4 className="font-semibold text-sm mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/category"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  href="/top-mcp"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Top Tools
                </Link>
              </li>
              <li>
                <Link
                  href="/new"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  New MCP
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t pt-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} TrackMCP. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground text-center md:text-right">
            Built with ❤️ by{' '}
            <a
              href="https://www.linkedin.com/in/krishnaa-goyal/"
              target="_blank"
              rel="author noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Krishna Goyal
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

export { Footer }
