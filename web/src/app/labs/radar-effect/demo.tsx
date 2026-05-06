'use client'

import { useEffect, useRef, useState } from 'react'
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
  desc: string
  tag: string
  cat: string
  detail: Detail
}

const CARDS: Card[] = [
  {
    emoji: '📉', name: 'Price Drops', cat: 'shopping',
    desc: 'Set a target price across thousands of retailers. Get pinged the instant it hits.',
    tag: '✓ Nike, Amazon, Best Buy & more',
    detail: { emoji: '📉', title: 'Price Drops', desc: 'Set a target price across thousands of retailers. Steward monitors 24/7 and pings you the second it hits your number, with fake deal detection so you never get played by inflated "sale" prices.', simBold: 'Price dropped!', simBody: 'Nike Dunk Low Panda is now $89 at nike.com. That\'s 26% below your target.' },
  },
  {
    emoji: '🍽', name: 'Restaurant Tables', cat: 'dining',
    desc: 'Impossible reservation? Steward monitors Resy for cancellations and new openings.',
    tag: '✓ Resy & more',
    detail: { emoji: '🍽', title: 'Restaurant Tables', desc: 'That impossible Resy reservation? Steward watches it around the clock and pings you the moment a table frees up so you can book before anyone else even knows it\'s available.', simBold: 'Table found!', simBody: 'Carbone NY just opened a Friday 8pm slot for 2 guests.' },
  },
  {
    emoji: '✈️', name: 'Flight Deals', cat: 'travel',
    desc: 'Track fares across airlines and routes. Get pinged when prices drop.',
    tag: '✓ Major airlines & routes',
    detail: { emoji: '✈️', title: 'Flight Deals', desc: 'Set a fare threshold for any route and Steward monitors prices across airlines. The moment it drops below your target, you get an instant alert with a direct link to book.', simBold: 'Fare dropped!', simBody: 'SFO → Tokyo round trip is now $1,120. That\'s $127 less than yesterday.' },
  },
  {
    emoji: '🏕', name: 'Campsites', cat: 'travel',
    desc: 'Yosemite, Yellowstone, Big Sur. Snag that cancellation before anyone else.',
    tag: '✓ Recreation.gov sites',
    detail: { emoji: '🏕', title: 'Campsites', desc: 'The best campsites book up in seconds. Steward watches Recreation.gov for cancellations on specific dates and pings you the moment one opens up so you can grab it first.', simBold: 'Site available!', simBody: 'Yosemite Upper Pines has an opening Jun 14–16. Book it before it\'s gone.' },
  },
  {
    emoji: '🎫', name: 'Event Tickets', cat: 'entertainment',
    desc: 'Sold out concert? Steward monitors for face-value drops and new inventory.',
    tag: '✓ Ticketmaster & more',
    detail: { emoji: '🎫', title: 'Event Tickets', desc: 'Sold out before you could buy? Steward monitors Ticketmaster and other platforms for face-value drops and new inventory so you get tickets at a fair price, not scalper markup.', simBold: 'Tickets available!', simBody: '2 floor seats for Kendrick Lamar at The Forum just dropped at face value.' },
  },
  {
    emoji: '📦', name: 'Restocks', cat: 'shopping',
    desc: 'Limited releases, sold-out sneakers, viral products. Be first in line.',
    tag: '✓ Works on most URLs',
    detail: { emoji: '📦', title: 'Restocks', desc: 'Limited drops, sold-out sneakers, viral products that vanish in minutes. Steward monitors stock status and alerts you the moment something is back so you\'re always first in line.', simBold: 'Back in stock!', simBody: 'PS5 Pro is available at Target right now. Grab it before it sells out again.' },
  },
  {
    emoji: '✦', name: 'AI Chat Setup', cat: 'shopping',
    desc: 'Just say what you want. Your AI concierge finds it and starts tracking.',
    tag: '✓ Just describe it',
    detail: { emoji: '✦', title: 'AI Chat Setup', desc: 'Skip the forms and dropdowns. Just describe what you want. "Dyson V15 under $500" or "Carbone table next Friday" and Steward\'s AI finds it and sets up the tracker in seconds.', simBold: 'Found it.', simBody: 'Dyson V15 Detect is $549 at dyson.com. I\'ll ping you the moment it dips below $500.' },
  },
  {
    emoji: '↗', name: 'Share Extension', cat: 'shopping',
    desc: 'See something in Safari or Chrome? Tap Share → Steward. Done.',
    tag: '✓ Works in most apps',
    detail: { emoji: '↗', title: 'Share Extension', desc: 'See something while browsing? Tap the share button in Safari, Chrome, or any app, then tap Steward. The AI reads the page, identifies the product, and sets up tracking in under 10 seconds.', simBold: 'Link received!', simBody: 'Nike Dunk Low Panda detected from nike.com. What should I track?' },
  },
]

const TABS = [
  { label: 'All', value: 'all' },
  { label: 'Shopping', value: 'shopping' },
  { label: 'Travel', value: 'travel' },
  { label: 'Dining', value: 'dining' },
  { label: 'Entertainment', value: 'entertainment' },
]

export function RadarEffectLabDemo() {
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState<Detail | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

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

  const visible = CARDS.filter((c) => filter === 'all' || c.cat === filter)

  return (
    <section
      id="radar-use-cases"
      style={{
        minHeight: '100dvh',
        padding: 'clamp(60px,10vh,120px) clamp(24px,8vw,60px)',
        background: '#0F2018',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div className="landing-reveal" style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto clamp(40px,7vh,72px)' }}>
        <div style={{ marginBottom: 16 }}><EyebrowPill>Why Steward</EyebrowPill></div>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(40px,5.5vw,80px)', fontWeight: 700, lineHeight: 0.96, letterSpacing: '-0.035em', color: '#F7F6F3', margin: 0, marginBottom: 16 }}>
          One app, endless<br />ways to <em className="italic-accent">save</em>
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(247,246,243,0.5)', margin: 0 }}>
          Tap any icon — Steward is watching it for you.
        </p>
      </div>

      {/* Tab filters */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            style={{
              fontSize: 13, fontWeight: filter === tab.value ? 600 : 500,
              color: filter === tab.value ? '#6EE7B7' : 'rgba(247,246,243,0.45)',
              background: filter === tab.value ? 'rgba(110,231,183,0.1)' : 'rgba(255,255,255,0.02)',
              border: filter === tab.value ? '1px solid rgba(110,231,183,0.25)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: 24, padding: '8px 20px', cursor: 'pointer',
              transition: 'all 0.3s', fontFamily: 'inherit',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Radar stage */}
      <div className="relative mx-auto flex h-[28rem] w-full max-w-3xl items-center justify-center overflow-visible">
        {/* Icons in flex-wrap above the radar */}
        <div className="relative z-50 flex w-full flex-wrap items-end justify-center gap-x-6 gap-y-8 px-4 pb-16 sm:gap-x-10">
          {visible.map((card, idx) => (
            <button
              key={card.name}
              type="button"
              aria-label={`Learn more about ${card.name}`}
              onClick={(e) => openModal(card.detail, e.currentTarget)}
              className="group cursor-pointer rounded-xl bg-transparent p-0 transition-transform duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F2018]"
              style={{ border: 'none' }}
            >
              <IconContainer
                delay={0.1 + idx * 0.06}
                text={card.name}
                icon={<span style={{ fontSize: 22, lineHeight: 1 }}>{card.emoji}</span>}
              />
            </button>
          ))}
        </div>

        {/* Radar sits anchored to bottom of stage */}
        <Radar className="absolute -bottom-12 left-1/2 -translate-x-1/2" />
        <div className="pointer-events-none absolute bottom-0 z-[41] h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
      </div>

      {/* Modal — mirrors landing-use-cases.tsx */}
      {modal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${modal.title} details`}
          onClick={() => setModal(null)}
          onKeyDown={(e) => e.key === 'Escape' && setModal(null)}
          tabIndex={-1}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
        </div>
      )}
    </section>
  )
}
