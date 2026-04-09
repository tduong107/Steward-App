'use client'

import { useEffect, useRef, useState } from 'react'

interface CategoryCoverageProps {
  competitorName: string
  competitorCategories: string[]
}

const ALL_CATEGORIES = [
  { id: 'shopping', label: 'Shopping', emoji: '🛍' },
  { id: 'restaurants', label: 'Restaurants', emoji: '🍽' },
  { id: 'campsites', label: 'Campsites', emoji: '🏕' },
  { id: 'flights', label: 'Flights', emoji: '✈️' },
  { id: 'tickets', label: 'Event Tickets', emoji: '🎫' },
  { id: 'any-url', label: 'Any URL', emoji: '🌐' },
]

export default function CategoryCoverage({
  competitorName,
  competitorCategories,
}: CategoryCoverageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const stewardCount = ALL_CATEGORIES.length
  const competitorCount = competitorCategories.length

  const orbActive = (active: boolean): React.CSSProperties =>
    active
      ? {
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 16px',
          borderRadius: 12,
          background: 'rgba(110,231,183,0.1)',
          border: '1px solid rgba(110,231,183,0.3)',
          color: '#6EE7B7',
          fontSize: 14,
          fontWeight: 500,
          minWidth: 120,
          justifyContent: 'center',
        }
      : {
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 16px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.1)',
          color: 'rgba(247,246,243,0.25)',
          fontSize: 14,
          fontWeight: 500,
          minWidth: 120,
          justifyContent: 'center',
        }

  return (
    <div
      ref={containerRef}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
        maxWidth: 720,
        margin: '48px auto',
        padding: '0 24px',
      }}
    >
      {/* Desktop: side by side */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: 32,
        }}
      >
        {/* Steward column */}
        <div style={{ flex: 1, maxWidth: 260 }}>
          <div
            style={{
              textAlign: 'center' as const,
              marginBottom: 16,
              fontWeight: 700,
              fontSize: 16,
              color: '#6EE7B7',
            }}
          >
            Steward
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column' as const,
              gap: 10,
              alignItems: 'center',
            }}
          >
            {ALL_CATEGORIES.map((cat) => (
              <div
                key={`steward-${cat.id}`}
                className="cat-orb-active"
                style={orbActive(true)}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center counter */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontWeight: 700,
                fontSize: 20,
                color: '#6EE7B7',
              }}
            >
              {stewardCount}
            </span>
            <span
              style={{
                fontSize: 11,
                color: 'rgba(247,246,243,0.35)',
              }}
            >
              vs
            </span>
            <span
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontWeight: 700,
                fontSize: 20,
                color: 'rgba(247,246,243,0.5)',
              }}
            >
              {competitorCount}
            </span>
          </div>
        </div>

        {/* Competitor column */}
        <div style={{ flex: 1, maxWidth: 260 }}>
          <div
            style={{
              textAlign: 'center' as const,
              marginBottom: 16,
              fontWeight: 700,
              fontSize: 16,
              color: 'rgba(247,246,243,0.5)',
            }}
          >
            {competitorName}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column' as const,
              gap: 10,
              alignItems: 'center',
            }}
          >
            {ALL_CATEGORIES.map((cat) => {
              const active = competitorCategories.includes(cat.id)
              return (
                <div
                  key={`competitor-${cat.id}`}
                  className={active ? 'cat-orb-active' : undefined}
                  style={orbActive(active)}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile override */}
      <style>{`
        @media (max-width: 639px) {
          .cat-coverage-wrapper > div:first-child {
            flex-direction: column !important;
            align-items: center !important;
            gap: 24px !important;
          }
        }
      `}</style>
    </div>
  )
}
