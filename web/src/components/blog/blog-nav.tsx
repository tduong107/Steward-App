'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const APP_STORE_URL = 'https://apps.apple.com/us/app/steward-concierge/id6760180137'

const PLAIN_LINKS = [
  ['/blog', 'Resources'],
  ['/blog/comparisons', 'How We Compare'],
  ['/blog/guides', 'Guides'],
  ['/blog/insights', 'Insights'],
] as const

export function BlogNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

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
      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <svg width="30" height="30" viewBox="0 0 1024 1024" fill="none">
          <rect width="1024" height="1024" rx="224" fill="url(#bn1)"/>
          <path d="M448 488Q445 536 425 579Q405 622 367 649Q329 676 270 676Q208 676 175 641Q142 606 142 559Q142 517 166 488Q190 460 228 438Q267 417 310 397Q348 380 386 360Q424 341 455 316Q486 291 504 256Q523 222 523 174Q523 119 495 76Q468 33 416 8Q364 -16 289 -16Q244 -16 196 -3Q148 10 111 35L116 -8H64L58 205H97Q102 117 158 71Q214 26 293 26Q332 26 365 40Q398 55 417 83Q437 111 437 151Q437 196 413 226Q389 256 351 278Q313 300 270 320Q232 337 195 356Q158 375 127 399Q97 424 78 458Q60 492 60 540Q60 566 69 596Q78 626 100 653Q123 681 162 698Q202 716 263 716Q301 716 348 705Q396 695 437 665L433 708H484V488Z"
            transform="translate(388.55,660.22) scale(0.4235,-0.4235)" fill="url(#bn2)"/>
          <g transform="translate(607,355)">
            <circle cx="0" cy="0" r="22" fill="rgba(110,231,183,0.15)"/>
            <path d="M0 -14 L3.5 -3.5 L14 0 L3.5 3.5 L0 14 L-3.5 3.5 L-14 0 L-3.5 -3.5 Z" fill="url(#bn3)"/>
          </g>
          <defs>
            <linearGradient id="bn1" x1="512" y1="0" x2="512" y2="1024"><stop offset="0%" stopColor="#243D30"/><stop offset="100%" stopColor="#0F2018"/></linearGradient>
            <linearGradient id="bn2" x1="512" y1="357" x2="512" y2="667"><stop offset="0%" stopColor="#FFFFFF"/><stop offset="50%" stopColor="#D1FAE5"/><stop offset="100%" stopColor="#6EE7B7"/></linearGradient>
            <radialGradient id="bn3" cx="30%" cy="30%" r="70%"><stop offset="0%" stopColor="#FFFFFF"/><stop offset="100%" stopColor="#6EE7B7"/></radialGradient>
          </defs>
        </svg>
        <span style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', color: '#F7F6F3' }}>
          Steward
        </span>
      </Link>

      {/* Right side links */}
      <div className="blog-nav-links" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
        {PLAIN_LINKS.map(([href, label]) => (
          <Link key={href} href={href}
            style={{ fontSize: 15, fontWeight: 500, color: 'rgba(247,246,243,0.55)', textDecoration: 'none', transition: 'color .25s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#6EE7B7')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(247,246,243,0.55)')}>
            {label}
          </Link>
        ))}

        {/* iOS App button */}
        <Link href={APP_STORE_URL} target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: '#F7F6F3', textDecoration: 'none', padding: '9px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', transition: 'all .25s' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
          iOS App
        </Link>

        {/* Get Started */}
        <Link href="/signup"
          style={{ background: '#6EE7B7', color: '#0F2018', fontWeight: 700, padding: '10px 24px', borderRadius: 10, fontSize: 14.5, textDecoration: 'none', display: 'inline-block' }}>
          Get Started for Free
        </Link>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .blog-nav-links { display: none !important; }
        }
      `}</style>
    </nav>
  )
}
