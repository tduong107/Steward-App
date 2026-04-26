/**
 * Final CTA section — Server Component shell. The interactive
 * `<Magnetic>` wrappers around the two CTAs are themselves marked
 * `'use client'` in their own file, so they hydrate as small islands
 * — the surrounding markup ships as zero-JS HTML.
 */

import Link from 'next/link'
import { EyebrowPill } from '@/components/landing-fx/eyebrow-pill'
import { Magnetic } from '@/components/landing-fx/magnetic'
import { S, APP_STORE_URL } from './tokens'

export function FinalCTA() {
  return (
    <section
      className="landing-reveal"
      style={{
        padding: 'clamp(60px,10vh,120px) clamp(24px,8vw,60px)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'transparent',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 600px 400px at 50% 50%,rgba(42,92,69,0.35) 0%,transparent 70%)',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 16 }}>
          <EyebrowPill>Your concierge is ready</EyebrowPill>
        </div>
        <h2
          style={{
            fontFamily: S.serif,
            fontSize: 'clamp(44px,6vw,88px)',
            fontWeight: 700,
            lineHeight: 0.96,
            letterSpacing: '-0.035em',
            color: S.cream,
            margin: 0,
            marginBottom: 20,
          }}
        >
          Stop losing to bots
          <br />
          Get <em className="italic-accent">your own</em>
        </h2>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.6,
            color: 'rgba(247,246,243,0.5)',
            fontWeight: 300,
            maxWidth: 600,
            margin: '0 auto 40px',
          }}
        >
          Steward monitors prices, tables, tickets, and campsites around the clock and
          pings you the moment something opens up. No scripts. No refreshing. Just results.
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <Magnetic strength={0.3}>
            <Link href="/signup" className="btn-primary">
              Start Free on Web <span aria-hidden="true">→</span>
            </Link>
          </Magnetic>
          <Magnetic strength={0.3}>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              iOS App
            </a>
          </Magnetic>
        </div>
      </div>
    </section>
  )
}
