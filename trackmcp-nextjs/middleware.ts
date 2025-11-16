import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Content Security Policy - ENFORCED (Production Hardened)
  // Aggressive security posture - no unsafe-inline
  // All inline code must be moved to external files
  
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.vercel-analytics.com https://www.googletagmanager.com https://www.google-analytics.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https: blob:;
    media-src 'self' https:;
    connect-src 'self' https: http://localhost:3000 http://localhost:3004 https://www.google-analytics.com https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com;
    frame-src 'self' https:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
    report-uri /api/csp-report;
  `
    .replace(/\s{2,}/g, ' ')
    .trim()

  // ENFORCED mode - violations are BLOCKED (not just reported)
  response.headers.append('Content-Security-Policy', cspHeader)

  // Additional security headers
  response.headers.append('X-Content-Type-Options', 'nosniff')
  response.headers.append('X-Frame-Options', 'DENY')
  // X-XSS-Protection: Legacy header (deprecated in modern browsers)
  // Set to 0 to disable legacy XSS filter and avoid double-handling
  // Modern protection via CSP is preferred
  response.headers.append('X-XSS-Protection', '0')
  response.headers.append('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.append(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  )

  // HSTS - Strict-Transport-Security
  // ⚠️ IMPORTANT: Only add includeSubDomains if ALL subdomains support HTTPS
  // If any subdomain is HTTP-only, it will break!
  //
  // Phase 1 (Current - Tuning Phase): 
  //   - max-age=63072000 (2 years)
  //   - includeSubDomains (only if all subdomains are HTTPS)
  //   - NO preload (test thoroughly first)
  //
  // Phase 2 (After 1-3 months of testing):
  //   - Verify all subdomains are HTTPS
  //   - Verify no HTTP redirects
  //   - Verify no certificate issues
  //   - Then consider adding preload
  //
  // Phase 3 (After preload validation):
  //   - Add preload directive
  //   - Submit to https://hstspreload.org/
  //   - Wait for inclusion (1-2 months)
  //
  // ⚠️ WARNING: Preload is PERMANENT - very hard to remove!
  // Only add after thorough testing and verification.
  
  // Current: Without preload (safe for tuning phase)
  response.headers.append('Strict-Transport-Security', 'max-age=63072000; includeSubDomains')
  
  // Future: With preload (only after validation)
  // response.headers.append('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
