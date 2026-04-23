'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SplineScene } from '@/components/ui/splite'
import { Spotlight } from '@/components/ui/spotlight'

// Brand tokens — mirror the S object in landing-client-page.tsx so the
// preview reads as a true extension of production.
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

// Six cards in a balanced 3-top × 3-bottom grid around the robot.
// (Share Extension + AI Chat Setup were removed.)
//
//      NW      N      NE       ← Price Drops · Restaurants · Flight Deals
//          \  |  /
//             robot (~71% viewport)
//          /  |  \
//      SW      S      SE       ← Event Tickets · Restocks · Campsites
//
// Horizontal columns at left 44% / left 58% / right 3% put the 6 cards'
// geometric center at ~(68%, 50%) viewport — essentially where the
// robot lands, so he reads as the centerpiece of the ring.
// Detail copy is lifted verbatim from components/landing-use-cases.tsx.
const USE_CASES: UseCase[] = [
  // NW — top row, left
  {
    id: 'price-drops',
    icon: '📉',
    title: 'Price Drops',
    tag: 'Nike, Amazon, Best Buy & more',
    desc: 'Set a target price across thousands of retailers. Steward monitors 24/7 and pings you the second it hits your number, with fake deal detection so you never get played by inflated "sale" prices.',
    simBold: 'Price dropped!',
    simBody: "Nike Dunk Low Panda is now $89 at nike.com. That's 26% below your target.",
    style: { top: '3%', left: '44%', width: 170 },
    depth: 0.04,
    delay: 800,
  },
  // N — top row, center (above robot head)
  {
    id: 'restaurants',
    icon: '🍽',
    title: 'Restaurant Tables',
    tag: 'Resy & more',
    desc: "That impossible Resy reservation? Steward watches it around the clock and pings you the moment a table frees up so you can book before anyone else even knows it's available.",
    simBold: 'Table found!',
    simBody: 'Carbone NY just opened a Friday 8pm slot for 2 guests.',
    style: { top: '0%', left: '58%', width: 175 },
    depth: 0.025,
    delay: 900,
  },
  // NE — top row, right
  {
    id: 'flights',
    icon: '✈️',
    title: 'Flight Deals',
    tag: 'Major airlines & routes',
    desc: 'Set a fare threshold for any route and Steward monitors prices across airlines. The moment it drops below your target, you get an instant alert with a direct link to book.',
    simBold: 'Fare dropped!',
    simBody: "SFO → Tokyo round trip is now $1,120. That's $127 less than yesterday.",
    style: { top: '3%', right: '3%', width: 170 },
    depth: 0.035,
    delay: 1000,
  },
  // SW — bottom row, left
  {
    id: 'tickets',
    icon: '🎫',
    title: 'Event Tickets',
    tag: 'Ticketmaster & more',
    desc: 'Sold out before you could buy? Steward monitors Ticketmaster and other platforms for face-value drops and new inventory so you get tickets at a fair price, not scalper markup.',
    simBold: 'Tickets available!',
    simBody: '2 floor seats for Kendrick Lamar at The Forum just dropped at face value.',
    style: { bottom: '3%', left: '44%', width: 170 },
    depth: 0.04,
    delay: 1100,
  },
  // S — bottom row, center (below robot feet)
  {
    id: 'restocks',
    icon: '📦',
    title: 'Restocks',
    tag: 'Works on most URLs',
    desc: "Limited drops, sold-out sneakers, viral products that vanish in minutes. Steward monitors stock status and alerts you the moment something is back so you're always first in line.",
    simBold: 'Back in stock!',
    simBody: 'PS5 Pro is available at Target right now. Grab it before it sells out again.',
    style: { bottom: '0%', left: '58%', width: 175 },
    depth: 0.03,
    delay: 1200,
  },
  // SE — bottom row, right
  {
    id: 'campsites',
    icon: '🏕',
    title: 'Campsites',
    tag: 'Recreation.gov sites',
    desc: 'The best campsites book up in seconds. Steward watches Recreation.gov for cancellations on specific dates and pings you the moment one opens up so you can grab it first.',
    simBold: 'Site available!',
    simBody: "Yosemite Upper Pines has an opening Jun 14–16. Book it before it's gone.",
    style: { bottom: '3%', right: '3%', width: 170 },
    depth: 0.035,
    delay: 1300,
  },
]


const DEMO_CHIPS = [
  { q: 'Nike Dunk Low Panda', emoji: '👟' },
  { q: 'Carbone NY · Friday 8pm', emoji: '🍽' },
  { q: 'Yosemite Upper Pines', emoji: '🏕' },
  { q: 'SFO → Tokyo round trip', emoji: '✈️' },
]

// ───── Main hero ─────

export function HeroV2Demo() {
  const [cardsReady, setCardsReady] = useState(false)
  const [modal, setModal] = useState<UseCase | null>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const curRef = useRef({ x: 0, y: 0 })
  const cardEls = useRef<Array<HTMLDivElement | null>>([])
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setCardsReady(true), 250)
    return () => clearTimeout(t)
  }, [])

  const openModal = (uc: UseCase, trigger: EventTarget | null) => {
    triggerRef.current = trigger as HTMLElement | null
    setModal(uc)
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

  // Parallax loop — identical easing to landing-client-page.tsx
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      }
    }
    document.addEventListener('mousemove', onMove)
    const depths = USE_CASES.map((c) => c.depth)
    const loop = () => {
      curRef.current.x += (mouseRef.current.x - curRef.current.x) * 0.06
      curRef.current.y += (mouseRef.current.y - curRef.current.y) * 0.06
      cardEls.current.forEach((el, i) => {
        if (!el) return
        const d = depths[i] ?? 0.03
        const tx = curRef.current.x * d * 600
        const ty = curRef.current.y * d * 400
        el.style.transform = `translate(${tx}px, ${ty}px)`
      })
      rafRef.current = requestAnimationFrame(loop)
    }
    loop()
    return () => {
      document.removeEventListener('mousemove', onMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

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

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 1.8 }}
            style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
          >
            {['Free forever', 'No credit card', 'iOS & Web'].map((t, i) => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {i > 0 && (
                  <span
                    style={{
                      width: 3,
                      height: 3,
                      borderRadius: '50%',
                      background: 'rgba(247,246,243,0.2)',
                      display: 'inline-block',
                    }}
                  />
                )}
                <span style={{ fontSize: 12.5, color: 'rgba(247,246,243,0.35)', fontWeight: 300 }}>
                  {t}
                </span>
              </span>
            ))}
          </motion.div>

          {/* Demo bar */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2, ease: [0.22, 1, 0.36, 1] }}
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
          </motion.div>
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
          style={{
            position: 'absolute',
            left: '55%',
            right: '-20%',
            top: 0,
            bottom: 0,
            zIndex: 1,
            pointerEvents: 'none',
            // Tuned to match the 6-card grid's geometric center. The
            // GENKUB robot has an outstretched left arm that extends his
            // visual center ~2% right of his face, so translateX(10%)
            // puts the face around 67% and the full visual mass
            // (head + arm span) around 69% — matching the cards' center
            // of mass at ~68% horizontal.
            transform: 'translateX(10%)',
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

          {/* Floating "Your concierge" badge — aligned with robot */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              left: '9%',
              bottom: '10%',
              transform: 'translateX(-50%)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              background: 'rgba(15,32,24,0.85)',
              border: '1px solid rgba(110,231,183,0.3)',
              borderRadius: 999,
              backdropFilter: 'blur(12px)',
              fontFamily: SANS,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: C.mint,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: C.mint,
                boxShadow: '0 0 0 4px rgba(110,231,183,0.2)',
              }}
            />
            Your concierge · On duty
          </motion.div>
        </div>

        {/* ── Clickable use case cards layer ── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            pointerEvents: 'none',
          }}
        >
          {USE_CASES.map((uc, i) => (
            <div
              key={uc.id}
              ref={(el) => {
                cardEls.current[i] = el
              }}
              style={{
                position: 'absolute',
                ...uc.style,
                pointerEvents: 'none',
              }}
            >
              <UseCaseCard
                useCase={uc}
                ready={cardsReady}
                isOpen={modal?.id === uc.id}
                onClick={(e) => openModal(uc, e.currentTarget)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Lab preview label */}
      <div
        style={{
          position: 'absolute',
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
        }}
      >
        Labs · Hero v2 preview
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
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={`Learn more about ${useCase.title}`}
      initial={{ opacity: 0, y: 14, scale: 0.94 }}
      animate={
        ready ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 14, scale: 0.94 }
      }
      transition={{
        duration: 0.55,
        delay: useCase.delay / 1000,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.96 }}
      style={{
        position: 'relative',
        width: '100%',
        padding: '12px 14px',
        background: isOpen
          ? 'linear-gradient(135deg, rgba(42,92,69,0.85), rgba(28,61,46,0.55))'
          : 'rgba(15,32,24,0.72)',
        border: isOpen
          ? '1px solid rgba(110,231,183,0.55)'
          : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: isOpen
          ? '0 0 0 4px rgba(110,231,183,0.18), 0 12px 32px rgba(0,0,0,0.4)'
          : '0 8px 28px rgba(0,0,0,0.3)',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: SANS,
        color: 'inherit',
        pointerEvents: 'auto',
        transition: 'border-color 0.3s, background 0.3s, box-shadow 0.3s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'rgba(110,231,183,0.08)',
            border: '1px solid rgba(110,231,183,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {useCase.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 14,
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
              marginTop: 3,
              fontSize: 10,
              color: C.mint,
              fontWeight: 600,
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            ✓ {useCase.tag}
          </div>
        </div>
      </div>
    </motion.button>
  )
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
