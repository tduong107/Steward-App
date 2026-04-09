import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Steward — AI Price Tracker for Deals, Restocks, Reservations & Flights'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #0F2018 0%, #080A08 50%, #1C3D2E 100%)',
          position: 'relative',
        }}
      >
        {/* Subtle glow */}
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(110,231,183,0.15) 0%, transparent 70%)',
            top: '15%',
            left: '30%',
          }}
        />

        {/* Logo S */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #243D30, #0F2018)',
            border: '2px solid rgba(110,231,183,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            fontWeight: 800,
            color: '#6EE7B7',
            marginBottom: 24,
          }}
        >
          S
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: '#F7F6F3',
            textAlign: 'center',
            lineHeight: 1.15,
            marginBottom: 16,
            letterSpacing: '-0.03em',
          }}
        >
          Steward
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: '#6EE7B7',
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          AI Price Tracker & Personal Concierge
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: 800,
          }}
        >
          {['Price Drops', 'Restocks', 'Reservations', 'Campsites', 'Flights', 'Tickets'].map(
            (label) => (
              <div
                key={label}
                style={{
                  background: 'rgba(110,231,183,0.1)',
                  border: '1px solid rgba(110,231,183,0.25)',
                  borderRadius: 24,
                  padding: '8px 20px',
                  fontSize: 18,
                  color: 'rgba(247,246,243,0.7)',
                  fontWeight: 500,
                }}
              >
                {label}
              </div>
            )
          )}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 16,
            color: 'rgba(247,246,243,0.4)',
          }}
        >
          joinsteward.app · iOS & Web · Free to start
        </div>
      </div>
    ),
    { ...size }
  )
}
