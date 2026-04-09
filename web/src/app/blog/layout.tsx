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
          href="/blog"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            color: '#F7F6F3',
          }}
        >
          {/* Logo mark */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#2A5C45',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 700,
              fontSize: 16,
              color: '#6EE7B7',
            }}
          >
            S
          </span>
          <span
            style={{
              fontWeight: 600,
              fontSize: 17,
              letterSpacing: '-0.01em',
            }}
          >
            Steward
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase' as const,
              padding: '3px 8px',
              borderRadius: 6,
              background: 'rgba(110,231,183,0.1)',
              color: '#6EE7B7',
              border: '1px solid rgba(110,231,183,0.2)',
            }}
          >
            Blog
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
