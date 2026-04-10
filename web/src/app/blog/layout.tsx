import Link from 'next/link'

const APP_STORE_URL = 'https://apps.apple.com/us/app/steward-concierge/id6760180137'
const WEB_APP_URL = '/signup'

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#080A08',
        color: '#F7F6F3',
        minHeight: '100dvh',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
      }}
    >
      {/* ── Nav ── */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 24px',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          background: 'rgba(8,10,8,0.85)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            color: '#F7F6F3',
          }}
        >
          {/* SVG Logo — matches landing page exactly */}
          <svg width="30" height="30" viewBox="0 0 1024 1024" fill="none">
            <rect width="1024" height="1024" rx="224" fill="url(#bl1)"/>
            <path d="M448 488Q445 536 425 579Q405 622 367 649Q329 676 270 676Q208 676 175 641Q142 606 142 559Q142 517 166 488Q190 460 228 438Q267 417 310 397Q348 380 386 360Q424 341 455 316Q486 291 504 256Q523 222 523 174Q523 119 495 76Q468 33 416 8Q364 -16 289 -16Q244 -16 196 -3Q148 10 111 35L116 -8H64L58 205H97Q102 117 158 71Q214 26 293 26Q332 26 365 40Q398 55 417 83Q437 111 437 151Q437 196 413 226Q389 256 351 278Q313 300 270 320Q232 337 195 356Q158 375 127 399Q97 424 78 458Q60 492 60 540Q60 566 69 596Q78 626 100 653Q123 681 162 698Q202 716 263 716Q301 716 348 705Q396 695 437 665L433 708H484V488Z"
              transform="translate(388.55,660.22) scale(0.4235,-0.4235)" fill="url(#bl2)"/>
            <g transform="translate(607,355)">
              <circle cx="0" cy="0" r="22" fill="rgba(110,231,183,0.15)"/>
              <path d="M0 -14 L3.5 -3.5 L14 0 L3.5 3.5 L0 14 L-3.5 3.5 L-14 0 L-3.5 -3.5 Z" fill="url(#bl3)"/>
            </g>
            <defs>
              <linearGradient id="bl1" x1="512" y1="0" x2="512" y2="1024">
                <stop offset="0%" stopColor="#243D30"/><stop offset="100%" stopColor="#0F2018"/>
              </linearGradient>
              <linearGradient id="bl2" x1="512" y1="357" x2="512" y2="667">
                <stop offset="0%" stopColor="#FFFFFF"/><stop offset="50%" stopColor="#D1FAE5"/><stop offset="100%" stopColor="#6EE7B7"/>
              </linearGradient>
              <radialGradient id="bl3" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#FFFFFF"/><stop offset="100%" stopColor="#6EE7B7"/>
              </radialGradient>
            </defs>
          </svg>
          <span
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: '-0.02em',
              color: '#F7F6F3',
            }}
          >
            Steward
          </span>
        </Link>

        <Link
          href={APP_STORE_URL}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 18px',
            borderRadius: 8,
            background: '#6EE7B7',
            color: '#080A08',
            fontWeight: 600,
            fontSize: 14,
            textDecoration: 'none',
            transition: 'opacity 0.15s',
          }}
        >
          Get Started
        </Link>
      </nav>

      {/* ── Main content ── */}
      <main>{children}</main>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          marginTop: 80,
        }}
      >
        {/* CTA block */}
        <div
          style={{
            maxWidth: 600,
            margin: '0 auto',
            textAlign: 'center' as const,
            padding: '64px 24px 48px',
          }}
        >
          <h2
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 28,
              fontWeight: 700,
              marginBottom: 8,
              color: '#F7F6F3',
            }}
          >
            Try Steward Free
          </h2>
          <p
            style={{
              color: 'rgba(247,246,243,0.55)',
              fontSize: 15,
              marginBottom: 28,
            }}
          >
            Track prices, restaurants, campsites, and more. Get notified the moment things change.
          </p>
          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap' as const,
            }}
          >
            <Link
              href={APP_STORE_URL}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                borderRadius: 10,
                background: '#6EE7B7',
                color: '#080A08',
                fontWeight: 600,
                fontSize: 15,
                textDecoration: 'none',
              }}
            >
              iOS App
            </Link>
            <Link
              href={WEB_APP_URL}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.06)',
                color: '#F7F6F3',
                fontWeight: 600,
                fontSize: 15,
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              Web App
            </Link>
          </div>
        </div>

        {/* Links row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 28,
            flexWrap: 'wrap' as const,
            padding: '0 24px 20px',
          }}
        >
          {[
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
            { label: 'Support', href: '/support' },
            { label: 'Home', href: '/' },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              style={{
                color: 'rgba(247,246,243,0.4)',
                fontSize: 13,
                textDecoration: 'none',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Copyright */}
        <div
          style={{
            textAlign: 'center' as const,
            padding: '16px 24px 32px',
            color: 'rgba(247,246,243,0.25)',
            fontSize: 12,
          }}
        >
          &copy; {new Date().getFullYear()} Steward. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
