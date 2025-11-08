import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Minimal middleware - only handle critical paths
  const { pathname } = request.nextUrl

  // Block attempts to access file paths from GitHub repos (404s)
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

  // Let everything else pass through
  return NextResponse.next()
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    // Match all paths except static files and API routes
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/).*)',
  ],
}
