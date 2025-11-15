import { NextRequest, NextResponse } from 'next/server'

interface CSPReport {
  'csp-report': {
    'document-uri': string
    'violated-directive': string
    'effective-directive': string
    'original-policy': string
    'disposition': string
    'blocked-uri'?: string
    'source-file'?: string
    'line-number'?: number
    'column-number'?: number
    'status-code'?: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CSPReport = await request.json()
    const report = body['csp-report']

    // Log CSP violation
    console.error('🚨 CSP Violation Report:', {
      timestamp: new Date().toISOString(),
      documentUri: report['document-uri'],
      violatedDirective: report['violated-directive'],
      effectiveDirective: report['effective-directive'],
      blockedUri: report['blocked-uri'],
      sourceFile: report['source-file'],
      lineNumber: report['line-number'],
      columnNumber: report['column-number'],
      statusCode: report['status-code'],
      disposition: report['disposition'],
    })

    // TODO: Send to monitoring service (e.g., Sentry, DataDog, custom logging)
    // Example:
    // await fetch('https://your-monitoring-service.com/csp-reports', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(report),
    // })

    return NextResponse.json(
      { success: true, message: 'CSP report received' },
      { status: 204 }
    )
  } catch (error) {
    console.error('Error processing CSP report:', error)
    return NextResponse.json(
      { error: 'Failed to process CSP report' },
      { status: 400 }
    )
  }
}
