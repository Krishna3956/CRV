import { NextResponse } from 'next/server'

export async function GET() {
  const appleAppSiteAssociation = {
    applinks: {
      apps: [],
      details: [
        {
          appID: 'XXXXXXXXXX.com.trackmcp.app',
          paths: [
            '/tool/*',
            '/category/*',
            '/categories',
            '/top-mcp',
            '/new',
          ],
        },
      ],
    },
    webcredentials: {
      apps: [
        'XXXXXXXXXX.com.trackmcp.app',
      ],
    },
    activitycontinuation: {
      apps: [
        'XXXXXXXXXX.com.trackmcp.app',
      ],
    },
  }

  return NextResponse.json(appleAppSiteAssociation, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
