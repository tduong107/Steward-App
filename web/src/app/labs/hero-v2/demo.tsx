'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
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

// ───── Floating cards (copy matches landing FLOAT_CARDS exactly) ─────

type FloatCard = {
  depth: number
  style: React.CSSProperties
  delay: number // ms
  isNotif?: boolean
  children: React.ReactNode
}

const FLOAT_CARDS: FloatCard[] = [
  {
    depth: 0.04,
    delay: 800,
    style: { right: '3%', top: '6%', width: 220 },
    children: (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>👟</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: C.cream, marginBottom: 2 }}>
              Nike Dunk Low Panda
            </div>
            <div style={{ fontSize: 10, color: C.textFaint }}>nike.com</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
          <span style={{ fontSize: 11, color: 'rgba(247,246,243,0.3)', textDecoration: 'line-through' }}>
            $120
          </span>
          <span style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.mint }}>
            $89
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: C.gold,
              background: 'rgba(245,158,11,0.12)',
              padding: '2px 6px',
              borderRadius: 10,
            }}
          >
            -26%
          </span>
        </div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 20,
            background: 'rgba(245,158,11,0.14)',
            border: '1px solid rgba(245,158,11,0.28)',
            color: C.gold,
            display: 'inline-block',
            marginTop: 10,
          }}
        >
          ↓ Target price hit!
        </div>
      </>
    ),
  },
  {
    depth: 0.025,
    delay: 1000,
    style: { left: '44%', top: '5%', width: 200 },
    children: (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>✈️</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: C.cream, marginBottom: 2 }}>
              SFO → Tokyo Narita
            </div>
            <div style={{ fontSize: 10, color: C.textFaint }}>Round trip · 2 adults</div>
          </div>
        </div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 20,
            background: 'rgba(110,231,183,0.08)',
            border: '1px solid rgba(110,231,183,0.15)',
            color: C.mint,
            display: 'inline-block',
            marginTop: 10,
          }}
        >
          📡 Monitoring fares
        </div>
      </>
    ),
  },
  {
    depth: 0.035,
    delay: 1200,
    style: { right: '1%', top: '54%', width: 205 },
    children: (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>🏕</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: C.cream, marginBottom: 2 }}>
              Yosemite · Upper Pines
            </div>
            <div style={{ fontSize: 10, color: C.textFaint }}>recreation.gov</div>
          </div>
        </div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 20,
            background: 'rgba(52,211,153,0.1)',
            border: '1px solid rgba(52,211,153,0.22)',
            color: '#34d399',
            display: 'inline-block',
            marginTop: 10,
          }}
        >
          🎉 Site available!
        </div>
      </>
    ),
  },
  {
    depth: 0.02,
    delay: 1400,
    style: { left: '44%', bottom: '5%', width: 190 },
    children: (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>🎫</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: C.cream, marginBottom: 2 }}>
              Kendrick Lamar · LA
            </div>
            <div style={{ fontSize: 10, color: C.textFaint }}>ticketmaster.com</div>
          </div>
        </div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 20,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.22)',
            color: '#f87171',
            display: 'inline-block',
            marginTop: 10,
          }}
        >
          Sold out · Monitoring
        </div>
      </>
    ),
  },
  {
    depth: 0.03,
    delay: 1600,
    style: { right: '5%', bottom: '2%', width: 190 },
    children: (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>📦</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: C.cream, marginBottom: 2 }}>
              PS5 Pro · Target
            </div>
            <div style={{ fontSize: 10, color: C.textFaint }}>target.com</div>
          </div>
        </div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 20,
            background: 'rgba(52,211,153,0.1)',
            border: '1px solid rgba(52,211,153,0.22)',
            color: '#34d399',
            display: 'inline-block',
            marginTop: 10,
          }}
        >
          Back in stock!
        </div>
      </>
    ),
  },
  {
    depth: 0.05,
    delay: 1800,
    isNotif: true,
    style: { left: '48%', top: '36%', width: 240 },
    children: (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: C.mint,
            marginTop: 4,
            flexShrink: 0,
            boxShadow: `0 0 0 4px rgba(110,231,183,0.2)`,
          }}
        />
        <div style={{ fontSize: 12, color: 'rgba(247,246,243,0.8)', lineHeight: 1.4 }}>
          <strong style={{ color: C.mint }}>Table found!</strong> Carbone NY just opened a Friday
          8pm slot for 2 guests.
          <span
            style={{
              display: 'block',
              fontSize: 10,
              color: 'rgba(247,246,243,0.35)',
              marginTop: 2,
            }}
          >
            Just now
          </span>
        </div>
      </div>
    ),
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
  const mouseRef = useRef({ x: 0, y: 0 })
  const curRef = useRef({ x: 0, y: 0 })
  const cardEls = useRef<Array<HTMLDivElement | null>>([])
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setCardsReady(true), 250)
    return () => clearTimeout(t)
  }, [])

  // Parallax loop — identical easing to landing-client-page.tsx
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      }
    }
    document.addEventListener('mousemove', onMove)
    const depths = FLOAT_CARDS.map((c) => c.depth)
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

        {/* ── RIGHT: concierge stage ── */}
        <div
          style={{
            position: 'absolute',
            right: '-10%',
            top: 0,
            bottom: 0,
            width: '75%',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          {/* Stage light — mint cone from above the robot */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.6, delay: 0.6, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: '50%',
              top: '-5%',
              width: 600,
              height: 600,
              marginLeft: -300,
              background:
                'radial-gradient(ellipse 50% 80% at 50% 0%, rgba(110,231,183,0.22), transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Robot halo — faint pulsing mint ring behind the robot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              left: '50%',
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

          {/* Floating "Your concierge" badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              left: '50%',
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

        {/* ── Floating deal cards layer ── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            pointerEvents: 'none',
          }}
        >
          {FLOAT_CARDS.map((card, i) => (
            <div
              key={i}
              ref={(el) => {
                cardEls.current[i] = el
              }}
              style={{
                position: 'absolute',
                ...card.style,
                background: card.isNotif
                  ? 'linear-gradient(135deg, rgba(42,92,69,0.8), rgba(28,61,46,0.6))'
                  : 'rgba(15,32,24,0.7)',
                border: card.isNotif
                  ? '1px solid rgba(110,231,183,0.25)'
                  : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 18,
                padding: 16,
                backdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                opacity: cardsReady ? 1 : 0,
                transition: `opacity .8s ${card.delay}ms ease`,
                pointerEvents: 'auto',
                fontFamily: SANS,
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={cardsReady ? { opacity: 1, y: 0, scale: 1 } : undefined}
                transition={{
                  duration: 0.6,
                  delay: card.delay / 1000,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {card.children}
              </motion.div>
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

