'use client'

import { useEffect, useRef, useState } from 'react'

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
  preview: string
  detail: Detail
}

const CARDS: Card[] = [
  {
    emoji: '📉', name: 'Price Drops', cat: 'shopping',
    desc: 'Set a target price across thousands of retailers. Get pinged the instant it hits.',
    tag: '✓ Nike, Amazon, Best Buy & more',
    preview: '↓ $89 — target hit!',
    detail: { emoji: '📉', title: 'Price Drops', desc: 'Set a target price across thousands of retailers. Steward monitors 24/7 and pings you the second it hits your number — with fake deal detection so you never get played by inflated "sale" prices.', simBold: 'Price dropped!', simBody: 'Nike Dunk Low Panda is now $89 at nike.com. That\'s 26% below your target.' },
  },
  {
    emoji: '🍽', name: 'Restaurant Tables', cat: 'dining',
    desc: 'Impossible reservation? Steward monitors Resy for cancellations and new openings.',
    tag: '✓ Resy & more',
    preview: '🎉 Table found!',
    detail: { emoji: '🍽', title: 'Restaurant Tables', desc: 'That impossible Resy reservation? Steward watches it around the clock and pings you the moment a table frees up — so you can book before anyone else even knows it\'s available.', simBold: 'Table found!', simBody: 'Carbone NY just opened a Friday 8pm slot for 2 guests.' },
  },
  {
    emoji: '✈️', name: 'Flight Deals', cat: 'travel',
    desc: 'Track fares across airlines and routes. Get pinged when prices drop.',
    tag: '✓ Major airlines & routes',
    preview: '✈️ Fare dropped $127!',
    detail: { emoji: '✈️', title: 'Flight Deals', desc: 'Set a fare threshold for any route and Steward monitors prices across airlines. The moment it drops below your target, you get an instant alert with a direct link to book.', simBold: 'Fare dropped!', simBody: 'SFO → Tokyo round trip is now $1,120. That\'s $127 less than yesterday.' },
  },
  {
    emoji: '🏕', name: 'Campsites', cat: 'travel',
    desc: 'Yosemite, Yellowstone, Big Sur. Snag that cancellation before anyone else.',
    tag: '✓ Recreation.gov sites',
    preview: '🏕 Site available!',
    detail: { emoji: '🏕', title: 'Campsites', desc: 'The best campsites book up in seconds. Steward watches Recreation.gov for cancellations on specific dates and loops — and pings you the moment one opens up so you can grab it first.', simBold: 'Site available!', simBody: 'Yosemite Upper Pines has an opening Jun 14–16. Book it before it\'s gone.' },
  },
  {
    emoji: '🎫', name: 'Event Tickets', cat: 'entertainment',
    desc: 'Sold out concert? Steward monitors for face-value drops and new inventory.',
    tag: '✓ Ticketmaster & more',
    preview: '🎫 Tickets dropped!',
    detail: { emoji: '🎫', title: 'Event Tickets', desc: 'Sold out before you could buy? Steward monitors Ticketmaster and other platforms for face-value drops and new inventory — so you get tickets at a fair price, not scalper markup.', simBold: 'Tickets available!', simBody: '2 floor seats for Kendrick Lamar at The Forum just dropped at face value.' },
  },
  {
    emoji: '📦', name: 'Restocks', cat: 'shopping',
    desc: 'Limited releases, sold-out sneakers, viral products. Be first in line.',
    tag: '✓ Works on most URLs',
    preview: '📦 Back in stock!',
    detail: { emoji: '📦', title: 'Restocks', desc: 'Limited drops, sold-out sneakers, viral products that vanish in minutes. Steward monitors stock status and alerts you the moment something is back — so you\'re always first in line.', simBold: 'Back in stock!', simBody: 'PS5 Pro is available at Target right now. Grab it before it sells out again.' },
  },
  {
    emoji: '✦', name: 'AI Chat Setup', cat: 'shopping',
    desc: 'Just say what you want. Your AI concierge finds it and starts tracking.',
    tag: '✓ Just describe it',
    preview: '✦ AI found it!',
    detail: { emoji: '✦', title: 'AI Chat Setup', desc: 'Skip the forms and dropdowns. Just describe what you want in plain English — "Dyson V15 under $500" or "Carbone table next Friday" — and Steward\'s AI finds it and sets up the tracker in seconds.', simBold: 'Found it.', simBody: 'Dyson V15 Detect is $549 at dyson.com. I\'ll ping you the moment it dips below $500.' },
  },
  {
    emoji: '↗', name: 'Share Extension', cat: 'shopping',
    desc: 'See something in Safari or Chrome? Tap Share → Steward. Done.',
    tag: '✓ Works in most apps',
    preview: '📤 Shared to Steward',
    detail: { emoji: '↗', title: 'Share Extension', desc: 'See something while browsing? Tap the share button in Safari, Chrome, or any app — then tap Steward. The AI reads the page, identifies the product, and sets up tracking in under 10 seconds.', simBold: 'Link received!', simBody: 'Nike Dunk Low Panda detected from nike.com. What should I track?' },
  },
]

const TABS = [
  { label: 'All', value: 'all' },
  { label: 'Shopping', value: 'shopping' },
  { label: 'Travel', value: 'travel' },
  { label: 'Dining', value: 'dining' },
  { label: 'Entertainment', value: 'entertainment' },
]

export function LandingUseCases() {
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState<Detail | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (modal) {
      closeBtnRef.current?.focus()
    } else {
      (triggerRef.current as HTMLElement | null)?.focus()
    }
  }, [modal])

  function openModal(detail: Detail, trigger: EventTarget | null) {
    triggerRef.current = trigger as HTMLElement | null
    setModal(detail)
  }

  const visible = CARDS.filter((c) => filter === 'all' || c.cat === filter)

  return (
    <section id="why-steward" style={{ padding: 'clamp(60px,10vh,120px) clamp(24px,8vw,60px)', background: '#080A08' }}>
      {/* Header */}
      <div className="landing-reveal" style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto clamp(40px,7vh,72px)' }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6EE7B7', opacity: 0.7, marginBottom: 16 }}>Why Steward</div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(36px,5vw,48px)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#F7F6F3', marginBottom: 16 }}>
          One app, endless<br />ways to <em style={{ fontStyle: 'italic', color: '#6EE7B7' }}>save</em>
        </div>
      </div>

      {/* Tab filters */}
      <div className="landing-reveal" style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 40, flexWrap: 'wrap' }}>
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

      {/* Grid */}
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
        {visible.map((card, idx) => (
          <div
            key={card.name}
            className="landing-reveal"
            role="button"
            tabIndex={0}
            aria-label={`Learn more about ${card.name}`}
            onClick={(e) => openModal(card.detail, e.currentTarget)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(card.detail, e.currentTarget) } }}
            onMouseEnter={() => setHovered(idx)}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: hovered === idx ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.02)',
              border: hovered === idx ? '1px solid rgba(110,231,183,0.2)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: 20, overflow: 'hidden',
              transition: 'all 0.4s cubic-bezier(.34,1.56,.64,1)',
              cursor: 'pointer', position: 'relative',
              transform: hovered === idx ? 'translateY(-4px)' : 'none',
              boxShadow: hovered === idx ? '0 16px 48px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            {/* Preview strip */}
            <div style={{
              height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(110,231,183,0.03)', borderBottom: '1px solid rgba(255,255,255,0.04)',
              position: 'relative', overflow: 'hidden',
              opacity: hovered === idx ? 1 : 0.5,
              transition: 'all 0.4s',
            }}>
              <div style={{
                background: 'rgba(110,231,183,0.1)', border: '1px solid rgba(110,231,183,0.2)',
                borderRadius: 10, padding: '6px 10px', fontSize: 10, color: '#6EE7B7',
                display: 'flex', alignItems: 'center', gap: 5,
                transform: hovered === idx ? 'translateY(0)' : 'translateY(8px)',
                opacity: hovered === idx ? 1 : 0,
                transition: 'all 0.4s 0.1s ease',
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#6EE7B7', boxShadow: '0 0 6px rgba(110,231,183,0.6)', animation: 'pulseDot 2s ease-in-out infinite', display: 'block' }} />
                {card.preview}
              </div>
              {/* Visible when not hovered */}
              {hovered !== idx && (
                <div style={{ fontSize: 24, opacity: 0.4 }}>{card.emoji}</div>
              )}
            </div>
            {/* Body */}
            <div style={{ padding: '22px 22px 24px' }}>
              <span style={{ fontSize: 24, marginBottom: 12, display: 'block' }}>{card.emoji}</span>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 600, color: '#F7F6F3', marginBottom: 6 }}>{card.name}</div>
              <div style={{ fontSize: 12, lineHeight: 1.5, color: 'rgba(247,246,243,0.45)', fontWeight: 300 }}>{card.desc}</div>
              <div style={{ display: 'inline-block', marginTop: 10, fontSize: 10, fontWeight: 600, color: '#6EE7B7', letterSpacing: '0.05em', opacity: 0.7 }}>{card.tag}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${modal.title} details`}
          onClick={() => setModal(null)}
          onKeyDown={(e) => e.key === 'Escape' && setModal(null)}
          tabIndex={-1}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
