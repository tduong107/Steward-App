'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Radar, IconContainer } from '@/components/ui/radar-effect'
import { EyebrowPill } from '@/components/landing-fx/eyebrow-pill'

type Detail = {
  emoji: string
  title: string
  desc: string
  simBold: string
  simBody: string
}

type Card = {
  emoji: string
  name: string
  detail: Detail
}

const CARDS: Card[] = [
  {
    emoji: '📉', name: 'Price Drops',
    detail: { emoji: '📉', title: 'Price Drops', desc: 'Set a target price across thousands of retailers. Steward monitors 24/7 and pings you the second it hits your number, with fake deal detection so you never get played by inflated "sale" prices.', simBold: 'Price dropped!', simBody: 'Nike Dunk Low Panda is now $89 at nike.com. That\'s 26% below your target.' },
  },
  {
    emoji: '🍽', name: 'Restaurant Tables',
    detail: { emoji: '🍽', title: 'Restaurant Tables', desc: 'That impossible Resy reservation? Steward watches it around the clock and pings you the moment a table frees up so you can book before anyone else even knows it\'s available.', simBold: 'Table found!', simBody: 'Carbone NY just opened a Friday 8pm slot for 2 guests.' },
  },
  {
    emoji: '✈️', name: 'Flight Deals',
    detail: { emoji: '✈️', title: 'Flight Deals', desc: 'Set a fare threshold for any route and Steward monitors prices across airlines. The moment it drops below your target, you get an instant alert with a direct link to book.', simBold: 'Fare dropped!', simBody: 'SFO → Tokyo round trip is now $1,120. That\'s $127 less than yesterday.' },
  },
  {
    emoji: '🏕', name: 'Campsites',
    detail: { emoji: '🏕', title: 'Campsites', desc: 'The best campsites book up in seconds. Steward watches Recreation.gov for cancellations on specific dates and pings you the moment one opens up so you can grab it first.', simBold: 'Site available!', simBody: 'Yosemite Upper Pines has an opening Jun 14–16. Book it before it\'s gone.' },
  },
  {
    emoji: '🎫', name: 'Event Tickets',
    detail: { emoji: '🎫', title: 'Event Tickets', desc: 'Sold out before you could buy? Steward monitors Ticketmaster and other platforms for face-value drops and new inventory so you get tickets at a fair price, not scalper markup.', simBold: 'Tickets available!', simBody: '2 floor seats for Kendrick Lamar at The Forum just dropped at face value.' },
  },
  {
    emoji: '📦', name: 'Restocks',
    detail: { emoji: '📦', title: 'Restocks', desc: 'Limited drops, sold-out sneakers, viral products that vanish in minutes. Steward monitors stock status and alerts you the moment something is back so you\'re always first in line.', simBold: 'Back in stock!', simBody: 'PS5 Pro is available at Target right now. Grab it before it sells out again.' },
  },
  {
    emoji: '↗', name: 'Share Extension',
    detail: { emoji: '↗', title: 'Share Extension', desc: 'See something while browsing? Tap the share button in Safari, Chrome, or any app, then tap Steward. The AI reads the page, identifies the product, and sets up tracking in under 10 seconds.', simBold: 'Link received!', simBody: 'Nike Dunk Low Panda detected from nike.com. What should I track?' },
  },
]

type Pos = { angle: number; radius: number }

// Desktop: 3-2-2 hemisphere with bigger radii so the icons sit further out around a larger radar.
const POSITIONS_DESKTOP: Pos[] = [
  { angle: 145, radius: 320 }, // Price Drops       — top-left
  { angle: 118, radius: 235 }, // Restaurant Tables — mid-left, closer in
  { angle: 92,  radius: 360 }, // Flight Deals      — top-center
  { angle: 62,  radius: 235 }, // Campsites         — mid-right, closer in
  { angle: 35,  radius: 320 }, // Event Tickets     — top-right
  { angle: 168, radius: 350 }, // Restocks          — bottom-left outer
  { angle: 12,  radius: 350 }, // Share Extension   — bottom-right outer
]

// Mobile: angles biased away from horizontal so |x| stays small (no edge clipping),
// and the top-center is pushed higher to use the vertical space.
const POSITIONS_MOBILE: Pos[] = [
  { angle: 142, radius: 175 },
  { angle: 117, radius: 130 },
  { angle: 92,  radius: 265 },
  { angle: 63,  radius: 130 },
  { angle: 38,  radius: 175 },
  { angle: 158, radius: 105 },
  { angle: 22,  radius: 105 },
]

function polar(angle: number, radius: number) {
  const r = (angle * Math.PI) / 180
  return { x: Math.cos(r) * radius, y: Math.sin(r) * radius }
}

type Layout = {
  positions: Pos[]
  iconSize: number
  iconFontSize: number
  radarScale: number
  stageHeight: string
}

const MOBILE_LAYOUT: Layout = {
  positions: POSITIONS_MOBILE,
  iconSize: 48,
  iconFontSize: 22,
  radarScale: 1.0,
  stageHeight: '30rem',
}
const TABLET_LAYOUT: Layout = {
  positions: POSITIONS_DESKTOP,
  iconSize: 56,
  iconFontSize: 26,
  radarScale: 1.15,
  stageHeight: '34rem',
}
const DESKTOP_LAYOUT: Layout = {
  positions: POSITIONS_DESKTOP,
  iconSize: 64,
  iconFontSize: 30,
  radarScale: 1.3,
  stageHeight: '38rem',
}

function computeLayout(width: number): Layout {
  if (width < 768) return MOBILE_LAYOUT
  if (width < 1024) return TABLET_LAYOUT
  return DESKTOP_LAYOUT
}

export function LandingUseCases() {
  const [modal, setModal] = useState<Detail | null>(null)
  const [pingIdx, setPingIdx] = useState<number | null>(null)
  const [pingTick, setPingTick] = useState(0)
  // Default to mobile layout so the SSR/initial paint is the more constrained
  // case — desktop scales UP when the resize listener fires.
  const [layout, setLayout] = useState<Layout>(MOBILE_LAYOUT)
  const [mounted, setMounted] = useState(false)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    setMounted(true)
    function update() {
      setLayout(computeLayout(window.innerWidth))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Periodic radar "ping" on a random icon — every 1.5–3.7s a single icon
  // emits an expanding mint ring like a sonar return.
  useEffect(() => {
    let cancelled = false
    let t1: ReturnType<typeof setTimeout>
    let t2: ReturnType<typeof setTimeout>
    function schedule() {
      if (cancelled) return
      const delay = 1500 + Math.random() * 2200
      t1 = setTimeout(() => {
        if (cancelled) return
        const idx = Math.floor(Math.random() * CARDS.length)
        setPingIdx(idx)
        setPingTick((t) => t + 1)
        t2 = setTimeout(() => {
          if (!cancelled) setPingIdx(null)
          schedule()
        }, 1400)
      }, delay)
    }
    schedule()
    return () => {
      cancelled = true
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  useEffect(() => {
    if (modal) {
      closeBtnRef.current?.focus()
    } else {
      triggerRef.current?.focus()
    }
  }, [modal])

  function openModal(detail: Detail, trigger: EventTarget | null) {
    triggerRef.current = trigger as HTMLElement | null
    setModal(detail)
  }

  return (
    <section
      id="why-steward"
      style={{
        padding: 'clamp(60px,10vh,120px) clamp(24px,8vw,60px)',
        background: 'transparent',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div className="landing-reveal" style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto clamp(40px,7vh,72px)' }}>
        <div style={{ marginBottom: 16 }}><EyebrowPill>Why Steward</EyebrowPill></div>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(44px,6vw,88px)', fontWeight: 700, lineHeight: 0.96, letterSpacing: '-0.035em', color: '#F7F6F3', margin: 0, marginBottom: 16 }}>
          One app,<br />monitor <em className="italic-accent">anything</em>
        </h2>
      </div>

      {/* Radar stage */}
      <div className="relative mx-auto w-full max-w-5xl overflow-hidden" style={{ height: layout.stageHeight }}>
        {/* Icons positioned by polar coords */}
        {CARDS.map((card, i) => {
          const pos = layout.positions[i]
          const { x, y } = polar(pos.angle, pos.radius)
          const isPinging = pingIdx === i
          return (
            <div
              key={card.name}
              className="absolute z-40"
              style={{
                left: `calc(50% + ${x}px)`,
                bottom: `${Math.max(0, y)}px`,
                transform: 'translate(-50%, 0)',
              }}
            >
              <button
                type="button"
                onClick={(e) => openModal(card.detail, e.currentTarget)}
                aria-label={`Learn more about ${card.name}`}
                className="group relative cursor-pointer bg-transparent p-0 transition-transform duration-300 hover:-translate-y-1 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F2018]"
                style={{ border: 'none', borderRadius: '1rem' }}
              >
                {/* Hover glow ring */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -inset-1 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    boxShadow: '0 0 24px rgba(110,231,183,0.45)',
                    border: '1px solid rgba(110,231,183,0.35)',
                  }}
                />
                {/* Periodic radar ping */}
                {isPinging && (
                  <motion.span
                    key={pingTick}
                    initial={{ scale: 1, opacity: 0.85 }}
                    animate={{ scale: 2.6, opacity: 0 }}
                    transition={{ duration: 1.3, ease: 'easeOut' }}
                    className="pointer-events-none absolute -inset-1 rounded-2xl border-2 border-emerald-400"
                    style={{ boxShadow: '0 0 16px rgba(110,231,183,0.5)' }}
                  />
                )}
                <IconContainer
                  delay={0.3 + i * 0.07}
                  text={card.name}
                  size={layout.iconSize}
                  icon={<span style={{ fontSize: layout.iconFontSize, lineHeight: 1 }}>{card.emoji}</span>}
                />
                {/* Hover tooltip (desktop only) */}
                <span className="pointer-events-none absolute -bottom-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-semibold opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:block"
                  style={{
                    color: '#6EE7B7',
                    background: 'rgba(110,231,183,0.1)',
                    border: '1px solid rgba(110,231,183,0.2)',
                  }}
                >
                  Click to learn more
                </span>
              </button>
            </div>
          )
        })}

        {/* Radar — scaled wrapper so the visible arc grows with viewport */}
        <div
          style={{
            position: 'absolute',
            bottom: '-3rem',
            left: '50%',
            transform: `translateX(-50%) scale(${layout.radarScale})`,
            transformOrigin: 'center bottom',
            pointerEvents: 'none',
          }}
        >
          <Radar />
        </div>
        <div className="pointer-events-none absolute bottom-0 z-[41] h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
      </div>

      {/* Modal — rendered to document.body via portal so it escapes any parent
          stacking context (icons were bleeding through the overlay before). */}
      {modal && mounted && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${modal.title} details`}
          onClick={() => setModal(null)}
          onKeyDown={(e) => e.key === 'Escape' && setModal(null)}
          tabIndex={-1}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#0F2018', border: '1px solid rgba(110,231,183,0.2)', borderRadius: 24, padding: 'clamp(24px,5vw,36px)', maxWidth: 480, width: '90%', position: 'relative', maxHeight: '90dvh', overflowY: 'auto' }}
          >
            <button ref={closeBtnRef} onClick={() => setModal(null)} aria-label="Close dialog" style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'rgba(247,246,243,0.5)', cursor: 'pointer', transition: 'all .25s', fontFamily: 'inherit' }}>✕</button>
            <div style={{ fontSize: 40, marginBottom: 16 }}>{modal.emoji}</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, color: '#F7F6F3', marginBottom: 8 }}>{modal.title}</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(247,246,243,0.55)', marginBottom: 20 }}>{modal.desc}</div>
            <div style={{ background: 'rgba(110,231,183,0.06)', border: '1px solid rgba(110,231,183,0.15)', borderRadius: 16, padding: 16, marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6EE7B7', boxShadow: '0 0 10px rgba(110,231,183,0.6)', marginTop: 3, flexShrink: 0, animation: 'pulseDot 2s ease-in-out infinite', display: 'block' }} />
              <div style={{ fontSize: 13, color: 'rgba(247,246,243,0.7)', lineHeight: 1.45 }}>
                <strong style={{ color: '#F7F6F3' }}>{modal.simBold}</strong>{' '}{modal.simBody}
              </div>
            </div>
            <a href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#6EE7B7', color: '#0F2018', fontSize: 14, fontWeight: 700, padding: '12px 24px', borderRadius: 12, textDecoration: 'none', transition: 'all .3s' }}>
              Try it free →
            </a>
          </div>
        </div>,
        document.body
      )}
    </section>
  )
}
