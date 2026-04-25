'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { track } from '@vercel/analytics'
import { LandingHero } from '@/components/landing-hero'
import { LandingHIW } from '@/components/landing-hiw'
import { LandingUseCases } from '@/components/landing-use-cases'
import { CursorSpotlight } from '@/components/landing-fx/cursor-spotlight'
import { GlobalBg } from '@/components/landing-fx/global-bg'
import { EyebrowPill } from '@/components/landing-fx/eyebrow-pill'
import { Magnetic } from '@/components/landing-fx/magnetic'
import { Bento } from '@/components/landing-fx/bento'
import { LivePrice } from '@/components/landing-fx/live-price'

// ── Logo ─────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 1024 1024" fill="none">
      <rect width="1024" height="1024" rx="224" fill="url(#l1)"/>
      <path d="M448 488Q445 536 425 579Q405 622 367 649Q329 676 270 676Q208 676 175 641Q142 606 142 559Q142 517 166 488Q190 460 228 438Q267 417 310 397Q348 380 386 360Q424 341 455 316Q486 291 504 256Q523 222 523 174Q523 119 495 76Q468 33 416 8Q364 -16 289 -16Q244 -16 196 -3Q148 10 111 35L116 -8H64L58 205H97Q102 117 158 71Q214 26 293 26Q332 26 365 40Q398 55 417 83Q437 111 437 151Q437 196 413 226Q389 256 351 278Q313 300 270 320Q232 337 195 356Q158 375 127 399Q97 424 78 458Q60 492 60 540Q60 566 69 596Q78 626 100 653Q123 681 162 698Q202 716 263 716Q301 716 348 705Q396 695 437 665L433 708H484V488Z"
        transform="translate(388.55,660.22) scale(0.4235,-0.4235)" fill="url(#l2)"/>
      <g transform="translate(607,355)">
        <circle cx="0" cy="0" r="22" fill="rgba(110,231,183,0.15)"/>
        <path d="M0 -14 L3.5 -3.5 L14 0 L3.5 3.5 L0 14 L-3.5 3.5 L-14 0 L-3.5 -3.5 Z" fill="url(#l3)"/>
      </g>
      <defs>
        <linearGradient id="l1" x1="512" y1="0" x2="512" y2="1024">
          <stop offset="0%" stopColor="#243D30"/><stop offset="100%" stopColor="#0F2018"/>
        </linearGradient>
        <linearGradient id="l2" x1="512" y1="357" x2="512" y2="667">
          <stop offset="0%" stopColor="#FFFFFF"/><stop offset="50%" stopColor="#D1FAE5"/><stop offset="100%" stopColor="#6EE7B7"/>
        </linearGradient>
        <radialGradient id="l3" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF"/><stop offset="100%" stopColor="#6EE7B7"/>
        </radialGradient>
      </defs>
    </svg>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  mint: '#6EE7B7',
  forest: '#0F2018',
  green: '#1C3D2E',
  green2: '#2A5C45',
  gold: '#F59E0B',
  cream: '#F7F6F3',
  bg: '#080A08',
  serif: 'Georgia, "Times New Roman", serif',
  textDim: 'rgba(247,246,243,0.55)',
  textFaint: 'rgba(247,246,243,0.35)',
  border: 'rgba(255,255,255,0.06)',
  borderMint: 'rgba(110,231,183,0.18)',
  cardBg: 'rgba(255,255,255,0.02)',
}

// ── Nav ───────────────────────────────────────────────────────────────────────
const APP_STORE_URL = 'https://apps.apple.com/us/app/steward-concierge/id6760180137'
const NAV_LINKS = [['#how-it-works', 'How it Works'], ['#why-steward', 'Why Steward'], ['#pricing', 'Pricing']] as const

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Close mobile menu on outside click / ESC
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: scrolled ? '14px 48px' : '22px 48px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: scrolled ? 'rgba(8,10,8,0.92)' : 'rgba(8,10,8,0.7)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(110,231,183,0.06)',
      transition: 'all 0.4s',
      flexWrap: 'wrap' as const,
    }}>
      <a href="#" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', cursor: 'pointer' }}>
        <Logo />
        <span style={{ fontFamily: S.serif, fontSize: 26, fontWeight: 700, color: S.cream, letterSpacing: '-0.02em' }}>Steward</span>
      </a>
      <div className="lnd-nav-links" style={{ display: 'flex', gap: 34, alignItems: 'center' }}>
        {NAV_LINKS.map(([href, label]) => (
          <a key={href} href={href} style={{ fontSize: 17, fontWeight: 600, color: 'rgba(247,246,243,0.7)', textDecoration: 'none', transition: 'color .25s' }}
            onMouseEnter={e => (e.currentTarget.style.color = S.mint)}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(247,246,243,0.7)')}>
            {label}
          </a>
        ))}
        {/* Resources — plain link to /blog */}
        <Link href="/blog" style={{ fontSize: 17, fontWeight: 600, color: 'rgba(247,246,243,0.7)', textDecoration: 'none', transition: 'color .25s' }}
          onMouseEnter={e => (e.currentTarget.style.color = S.mint)}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(247,246,243,0.7)')}>
          Resources
        </Link>
        <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" onClick={() => track('app_store_click', { location: 'nav' })} className="lnd-nav-ios"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15.5, fontWeight: 600, color: S.cream, textDecoration: 'none', padding: '11px 22px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', transition: 'all .25s' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
          iOS App
        </a>
        <Link href="/signup" onClick={() => track('signup_button_click', { location: 'nav' })} className="landing-btn-shimmer" style={{
          background: S.mint, color: S.forest, fontWeight: 700, padding: '12px 28px',
          borderRadius: 12, fontSize: 16, textDecoration: 'none', display: 'inline-block',
        }}>Get Started for Free</Link>
      </div>

      {/* Hamburger — visible on mobile only via CSS */}
      <button
        className="lnd-hamburger"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        aria-controls="lnd-mobile-menu"
        onClick={() => setMenuOpen(v => !v)}
        style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 10, background: menuOpen ? 'rgba(110,231,183,0.1)' : 'transparent', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 18, color: S.cream, fontFamily: 'inherit', transition: 'all .25s' }}
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div id="lnd-mobile-menu" style={{ width: '100%', borderTop: '1px solid rgba(110,231,183,0.08)', padding: '12px 0 16px', display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
          {NAV_LINKS.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}
              style={{ fontSize: 15, fontWeight: 500, color: 'rgba(247,246,243,0.7)', textDecoration: 'none', padding: '11px 4px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {label}
            </a>
          ))}
          <Link href="/blog" onClick={() => setMenuOpen(false)}
            style={{ fontSize: 15, fontWeight: 500, color: 'rgba(247,246,243,0.7)', textDecoration: 'none', padding: '11px 4px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            Resources
          </Link>
          <Link href="/signup" onClick={() => setMenuOpen(false)}
            style={{ background: S.mint, color: S.forest, fontWeight: 700, padding: '13px', borderRadius: 10, fontSize: 15, textDecoration: 'none', textAlign: 'center' as const, marginTop: 8, display: 'block' }}>
            Get Started for Free
          </Link>
          <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: S.cream, fontWeight: 600, padding: '13px', borderRadius: 10, fontSize: 14, textDecoration: 'none', marginTop: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
            iOS App
          </a>
        </div>
      )}
    </nav>
  )
}


// ── Ticker ────────────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  { icon: '👟', bold: '$31 saved', rest: 'on Nike Dunks', time: '2 min ago' },
  { icon: '✈️', bold: '$127 saved', rest: 'on LAX → Tokyo', time: '5 min ago' },
  { icon: '🍽', bold: 'Table found', rest: 'at Carbone NY', time: '8 min ago' },
  { icon: '🏕', bold: 'Campsite snagged', rest: 'at Yosemite', time: '12 min ago' },
  { icon: '🎫', bold: 'Tickets found', rest: 'for Kendrick Lamar', time: '15 min ago' },
  { icon: '📦', bold: 'Restock alert', rest: 'PS5 Pro at Target', time: '18 min ago' },
  { icon: '👟', bold: '$48 saved', rest: 'on New Balance 990v6', time: '22 min ago' },
  { icon: '✈️', bold: '$89 saved', rest: 'on SFO → JFK', time: '25 min ago' },
  { icon: '🍽', bold: 'Table found', rest: 'at Don Angie', time: '28 min ago' },
  { icon: '🏕', bold: 'Campsite snagged', rest: 'at Big Sur', time: '31 min ago' },
]

function Ticker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div aria-hidden="true" style={{ overflow: 'hidden', padding: '32px 0', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(15,32,24,0.3)' }}>
      <div className="landing-ticker-track">
        {doubled.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 40, whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{item.icon}</div>
              <span style={{ fontSize: 13, color: 'rgba(247,246,243,0.55)' }}>
                <strong>{item.bold}</strong>{' '}{item.rest}
                <span style={{ fontSize: 11, color: 'rgba(247,246,243,0.25)', marginLeft: 4 }}>{item.time}</span>
              </span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: 20, flexShrink: 0 }}>·</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Price Feature ─────────────────────────────────────────────────────────────
// Retailers shown beneath the body copy in S/02. Order is editorial,
// not alphabetic — the most recognizable names lead.
const PRICE_RETAILERS = ['Amazon', 'Nike', 'Best Buy', 'Target', 'Walmart', 'Nordstrom']

// 9 chart waypoints that descend from y=20 (top, ~$120-ish) to y=52
// (just above the dashed target line at y=50). Hand-tuned wiggle so
// the line reads like a real 30-day price history rather than a smooth
// curve. Width 300, viewBox 300×60.
const PRICE_CHART_POINTS: Array<[number, number]> = [
  [0, 22],
  [38, 18],
  [76, 28],
  [114, 24],
  [152, 32],
  [190, 26],
  [228, 38],
  [266, 44],
  [300, 52],
]
const PRICE_CHART_PATH = PRICE_CHART_POINTS.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')
const PRICE_CHART_FILL_PATH = `${PRICE_CHART_PATH} L300,60 L0,60 Z`

function PriceFeature() {
  return (
    <section
      style={{
        padding: 'clamp(60px,10vh,120px) clamp(24px,8vw,60px)',
        background: 'transparent',
        position: 'relative',
        overflow: 'hidden',
      }}
    >

      {/* PERF: section-local aurora blobs removed — <GlobalBg /> already
          provides aurora coverage across the viewport, and stacking
          two more blur(100px) layers per section was the largest
          source of scroll repaint cost. */}

      <div
        className="lnd-feature-grid"
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 80,
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* ── Left column: copy ─────────────────────────────────────── */}
        <div className="landing-reveal">
          <div style={{ marginBottom: 20 }}>
            <EyebrowPill icon="📉">Price Drops</EyebrowPill>
          </div>

          <h2
            style={{
              fontFamily: S.serif,
              fontSize: 'clamp(40px, 5.8vw, 84px)',
              fontWeight: 700,
              lineHeight: 0.96,
              letterSpacing: '-0.035em',
              color: 'var(--ink, #fff)',
              margin: 0,
              marginBottom: 22,
            }}
          >
            Your target<br />price <em className="italic-accent">Achieved</em>
          </h2>

          <p
            style={{
              fontFamily: 'var(--font-body, "Inter", system-ui, sans-serif)',
              fontSize: 17,
              lineHeight: 1.6,
              color: 'var(--ink-60, rgba(255,255,255,0.62))',
              fontWeight: 300,
              marginBottom: 32,
              maxWidth: 500,
            }}
          >
            Works across Amazon, Nike, Best Buy, Target, Walmart, and thousands of other retailers.
            Steward monitors 24/7 and pings you the moment your target hits — with fake-deal
            detection so you never get played by artificially inflated prices.
          </p>

          <Magnetic strength={0.3}>
            <Link
              href="/signup"
              onClick={() => track('signup_button_click', { location: 'price_feature' })}
              className="btn-primary"
            >
              Start tracking prices <span aria-hidden="true">→</span>
            </Link>
          </Magnetic>

          {/* Retailer row — uppercase mint-tinted monospace list, separated
              by mint diamond bullets. */}
          <div
            style={{
              marginTop: 36,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '8px 14px',
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(110,231,183,0.65)',
            }}
          >
            {PRICE_RETAILERS.map((r, i) => (
              <span key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
                {i > 0 && <span style={{ color: 'rgba(110,231,183,0.3)' }}>◆</span>}
                <span>{r}</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── Right column: dark Nike Dunk price-drop card ──────────── */}
        <div className="landing-reveal" style={{ position: 'relative' }}>
          {/* Floating ✦ chip outside top-right at 3°, 6s float */}
          <div
            className="s02-floating-chip"
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: -18,
              right: -10,
              zIndex: 3,
              padding: '8px 14px',
              borderRadius: 999,
              background: 'rgba(15,32,24,0.85)',
              border: '1px solid rgba(110,231,183,0.25)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              transform: 'rotate(3deg)',
              boxShadow: '0 14px 40px rgba(0,0,0,0.45)',
              fontFamily: 'var(--font-body, "Inter", sans-serif)',
              fontSize: 11.5,
              fontWeight: 500,
              color: 'rgba(247,246,243,0.85)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ color: 'var(--mint, #6EE7B7)', fontSize: 12 }}>✦</span>
            <span>Find the Dyson V15, alert under $500</span>
          </div>

          <Bento
            className="s02-bento"
            style={
              {
                background: 'var(--forest-2, #0F1410)',
                borderRadius: 20,
                border: '1px solid rgba(110,231,183,0.25)',
                padding: 32,
                boxShadow:
                  '0 32px 80px rgba(0,0,0,0.55), inset 0 0 80px rgba(110,231,183,0.05)',
                color: S.cream,
                position: 'relative',
                overflow: 'hidden',
              } as React.CSSProperties
            }
          >
            {/* Top row: 80×80 emoji tile + name + price */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                marginBottom: 26,
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 18,
                  background:
                    'linear-gradient(135deg, rgba(110,231,183,0.18), rgba(42,92,69,0.35))',
                  border: '1px solid rgba(110,231,183,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 48,
                  flexShrink: 0,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                👟
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: S.serif,
                    fontSize: 19,
                    fontWeight: 700,
                    color: 'var(--ink, #fff)',
                    letterSpacing: '-0.01em',
                    marginBottom: 4,
                  }}
                >
                  Nike Dunk Low Panda
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-60, rgba(255,255,255,0.62))' }}>
                  nike.com
                </div>
              </div>
            </div>

            {/* Price row: was $120 → animating LivePrice → SAVE 26% */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 14,
                marginBottom: 24,
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  color: 'rgba(255,255,255,0.32)',
                  textDecoration: 'line-through',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                $120
              </span>
              <LivePrice
                start={120}
                end={89}
                style={{
                  fontFamily: S.serif,
                  fontSize: 56,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(180deg, #A7F3D0, #6EE7B7 55%, #3A7C5A)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 24px rgba(110,231,183,0.35))',
                  fontVariantNumeric: 'tabular-nums',
                }}
              />
              <span
                style={{
                  alignSelf: 'center',
                  background:
                    'linear-gradient(135deg, var(--mint-2, #A7F3D0), var(--mint, #6EE7B7))',
                  color: 'var(--deep, #0F2018)',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  padding: '4px 11px',
                  borderRadius: 20,
                  boxShadow: '0 4px 12px rgba(110,231,183,0.3)',
                }}
              >
                SAVE 26%
              </span>
            </div>

            {/* 30-day price chart — 300×60 viewBox, mint line + fill +
                dashed mint target line + pulsing waypoint dot. */}
            <div style={{ position: 'relative', marginBottom: 22 }}>
              <svg
                viewBox="0 0 300 60"
                preserveAspectRatio="none"
                width="100%"
                height="80"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="s02-area-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(110,231,183,0.28)" />
                    <stop offset="100%" stopColor="rgba(110,231,183,0)" />
                  </linearGradient>
                </defs>
                {/* Area fill */}
                <path d={PRICE_CHART_FILL_PATH} fill="url(#s02-area-fill)" />
                {/* Mint line */}
                <path
                  d={PRICE_CHART_PATH}
                  stroke="var(--mint, #6EE7B7)"
                  strokeWidth="2"
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Dashed target line at y=50 */}
                <line
                  x1="0"
                  y1="50"
                  x2="300"
                  y2="50"
                  stroke="rgba(110,231,183,0.5)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                />
                {/* Pulsing dot at final waypoint with faint ring */}
                <circle
                  cx="300"
                  cy="52"
                  r="9"
                  fill="rgba(110,231,183,0.25)"
                  className="s02-chart-ping-bg"
                />
                <circle
                  cx="300"
                  cy="52"
                  r="4"
                  fill="var(--mint, #6EE7B7)"
                  className="s02-chart-dot"
                />
              </svg>
              <span
                style={{
                  position: 'absolute',
                  right: 0,
                  top: -6,
                  fontFamily: 'var(--font-body, "Inter", sans-serif)',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(110,231,183,0.55)',
                  background: 'rgba(15,32,24,0.65)',
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                target $90
              </span>
            </div>

            {/* Target hit banner */}
            <div
              style={{
                background:
                  'linear-gradient(90deg, rgba(110,231,183,0.14), rgba(42,92,69,0.06))',
                border: '1px solid rgba(110,231,183,0.35)',
                borderRadius: 10,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span className="live-dot" aria-hidden="true" />
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: 'var(--ink, #fff)',
                  lineHeight: 1.3,
                }}
              >
                <strong style={{ color: 'var(--mint, #6EE7B7)' }}>Target price hit!</strong>{' '}
                Tap to buy now
              </span>
              <span
                aria-hidden="true"
                style={{ color: 'var(--mint, #6EE7B7)', fontSize: 16, fontWeight: 700 }}
              >
                →
              </span>
            </div>
          </Bento>
        </div>
      </div>

      {/* Section-local keyframes (chip float, chart ping, aurora drift). */}
      <style>{`
        @keyframes s02-chip-float {
          0%, 100% { transform: translateY(0) rotate(3deg); }
          50%      { transform: translateY(-6px) rotate(3.4deg); }
        }
        .s02-floating-chip {
          animation: s02-chip-float 6s ease-in-out infinite;
          will-change: transform;
        }
        @keyframes s02-chart-ping {
          0%, 100% { opacity: 0.3; transform: scale(1); transform-origin: 300px 52px; }
          50%      { opacity: 0.9; transform: scale(1.6); transform-origin: 300px 52px; }
        }
        .s02-chart-ping-bg {
          animation: s02-chart-ping 2.2s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        @media (prefers-reduced-motion: reduce) {
          .s02-floating-chip,
          .s02-chart-ping-bg { animation: none !important; }
        }
      `}</style>
    </section>
  )
}

// ── AI Feature ────────────────────────────────────────────────────────────────
//
// Three messages cycle on a 2.8s interval. Each appears with a 300ms
// fade-up and stays visible until the loop resets. Step 0 = nothing
// shown; step 1/2/3 = first / first+second / all three. After step 3
// holds for one interval, we reset to 0 and replay.
type AiStep = 0 | 1 | 2 | 3

function AIFeature() {
  const ref = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState<AiStep>(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let timer: ReturnType<typeof setInterval> | null = null
    let visible = false

    const start = () => {
      if (reduced) {
        // Static end state — show all three messages immediately.
        setStep(3)
        return
      }
      if (timer) return
      // Kick off step 1 quickly, then step every 2.8s.
      setStep(1)
      let s: AiStep = 1
      timer = setInterval(() => {
        s = (s === 3 ? 0 : ((s + 1) as AiStep))
        setStep(s)
      }, 2800)
    }
    const stop = () => {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        const isIn = entry.isIntersecting
        if (isIn && !visible) {
          visible = true
          start()
        } else if (!isIn && visible) {
          visible = false
          stop()
        }
      },
      { threshold: 0.3 },
    )
    obs.observe(el)
    return () => {
      obs.disconnect()
      stop()
    }
  }, [])

  return (
    <section
      style={{
        padding: 'clamp(60px,10vh,120px) clamp(24px,8vw,60px)',
        background: 'transparent',
        position: 'relative',
        overflow: 'hidden',
      }}
    >

      {/* Soft vertical band so this section reads distinct from S/02
          while staying in the same dark palette. The aurora blob below
          adds a top-right accent. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, transparent 0%, rgba(15,32,24,0.30) 45%, rgba(15,32,24,0.30) 55%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      {/* PERF: s03-aurora blob removed — <GlobalBg /> provides
          aurora coverage; the section-local blob added another
          blur(100px) repaint cost without visible benefit. */}

      <div
        className="lnd-feature-grid lnd-feature-reverse"
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 80,
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* ── Left column: Chat panel ─────────────────────────────── */}
        <div className="landing-reveal" ref={ref}>
          <Bento
            className="s03-bento"
            style={
              {
                background: 'var(--forest-2, #0F1410)',
                borderRadius: 24,
                border: '1px solid rgba(110,231,183,0.15)',
                padding: 24,
                boxShadow:
                  '0 32px 80px rgba(0,0,0,0.55), inset 0 0 80px rgba(110,231,183,0.04)',
                color: S.cream,
                position: 'relative',
                overflow: 'hidden',
              } as React.CSSProperties
            }
          >
            {/* Header row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                paddingBottom: 18,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                marginBottom: 18,
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 7,
                  background:
                    'linear-gradient(135deg, var(--mint-2, #A7F3D0), var(--green-mid, #3A7C5A))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: S.serif,
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--deep, #0F2018)',
                  flexShrink: 0,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)',
                }}
              >
                ✦
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: S.serif,
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--ink, #fff)',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.1,
                  }}
                >
                  Steward
                </div>
                <div
                  style={{
                    marginTop: 3,
                    fontSize: 10.5,
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'rgba(110,231,183,0.75)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--mint, #6EE7B7)',
                      animation: 'pulse 2s ease-in-out infinite',
                      display: 'inline-block',
                    }}
                  />
                  ✦ AI concierge
                </div>
              </div>
              <span
                aria-hidden="true"
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'rgba(110,231,183,0.55)',
                  border: '1px solid rgba(110,231,183,0.22)',
                  padding: '3px 8px',
                  borderRadius: 6,
                }}
              >
                Live
              </span>
            </div>

            {/* Message stream — min-height keeps the input row from
                jumping as bubbles appear */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                minHeight: 260,
              }}
            >
              {/* User: step ≥ 1 */}
              <ChatBubble visible={step >= 1} role="user">
                find me a table at carbone for fri at 8 for 2 ppl
              </ChatBubble>

              {/* AI bubble: step ≥ 2 */}
              <ChatBubble visible={step >= 2} role="ai" tag="✦ Creating watch…">
                Got it. I&apos;ll watch Resy every 2 hrs for{' '}
                <strong style={{ color: 'var(--mint, #6EE7B7)', fontWeight: 600 }}>
                  Carbone NY · Fri 8pm · party of 2
                </strong>
                .
              </ChatBubble>

              {/* AI bubble: step ≥ 3 */}
              <ChatBubble visible={step >= 3} role="ai" tag="✦ Watch live">
                <span style={{ color: 'var(--mint, #6EE7B7)', fontWeight: 600 }}>✓ Done.</span>{' '}
                You&apos;ll get a push the moment a table opens.
              </ChatBubble>
            </div>

            {/* Input row — placeholder swaps once the watch is live */}
            <div
              style={{
                marginTop: 18,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  flex: 1,
                  paddingLeft: 12,
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.42)',
                  fontFamily: 'var(--font-body, "Inter", sans-serif)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {step >= 3 ? 'Track another…' : 'Tell me what to find'}
              </span>
              <button
                type="button"
                aria-label="Attach a screenshot"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(110,231,183,0.10)',
                  border: '1px solid rgba(110,231,183,0.22)',
                  color: 'var(--mint, #6EE7B7)',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '7px 11px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  flexShrink: 0,
                }}
              >
                <span aria-hidden="true">📷</span> Screenshot
              </button>
              <button
                type="button"
                aria-label="Send"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background:
                    'linear-gradient(180deg, var(--mint, #6EE7B7) 0%, var(--green, #2A5C45) 100%)',
                  color: 'var(--deep, #0F2018)',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '8px 14px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  flexShrink: 0,
                  boxShadow:
                    '0 2px 8px rgba(110,231,183,0.25), inset 0 1px 0 rgba(255,255,255,0.4)',
                }}
              >
                Send <span aria-hidden="true">→</span>
              </button>
            </div>
          </Bento>
        </div>

        {/* ── Right column: copy ──────────────────────────────────── */}
        <div className="landing-reveal lnd-ai-text">
          <div style={{ marginBottom: 20 }}>
            <EyebrowPill icon="✦">AI Concierge</EyebrowPill>
          </div>

          <h2
            style={{
              fontFamily: S.serif,
              fontSize: 'clamp(40px, 5.8vw, 84px)',
              fontWeight: 700,
              lineHeight: 0.96,
              letterSpacing: '-0.035em',
              color: 'var(--ink, #fff)',
              margin: 0,
              marginBottom: 22,
            }}
          >
            No forms.<br />Just say<br />what you <em className="italic-accent">want</em>
          </h2>

          <p
            style={{
              fontFamily: 'var(--font-body, "Inter", system-ui, sans-serif)',
              fontSize: 17,
              lineHeight: 1.6,
              color: 'var(--ink-60, rgba(255,255,255,0.62))',
              fontWeight: 300,
              marginBottom: 32,
              maxWidth: 500,
            }}
          >
            Skip the dropdowns and filters. Tell Steward what you want via text or a screenshot.
            The AI finds the product or experience and sets up tracking in seconds. It even
            detects fake deals.
          </p>

          <Magnetic strength={0.3}>
            <Link
              href="/signup"
              onClick={() => track('signup_button_click', { location: 'ai_feature' })}
              className="btn-primary"
            >
              Try the AI concierge <span aria-hidden="true">→</span>
            </Link>
          </Magnetic>
        </div>
      </div>

      {/* PERF: section-local aurora keyframes removed alongside the
          blob; chat fade-up is handled inline via opacity/transform
          transitions, so this section needs no scoped <style>. */}
    </section>
  )
}

// ── ChatBubble (S/03 internal) ────────────────────────────────────────────────
//
// Slides up + fades in over 300ms when `visible` flips true. Stays visible
// until the parent step resets. Re-uses the role-specific styling for user vs
// AI. Optional small uppercase "tag" line beneath an AI bubble (e.g. "✦
// Creating watch…").
function ChatBubble({
  visible,
  role,
  tag,
  children,
}: {
  visible: boolean
  role: 'user' | 'ai'
  tag?: string
  children: React.ReactNode
}) {
  const isUser = role === 'user'
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        gap: 6,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.3s var(--ease-out), transform 0.3s var(--ease-out)',
      }}
    >
      <div
        style={{
          maxWidth: '85%',
          padding: '12px 16px',
          fontSize: 13.5,
          lineHeight: 1.5,
          color: isUser ? 'var(--deep, #0F2018)' : 'rgba(247,246,243,0.85)',
          background: isUser
            ? 'linear-gradient(135deg, var(--mint-2, #A7F3D0), var(--mint, #6EE7B7))'
            : 'rgba(255,255,255,0.05)',
          border: isUser ? 'none' : '1px solid rgba(255,255,255,0.07)',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          fontWeight: isUser ? 500 : 400,
          boxShadow: isUser ? '0 6px 18px rgba(110,231,183,0.22)' : 'none',
        }}
      >
        {children}
      </div>
      {tag && !isUser && (
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'rgba(110,231,183,0.75)',
          }}
        >
          {tag}
        </span>
      )}
    </div>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────
function Pill({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.18)', borderRadius: 24, padding: '5px 14px', marginBottom: 20 }}>
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: S.mint }}>{label}</span>
    </div>
  )
}
function FeatTitle({ children }: { children: React.ReactNode }) {
  // Section H2 — clamp(44px, 6vw, 88px) per the concierge restyle spec.
  // Line-height 0.96 + letter-spacing -0.035em across all section H2s.
  return (
    <h2 style={{ fontFamily: S.serif, fontSize: 'clamp(44px,6vw,88px)', fontWeight: 700, lineHeight: 0.96, letterSpacing: '-0.035em', color: S.cream, margin: 0, marginBottom: 18 }}>
      {children}
    </h2>
  )
}
function FeatBody({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 16, lineHeight: 1.65, color: S.textDim, fontWeight: 300, marginBottom: 32, maxWidth: 420 }}>{children}</p>
}
function FeatLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="lnd-feat-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: S.mint, textDecoration: 'none', transition: 'gap .3s' }}>
      {children}
    </Link>
  )
}

// ── Platform Showcase — Animated Device Scene ────────────────────────────────
const PLATFORM_TAGLINES = [
  'Set it up on your phone',
  'Check it on your laptop',
  'Get alerts everywhere',
]

function PlatformShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)  // 0=idle, 1=phone notif, 2=sync pulse, 3=laptop notif, 4=done
  const [tagIdx, setTagIdx] = useState(0)

  // Trigger the sync animation on scroll
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && step === 0) {
        const seq: Array<[number, number]> = [[400, 1], [1200, 2], [2000, 3], [2800, 4]]
        seq.forEach(([delay, s]) => setTimeout(() => setStep(s), delay))
      }
    }, { threshold: 0.3 })
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Rotate taglines
  useEffect(() => {
    const iv = setInterval(() => setTagIdx(i => (i + 1) % PLATFORM_TAGLINES.length), 3000)
    return () => clearInterval(iv)
  }, [])

  return (
    <section id="platforms" ref={sectionRef} style={{ padding: 'clamp(80px,12vh,140px) clamp(24px,8vw,60px)', background: S.bg, position: 'relative', overflow: 'hidden' }}>
      {/* Bg glow */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 900px 700px at 50% 45%,rgba(42,92,69,0.35) 0%,transparent 60%)' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div className="landing-reveal" style={{ textAlign: 'center', maxWidth: 650, margin: '0 auto 60px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.18)', borderRadius: 30, padding: '6px 16px', marginBottom: 24 }}>
            <span style={{ fontSize: 13, color: S.mint }}>📱</span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: S.mint }}>Now on iOS &amp; Web</span>
            <span style={{ fontSize: 13, color: S.mint }}>💻</span>
          </div>
          <h2 style={{ fontFamily: S.serif, fontSize: 'clamp(44px,6vw,88px)', fontWeight: 700, lineHeight: 0.96, letterSpacing: '-0.035em', color: S.cream, margin: 0, marginBottom: 16 }}>
            One account<br /><em className="italic-accent">Every screen</em>
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(247,246,243,0.5)', fontWeight: 300, maxWidth: 500, margin: '0 auto' }}>
            Create a watch on your phone. Manage it on your laptop. Alerts hit everywhere. Same account, perfectly synced.
          </p>
        </div>

        {/* ── Device Scene — flexbox layout for precise alignment ── */}
        <div className="landing-reveal lnd-device-scene" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, maxWidth: 920, margin: '0 auto' }}>

          {/* ── iPhone Mockup ─── */}
          <div className="lnd-phone-mockup" style={{
            width: 220, height: 440, flexShrink: 0,
            background: 'linear-gradient(145deg,#1a1a1a,#0a0a0a)',
            borderRadius: 36, padding: 8,
            border: '2px solid rgba(255,255,255,0.12)',
            // PERF: dropped 60px+40px stacked shadows on this animated
            // mockup to a single 28px ambient — paired blur shadows on
            // an always-floating element re-rasterized every frame.
            boxShadow: '0 16px 28px rgba(0,0,0,0.45)',
            animation: 'platformFloatA 6s ease-in-out infinite',
            position: 'relative',
          }}>
            {/* Notch */}
            <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 80, height: 22, background: '#000', borderRadius: 14, zIndex: 5 }} />
            {/* Screen */}
            <div style={{ width: '100%', height: '100%', borderRadius: 28, overflow: 'hidden', background: '#0F2018', position: 'relative' }}>
              {/* Status bar */}
              <div style={{ padding: '28px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(247,246,243,0.5)' }}>9:41</span>
                <div style={{ display: 'flex', gap: 3 }}>
                  <div style={{ width: 12, height: 8, borderRadius: 2, background: 'rgba(247,246,243,0.4)' }} />
                  <div style={{ width: 16, height: 8, borderRadius: 2, background: 'rgba(110,231,183,0.6)' }} />
                </div>
              </div>
              {/* App header */}
              <div style={{ padding: '6px 16px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg,#243D30,#0F2018)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: S.mint, fontWeight: 700 }}>S</div>
                <span style={{ fontSize: 13, fontWeight: 700, color: S.cream, fontFamily: S.serif }}>Steward</span>
              </div>
              {/* Watch cards */}
              <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { emoji: '👟', name: 'Nike Dunk Low', price: '$89', badge: '↓ 26%', badgeColor: S.gold },
                  { emoji: '✈️', name: 'SFO → Tokyo', price: '$1,247', badge: 'Monitoring', badgeColor: S.mint },
                  { emoji: '🍽', name: 'Carbone NY', price: 'Fri 8pm', badge: 'Watching', badgeColor: S.mint },
                ].map((w, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <span style={{ fontSize: 18 }}>{w.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 600, color: S.cream, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.name}</div>
                      <div style={{ fontSize: 9, color: 'rgba(247,246,243,0.4)' }}>{w.price}</div>
                    </div>
                    <span style={{ fontSize: 7.5, fontWeight: 700, padding: '2px 6px', borderRadius: 8, background: `${w.badgeColor}15`, border: `1px solid ${w.badgeColor}30`, color: w.badgeColor }}>{w.badge}</span>
                  </div>
                ))}
              </div>
              {/* Push notification overlay */}
              <div style={{
                position: 'absolute', top: 38, left: 10, right: 10,
                background: 'rgba(30,60,45,0.95)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(110,231,183,0.25)', borderRadius: 16, padding: '10px 12px',
                display: 'flex', alignItems: 'center', gap: 10,
                opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? 'translateY(0)' : 'translateY(-30px)',
                transition: 'all 0.5s cubic-bezier(.34,1.56,.64,1)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#243D30,#0F2018)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: S.mint, fontWeight: 800, flexShrink: 0 }}>S</div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: S.mint }}>🎉 Table found!</div>
                  <div style={{ fontSize: 8, color: 'rgba(247,246,243,0.6)', lineHeight: 1.3 }}>Carbone NY · Fri 8pm for 2</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Sync connector: beam + orb + pulses ─── */}
          <div className="lnd-sync-connector" style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            position: 'relative', minWidth: 80, maxWidth: 220, alignSelf: 'center',
          }}>
            {/* Dashed beam line — spans full connector width behind the orb */}
            <div className="lnd-beam-track" style={{
              position: 'absolute', left: 0, right: 0, top: '28px', height: 2,
              background: step >= 2 ? `repeating-linear-gradient(90deg, ${S.mint}55 0, ${S.mint}55 3px, transparent 3px, transparent 8px)` : 'transparent',
              transition: 'background 0.4s 0.2s',
            }} />

            {/* Single traveling pulse — goes phone→laptop then laptop→phone */}
            {step >= 2 && (
              <div className="lnd-pulse-track" style={{
                position: 'absolute', left: 0, right: 0, top: '28px', height: 2, overflow: 'visible', pointerEvents: 'none',
              }}>
                <div className="lnd-pulse-dot-pingpong" style={{
                  position: 'absolute', top: '50%', width: 10, height: 10, borderRadius: '50%',
                  background: S.mint, transform: 'translateY(-50%)',
                  boxShadow: `0 0 8px ${S.mint}, 0 0 16px ${S.mint}80`,
                  animation: 'beamPingPong 3s ease-in-out infinite',
                }} />
              </div>
            )}

            {/* Sync orb — centered on top of beam */}
            <div className="lnd-sync-orb" style={{
              width: 56, height: 56, borderRadius: '50%',
              background: step >= 2 ? 'radial-gradient(circle,rgba(110,231,183,0.25),rgba(110,231,183,0.05))' : 'rgba(110,231,183,0.05)',
              border: `2px solid ${step >= 2 ? 'rgba(110,231,183,0.4)' : 'rgba(110,231,183,0.1)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.6s ease', position: 'relative', zIndex: 2,
              boxShadow: step >= 2 ? '0 0 30px rgba(110,231,183,0.3), 0 0 60px rgba(110,231,183,0.1)' : 'none',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={S.mint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: step >= 2 ? 1 : 0.3, transition: 'opacity 0.5s' }}>
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
              color: step >= 2 ? S.mint : 'rgba(110,231,183,0.3)', transition: 'color 0.5s',
            }}>Synced</span>
          </div>

          {/* ── Laptop Mockup ─── */}
          <div className="lnd-laptop-mockup" style={{
            width: 420, flexShrink: 0,
            animation: 'platformFloatB 6s ease-in-out infinite',
          }}>
            {/* Screen */}
            <div style={{
              background: 'linear-gradient(145deg,#111,#0a0a0a)',
              borderRadius: '12px 12px 0 0', padding: 6,
              border: '2px solid rgba(255,255,255,0.1)', borderBottom: 'none',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.4), 0 0 40px rgba(110,231,183,0.06)',
              position: 'relative',
            }}>
              {/* Browser chrome */}
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px 8px 0 0', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['#ff5f57', '#febc2e', '#28c840'].map(c => (
                    <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.7 }} />
                  ))}
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '3px 10px', fontSize: 8.5, color: 'rgba(247,246,243,0.35)' }}>joinsteward.app/home</div>
              </div>
              {/* Dashboard content */}
              <div style={{ background: '#0F2018', borderRadius: '0 0 6px 6px', padding: 14, minHeight: 240 }}>
                {/* Top bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, background: 'linear-gradient(135deg,#243D30,#0F2018)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: S.mint, fontWeight: 800 }}>S</div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: S.cream }}>Dashboard</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ fontSize: 7, padding: '3px 8px', borderRadius: 6, background: 'rgba(110,231,183,0.1)', color: S.mint, fontWeight: 600 }}>3 Active</div>
                    <div style={{ fontSize: 7, padding: '3px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.1)', color: S.gold, fontWeight: 600 }}>1 Triggered</div>
                  </div>
                </div>
                {/* Watch grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { emoji: '👟', name: 'Nike Dunk Low', sub: 'nike.com', status: '$89 ↓26%', sColor: S.gold },
                    { emoji: '✈️', name: 'SFO → Tokyo', sub: 'flights', status: 'Monitoring', sColor: S.mint },
                    { emoji: '🍽', name: 'Carbone NY', sub: 'resy.com', status: 'Table found!', sColor: '#34d399' },
                  ].map((w, i) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 10, padding: '10px',
                      borderLeft: i === 2 ? '2px solid #34d399' : undefined,
                    }}>
                      <div style={{ fontSize: 16, marginBottom: 6 }}>{w.emoji}</div>
                      <div style={{ fontSize: 9, fontWeight: 600, color: S.cream, marginBottom: 2 }}>{w.name}</div>
                      <div style={{ fontSize: 7.5, color: 'rgba(247,246,243,0.35)', marginBottom: 6 }}>{w.sub}</div>
                      <div style={{ fontSize: 7, fontWeight: 700, color: w.sColor }}>{w.status}</div>
                    </div>
                  ))}
                </div>
                {/* Notification toast */}
                <div style={{
                  position: 'absolute', bottom: 20, right: 20,
                  background: 'rgba(30,60,45,0.95)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(110,231,183,0.3)', borderRadius: 10, padding: '8px 12px',
                  display: 'flex', alignItems: 'center', gap: 8, maxWidth: 200,
                  opacity: step >= 3 ? 1 : 0, transform: step >= 3 ? 'translateY(0)' : 'translateY(12px)',
                  transition: 'all 0.5s cubic-bezier(.34,1.56,.64,1)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
                }}>
                  <span className="lnd-pulse-dot" />
                  <div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: S.mint }}>🎉 Table found!</div>
                    <div style={{ fontSize: 7, color: 'rgba(247,246,243,0.6)' }}>Carbone NY · Fri 8pm</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Keyboard base */}
            <div style={{
              height: 14, background: 'linear-gradient(180deg,#1a1a1a,#111)',
              borderRadius: '0 0 12px 12px / 0 0 8px 8px',
              border: '2px solid rgba(255,255,255,0.08)', borderTop: '1px solid rgba(255,255,255,0.04)',
              position: 'relative',
            }}>
              <div style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)', width: 60, height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }} />
            </div>
          </div>
        </div>

        {/* ── Rotating tagline ─── */}
        <div className="landing-reveal" style={{ textAlign: 'center', marginTop: 48, minHeight: 36 }}>
          {PLATFORM_TAGLINES.map((tag, i) => (
            <div key={tag} style={{
              fontFamily: S.serif, fontSize: 22, fontWeight: 600, color: S.cream,
              position: i === tagIdx ? 'relative' : 'absolute',
              opacity: i === tagIdx ? 1 : 0, transform: i === tagIdx ? 'translateY(0)' : 'translateY(10px)',
              transition: 'all 0.5s ease', pointerEvents: i === tagIdx ? 'auto' : 'none',
              left: i === tagIdx ? undefined : 0, right: i === tagIdx ? undefined : 0,
            }}>
              {tag.split(' ').map((w, wi) => (
                <span key={wi} style={{ color: wi === tag.split(' ').length - 1 ? S.mint : S.cream }}>{w}{wi < tag.split(' ').length - 1 ? ' ' : ''}</span>
              ))}
            </div>
          ))}
        </div>

        {/* ── CTAs ─── */}
        <div className="landing-reveal" style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 36, flexWrap: 'wrap' as const }}>
          <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="landing-btn-shimmer lnd-cta-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: S.mint, color: S.forest, fontSize: 15, fontWeight: 700, padding: '16px 32px', borderRadius: 14, textDecoration: 'none', transition: 'all .35s cubic-bezier(.34,1.56,.64,1)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
            iOS App
          </a>
          <Link href="/signup"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(110,231,183,0.06)', border: '1px solid rgba(110,231,183,0.2)', color: S.mint, fontSize: 15, fontWeight: 700, padding: '16px 32px', borderRadius: 14, textDecoration: 'none', transition: 'all .35s' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            Open Web App
          </Link>
        </div>

        {/* Micro features */}
        <div className="landing-reveal" style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 40, flexWrap: 'wrap' as const }}>
          {[
            { icon: '🔔', label: 'Push, Email & SMS alerts' },
            { icon: '⚡', label: 'Real-time sync' },
            { icon: '🔒', label: 'One account, all devices' },
          ].map(f => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>{f.icon}</span>
              <span style={{ fontSize: 13, color: 'rgba(247,246,243,0.45)', fontWeight: 400 }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Pricing ───────────────────────────────────────────────────────────────────
type Plan = {
  name: string; monthly: string; yearly: string; periodMonthly: string; periodYearly: string; featured: boolean; tag?: string
  features: string[]; btnMonthly: string; btnYearly: string
}

const PLANS: Plan[] = [
  {
    name: 'Free', monthly: '$0', yearly: '$0', periodMonthly: '/ forever', periodYearly: '/ forever', featured: false,
    features: ['Up to 3 trackers', 'Checks once per day', 'Push notifications', 'AI chat setup'],
    btnMonthly: 'Get Started for Free', btnYearly: 'Get Started for Free',
  },
  {
    name: 'Steward Pro', monthly: '$4.99', yearly: '$39.99', periodMonthly: '/ month', periodYearly: '/ year', featured: false,
    features: ['Up to 7 trackers', 'Check every 12 hours', 'Smart Cart Links', 'Price insights & deal alerts', 'Email & SMS alerts'],
    btnMonthly: 'Subscribe for $4.99/mo', btnYearly: 'Subscribe for $39.99/yr',
  },
  {
    name: 'Steward Premium', monthly: '$9.99', yearly: '$79.99', periodMonthly: '/ month', periodYearly: '/ year', featured: true, tag: 'BEST VALUE',
    features: ['Up to 15 trackers', 'Check every 2 hours', 'Steward Acts for you', 'Everything in Pro', 'Fake deal detection', 'Priority support'],
    btnMonthly: 'Subscribe for $9.99/mo', btnYearly: 'Subscribe for $79.99/yr',
  },
]

function Pricing() {
  const [yearly, setYearly] = useState(false)

  return (
    <section id="pricing" style={{ padding: 'clamp(60px,10vh,120px) clamp(24px,8vw,60px)', background: S.bg, position: 'relative' }}>
      <div className="landing-reveal" style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 40px' }}>
        <div style={{ marginBottom: 16 }}><EyebrowPill>Pricing</EyebrowPill></div>
        <h2 style={{ fontFamily: S.serif, fontSize: 'clamp(44px,6vw,88px)', fontWeight: 700, lineHeight: 0.96, letterSpacing: '-0.035em', color: S.cream, margin: 0, marginBottom: 16 }}>
          Pays for itself<br />with <em className="italic-accent">one deal</em>
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(247,246,243,0.5)', fontWeight: 300 }}>Start free, upgrade when you see how much you save.</p>
      </div>

      {/* Monthly / Yearly toggle */}
      <div className="landing-reveal" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 48 }}>
        <span style={{ fontSize: 14, fontWeight: !yearly ? 600 : 400, color: !yearly ? S.cream : 'rgba(247,246,243,0.4)', transition: 'all .3s' }}>Monthly</span>
        <button
          onClick={() => setYearly(v => !v)}
          aria-label={yearly ? 'Switch to monthly billing' : 'Switch to yearly billing'}
          style={{
            width: 52, height: 28, borderRadius: 14, padding: 3,
            background: yearly ? S.mint : 'rgba(255,255,255,0.12)',
            border: 'none', cursor: 'pointer', position: 'relative',
            transition: 'background .3s', fontFamily: 'inherit',
          }}
        >
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: yearly ? S.forest : 'rgba(247,246,243,0.8)',
            transform: yearly ? 'translateX(24px)' : 'translateX(0)',
            transition: 'transform .3s cubic-bezier(.34,1.56,.64,1)',
          }} />
        </button>
        <span style={{ fontSize: 14, fontWeight: yearly ? 600 : 400, color: yearly ? S.cream : 'rgba(247,246,243,0.4)', transition: 'all .3s' }}>
          Yearly
          <span style={{ fontSize: 11, fontWeight: 700, color: S.gold, marginLeft: 6 }}>Save 33%</span>
        </span>
      </div>

      <div className="lnd-pricing-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {PLANS.map((plan, i) => (
          <div key={plan.name} className="landing-reveal"
            style={{
              // Featured (Premium) tier gets the spec mint gradient bg
              // + brighter mint border. PERF: 60px outer glow dropped
              // to a 28px shadow — large blur shadows on always-rendered
              // elements force the compositor to expand the layer's
              // damage rect every paint, which compounded with the
              // global aurora layer for visible scroll jank.
              background: plan.featured
                ? 'linear-gradient(135deg, rgba(110,231,183,0.18), rgba(42,92,69,0.35))'
                : S.cardBg,
              border: plan.featured ? '1px solid rgba(110,231,183,0.35)' : S.border,
              borderRadius: 24, padding: '36px 28px', position: 'relative', overflow: 'hidden',
              display: 'flex', flexDirection: 'column' as const,
              animationDelay: `${i * 100}ms`,
              boxShadow: plan.featured
                ? '0 12px 28px rgba(110,231,183,0.14), inset 0 1px 0 rgba(255,255,255,0.08)'
                : 'none',
            }}>
            {plan.tag && (
              <div style={{
                position: 'absolute', top: 16, right: 16,
                // Mint→green gradient ribbon per concierge spec (was solid gold)
                background: 'linear-gradient(135deg, var(--mint, #6EE7B7), var(--green-mid, #3A7C5A))',
                color: 'var(--deep, #0F2018)',
                fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
                padding: '4px 11px', borderRadius: 20,
                boxShadow: '0 4px 14px rgba(110,231,183,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
              }}>{plan.tag}</div>
            )}
            <div style={{ fontFamily: S.serif, fontSize: 22, fontWeight: 700, color: S.cream, marginBottom: 8 }}>{plan.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
              <span style={{ fontFamily: S.serif, fontSize: 38, fontWeight: 700, color: S.mint }}>{yearly ? plan.yearly : plan.monthly}</span>
              <span style={{ fontSize: 13, color: 'rgba(247,246,243,0.4)' }}>{yearly ? plan.periodYearly : plan.periodMonthly}</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {plan.features.map(f => (
                <li key={f} style={{ fontSize: 13, color: 'rgba(247,246,243,0.55)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: S.mint, fontSize: 12, fontWeight: 700 }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Magnetic strength={0.2} style={{ marginTop: 'auto', display: 'flex' }}>
              <Link href="/signup" style={{
                display: 'block', textAlign: 'center', padding: 14, borderRadius: 12,
                fontSize: 14, fontWeight: plan.featured ? 700 : 600,
                textDecoration: 'none', transition: 'all .3s',
                width: '100%',
                background: plan.featured
                  ? 'linear-gradient(180deg, var(--mint, #6EE7B7) 0%, var(--green, #2A5C45) 100%)'
                  : 'rgba(110,231,183,0.06)',
                border: plan.featured ? 'none' : '1px solid rgba(110,231,183,0.18)',
                color: plan.featured ? 'var(--deep, #0F2018)' : 'var(--mint, #6EE7B7)',
                boxShadow: plan.featured
                  ? '0 2px 10px rgba(110,231,183,0.25), inset 0 1px 0 rgba(255,255,255,0.4)'
                  : 'none',
              }}>{yearly ? plan.btnYearly : plan.btnMonthly}</Link>
            </Magnetic>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── FAQ ──────────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: 'What is Steward?',
    a: 'Steward is an AI-powered personal concierge app that monitors websites for price drops, restocks, restaurant reservation openings, campsite availability, flight fare changes, and event ticket restocks. Available on iOS and web.',
  },
  {
    q: 'How does Steward track prices?',
    a: 'Steward uses a multi-tier system combining direct website fetching, smart scraping, shopping APIs, and AI analysis to check prices across Amazon, Nike, Best Buy, Target, Walmart, and thousands of other retailers \u2014 up to every 2 hours on Premium.',
  },
  {
    q: 'Is Steward free?',
    a: 'Yes! The free plan includes up to 3 trackers with daily checks and push notifications. Upgrade to Pro ($4.99/mo) for 7 trackers and 12-hour checks, or Premium ($9.99/mo) for 15 trackers, 2-hour checks, and automated actions.',
  },
  {
    q: 'What websites does Steward work with?',
    a: 'Steward works with virtually any website \u2014 Amazon, Nike, Best Buy, Target, Walmart, Costco, Nordstrom for shopping; Resy and OpenTable for restaurants; Recreation.gov for campsites (Yosemite, Yellowstone, Big Sur); Google Flights and Kayak for flights; and Ticketmaster for events.',
  },
  {
    q: 'How is Steward different from Honey or CamelCamelCamel?',
    a: 'Unlike Honey (coupon-only) or CamelCamelCamel (Amazon-only), Steward works on any URL \u2014 from sneaker drops on Nike to campsite cancellations on Recreation.gov to restaurant reservations on Resy. It also uses AI to understand any page you share, so there are no browser extensions to install.',
  },
  {
    q: 'Can Steward help me get restaurant reservations?',
    a: 'Yes! Steward monitors Resy and OpenTable for reservation cancellations and new openings. When a table at your desired restaurant, date, time, and party size opens up, Steward sends you an instant alert so you can book it before anyone else.',
  },
  {
    q: 'Does Steward work on iPhone?',
    a: 'Yes \u2014 Steward has a native iOS app available on the App Store with push notifications, AI chat for creating watches, and a share extension so you can send any URL directly from Safari or any app. Your watches sync in real-time between iOS and the web dashboard.',
  },
]

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" style={{ padding: 'clamp(60px,10vh,120px) clamp(24px,8vw,60px)', background: S.bg, position: 'relative' }}>
      <div className="landing-reveal" style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ marginBottom: 16 }}><EyebrowPill>FAQ</EyebrowPill></div>
          <h2 style={{ fontFamily: S.serif, fontSize: 'clamp(44px,6vw,88px)', fontWeight: 700, lineHeight: 0.96, letterSpacing: '-0.035em', color: S.cream, margin: 0 }}>
            Frequently Asked Questions
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={i} style={{ borderBottom: `1px solid ${S.border}` }}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', textAlign: 'left' as const,
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 600, color: S.cream, paddingRight: 16 }}>{item.q}</span>
                  <span style={{
                    fontSize: 20, color: S.mint, flexShrink: 0, transition: 'transform 0.3s',
                    transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                  }}>+</span>
                </button>
                <div style={{
                  maxHeight: isOpen ? 300 : 0, overflow: 'hidden',
                  transition: 'max-height 0.35s ease, opacity 0.3s ease',
                  opacity: isOpen ? 1 : 0,
                }}>
                  <p style={{ fontSize: 14.5, lineHeight: 1.7, color: S.textDim, fontWeight: 300, padding: '0 0 20px', margin: 0 }}>
                    {item.a}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ── Final CTA ─────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="landing-reveal" style={{ padding: 'clamp(60px,10vh,120px) clamp(24px,8vw,60px)', textAlign: 'center', position: 'relative', overflow: 'hidden', background: S.bg }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 600px 400px at 50% 50%,rgba(42,92,69,0.35) 0%,transparent 70%)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 16 }}><EyebrowPill>Your concierge is ready</EyebrowPill></div>
        <h2 style={{ fontFamily: S.serif, fontSize: 'clamp(44px,6vw,88px)', fontWeight: 700, lineHeight: 0.96, letterSpacing: '-0.035em', color: S.cream, margin: 0, marginBottom: 20 }}>
          Stop losing to bots<br />Get <em className="italic-accent">your own</em>
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(247,246,243,0.5)', fontWeight: 300, maxWidth: 600, margin: '0 auto 40px' }}>
          Steward monitors prices, tables, tickets, and campsites around the clock and pings you the moment something opens up. No scripts. No refreshing. Just results.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' as const }}>
          <Magnetic strength={0.3}>
            <Link href="/signup" className="btn-primary">
              Start Free on Web <span aria-hidden="true">→</span>
            </Link>
          </Magnetic>
          <Magnetic strength={0.3}>
            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              iOS App
            </a>
          </Magnetic>
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ padding: '40px clamp(24px,8vw,60px)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: S.bg, flexWrap: 'wrap' as const, gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Logo />
        <div>
          <div style={{ fontFamily: S.serif, fontSize: 18, fontWeight: 700, color: S.cream }}>Steward</div>
          <div style={{ fontSize: 12, color: 'rgba(247,246,243,0.3)' }}>© 2026 Steward. All rights reserved.</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 8 }}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' as const, alignItems: 'center' }}>
          {[['Resources', '/blog'], ['Privacy', '/privacy'], ['Terms', '/terms'], ['Support', '/support'], ['Sign In', '/login']].map(([label, href]) => (
            <Link key={href} href={href} className="lnd-footer-link"
              style={{ fontSize: 12, color: 'rgba(247,246,243,0.35)', textDecoration: 'none', transition: 'color .25s' }}>
              {label}
            </Link>
          ))}
          <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="lnd-footer-link"
            style={{ fontSize: 12, color: 'rgba(247,246,243,0.35)', textDecoration: 'none', transition: 'color .25s', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
            iOS App
          </a>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(247,246,243,0.25)' }}>
          Contact: <a href="mailto:hello@joinsteward.app" style={{ color: 'rgba(110,231,183,0.5)', textDecoration: 'none' }}>hello@joinsteward.app</a>
        </div>
      </div>
    </footer>
  )
}

// ── Scroll reveal ─────────────────────────────────────────────────────────────
function ScrollRevealInit() {
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement
          const s = getComputedStyle(el)
          const dStr = s.animationDelay || '0s'
          const ms = parseFloat(dStr) * (dStr.includes('ms') ? 1 : 1000)
          if (ms > 0) setTimeout(() => el.classList.add('visible'), ms)
          else el.classList.add('visible')
          obs.unobserve(el)
        }
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' })
    requestAnimationFrame(() => {
      document.querySelectorAll('.landing-reveal').forEach(el => obs.observe(el))
    })
    return () => obs.disconnect()
  }, [])
  return null
}

// ── Export ────────────────────────────────────────────────────────────────────
export function LandingClientPage() {
  return (
    <div style={{ background: 'var(--forest, #0A0C0B)', minHeight: '100vh', color: S.cream, position: 'relative' }}>
      {/* Concierge-restyle global layers — both fixed-position and pointer-
          events:none, so they sit behind/under all section content. */}
      <GlobalBg />
      <CursorSpotlight />
      <ScrollRevealInit />
      <Nav />
      <LandingHero />
      <Ticker />
      <PriceFeature />
      <AIFeature />
      <LandingHIW />
      <LandingUseCases />
      <PlatformShowcase />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />

      <style>{`
        /* Hover helpers that can't easily be inline */
        .lnd-cta-primary:hover { transform: translateY(-3px) scale(1.02) !important; box-shadow: 0 12px 40px rgba(110,231,183,0.35) !important; }
        .lnd-ghost-link:hover  { color: #6EE7B7 !important; }
        .lnd-feat-link:hover   { gap: 12px !important; }
        .lnd-chip:hover        { background: rgba(110,231,183,0.12) !important; color: #6EE7B7 !important; transform: translateY(-1px); }
        .lnd-demo-btn:hover    { transform: scale(1.04); box-shadow: 0 4px 16px rgba(110,231,183,0.3); }
        .lnd-footer-link:hover { color: #6EE7B7 !important; }
        .lnd-appstore-btn:hover { background: rgba(255,255,255,0.14) !important; border-color: rgba(255,255,255,0.25) !important; transform: translateY(-2px); }
        .lnd-nav-ios:hover { border-color: rgba(110,231,183,0.4) !important; background: rgba(110,231,183,0.08) !important; color: #6EE7B7 !important; }
        .lnd-appstore-hero:hover { background: rgba(110,231,183,0.1) !important; border-color: rgba(110,231,183,0.4) !important; transform: translateY(-3px) scale(1.02); box-shadow: 0 8px 32px rgba(110,231,183,0.15) !important; }

        /* Platform device scene */
        @keyframes platformFloatA {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes platformFloatB {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        /* Single pulse: phone→laptop→phone ping-pong (horizontal) */
        @keyframes beamPingPong {
          0%   { left: 0; opacity: 0; }
          3%   { opacity: 1; }
          48%  { left: calc(100% - 10px); opacity: 1; }
          50%  { left: calc(100% - 10px); opacity: 1; }
          52%  { opacity: 1; }
          97%  { left: 0; opacity: 1; }
          100% { left: 0; opacity: 0; }
        }
        /* Single pulse vertical: uses translateY so !important on top won't block it */
        @keyframes beamPingPongV {
          0%   { transform: translateY(0); opacity: 0; }
          3%   { opacity: 1; }
          48%  { transform: translateY(calc(var(--track-h, 100px) - 10px)); opacity: 1; }
          50%  { transform: translateY(calc(var(--track-h, 100px) - 10px)); opacity: 1; }
          52%  { opacity: 1; }
          97%  { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(0); opacity: 0; }
        }
        .lnd-sync-orb { animation: syncPulse 3s ease-in-out infinite; }
        @keyframes syncPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(110,231,183,0.1); }
          50% { box-shadow: 0 0 40px rgba(110,231,183,0.3), 0 0 80px rgba(110,231,183,0.1); }
        }

        /* Pulse dot for notification indicators */
        .lnd-pulse-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #6EE7B7; flex-shrink: 0; display: block;
          box-shadow: 0 0 8px rgba(110,231,183,0.5);
          animation: pulseDot 2s ease-in-out infinite;
        }

        /* Floating card parallax — CSS custom property method */
        [data-parallax] { translate: var(--px,0px) var(--py,0px); }

        /* Feature reverse on desktop */
        @media (min-width: 1101px) {
          .lnd-feature-reverse { direction: rtl; }
          .lnd-feature-reverse > * { direction: ltr; }
        }

        /* Responsive breakpoints */
        @media (max-width: 1100px) {
          .lnd-hero-cards { display: none !important; }
          .lnd-hero-text  { max-width: 100% !important; padding-left: 0 !important; text-align: center; }
          .lnd-feature-grid   { grid-template-columns: 1fr !important; gap: 48px !important; direction: ltr !important; }
          .lnd-feature-reverse { direction: ltr !important; }
          .lnd-pricing-grid   { grid-template-columns: 1fr !important; max-width: 440px; margin: 0 auto; }
          .lnd-device-scene       { flex-direction: column !important; gap: 0 !important; }
          .lnd-phone-mockup       { margin-bottom: 0; }
          .lnd-laptop-mockup      { width: 100% !important; max-width: 380px; }
          .lnd-sync-connector     { --track-h: 110px; flex-direction: column !important; min-width: unset !important; max-width: unset !important; width: auto !important; min-height: 110px; padding: 8px 0 !important; }
          .lnd-beam-track         { left: 50% !important; right: auto !important; top: 0 !important; bottom: 0 !important; width: 2px !important; height: auto !important; transform: translateX(-50%); background: repeating-linear-gradient(180deg, rgba(110,231,183,0.33) 0, rgba(110,231,183,0.33) 3px, transparent 3px, transparent 8px) !important; }
          .lnd-pulse-track        { left: 50% !important; right: auto !important; top: 0 !important; bottom: 0 !important; width: 10px !important; height: 110px !important; transform: translateX(-50%) !important; }
          .lnd-pulse-dot-pingpong { top: 0 !important; left: 0 !important; animation: beamPingPongV 3s ease-in-out infinite !important; }
          .lnd-hamburger      { display: flex !important; }
        }
        /* Hide the desktop nav links / show hamburger a bit sooner — the
           nav items are now larger so they need more horizontal room. */
        @media (max-width: 1200px) {
          .lnd-nav-links      { display: none !important; }
          .lnd-hamburger      { display: flex !important; }
        }
        @media (max-width: 768px) {
          .lnd-hero-text { padding: 0 !important; }
          nav { padding-left: clamp(16px, 5vw, 40px) !important; padding-right: clamp(16px, 5vw, 40px) !important; }
        }
        @media (max-width: 540px) {
          .lnd-pricing-grid { grid-template-columns: 1fr !important; }
          .lnd-feature-grid { gap: 36px !important; }
        }
        /* AI feature: show text above animation on mobile */
        @media (max-width: 1100px) {
          .lnd-ai-text { order: -1 !important; }
        }

        /* Shared fade-in for chat items */
        @keyframes tapHintPulse { 0%,100%{opacity:.4} 50%{opacity:1} }
        @keyframes sharePulse   { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.15)} }
      `}</style>
    </div>
  )
}
