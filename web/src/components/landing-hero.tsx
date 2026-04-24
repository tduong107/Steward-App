'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { track } from '@vercel/analytics'
import { SplineScene } from '@/components/ui/splite'
import { Spotlight } from '@/components/ui/spotlight'

// Brand tokens — mirror the S object in landing-client-page.tsx so the
// hero reads as a true extension of the rest of the landing.
const C = {
  mint: '#6EE7B7',
  forest: '#0F2018',
  green: '#1C3D2E',
  green2: '#2A5C45',
  gold: '#F59E0B',
  cream: '#F7F6F3',
  bg: '#080A08',
  textDim: 'rgba(247,246,243,0.55)',
  textFaint: 'rgba(247,246,243,0.35)',
  border: 'rgba(255,255,255,0.06)',
  borderMint: 'rgba(110,231,183,0.18)',
}

const SERIF = 'Georgia, "Times New Roman", serif'
const SANS =
  '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif'

// "GENKUB - Greeting robot" from spline.design/community — picked
// because it waves hello (concierge-y) and has cleaner lines than the
// generic humanoid. Runtime URL via my.spline.design publish.
const SPLINE_URL = 'https://prod.spline.design/PMjj5iAHXFgvcUSQ/scene.splinecode'

// ───── Use cases (match the 8 cards on the landing's "One app, endless
// ways to save" grid, but rendered here as clickable floating chips
// distributed around the concierge robot) ─────

type UseCase = {
  id: string
  icon: string
  title: string
  tag: string
  desc: string // long-form, shown in modal
  simBold: string // "Price dropped!" header in simulation card
  simBody: string // narrative simulation body
  style: {
    left?: string
    right?: string
    top?: string
    bottom?: string
    width: number
  }
  depth: number
  delay: number // ms
}

// Six cards clustered in the gap between hero text and robot.
// Previously spread NW/N/NE across 44%–97% horizontal, which read as
// "scattered." Now packed into a 2-column × 3-row grid at left:44% /
// left:58% so they fill the empty middle space. The right column and
// middle row will slightly overlap the robot's body — that's by design
// per the user's direction ("that is fine if the cards are clipping
// the robot a little bit").
//
//   col 44%            col 58%
//   ┌──────────────┐   ┌──────────────┐
//   │ Price Drops  │   │ Restaurants  │   ← top row (top: 3%)
//   └──────────────┘   └──────────────┘
//   ┌──────────────┐   ┌──────────────┐
//   │ Flight Deals │   │ Event Tickets│   ← middle row (top: 38%)
//   └──────────────┘   └──────────────┘
//   ┌──────────────┐   ┌──────────────┐
//   │ Restocks     │   │ Campsites    │   ← bottom row (bottom: 3%)
//   └──────────────┘   └──────────────┘
//
// Detail copy is lifted verbatim from components/landing-use-cases.tsx.
const USE_CASES: UseCase[] = [
  // Positions are hand-tuned with 3-7% random-feel offsets on both X
  // and Y so the 6 cards break out of a strict 2×3 grid — no two share
  // a horizontal row or vertical column. The overall cluster still
  // sits in the middle gap between hero text and robot, but the
  // layout reads as organic scatter instead of spreadsheet rows.
  {
    id: 'price-drops',
    icon: '📉',
    title: 'Price Drops',
    tag: 'Nike, Amazon, Best Buy & more',
    desc: 'Set a target price across thousands of retailers. Steward monitors 24/7 and pings you the second it hits your number, with fake deal detection so you never get played by inflated "sale" prices.',
    simBold: 'Price dropped!',
    simBody: "Nike Dunk Low Panda is now $89 at nike.com. That's 26% below your target.",
    style: { top: '14%', left: '44%', width: 180 },
    depth: 0.04,
    delay: 800,
  },
  {
    id: 'restaurants',
    icon: '🍽',
    title: 'Restaurant Tables',
    tag: 'Resy & more',
    desc: "That impossible Resy reservation? Steward watches it around the clock and pings you the moment a table frees up so you can book before anyone else even knows it's available.",
    simBold: 'Table found!',
    simBody: 'Carbone NY just opened a Friday 8pm slot for 2 guests.',
    style: { top: '24%', left: '61%', width: 180 },
    depth: 0.025,
    delay: 900,
  },
  {
    id: 'flights',
    icon: '✈️',
    title: 'Flight Deals',
    tag: 'Major airlines & routes',
    desc: 'Set a fare threshold for any route and Steward monitors prices across airlines. The moment it drops below your target, you get an instant alert with a direct link to book.',
    simBold: 'Fare dropped!',
    simBody: "SFO → Tokyo round trip is now $1,120. That's $127 less than yesterday.",
    style: { top: '40%', left: '47%', width: 180 },
    depth: 0.035,
    delay: 1000,
  },
  {
    id: 'campsites',
    icon: '🏕',
    title: 'Campsites',
    tag: 'Recreation.gov sites',
    desc: 'The best campsites book up in seconds. Steward watches Recreation.gov for cancellations on specific dates and pings you the moment one opens up so you can grab it first.',
    simBold: 'Site available!',
    simBody: "Yosemite Upper Pines has an opening Jun 14–16. Book it before it's gone.",
    style: { top: '50%', left: '62%', width: 180 },
    depth: 0.03,
    delay: 1100,
  },
  {
    id: 'tickets',
    icon: '🎫',
    title: 'Event Tickets',
    tag: 'Ticketmaster & more',
    desc: 'Sold out before you could buy? Steward monitors Ticketmaster and other platforms for face-value drops and new inventory so you get tickets at a fair price, not scalper markup.',
    simBold: 'Tickets available!',
    simBody: '2 floor seats for Kendrick Lamar at The Forum just dropped at face value.',
    style: { top: '66%', left: '45%', width: 180 },
    depth: 0.04,
    delay: 1200,
  },
  {
    id: 'restocks',
    icon: '📦',
    title: 'Restocks',
    tag: 'Works on most URLs',
    desc: "Limited drops, sold-out sneakers, viral products that vanish in minutes. Steward monitors stock status and alerts you the moment something is back so you're always first in line.",
    simBold: 'Back in stock!',
    simBody: 'PS5 Pro is available at Target right now. Grab it before it sells out again.',
    style: { top: '76%', left: '60%', width: 180 },
    depth: 0.035,
    delay: 1300,
  },
]


// Four example prompts that demo what the AI concierge can parse. Each
// chip carries the full shape of a DemoResult so tapping it fills the
// input + shows the simulated "Found by AI concierge" result card.
type DemoResult = { emoji: string; q: string; price: string; site: string; action: string }

const DEMO_CHIPS: DemoResult[] = [
  { q: 'Nike Dunk Low Panda',     emoji: '👟', site: 'nike.com',           price: '$120',      action: '📉 Alert below $90' },
  { q: 'Carbone NY · Friday 8pm', emoji: '🍽', site: 'resy.com',           price: '2 guests',  action: '🍽 Alert on openings' },
  { q: 'Yosemite Upper Pines',    emoji: '🏕', site: 'recreation.gov',     price: 'Jun 14-16', action: '🏕 Alert on cancellation' },
  { q: 'SFO → Tokyo round trip',  emoji: '✈️', site: 'google.com/flights', price: '$1,247',    action: '✈️ Alert on fare drop' },
]

// ───── Main hero ─────

export function LandingHero() {
  const [cardsReady, setCardsReady] = useState(false)
  const [modal, setModal] = useState<UseCase | null>(null)
  const [demoInput, setDemoInput] = useState('')
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoResult, setDemoResult] = useState<DemoResult | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setCardsReady(true), 250)
    return () => clearTimeout(t)
  }, [])

  const openModal = (uc: UseCase, trigger: EventTarget | null) => {
    triggerRef.current = trigger as HTMLElement | null
    setModal(uc)
  }

  // Demo bar — fills the input + shows a fake "AI found it" result
  // card after a short spinner. Same behaviour as the original
  // landing-client-page.tsx Hero().
  const runDemo = (data: DemoResult) => {
    setDemoResult(null)
    setDemoLoading(true)
    setDemoInput(data.q)
    setTimeout(() => {
      setDemoLoading(false)
      setDemoResult(data)
    }, 1400)
  }

  // Sensible fallback for a free-form input — grab the first matching
  // chip or build a generic result if nothing matches.
  const runFreeformDemo = () => {
    const q = demoInput.trim()
    if (!q) return
    const match = DEMO_CHIPS.find((c) => c.q.toLowerCase().includes(q.toLowerCase()))
    runDemo(match ?? { emoji: '✦', q, site: 'steward', price: 'AI detected', action: '📡 Start monitoring' })
  }

  // Focus management — mirrors LandingUseCases modal
  useEffect(() => {
    if (modal) {
      closeBtnRef.current?.focus()
    } else {
      triggerRef.current?.focus()
    }
  }, [modal])

  // ESC to close
  useEffect(() => {
    if (!modal) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModal(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modal])

  // Note: the mouse-parallax RAF loop that used to run here was
  // removed for performance. It was mutating 6 DOM elements'
  // `style.transform` every frame, competing with the Spline WebGL
  // canvas for GPU/compositor time. The idle-float feeling is now
  // handled by a pure CSS keyframe on each card (see <style> below),
  // which runs on the compositor thread and doesn't touch JS.

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        background: C.bg,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: SANS,
      }}
    >
      {/* Resource hints — React 19 hoists these to <head>. Preconnect
          lets the browser open the TLS handshake to Spline's CDN in
          parallel with the page render, and preload pre-fetches the
          ~380 KB .splinecode binary so the robot pops in ~1-2s faster
          on a cold load. */}
      <link rel="preconnect" href="https://prod.spline.design" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://prod.spline.design" />
      <link
        rel="preload"
        as="fetch"
        href={SPLINE_URL}
        crossOrigin="anonymous"
      />

      {/* CSS animations for card float + dot pulse. Used to be
          framer-motion infinite loops — see UseCaseCard comments for
          the perf context. Using <style> inline so the keyframes ship
          only when this component mounts. */}
      <style>{`
        @keyframes hero-card-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-5px); }
        }
        .hero-float-card {
          animation-name: hero-card-float;
          animation-duration: var(--hero-float-dur, 4s);
          animation-delay: var(--hero-float-delay, 0s);
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
          will-change: transform;
        }
        @keyframes hero-dot-pulse {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.15); }
        }
        .hero-dot-pulse {
          animation-name: hero-dot-pulse;
          animation-duration: 2s;
          animation-delay: var(--hero-dot-delay, 0s);
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-float-card,
          .hero-dot-pulse { animation: none; }
        }

        /* Desktop (>= 768px): show the absolute-positioned Spline +
           floating cards, hide the mobile grid. */
        .hero-stage-desktop { display: block; }
        .hero-stage-mobile  { display: none; }

        @media (max-width: 767px) {
          /* Mobile: hide the Spline canvas and the absolute-positioned
             cards layer entirely (both use .hero-stage-desktop). The
             floating layout depends on a wide viewport; on phones the
             cards would overlap the hero text and the Spline canvas
             is a 380 KB download for a visual that doesn't fit. */
          .hero-stage-desktop { display: none !important; }

          /* Mobile: 2-column use-case grid below the demo bar. */
          .hero-stage-mobile {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          /* Cards are positioned absolute on desktop; reset for mobile. */
          .hero-stage-mobile > * {
            width: 100% !important;
            position: static !important;
            animation: none;
          }
        }
      `}</style>

      {/* Ambient gradient washes (mirror landing) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 900px 800px at 30% 40%, rgba(42,92,69,0.5) 0%, transparent 60%), radial-gradient(ellipse 600px 500px at 75% 25%, rgba(110,231,183,0.07) 0%, transparent 55%), radial-gradient(ellipse 500px 700px at 80% 80%, rgba(28,61,46,0.35) 0%, transparent 55%)',
        }}
      />
      {/* Dot grid overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle, rgba(110,231,183,0.07) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        }}
      />

      {/* Aceternity-style spotlight sweep on load */}
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="rgba(110,231,183,0.6)" />

      {/* Scene container */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: 1400,
          minHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          padding: '80px 40px',
        }}
      >
        {/* ── LEFT: hero copy ── */}
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 560, flexShrink: 0 }}>
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(110,231,183,0.08)',
              border: '1px solid rgba(110,231,183,0.18)',
              borderRadius: 30,
              padding: '6px 16px',
              marginBottom: 28,
            }}
          >
            <span style={{ fontSize: 14, color: C.mint }}>✦</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: C.mint,
              }}
            >
              Now on the App Store &amp; Web
            </span>
          </motion.div>

          {/* Headline — word reveal */}
          <h1
            style={{
              fontFamily: SERIF,
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              color: C.cream,
              margin: 0,
              marginBottom: 24,
              fontSize: 'clamp(38px, 5.5vw, 62px)',
              fontWeight: 700,
            }}
          >
            {['Scalpers', 'have', 'bots'].map((w, i) => (
              <RevealWord key={w} word={w} delay={0.5 + i * 0.1} marginRight="0.22em" />
            ))}
            <br />
            {['Now', 'you', 'have', 'a\u00a0concierge'].map((w, i) => (
              <RevealWord
                key={w}
                word={w}
                delay={0.85 + i * 0.1}
                marginRight={i < 3 ? '0.22em' : '0'}
                italic
                color={C.mint}
              />
            ))}
          </h1>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontSize: 17,
              lineHeight: 1.65,
              color: C.textDim,
              fontWeight: 300,
              marginBottom: 36,
              maxWidth: 440,
            }}
          >
            Be the first to snag deals, hard to get reservations, and sold-out tickets with Steward.
            Your personalized AI concierge that levels the playing field.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}
          >
            <a
              href="/signup"
              onClick={() => track('signup_button_click', { location: 'hero' })}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                background: C.mint,
                color: C.forest,
                fontSize: 16,
                fontWeight: 700,
                padding: '18px 36px',
                borderRadius: 14,
                textDecoration: 'none',
                boxShadow: '0 10px 40px rgba(110,231,183,0.3)',
              }}
            >
              Start for free <span>→</span>
            </a>
            <a
              href="https://apps.apple.com/us/app/steward-concierge/id6760180137"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('app_store_click', { location: 'hero' })}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(110,231,183,0.25)',
                color: C.cream,
                fontSize: 16,
                fontWeight: 700,
                padding: '18px 36px',
                borderRadius: 14,
                textDecoration: 'none',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={C.mint}>
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              iOS App
            </a>
          </motion.div>

          {/* Demo bar — functional AI-search simulation */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.9, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginTop: 32, maxWidth: 460 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14,
                padding: '6px 6px 6px 18px',
              }}
            >
              <input
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    runFreeformDemo()
                  }
                }}
                placeholder="What do you want to track?"
                aria-label="What do you want Steward to track?"
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  fontSize: 14.5,
                  color: C.cream,
                  minWidth: 0,
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={runFreeformDemo}
                style={{
                  background: C.mint,
                  color: C.forest,
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                  padding: '10px 20px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  flexShrink: 0,
                  fontFamily: 'inherit',
                }}
              >
                Track it ✦
              </button>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              {DEMO_CHIPS.map((chip) => (
                <button
                  key={chip.q}
                  onClick={() => runDemo(chip)}
                  style={{
                    background: 'rgba(110,231,183,0.06)',
                    border: '1px solid rgba(110,231,183,0.14)',
                    borderRadius: 20,
                    padding: '5px 12px',
                    fontSize: 11.5,
                    color: 'rgba(110,231,183,0.7)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontFamily: 'inherit',
                  }}
                >
                  {chip.emoji} {chip.q}
                </button>
              ))}
            </div>

            {/* Loading spinner */}
            {demoLoading && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 14,
                  fontSize: 12,
                  color: 'rgba(110,231,183,0.7)',
                }}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    border: '2px solid rgba(110,231,183,0.2)',
                    borderTopColor: C.mint,
                    animation: 'hiw-spin .8s linear infinite',
                    display: 'inline-block',
                  }}
                />
                Steward is searching...
              </div>
            )}

            {/* Result card (appears after 1.4s "search") */}
            {!demoLoading && demoResult && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  marginTop: 14,
                  background:
                    'linear-gradient(135deg, rgba(42,92,69,0.5), rgba(15,32,24,0.3))',
                  border: '1px solid rgba(110,231,183,0.2)',
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 10,
                  }}
                >
                  <span style={{ color: C.mint }}>✦</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: C.mint,
                    }}
                  >
                    Found by AI concierge
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <span style={{ fontSize: 28 }}>{demoResult.emoji}</span>
                  <div>
                    <div
                      style={{ fontSize: 14, fontWeight: 600, color: C.cream }}
                    >
                      {demoResult.q}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'rgba(247,246,243,0.4)',
                      }}
                    >
                      {demoResult.price} · {demoResult.site}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <a
                    href="/signup"
                    onClick={() =>
                      track('signup_button_click', {
                        location: `hero_demo_${demoResult.q}`,
                      })
                    }
                    style={{
                      fontSize: 11,
                      padding: '6px 14px',
                      borderRadius: 10,
                      background: C.mint,
                      color: C.forest,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    {demoResult.action}
                  </a>
                  <button
                    onClick={() => setDemoResult(null)}
                    style={{
                      fontSize: 11,
                      padding: '6px 14px',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(247,246,243,0.6)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Change condition
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* ── Mobile card grid — 2×3 use cases below the demo bar.
              Only visible < 768px; desktop hides this via CSS. The
              Spline robot + absolute-positioned floating cards layer
              above are display:none'd on the same breakpoint, since
              the absolute-positioned layout can't fit on narrow
              viewports and the robot is a 380 KB download that's a
              rough trade on mobile networks anyway. */}
          <div className="hero-stage-mobile" style={{ marginTop: 40 }}>
            {USE_CASES.map((uc) => (
              <UseCaseCard
                key={uc.id}
                useCase={uc}
                ready={cardsReady}
                isOpen={modal?.id === uc.id}
                onClick={(e) => openModal(uc, e.currentTarget)}
              />
            ))}
          </div>
        </div>

        {/* ── RIGHT: concierge stage ──
            The GENKUB scene renders its robot left-of-canvas-center in
            its own scene coordinates, so we (a) start the canvas
            further right and (b) apply a translateX on the container to
            physically shift the rendered canvas further right. Together
            these put the robot's visual center around 78-82% of the
            viewport — clear of the hero-text column AND the 8 use case
            cards that now sit in the left-center gap. */}
        <div
          className="hero-stage-desktop"
          style={{
            position: 'absolute',
            // Canvas widened from 65% → 85% (left:45 + right:-30) so the
            // robot's raised waving arm no longer clips at the left edge
            // during the GENKUB greeting animation's peak frames. The
            // wider canvas means the Spline camera captures more of the
            // scene horizontally.
            left: '45%',
            right: '-30%',
            top: 0,
            bottom: 0,
            zIndex: 1,
            pointerEvents: 'none',
            // Retuned shift to keep robot face landing around 64% of
            // viewport (cards' geometric center of mass). Formula:
            //   face% = left + translateX*width + 0.09*width
            //   64   = 45 + 0.13*85 + 0.09*85 = 45 + 11 + 7.65 = 63.65%
            transform: 'translateX(13%)',
          }}
        >
          {/* Stage light — mint cone from above the robot. Positioned at
              container-left 9% to align with the robot's actual render
              position inside the Spline canvas (GENKUB renders ~9% from
              the left edge of its scene, not at canvas center). */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.6, delay: 0.6, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: '9%',
              top: '-5%',
              width: 600,
              height: 600,
              marginLeft: -300,
              background:
                'radial-gradient(ellipse 50% 80% at 50% 0%, rgba(110,231,183,0.22), transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Robot halo — aligned with robot render position */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              left: '9%',
              top: '42%',
              width: 480,
              height: 480,
              marginLeft: -240,
              marginTop: -240,
              borderRadius: '50%',
              background:
                'radial-gradient(circle at 50% 50%, rgba(110,231,183,0.18) 0%, rgba(110,231,183,0.04) 40%, transparent 70%)',
              filter: 'blur(30px)',
              pointerEvents: 'none',
            }}
          />

          {/* Spline robot */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'auto',
            }}
          >
            <SplineScene scene={SPLINE_URL} className="w-full h-full" />
          </div>

        </div>

        {/* ── Clickable use case cards layer (desktop) ── */}
        <div
          className="hero-stage-desktop"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            pointerEvents: 'none',
          }}
        >
          {USE_CASES.map((uc) => {
            // Per-card CSS-animation timing, seeded from the id so
            // hot-reloads keep rhythm but cards don't pulse in lockstep.
            const hash = hashCode(uc.id)
            const floatDur = 3.2 + (hash % 200) / 100 // 3.2–5.2s
            const floatDelay = (hash % 1200) / 1000 // 0–1.2s
            const dotDelay = (hash % 800) / 1000 // 0–0.8s
            return (
              <div
                key={uc.id}
                className="hero-float-card"
                style={
                  {
                    position: 'absolute',
                    ...uc.style,
                    pointerEvents: 'none',
                    '--hero-float-dur': `${floatDur}s`,
                    '--hero-float-delay': `${floatDelay}s`,
                    '--hero-dot-delay': `${dotDelay}s`,
                  } as React.CSSProperties
                }
              >
                <UseCaseCard
                  useCase={uc}
                  ready={cardsReady}
                  isOpen={modal?.id === uc.id}
                  onClick={(e) => openModal(uc, e.currentTarget)}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Use-case detail modal — opened when a floating card is clicked */}
      <AnimatePresence>
        {modal && (
          <UseCaseModal
            key={modal.id}
            useCase={modal}
            onClose={() => setModal(null)}
            closeRef={closeBtnRef}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

// ───── Sub-components ─────

function RevealWord({
  word,
  delay,
  marginRight,
  italic = false,
  color,
}: {
  word: string
  delay: number
  marginRight: string
  italic?: boolean
  color?: string
}) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: 'inline-block',
        marginRight,
        color,
        fontStyle: italic ? 'italic' : 'normal',
      }}
    >
      {word}
    </motion.span>
  )
}


// ───── Use case card ─────
//
// Clickable chip rendered at an absolute position (set by the parent
// wrapper). Handles:
//  - Staggered entrance (spring-in via framer-motion delay from props)
//  - Hover lift (scale + translateY)
//  - Tap press (scale down briefly)
//  - Click selection: mint ring ripples outward + border brightens,
//    controlled via `activeId + clickCount` from the parent so tapping
//    the same card re-fires the animation.

function UseCaseCard({
  useCase,
  ready,
  isOpen,
  onClick,
}: {
  useCase: UseCase
  ready: boolean
  isOpen: boolean
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
}) {
  // Idle floating is handled by the `.hero-float-card` CSS animation on
  // the parent wrapper. This component only drives entrance (one-shot),
  // hover, and tap — so framer-motion's frame-scheduler is only busy
  // during explicit user interaction, not on every tick.
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={`Learn more about ${useCase.title}`}
      initial={{ opacity: 0, y: 14, scale: 0.94 }}
      animate={ready ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 14, scale: 0.94 }}
      transition={{
        duration: 0.55,
        delay: ready ? useCase.delay / 1000 : 0,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ scale: 1.06, y: -6, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.97 }}
      style={{
        position: 'relative',
        width: '100%',
        padding: '14px',
        // Fully opaque gradient replaces the previous 82%-alpha + 18px
        // backdrop-filter blur — blurring a moving element was forcing
        // the compositor to re-paint behind each card every frame, the
        // single biggest GPU hit in the hero. Solid bg preserves the
        // same look without GPU tax.
        background: isOpen
          ? 'linear-gradient(135deg, #1F3A2B, #132219)'
          : 'linear-gradient(135deg, #142A1F, #0A120E)',
        border: isOpen
          ? '1px solid rgba(110,231,183,0.55)'
          : '1px solid rgba(110,231,183,0.18)',
        borderRadius: 16,
        boxShadow: isOpen
          ? '0 0 0 4px rgba(110,231,183,0.18), 0 14px 36px rgba(0,0,0,0.45)'
          : '0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: SANS,
        color: 'inherit',
        pointerEvents: 'auto',
        overflow: 'hidden',
        transition: 'border-color 0.3s, background 0.3s, box-shadow 0.3s',
        willChange: 'transform',
      }}
    >
      {/* Live mint dot top-right — CSS @keyframes (see <style> above);
          framer-motion was running 6 parallel infinite opacity/scale
          animations here, one per card, which was pure overhead. */}
      <span
        aria-hidden="true"
        className="hero-dot-pulse"
        style={{
          position: 'absolute',
          top: 10,
          right: 14,
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: C.mint,
          boxShadow: '0 0 8px rgba(110,231,183,0.8)',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background:
              'linear-gradient(135deg, rgba(110,231,183,0.22), rgba(110,231,183,0.04))',
            border: '1px solid rgba(110,231,183,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          {useCase.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 15,
              fontWeight: 700,
              color: C.cream,
              letterSpacing: '-0.01em',
              lineHeight: 1.15,
            }}
          >
            {useCase.title}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 10.5,
              color: C.mint,
              fontWeight: 600,
              letterSpacing: '0.02em',
              lineHeight: 1.35,
            }}
          >
            ✓ {useCase.tag}
          </div>
        </div>
      </div>

    </motion.button>
  )
}

// Simple deterministic hash for seeding per-card animation params.
function hashCode(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

// ───── Modal (mirrors LandingUseCases.modal — same copy shape & look) ─────

function UseCaseModal({
  useCase,
  onClose,
  closeRef,
}: {
  useCase: UseCase
  onClose: () => void
  closeRef: React.RefObject<HTMLButtonElement | null>
}) {
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${useCase.title} details`}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: C.forest,
          border: '1px solid rgba(110,231,183,0.2)',
          borderRadius: 24,
          padding: 'clamp(24px,5vw,36px)',
          maxWidth: 480,
          width: '100%',
          position: 'relative',
          maxHeight: '90dvh',
          overflowY: 'auto',
          fontFamily: SANS,
        }}
      >
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Close dialog"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            color: 'rgba(247,246,243,0.55)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ✕
        </button>
        <div style={{ fontSize: 40, marginBottom: 16 }}>{useCase.icon}</div>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 28,
            fontWeight: 700,
            color: C.cream,
            marginBottom: 8,
            letterSpacing: '-0.02em',
          }}
        >
          {useCase.title}
        </div>
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: 'rgba(247,246,243,0.6)',
            marginBottom: 20,
            fontWeight: 300,
          }}
        >
          {useCase.desc}
        </div>
        <div
          style={{
            background: 'rgba(110,231,183,0.06)',
            border: '1px solid rgba(110,231,183,0.15)',
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: C.mint,
              boxShadow: '0 0 10px rgba(110,231,183,0.6)',
              marginTop: 5,
              flexShrink: 0,
              display: 'block',
            }}
          />
          <div
            style={{
              fontSize: 13,
              color: 'rgba(247,246,243,0.7)',
              lineHeight: 1.45,
            }}
          >
            <strong style={{ color: C.cream }}>{useCase.simBold}</strong>{' '}
            {useCase.simBody}
          </div>
        </div>
        <a
          href="/signup"
          onClick={() => track('signup_button_click', { location: `hero_modal_${useCase.id}` })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: C.mint,
            color: C.forest,
            fontSize: 14,
            fontWeight: 700,
            padding: '12px 24px',
            borderRadius: 12,
            textDecoration: 'none',
          }}
        >
          Try it free →
        </a>
      </motion.div>
    </motion.div>
  )
}
