import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const toolName = searchParams.get('tool') || 'Track MCP'
    const stars = searchParams.get('stars') || '0'
    const description = searchParams.get('description')?.slice(0, 120) || 'Model Context Protocol Tools Directory'
    
    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, hsl(243, 75%, 59%) 0%, hsl(199, 89%, 48%) 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '0',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            position: 'relative',
          }}
        >
          {/* Background Pattern */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.08) 0%, transparent 50%)',
              display: 'flex',
            }}
          />

          {/* Content Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '60px 80px',
              height: '100%',
              justifyContent: 'space-between',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {/* Logo */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                  }}
                >
                  ✨
                </div>
                <span
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: 'white',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Track MCP
                </span>
              </div>

              {/* Stars Badge */}
              {parseInt(stars) > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '12px 24px',
                    borderRadius: '100px',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <span style={{ fontSize: '24px' }}>⭐</span>
                  <span
                    style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: 'white',
                    }}
                  >
                    {parseInt(stars).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Main Content */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                marginTop: '40px',
              }}
            >
              {/* Tool Name */}
              <h1
                style={{
                  fontSize: toolName.length > 40 ? '52px' : toolName.length > 25 ? '64px' : '72px',
                  fontWeight: 800,
                  color: 'white',
                  margin: 0,
                  lineHeight: 1.1,
                  letterSpacing: '-0.03em',
                  maxWidth: '1000px',
                  textShadow: '0 2px 20px rgba(0, 0, 0, 0.2)',
                }}
              >
                {toolName}
              </h1>

              {/* Description */}
              <p
                style={{
                  fontSize: '28px',
                  color: 'rgba(255, 255, 255, 0.95)',
                  margin: 0,
                  lineHeight: 1.5,
                  maxWidth: '950px',
                  fontWeight: 400,
                }}
              >
                {description}
              </p>
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '40px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '20px',
                  fontWeight: 500,
                }}
              >
                <span>🚀</span>
                <span>10,000+ MCP Tools</span>
              </div>
              <div
                style={{
                  fontSize: '18px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 500,
                }}
              >
                trackmcp.com
              </div>
            </div>
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
