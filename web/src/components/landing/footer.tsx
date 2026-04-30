/**
 * Landing footer — pure Server Component. Markup + Links only, no
 * state or effects. Ships as zero-JS HTML.
 */

import Link from 'next/link'
import { Logo } from './helpers'
import { S, APP_STORE_URL } from './tokens'

// Footer links double as internal-link equity for SEO. Order matters:
// `/about` early gives the founder Person entity a high-priority
// crawl path from the sitewide footer (every page links here),
// boosting its E-E-A-T weight.
const FOOTER_LINKS: ReadonlyArray<readonly [string, string]> = [
  ['About', '/about'],
  ['Resources', '/blog'],
  ['Privacy', '/privacy'],
  ['Terms', '/terms'],
  ['Support', '/support'],
  ['Sign In', '/login'],
]

export function Footer() {
  return (
    <footer
      style={{
        padding: '40px clamp(24px,8vw,60px)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: S.bg,
        flexWrap: 'wrap',
        gap: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Logo />
        <div>
          <div style={{ fontFamily: S.serif, fontSize: 18, fontWeight: 700, color: S.cream }}>
            Steward
          </div>
          <div style={{ fontSize: 12, color: 'rgba(247,246,243,0.3)' }}>
            © 2026 Steward. All rights reserved.
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 20,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {FOOTER_LINKS.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="lnd-footer-link"
              style={{
                fontSize: 12,
                color: 'rgba(247,246,243,0.35)',
                textDecoration: 'none',
                transition: 'color .25s',
              }}
            >
              {label}
            </Link>
          ))}
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="lnd-footer-link"
            style={{
              fontSize: 12,
              color: 'rgba(247,246,243,0.35)',
              textDecoration: 'none',
              transition: 'color .25s',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            iOS App
          </a>
          {/* Instagram — sitewide footer link.
              `rel="me"` is the IndieWeb / Microformats-2 convention
              for "this is the same entity"; Google's Knowledge Graph
              honors it as a confirmation signal alongside the
              Organization.sameAs entry in layout.tsx. Combined, every
              page on the site now both schema-claims and visibly
              links the @joinsteward Instagram, which is the strongest
              brand-to-profile pairing we can give crawlers.
              `target="_blank"` opens the profile in a new tab.
              `noopener noreferrer` is mandatory for `_blank` links
              (security + perf). */}
          <a
            href="https://www.instagram.com/joinsteward/"
            target="_blank"
            rel="me noopener noreferrer"
            aria-label="Steward on Instagram"
            className="lnd-footer-link"
            style={{
              fontSize: 12,
              color: 'rgba(247,246,243,0.35)',
              textDecoration: 'none',
              transition: 'color .25s',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            Instagram
          </a>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(247,246,243,0.25)' }}>
          Contact:{' '}
          <a
            href="mailto:hello@joinsteward.app"
            style={{ color: 'rgba(110,231,183,0.5)', textDecoration: 'none' }}
          >
            hello@joinsteward.app
          </a>
        </div>
      </div>
    </footer>
  )
}
