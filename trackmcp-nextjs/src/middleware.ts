import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.nextUrl.hostname || ''
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')

  // SKIP ALL REDIRECTS ON LOCALHOST
  if (isLocalhost) {
    return NextResponse.next()
  }

  // Production redirects only
  // Normalize URLs to prevent 302 redirects
  // Remove trailing slashes (except for root)
  if (pathname !== '/' && pathname.endsWith('/')) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.slice(0, -1)
    return NextResponse.redirect(url, { status: 301 })
  }

  // Handle tool URLs with special characters
  if (pathname.startsWith('/tool/')) {
    const toolName = pathname.slice(6)
    
    if (toolName) {
      try {
        const decoded = decodeURIComponent(toolName)
        const reEncoded = encodeURIComponent(decoded)
        
        if (toolName !== reEncoded) {
          const url = request.nextUrl.clone()
          url.pathname = `/tool/${reEncoded}`
          return NextResponse.redirect(url, { status: 301 })
        }
      } catch (e) {
        // Invalid URL encoding
      }
    }
  }

  // Handle apple-app-site-association without trailing slash
  if (pathname === '/apple-app-site-association/') {
    const url = request.nextUrl.clone()
    url.pathname = '/apple-app-site-association'
    return NextResponse.redirect(url, { status: 301 })
  }

  // Block attempts to access file paths from GitHub repos
  if (
    pathname.includes('/path/to/') ||
    pathname.includes('/absolute/path/') ||
    pathname.includes('/Users/') ||
    pathname.includes('/workspace/') ||
    pathname.includes('/ABSOLUTE/PATH/')
  ) {
    return new NextResponse('Not Found', { status: 404 })
  }

  // Block attempts to access documentation files from tool repos
  if (
    pathname.includes('/tool/docs/') ||
    pathname.includes('/tool/examples/') ||
    pathname.includes('/tool/assets/') ||
    pathname.includes('/tool/resource/') ||
    pathname.includes('/tool/img/')
  ) {
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
