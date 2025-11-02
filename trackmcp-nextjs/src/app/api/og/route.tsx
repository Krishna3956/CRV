import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const toolName = searchParams.get('tool') || 'Track MCP'
    const stars = searchParams.get('stars') || '0'
    const description = searchParams.get('description')?.slice(0, 150) || 'Model Context Protocol Tools Directory'
    
    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Logo/Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '30px',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '12px 24px',
              borderRadius: '50px',
              backdropFilter: 'blur(10px)',
            }}
          >
            <span style={{ fontSize: 24, color: 'white' }}>✨</span>
            <span style={{ fontSize: 20, color: 'white', fontWeight: 600 }}>Track MCP</span>
          </div>

          {/* Tool Name */}
          <h1
            style={{
              fontSize: toolName.length > 30 ? 48 : 64,
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              margin: '0 0 20px 0',
              lineHeight: 1.2,
              maxWidth: '900px',
            }}
          >
            {toolName}
          </h1>

          {/* Stars */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '30px',
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '8px 20px',
              borderRadius: '20px',
            }}
          >
            <span style={{ fontSize: 28 }}>⭐</span>
            <span style={{ fontSize: 28, color: 'white', fontWeight: 600 }}>
              {parseInt(stars).toLocaleString()}
            </span>
            <span style={{ fontSize: 20, color: 'rgba(255, 255, 255, 0.8)' }}>stars</span>
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: 24,
              color: 'rgba(255, 255, 255, 0.9)',
              textAlign: 'center',
              margin: 0,
              maxWidth: '900px',
              lineHeight: 1.4,
            }}
          >
            {description}
          </p>

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: 18,
            }}
          >
            <span>🔍</span>
            <span>Discover 10,000+ MCP Tools</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    console.error('Error generating OG image:', e)
    return new Response(`Failed to generate image: ${e.message}`, {
      status: 500,
    })
  }
}
