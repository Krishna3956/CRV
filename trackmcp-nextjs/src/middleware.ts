import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Normalize URLs to prevent 302 redirects
  // Remove trailing slashes (except for root)
  if (pathname !== '/' && pathname.endsWith('/')) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.slice(0, -1)
    return NextResponse.redirect(url, { status: 301 })
  }

  // Handle tool URLs with special characters
  // Convert URLs like /tool/D.I.E-MCP to /tool/D.I.E-MCP (properly encoded)
  if (pathname.startsWith('/tool/')) {
    const toolName = pathname.slice(6) // Remove '/tool/' prefix
    
    // Skip if empty
    if (!toolName) {
      return NextResponse.next()
    }
    
    try {
      // Decode to see the actual tool name
      const decoded = decodeURIComponent(toolName)
      
      // Re-encode to canonical form
      const reEncoded = encodeURIComponent(decoded)
      
      // If encoding differs, redirect to canonical form
      if (toolName !== reEncoded) {
        const url = request.nextUrl.clone()
        url.pathname = `/tool/${reEncoded}`
        return NextResponse.redirect(url, { status: 301 })
      }
      
      // Handle special characters that might not be properly encoded
      // Examples: D.I.E-MCP, mcpserver.azuredevops, BootstrapBlazor.MCPServer
      // These should be URL-encoded when accessed
      if (decoded !== toolName && decoded.includes('.')) {
        // Tool name has dots, ensure it's properly encoded
        const url = request.nextUrl.clone()
        url.pathname = `/tool/${reEncoded}`
        return NextResponse.redirect(url, { status: 301 })
      }
    } catch (e) {
      // Invalid URL encoding, let it pass through to Next.js
      // Next.js will handle it or return 404
    }
  }

  // Handle .well-known paths
  if (pathname.startsWith('/.well-known/')) {
    // Let these pass through - they're handled by Next.js
    return NextResponse.next()
  }

  // Handle apple-app-site-association without trailing slash
  if (pathname === '/apple-app-site-association/') {
    const url = request.nextUrl.clone()
    url.pathname = '/apple-app-site-association'
    return NextResponse.redirect(url, { status: 301 })
  }

  // Block attempts to access file paths from GitHub repos
  // These are 404s from people trying to access raw files
  if (
    pathname.includes('/path/to/') ||
    pathname.includes('/absolute/path/') ||
    pathname.includes('/Users/') ||
    pathname.includes('/workspace/') ||
    pathname.includes('/ABSOLUTE/PATH/')
  ) {
    // Return 410 Gone instead of 404 to indicate these are permanently gone
    return new NextResponse('Not Found', { status: 404 })
  }

  // Block attempts to access documentation files from tool repos
  // These are not served by Track MCP
  if (
    pathname.includes('/tool/docs/') ||
    pathname.includes('/tool/examples/') ||
    pathname.includes('/tool/assets/') ||
    pathname.includes('/tool/resource/') ||
    pathname.includes('/tool/img/')
  ) {
    // Return 404 - these files don't exist on Track MCP
    return new NextResponse('Not Found', { status: 404 })
  }

  return NextResponse.next()
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    // Match all paths except static files and API routes
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/).*)',
  ],
}
