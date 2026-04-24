'use client'

// This lab route is now a thin preview wrapper around the real shared
// landing hero component at `web/src/components/landing-hero.tsx`.
// Anything in here should be considered a preview-only addition — the
// actual hero markup + state lives in the shared component so the lab
// and production stay in lockstep automatically.

import { LandingHero } from '@/components/landing-hero'

const SANS =
  '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif'

export function HeroV2Demo() {
  return (
    <div style={{ position: 'relative' }}>
      <LandingHero />
      {/* Lab preview chip — only shown on /labs/hero-v2, not on the real landing */}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 50,
          padding: '6px 14px',
          background: 'rgba(15,32,24,0.85)',
          border: '1px solid rgba(110,231,183,0.2)',
          borderRadius: 999,
          fontFamily: SANS,
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(247,246,243,0.5)',
          pointerEvents: 'none',
        }}
      >
        Labs · Hero v2 preview
      </div>
    </div>
  )
}
