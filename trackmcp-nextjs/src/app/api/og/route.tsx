import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

// Helper: Format tool name for display (Title Case with spaces)
function formatToolName(name: string): string {
  return name
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const toolName = searchParams.get('tool') || 'Track MCP'
    const stars = searchParams.get('stars') || '0'
    const description = searchParams.get('description') || 'Model Context Protocol Tools Directory'
    
    // Truncate description to 150 chars
    const truncatedDescription = description.length > 150 ? description.slice(0, 150) + '...' : description
    
    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: '60px 80px',
            fontFamily: '"Inter", "system-ui", sans-serif',
            color: 'white',
          }}
        >
          {/* Header with Logo and Stars */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  fontSize: '32px',
                }}
              >
                ✨
              </div>
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                }}
              >
                Track MCP
              </span>
            </div>
            
            {parseInt(stars) > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '10px 20px',
                  borderRadius: '20px',
                  fontSize: '20px',
                  fontWeight: 700,
                }}
              >
                <span>⭐</span>
                <span>{parseInt(stars).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Tool Name */}
            <div
              style={{
                fontSize: '72px',
                fontWeight: 800,
                lineHeight: 1.2,
                maxWidth: '900px',
              }}
            >
              {toolName}
            </div>

            {/* Description */}
            <div
              style={{
                fontSize: '24px',
                lineHeight: 1.5,
                maxWidth: '900px',
                opacity: 0.95,
              }}
            >
              {truncatedDescription}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              fontSize: '18px',
              opacity: 0.8,
            }}
          >
            <span>Discover 10,000+ MCP Tools</span>
            <span>trackmcp.com</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error: any) {
    console.error('OG Image Generation Error:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
