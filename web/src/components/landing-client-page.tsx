'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { LandingHIW } from '@/components/landing-hiw'
import { LandingUseCases } from '@/components/landing-use-cases'

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
      padding: scrolled ? '12px 40px' : '18px 40px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: scrolled ? 'rgba(8,10,8,0.92)' : 'rgba(8,10,8,0.7)',
      backdropFilter: 'blur(24px) saturate(1.4)',
      borderBottom: '1px solid rgba(110,231,183,0.06)',
      transition: 'all 0.4s',
      flexWrap: 'wrap' as const,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Logo />
        <span style={{ fontFamily: S.serif, fontSize: 22, fontWeight: 700, color: S.cream, letterSpacing: '-0.02em' }}>Steward</span>
      </div>
      <div className="lnd-nav-links" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
        {NAV_LINKS.map(([href, label]) => (
          <a key={href} href={href} style={{ fontSize: 13.5, fontWeight: 500, color: 'rgba(247,246,243,0.55)', textDecoration: 'none', transition: 'color .25s' }}
            onMouseEnter={e => (e.currentTarget.style.color = S.mint)}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(247,246,243,0.55)')}>
            {label}
          </a>
        ))}
        <Link href="/signup" className="landing-btn-shimmer" style={{
          background: S.mint, color: S.forest, fontWeight: 700, padding: '10px 24px',
          borderRadius: 10, fontSize: 13.5, textDecoration: 'none', display: 'inline-block',
        }}>Get Started</Link>
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
          <Link href="/signup" onClick={() => setMenuOpen(false)}
            style={{ background: S.mint, color: S.forest, fontWeight: 700, padding: '13px', borderRadius: 10, fontSize: 15, textDecoration: 'none', textAlign: 'center' as const, marginTop: 8, display: 'block' }}>
            Get Started Free
          </Link>
        </div>
      )}
    </nav>
  )
}

// ── Floating card ─────────────────────────────────────────────────────────────
type FloatCard = { floatCls: string; depth: number; style: React.CSSProperties; delay: number; isNotif?: boolean; children: React.ReactNode }

const FLOAT_CARDS: FloatCard[] = [
  {
    floatCls: 'lfc-1', depth: 0.04, delay: 800,
    style: { right: '0%', top: '4%', width: 210 },
    children: (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>👟</span>
          <div><div style={{ fontSize: 12, fontWeight: 500, color: S.cream, marginBottom: 2 }}>Nike Dunk Low Panda</div><div style={{ fontSize: 10, color: 'rgba(247,246,243,0.4)' }}>nike.com</div></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
          <span style={{ fontSize: 11, color: 'rgba(247,246,243,0.3)', textDecoration: 'line-through' }}>$120</span>
          <span style={{ fontFamily: S.serif, fontSize: 22, fontWeight: 700, color: S.mint }}>$89</span>
          <span style={{ fontSize: 9, fontWeight: 800, color: S.gold, background: 'rgba(245,158,11,0.12)', padding: '2px 6px', borderRadius: 10 }}>-26%</span>
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.28)', color: S.gold, display: 'inline-block', marginTop: 10 }}>↓ Target price hit!</div>
      </>
    ),
  },
  {
    floatCls: 'lfc-2', depth: 0.025, delay: 1050,
    style: { right: '42%', top: '2%', width: 195 },
    children: (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>✈️</span>
          <div><div style={{ fontSize: 12, fontWeight: 500, color: S.cream, marginBottom: 2 }}>SFO → Tokyo Narita</div><div style={{ fontSize: 10, color: 'rgba(247,246,243,0.4)' }}>Round trip · 2 adults</div></div>
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.15)', color: S.mint, display: 'inline-block', marginTop: 10 }}>📡 Monitoring fares</div>
      </>
    ),
  },
  {
    floatCls: 'lfc-3', depth: 0.035, delay: 1300,
    style: { right: '2%', top: '52%', width: 200 },
    children: (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🏕</span>
          <div><div style={{ fontSize: 12, fontWeight: 500, color: S.cream, marginBottom: 2 }}>Yosemite · Upper Pines</div><div style={{ fontSize: 10, color: 'rgba(247,246,243,0.4)' }}>recreation.gov</div></div>
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.22)', color: '#34d399', display: 'inline-block', marginTop: 10 }}>🎉 Site available!</div>
      </>
    ),
  },
  {
    floatCls: 'lfc-4', depth: 0.02, delay: 1550,
    style: { right: '42%', bottom: '2%', width: 185 },
    children: (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🎫</span>
          <div><div style={{ fontSize: 12, fontWeight: 500, color: S.cream, marginBottom: 2 }}>Kendrick Lamar · LA</div><div style={{ fontSize: 10, color: 'rgba(247,246,243,0.4)' }}>ticketmaster.com</div></div>
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.22)', color: '#f87171', display: 'inline-block', marginTop: 10 }}>Sold out · Monitoring</div>
      </>
    ),
  },
  {
    floatCls: 'lfc-5', depth: 0.03, delay: 1800,
    style: { right: '4%', bottom: '0%', width: 185 },
    children: (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>📦</span>
          <div><div style={{ fontSize: 12, fontWeight: 500, color: S.cream, marginBottom: 2 }}>PS5 Pro · Target</div><div style={{ fontSize: 10, color: 'rgba(247,246,243,0.4)' }}>target.com</div></div>
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.22)', color: '#34d399', display: 'inline-block', marginTop: 10 }}>Back in stock!</div>
      </>
    ),
  },
  {
    floatCls: '', depth: 0.05, delay: 2100, isNotif: true,
    style: { right: '24%', top: '28%', width: 230 },
    children: (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span className="lnd-pulse-dot" />
        <div style={{ fontSize: 12, color: 'rgba(247,246,243,0.8)', lineHeight: 1.4 }}>
          <strong style={{ color: S.mint }}>Table found!</strong> Carbone NY just opened a Friday 8pm slot for 2 guests.
          <span style={{ display: 'block', fontSize: 10, color: 'rgba(247,246,243,0.35)', marginTop: 2 }}>Just now</span>
        </div>
      </div>
    ),
  },
]

// ── Hero ──────────────────────────────────────────────────────────────────────
const DEMO_CHIPS = [
  { q: 'Nike Dunk Low Panda',       emoji: '👟', site: 'nike.com',              price: '$120',   action: '📉 Alert below $90' },
  { q: 'Carbone NY · Friday 8pm',   emoji: '🍽',  site: 'resy.com',              price: '2 guests', action: '🍽 Alert on openings' },
  { q: 'Yosemite Upper Pines',      emoji: '🏕',  site: 'recreation.gov',        price: 'Jun 14-16', action: '🏕 Alert on cancellation' },
  { q: 'SFO → Tokyo round trip',    emoji: '✈️', site: 'google.com/flights',    price: '$1,247',  action: '✈️ Alert on fare drop' },
]

type DemoResult = { emoji: string; q: string; price: string; site: string; action: string }

function Hero() {
  const [cardsReady, setCardsReady] = useState(false)
  const [demoInput, setDemoInput] = useState('')
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoResult, setDemoResult] = useState<DemoResult | null>(null)
  const cardEls = useRef<Array<HTMLDivElement | null>>([])
  const mouseX = useRef(0); const mouseY = useRef(0)
  const curX = useRef(0); const curY = useRef(0)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setCardsReady(true), 200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseX.current = (e.clientX / window.innerWidth - 0.5) * 2
      mouseY.current = (e.clientY / window.innerHeight - 0.5) * 2
    }
    document.addEventListener('mousemove', onMove)
    const depths = FLOAT_CARDS.map(c => c.depth)
    function loop() {
      curX.current += (mouseX.current - curX.current) * 0.06
      curY.current += (mouseY.current - curY.current) * 0.06
      cardEls.current.forEach((el, i) => {
        if (!el) return
        const d = depths[i] ?? 0.03
        const tx = curX.current * d * 600
        const ty = curY.current * d * 400
        // Preserve existing float animation by using translate on top; use CSS variable trick
        el.style.setProperty('--px', `${tx}px`)
        el.style.setProperty('--py', `${ty}px`)
      })
      raf.current = requestAnimationFrame(loop)
    }
    loop()
    return () => {
      document.removeEventListener('mousemove', onMove)
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [])

  const runDemo = useCallback((data: DemoResult) => {
    setDemoResult(null)
    setDemoLoading(true)
    setDemoInput(data.q)
    setTimeout(() => {
      setDemoLoading(false)
      setDemoResult(data)
    }, 1400)
  }, [])

  return (
    <section style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', padding: 'clamp(80px,10vh,100px) clamp(20px,6vw,40px) 60px', background: S.bg,
    }}>
      {/* Bg gradients */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 900px 800px at 30% 40%,rgba(42,92,69,0.5) 0%,transparent 60%),radial-gradient(ellipse 600px 500px at 75% 25%,rgba(110,231,183,0.07) 0%,transparent 55%),radial-gradient(ellipse 500px 700px at 80% 80%,rgba(28,61,46,0.35) 0%,transparent 55%)' }} />
      <div className="landing-dot-grid" />

      {/* Scene */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 1200, margin: '0 auto', minHeight: '70vh', display: 'flex', alignItems: 'center', padding: '40px 0' }}>

        {/* Text */}
        <div className="lnd-hero-text" style={{ position: 'relative', zIndex: 10, maxWidth: 560, paddingLeft: 20 }}>
          {/* Eyebrow */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.18)', borderRadius: 30, padding: '6px 16px', marginBottom: 28, opacity: 0, transform: 'translateY(20px)', animation: 'hiw-fadeUp .7s .3s ease forwards' }}>
            <span style={{ fontSize: 14, color: S.mint }}>✦</span>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: S.mint }}>Your personal AI concierge</span>
          </div>

          {/* Title — word by word */}
          <div style={{ fontFamily: S.serif, lineHeight: 1.08, letterSpacing: '-0.03em', color: S.cream, marginBottom: 24, fontSize: 'clamp(38px,5.5vw,62px)', fontWeight: 700 }}>
            {['Scalpers', 'have', 'bots'].map((w, i) => (
              <span key={w} className="landing-word" style={{ animationDelay: `${0.5 + i * 0.1}s`, marginRight: '0.22em' }}>{w}</span>
            ))}<br />
            {['Now', 'you', 'have', 'a\u00a0concierge'].map((w, i) => (
              <span key={w} className="landing-word" style={{ animationDelay: `${0.85 + i * 0.1}s`, marginRight: i < 3 ? '0.22em' : 0, color: S.mint, fontStyle: 'italic' }}>{w}</span>
            ))}
          </div>

          {/* Body */}
          <p style={{ fontSize: 17, lineHeight: 1.65, color: S.textDim, fontWeight: 300, marginBottom: 36, maxWidth: 440, opacity: 0, transform: 'translateY(25px)', animation: 'hiw-fadeUp .8s 1.4s ease forwards' }}>
            Be the first to snag deals, hard to get reservations, and sold-out tickets with Steward. Your personalized AI concierge that levels the playing field.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const, opacity: 0, transform: 'translateY(25px)', animation: 'hiw-fadeUp .8s 1.6s ease forwards' }}>
            <Link href="/signup" className="landing-btn-shimmer lnd-cta-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: S.mint, color: S.forest, fontSize: 16, fontWeight: 700, padding: '18px 36px', borderRadius: 14, textDecoration: 'none', transition: 'all .35s cubic-bezier(.34,1.56,.64,1)' }}>
              Start for free <span>→</span>
            </Link>
            <a href="#how-it-works" className="lnd-ghost-link"
              style={{ fontSize: 14.5, fontWeight: 500, color: 'rgba(247,246,243,0.55)', textDecoration: 'none', transition: 'color .25s', display: 'flex', alignItems: 'center', gap: 6 }}>
              See how it works ↓
            </a>
          </div>

          {/* Social proof */}
          <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 8, opacity: 0, animation: 'hiw-fadeUp .7s 1.8s ease forwards' }}>
            {['Free forever', 'No credit card', 'Setup in seconds'].map((t, i) => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {i > 0 && <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(247,246,243,0.2)', display: 'inline-block' }} />}
                <span style={{ fontSize: 12.5, color: 'rgba(247,246,243,0.35)', fontWeight: 300 }}>{t}</span>
              </span>
            ))}
          </div>

          {/* Demo bar */}
          <div style={{ marginTop: 32, maxWidth: 460, opacity: 0, animation: 'hiw-fadeUp .8s 2s ease forwards' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '6px 6px 6px 18px' }}>
              <input
                value={demoInput}
                onChange={e => setDemoInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && demoInput.trim() && runDemo({ q: demoInput, emoji: '✦', site: 'steward', price: 'AI detected', action: '📡 Start monitoring' })}
                placeholder="What do you want to track?"
                aria-label="What do you want Steward to track?"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14.5, color: S.cream, minWidth: 0, fontFamily: 'inherit' }}
              />
              <button onClick={() => demoInput.trim() && runDemo({ q: demoInput, emoji: '✦', site: 'steward', price: 'AI detected', action: '📡 Start monitoring' })}
                className="lnd-demo-btn"
                style={{ background: S.mint, color: S.forest, border: 'none', fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 10, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>
                Track it ✦
              </button>
            </div>
            {/* Chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginTop: 10 }}>
              {DEMO_CHIPS.map(chip => (
                <button key={chip.q} onClick={() => runDemo(chip)}
                  className="lnd-chip"
                  style={{ background: 'rgba(110,231,183,0.06)', border: '1px solid rgba(110,231,183,0.14)', borderRadius: 20, padding: '5px 12px', fontSize: 11.5, color: 'rgba(110,231,183,0.7)', cursor: 'pointer', whiteSpace: 'nowrap' as const, fontFamily: 'inherit' }}>
                  {chip.emoji} {chip.q}
                </button>
              ))}
            </div>
            {demoLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 12, color: 'rgba(110,231,183,0.7)' }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(110,231,183,0.2)', borderTopColor: S.mint, animation: 'hiw-spin .8s linear infinite', display: 'inline-block' }} />
                Steward is searching...
              </div>
            )}
            {!demoLoading && demoResult && (
              <div style={{ marginTop: 14, background: 'linear-gradient(135deg,rgba(42,92,69,0.5),rgba(15,32,24,0.3))', border: '1px solid rgba(110,231,183,0.2)', borderRadius: 16, padding: 16, animation: 'hiw-fadeUp .4s ease forwards' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <span style={{ color: S.mint }}>✦</span>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: S.mint }}>Found by AI concierge</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 28 }}>{demoResult.emoji}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: S.cream }}>{demoResult.q}</div>
                    <div style={{ fontSize: 11, color: 'rgba(247,246,243,0.4)' }}>{demoResult.price} · {demoResult.site}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                  <Link href="/signup" style={{ fontSize: 11, padding: '6px 14px', borderRadius: 10, background: S.mint, color: S.forest, fontWeight: 700, textDecoration: 'none' }}>{demoResult.action}</Link>
                  <button style={{ fontSize: 11, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(247,246,243,0.6)', cursor: 'pointer', fontFamily: 'inherit' }}>Change condition</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating cards */}
        <div className="lnd-hero-cards" style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
          {FLOAT_CARDS.map((card, i) => (
            <div
              key={i}
              ref={el => { cardEls.current[i] = el }}
              className={card.floatCls}
              style={{
                position: 'absolute',
                ...card.style,
                background: card.isNotif
                  ? 'linear-gradient(135deg,rgba(42,92,69,0.8),rgba(28,61,46,0.6))'
                  : 'rgba(15,32,24,0.7)',
                border: card.isNotif
                  ? '1px solid rgba(110,231,183,0.25)'
                  : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 18, padding: 16,
                backdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                opacity: cardsReady ? 1 : 0,
                transition: `opacity .8s ${card.delay}ms ease, border-color .4s, box-shadow .4s`,
                translate: 'var(--px,0px) var(--py,0px)',
                pointerEvents: 'auto',
              }}
            >
              {card.children}
            </div>
          ))}
        </div>
      </div>
    </section>
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
function PriceFeature() {
  const ref = useRef<HTMLDivElement>(null)
  const [animated, setAnimated] = useState(false)
  const [price, setPrice] = useState(120)
  const [showSave, setShowSave] = useState(false)
  const [showNotif, setShowNotif] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !animated) {
        setAnimated(true)
        let c = 120
        setTimeout(() => {
          const tick = () => {
            c--; setPrice(c)
            if (c <= 89) { setShowSave(true); setTimeout(() => setShowNotif(true), 600); return }
            setTimeout(tick, 40 + Math.random() * 30)
          }
          tick()
        }, 800)
      }
    }, { threshold: 0.4 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [animated])

  return (
    <section style={{ padding: 'clamp(60px,10vh,120px) clamp(24px,8vw,60px)', background: S.bg }}>
      <div className="lnd-feature-grid" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
        <div className="landing-reveal">
          <Pill icon="📉" label="Price Drops" />
          <FeatTitle>Your target<br />price <em>Achieved</em></FeatTitle>
          <FeatBody>Works across Amazon, Nike, Best Buy, Target, Walmart, and thousands of other retailers. Steward monitors 24/7 and pings you the moment your target hits, with fake deal detection so you never get played by artificially inflated prices.</FeatBody>
          <FeatLink href="/signup">Start tracking prices →</FeatLink>
        </div>
        <div className="landing-reveal" ref={ref} style={{ background: 'linear-gradient(135deg,rgba(42,92,69,0.3),rgba(15,32,24,0.2))', border: '1px solid rgba(110,231,183,0.1)', borderRadius: 24, padding: 40, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(110,231,183,0.05)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <span style={{ fontSize: 36 }}>👟</span>
            <div><div style={{ fontSize: 15, fontWeight: 500, color: S.cream }}>Nike Dunk Low Panda</div><div style={{ fontSize: 12, color: 'rgba(247,246,243,0.4)' }}>nike.com</div></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 28 }}>
            <span style={{ fontSize: 18, color: 'rgba(247,246,243,0.3)', textDecoration: 'line-through' }}>$120</span>
            <span style={{ fontFamily: S.serif, fontSize: 52, fontWeight: 700, color: S.mint }}>${price}</span>
            <span style={{ background: S.gold, color: S.forest, fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', padding: '4px 10px', borderRadius: 20, alignSelf: 'center', opacity: showSave ? 1 : 0, transition: 'opacity .4s' }}>SAVE 26%</span>
          </div>
          <div style={{ height: 80, position: 'relative', marginBottom: 20 }}>
            <svg viewBox="0 0 400 80" preserveAspectRatio="none" width="100%" height="100%">
              <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(110,231,183,0.2)"/><stop offset="100%" stopColor="rgba(110,231,183,0)"/></linearGradient></defs>
              <path d="M0,20 Q50,18 100,25 T200,30 T300,22 T380,55 L400,55 L400,80 L0,80 Z" fill="url(#pg)" style={{ opacity: animated ? 1 : 0, transition: 'opacity 1.5s .5s ease' }} />
              <path d="M0,20 Q50,18 100,25 T200,30 T300,22 T380,55" stroke={S.mint} strokeWidth="2.5" fill="none" style={{ strokeDasharray: 500, strokeDashoffset: animated ? 0 : 500, transition: 'stroke-dashoffset 2s ease' }} />
              <circle cx="380" cy="55" r={animated ? 5 : 0} fill={S.mint} style={{ transition: 'r .4s 1.8s cubic-bezier(.34,1.56,.64,1)' }} />
            </svg>
          </div>
          <div style={{ background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.18)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, opacity: showNotif ? 1 : 0, transform: showNotif ? 'none' : 'translateY(10px)', transition: 'all .5s ease' }}>
            <span className="lnd-pulse-dot" />
            <span style={{ fontSize: 12.5, color: 'rgba(247,246,243,0.7)', lineHeight: 1.3 }}><strong style={{ color: S.mint }}>Target price hit!</strong> Tap to buy now →</span>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── AI Feature ────────────────────────────────────────────────────────────────
function AIFeature() {
  const ref = useRef<HTMLDivElement>(null)
  const [chatStep, setChatStep] = useState(0)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && chatStep === 0) {
        const seq: Array<[number, number]> = [[300, 1], [900, 2], [2200, 3], [2500, 4], [3000, 5], [3600, 6]]
        seq.forEach(([delay, step]) => setTimeout(() => setChatStep(step), delay))
      }
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section style={{ padding: 'clamp(60px,10vh,120px) clamp(24px,8vw,60px)', background: S.bg }}>
      <div className="lnd-feature-grid lnd-feature-reverse" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
        {/* Chat visual — left visually, first in DOM */}
        <div className="landing-reveal" ref={ref} style={{ background: 'linear-gradient(135deg,rgba(42,92,69,0.25),rgba(15,32,24,0.15))', border: '1px solid rgba(110,231,183,0.08)', borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', overflow: 'hidden' }}>
          <div style={{ maxWidth: '85%', padding: '12px 16px', borderRadius: '18px 18px 4px 18px', fontSize: 13, lineHeight: 1.5, background: '#2A5C45', color: S.cream, alignSelf: 'flex-end', marginLeft: 'auto', opacity: chatStep >= 1 ? 1 : 0, transform: chatStep >= 1 ? 'none' : 'translateY(12px)', transition: 'all .5s ease' }}>
            Find the Dyson V15, alert me under $500
          </div>
          {chatStep === 2 && (
            <div style={{ display: 'flex', gap: 4, padding: '12px 16px', alignSelf: 'flex-start' }}>
              {[0, 0.2, 0.4].map(d => (
                <span key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(110,231,183,0.4)', animation: `typeBounce 1.4s ${d}s ease-in-out infinite`, display: 'block' }} />
              ))}
            </div>
          )}
          {chatStep >= 3 && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, width: '85%', opacity: 1, animation: 'hiw-fadeUp .4s ease' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,rgba(110,231,183,0.2),rgba(42,92,69,0.4))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🧹</div>
              <div><div style={{ fontSize: 12, fontWeight: 500, color: S.cream, marginBottom: 2 }}>Dyson V15 Detect Absolute</div><div style={{ fontSize: 11, color: S.mint }}>$549 · dyson.com</div></div>
            </div>
          )}
          {chatStep >= 4 && (
            <div style={{ maxWidth: '85%', padding: '12px 16px', borderRadius: '18px 18px 18px 4px', fontSize: 13, lineHeight: 1.5, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(247,246,243,0.7)', animation: 'hiw-fadeUp .4s ease' }}>
              <strong style={{ color: S.mint }}>Found it.</strong> It&apos;s $549 now. I&apos;ll ping you the moment it dips below $500.
            </div>
          )}
          {chatStep >= 5 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, animation: 'hiw-fadeUp .4s ease' }}>
              {['✓ Start tracking', 'Change price', 'More options'].map(chip => (
                <div key={chip} style={{ background: 'rgba(110,231,183,0.07)', border: '1px solid rgba(110,231,183,0.16)', borderRadius: 20, padding: '5px 12px', fontSize: 11, color: S.mint, cursor: 'pointer' }}>{chip}</div>
              ))}
            </div>
          )}
        </div>

        {/* Text — lnd-ai-text allows order swap on mobile */}
        <div className="landing-reveal lnd-ai-text">
          <Pill icon="✦" label="AI Concierge" />
          <FeatTitle>No forms<br />Just say<br />what you <em>want</em></FeatTitle>
          <FeatBody>Skip the dropdowns and filters. Tell Steward what you want via text or a screenshot. The AI finds the product or experience and sets up tracking in seconds. It even detects fake deals.</FeatBody>
          <FeatLink href="/signup">Try the AI concierge →</FeatLink>
        </div>
      </div>
    </section>
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
  return (
    <div style={{ fontFamily: S.serif, fontSize: 'clamp(28px,4vw,46px)', fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.03em', color: S.cream, marginBottom: 18 }}>
      {children}
    </div>
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

// ── Pricing ───────────────────────────────────────────────────────────────────
type Plan = {
  name: string; monthly: string; yearly: string; period: string; featured: boolean; tag?: string
  features: string[]; btnMonthly: string; btnYearly: string
}

const PLANS: Plan[] = [
  {
    name: 'Free', monthly: '$0', yearly: '$0', period: '/ forever', featured: false,
    features: ['Up to 3 trackers', 'Checks once per day', 'Push notifications', 'AI chat setup'],
    btnMonthly: 'Get Started Free', btnYearly: 'Get Started Free',
  },
  {
    name: 'Steward Pro', monthly: '$4.99', yearly: '$3.99', period: '/ month', featured: false,
    features: ['Up to 7 trackers', 'Check every 12 hours', 'Notify + Quick Link', 'Price insights & deal alerts', 'Email & SMS alerts'],
    btnMonthly: 'Subscribe for $4.99', btnYearly: 'Subscribe for $3.99',
  },
  {
    name: 'Steward Premium', monthly: '$9.99', yearly: '$7.99', period: '/ month', featured: true, tag: 'BEST VALUE',
    features: ['Up to 15 trackers', 'Check every 2 hours', 'Steward Acts for you', 'Everything in Pro', 'Fake deal detection', 'Priority support'],
    btnMonthly: 'Subscribe for $9.99', btnYearly: 'Subscribe for $7.99',
  },
]

function Pricing() {
  const [yearly, setYearly] = useState(false)

  return (
    <section id="pricing" style={{ padding: 'clamp(60px,10vh,120px) clamp(24px,8vw,60px)', background: S.bg }}>
      <div className="landing-reveal" style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 40px' }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: S.mint, opacity: 0.7, marginBottom: 16 }}>Pricing</div>
        <div style={{ fontFamily: S.serif, fontSize: 'clamp(36px,5vw,48px)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: S.cream, marginBottom: 16 }}>
          Pays for itself<br />with <em style={{ color: S.mint }}>one deal</em>
        </div>
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
          <span style={{ fontSize: 11, fontWeight: 700, color: S.gold, marginLeft: 6 }}>Save 20%</span>
        </span>
      </div>

      <div className="lnd-pricing-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {PLANS.map((plan, i) => (
          <div key={plan.name} className="landing-reveal"
            style={{
              background: plan.featured ? 'linear-gradient(135deg,rgba(42,92,69,0.3),rgba(15,32,24,0.2))' : S.cardBg,
              border: plan.featured ? '1px solid rgba(110,231,183,0.2)' : S.border,
              borderRadius: 24, padding: '36px 28px', position: 'relative', overflow: 'hidden',
              display: 'flex', flexDirection: 'column' as const,
              animationDelay: `${i * 100}ms`,
            }}>
            {plan.tag && <div style={{ position: 'absolute', top: 16, right: 16, background: S.gold, color: S.forest, fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', padding: '3px 10px', borderRadius: 20 }}>{plan.tag}</div>}
            <div style={{ fontFamily: S.serif, fontSize: 22, fontWeight: 700, color: S.cream, marginBottom: 8 }}>{plan.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
              <span style={{ fontFamily: S.serif, fontSize: 38, fontWeight: 700, color: S.mint }}>{yearly ? plan.yearly : plan.monthly}</span>
              <span style={{ fontSize: 13, color: 'rgba(247,246,243,0.4)' }}>{plan.period}</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {plan.features.map(f => (
                <li key={f} style={{ fontSize: 13, color: 'rgba(247,246,243,0.55)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: S.mint, fontSize: 12, fontWeight: 700 }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" style={{ marginTop: 'auto',
              display: 'block', textAlign: 'center', padding: 14, borderRadius: 12, fontSize: 14, fontWeight: plan.featured ? 700 : 600, textDecoration: 'none', transition: 'all .3s',
              background: plan.featured ? S.mint : 'rgba(110,231,183,0.06)',
              border: plan.featured ? 'none' : '1px solid rgba(110,231,183,0.18)',
              color: plan.featured ? S.forest : S.mint,
            }}>{yearly ? plan.btnYearly : plan.btnMonthly}</Link>
          </div>
        ))}
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
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: S.mint, opacity: 0.7, marginBottom: 16 }}>Your concierge is ready</div>
        <div style={{ fontFamily: S.serif, fontSize: 'clamp(36px,5vw,52px)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: S.cream, marginBottom: 20 }}>
          Stop losing to bots<br />Get <em style={{ color: S.mint }}>your own</em>
        </div>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(247,246,243,0.5)', fontWeight: 300, maxWidth: 600, margin: '0 auto 40px' }}>
          Steward monitors prices, tables, tickets, and campsites around the clock and pings you the moment something opens up. No scripts. No refreshing. Just results.
        </p>
        <Link href="/signup" className="landing-btn-shimmer lnd-cta-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: S.mint, color: S.forest, fontSize: 17, fontWeight: 700, padding: '18px 40px', borderRadius: 14, textDecoration: 'none' }}>
          Create Your Free Account →
        </Link>
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
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' as const }}>
        {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Support', '/support'], ['Sign In', '/login']].map(([label, href]) => (
          <Link key={href} href={href} className="lnd-footer-link"
            style={{ fontSize: 12, color: 'rgba(247,246,243,0.35)', textDecoration: 'none', transition: 'color .25s' }}>
            {label}
          </Link>
        ))}
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
    <div style={{ background: S.bg, minHeight: '100vh', color: S.cream }}>
      <ScrollRevealInit />
      <Nav />
      <Hero />
      <Ticker />
      <PriceFeature />
      <AIFeature />
      <LandingHIW />
      <LandingUseCases />
      <Pricing />
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
