'use client'

/**
 * Top nav bar — Client Component because it tracks scroll position
 * (to switch padding/opacity at 60px) and toggles the mobile menu.
 *
 * Phase 10 server-shell refactor: previously inline inside the giant
 * landing-client-page.tsx. Now an isolated client island so it doesn't
 * force the rest of the page into a client tree.
 *
 * Phase 5/8 perf carry-over: no `backdrop-filter` (was the main scroll
 * jank source on the fixed bar). Background opacity does the depth
 * masking instead.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { track } from '@vercel/analytics'
import { Logo } from './helpers'
import { S, APP_STORE_URL, NAV_LINKS } from './tokens'

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Close mobile menu on ESC
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: scrolled ? '14px 48px' : '22px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: scrolled ? 'rgba(8,10,8,0.94)' : 'rgba(8,10,8,0.85)',
        borderBottom: '1px solid rgba(110,231,183,0.06)',
        transition: 'background 0.4s, padding 0.4s',
        flexWrap: 'wrap',
      }}
    >
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault()
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          textDecoration: 'none',
          cursor: 'pointer',
        }}
      >
        <Logo />
        <span
          style={{
            fontFamily: S.serif,
            fontSize: 26,
            fontWeight: 700,
            color: S.cream,
            letterSpacing: '-0.02em',
          }}
        >
          Steward
        </span>
      </a>
      <div className="lnd-nav-links" style={{ display: 'flex', gap: 34, alignItems: 'center' }}>
        {NAV_LINKS.map(([href, label]) => (
          <a
            key={href}
            href={href}
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: 'rgba(247,246,243,0.7)',
              textDecoration: 'none',
              transition: 'color .25s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = S.mint)}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(247,246,243,0.7)')}
          >
            {label}
          </a>
        ))}
        <Link
          href="/blog"
          style={{
            fontSize: 17,
            fontWeight: 600,
            color: 'rgba(247,246,243,0.7)',
            textDecoration: 'none',
            transition: 'color .25s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = S.mint)}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(247,246,243,0.7)')}
        >
          Resources
        </Link>
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('app_store_click', { location: 'nav' })}
          className="lnd-nav-ios"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 15.5,
            fontWeight: 600,
            color: S.cream,
            textDecoration: 'none',
            padding: '11px 22px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.2)',
            transition: 'all .25s',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          iOS App
        </a>
        <Link
          href="/signup"
          onClick={() => track('signup_button_click', { location: 'nav' })}
          className="landing-btn-shimmer"
          style={{
            background: S.mint,
            color: S.forest,
            fontWeight: 700,
            padding: '12px 28px',
            borderRadius: 12,
            fontSize: 16,
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Get Started for Free
        </Link>
      </div>

      <button
        className="lnd-hamburger"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        aria-controls="lnd-mobile-menu"
        onClick={() => setMenuOpen((v) => !v)}
        style={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: 10,
          background: menuOpen ? 'rgba(110,231,183,0.1)' : 'transparent',
          border: '1px solid rgba(255,255,255,0.1)',
          cursor: 'pointer',
          fontSize: 18,
          color: S.cream,
          fontFamily: 'inherit',
          transition: 'all .25s',
        }}
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {menuOpen && (
        <div
          id="lnd-mobile-menu"
          style={{
            width: '100%',
            borderTop: '1px solid rgba(110,231,183,0.08)',
            padding: '12px 0 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {NAV_LINKS.map(([href, label]) => (
            <a
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: 'rgba(247,246,243,0.7)',
                textDecoration: 'none',
                padding: '11px 4px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              {label}
            </a>
          ))}
          <Link
            href="/blog"
            onClick={() => setMenuOpen(false)}
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: 'rgba(247,246,243,0.7)',
              textDecoration: 'none',
              padding: '11px 4px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            Resources
          </Link>
          <Link
            href="/signup"
            onClick={() => setMenuOpen(false)}
            style={{
              background: S.mint,
              color: S.forest,
              fontWeight: 700,
              padding: '13px',
              borderRadius: 10,
              fontSize: 15,
              textDecoration: 'none',
              textAlign: 'center',
              marginTop: 8,
              display: 'block',
            }}
          >
            Get Started for Free
          </Link>
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: S.cream,
              fontWeight: 600,
              padding: '13px',
              borderRadius: 10,
              fontSize: 14,
              textDecoration: 'none',
              marginTop: 6,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            iOS App
          </a>
        </div>
      )}
    </nav>
  )
}
