import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Insights — Tips, Trends & Product Updates',
  description: 'Tips on saving money, tracking strategies, product updates, and behind-the-scenes looks at how Steward works.',
  alternates: { canonical: 'https://www.joinsteward.app/blog/insights' },
}

const S = {
  mint: '#6EE7B7',
  cream: '#F7F6F3',
  serif: 'Georgia, "Times New Roman", serif',
}

export default function InsightsPage() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px 80px' }}>
      <div style={{ marginBottom: 48 }}>
        <Link href="/blog" style={{ fontSize: 13, color: 'rgba(247,246,243,0.4)', textDecoration: 'none' }}>
          ← Back to Resources
        </Link>
      </div>

      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(168,130,255,0.08)', border: '1px solid rgba(168,130,255,0.18)', borderRadius: 30, padding: '6px 16px', marginBottom: 20 }}>
          <span style={{ fontSize: 13 }}>💡</span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(168,130,255,0.9)' }}>Insights</span>
        </div>
        <h1 style={{ fontFamily: S.serif, fontSize: 'clamp(32px,5vw,44px)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: S.cream, margin: '0 0 12px' }}>
          Tips, trends &amp; <em style={{ color: S.mint }}>updates</em>
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(247,246,243,0.5)', fontWeight: 300, maxWidth: 500 }}>
          Behind-the-scenes looks at how Steward works, saving strategies, and product updates.
        </p>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '60px 32px', textAlign: 'center' }}>
        <span style={{ fontSize: 40, display: 'block', marginBottom: 16 }}>💡</span>
        <p style={{ fontFamily: S.serif, fontSize: 22, fontWeight: 700, color: S.cream, marginBottom: 10 }}>Coming soon</p>
        <p style={{ fontSize: 15, color: 'rgba(247,246,243,0.4)', maxWidth: 440, margin: '0 auto', lineHeight: 1.6 }}>
          We&apos;re working on articles about saving money, tracking strategies, product updates, and behind-the-scenes looks at how Steward monitors the web for you.
        </p>
      </div>
    </div>
  )
}
