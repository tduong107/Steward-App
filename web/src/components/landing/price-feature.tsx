/**
 * Price Drops feature section (S/02) — Server Component shell.
 *
 * Phase 10 server-shell refactor. The interactive children
 * (`Magnetic`, `Bento`, `LivePrice`, `EyebrowPill`) are themselves
 * client components and hydrate as their own islands; everything
 * else here — copy, retailer row, SVG chart, target-hit banner —
 * ships as zero-JS HTML.
 *
 * The big LivePrice text + the floating chip + the SVG chart are the
 * visually busy parts of S/02, but none of them need React state at
 * this level. The CSS keyframes for chip float + chart ping are
 * inlined via <style> at the end (still allowed in server components).
 */

import { EyebrowPill } from '@/components/landing-fx/eyebrow-pill'
import { Bento } from '@/components/landing-fx/bento'
import { LivePrice } from '@/components/landing-fx/live-price'
import { PriceCTA } from './price-cta'
import { S } from './tokens'

// Retailers shown beneath the body copy. Order is editorial — most
// recognizable names lead.
const PRICE_RETAILERS = ['Amazon', 'Nike', 'Best Buy', 'Target', 'Walmart', 'Nordstrom']

// 9 chart waypoints descending from y=20 to y=52 (just above the
// dashed target line). Hand-tuned wiggle so the line reads like a real
// 30-day price history rather than a smooth curve. Width 300, viewBox
// 300×60.
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
const PRICE_CHART_PATH = PRICE_CHART_POINTS.map(
  (p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`,
).join(' ')
const PRICE_CHART_FILL_PATH = `${PRICE_CHART_PATH} L300,60 L0,60 Z`

export function PriceFeature() {
  return (
    <section
      style={{
        padding: 'clamp(60px,10vh,120px) clamp(24px,8vw,60px)',
        background: 'transparent',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
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
            Works across Amazon, Nike, Best Buy, Target, Walmart, and thousands of
            other retailers. Steward monitors 24/7 and pings you the moment your
            target hits — with fake-deal detection so you never get played by
            artificially inflated prices.
          </p>

          <PriceCTA />

          {/* Retailer row */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 26 }}>
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
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 24 }}>
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

            {/* 30-day price chart */}
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
                <path d={PRICE_CHART_FILL_PATH} fill="url(#s02-area-fill)" />
                <path
                  d={PRICE_CHART_PATH}
                  stroke="var(--mint, #6EE7B7)"
                  strokeWidth="2"
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
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
