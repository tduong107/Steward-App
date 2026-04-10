import Link from 'next/link'
import { BlogNav } from '@/components/blog/blog-nav'

const APP_STORE_URL = 'https://apps.apple.com/us/app/steward-concierge/id6760180137'

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#080A08',
        color: '#F7F6F3',
        minHeight: '100dvh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
      }}
    >
      <BlogNav />

      {/* Spacer for fixed nav */}
      <div style={{ height: 64 }} />

      {/* ── Main content ── */}
      <main>{children}</main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 80 }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' as const, padding: '64px 24px 48px' }}>
          <h2 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 28, fontWeight: 700, margin: '0 0 8px', color: '#F7F6F3' }}>
            Try Steward Free
          </h2>
          <p style={{ color: 'rgba(247,246,243,0.55)', fontSize: 15, marginBottom: 28 }}>
            Track prices, restaurants, campsites, and more. Get notified the moment things change.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const }}>
            <Link href={APP_STORE_URL}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10, background: '#6EE7B7', color: '#080A08', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
              iOS App
            </Link>
            <Link href="/signup"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', color: '#F7F6F3', fontWeight: 600, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>
              Web App
            </Link>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 28, flexWrap: 'wrap' as const, padding: '0 24px 20px' }}>
          {[{ label: 'Resources', href: '/blog' }, { label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }, { label: 'Support', href: '/support' }, { label: 'Home', href: '/' }].map(link => (
            <Link key={link.label} href={link.href} style={{ color: 'rgba(247,246,243,0.4)', fontSize: 13, textDecoration: 'none' }}>
              {link.label}
            </Link>
          ))}
        </div>
        <div style={{ textAlign: 'center' as const, padding: '16px 24px 32px', color: 'rgba(247,246,243,0.25)', fontSize: 12 }}>
          &copy; {new Date().getFullYear()} Steward. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
