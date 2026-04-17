import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Resources — Comparisons, Guides & Insights',
  description: 'Steward resources: see how we compare to Honey and CamelCamelCamel, read guides on tracking campsites and restaurants, and get insights on saving money.',
  alternates: { canonical: 'https://www.joinsteward.app/blog' },
  openGraph: {
    title: 'Steward Resources — Comparisons, Guides & Insights',
    description: 'Comparisons, guides, and tips on tracking prices, restaurants, campsites, flights, and event tickets with Steward.',
    url: 'https://www.joinsteward.app/blog',
    type: 'website',
  },
}

const S = {
  mint: '#6EE7B7',
  cream: '#F7F6F3',
  serif: 'Georgia, "Times New Roman", serif',
}

const CATEGORIES = [
  {
    title: 'How We Compare',
    desc: 'See how Steward stacks up against Honey, CamelCamelCamel, and other price trackers.',
    href: '/blog/comparisons',
  },
  {
    title: 'Guides',
    desc: 'Step-by-step guides on tracking campsites, restaurants, flights, and event tickets.',
    href: '/blog/guides',
  },
  {
    title: 'Insights',
    desc: 'Tips on saving money, tracking strategies, product updates, and behind-the-scenes looks.',
    href: '/blog/insights',
  },
]

export default function BlogIndexPage() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px 80px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.18)', borderRadius: 30, padding: '6px 16px', marginBottom: 24 }}>
          <span style={{ fontSize: 13, color: S.mint }}>✦</span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: S.mint }}>Resources</span>
        </div>
        <h1 style={{ fontFamily: S.serif, fontSize: 'clamp(32px,5vw,48px)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: S.cream, margin: '0 0 16px' }}>
          Comparisons, guides &amp;{' '}
          <em style={{ color: S.mint }}>insights</em>
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(247,246,243,0.5)', fontWeight: 300, maxWidth: 500, margin: '0 auto' }}>
          Learn how Steward stacks up against competitors and discover new ways to track the things that matter to you.
        </p>
      </div>

      {/* Category cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
        {CATEGORIES.map(cat => (
          <Link
            key={cat.title}
            href={cat.href}
            style={{
              display: 'flex', flexDirection: 'column', gap: 16,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 20, padding: '32px 28px', textDecoration: 'none', transition: 'all 0.3s ease',
            }}
          >
            <h2 style={{ fontFamily: S.serif, fontSize: 22, fontWeight: 700, color: S.cream, lineHeight: 1.2, margin: 0 }}>
              {cat.title}
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(247,246,243,0.45)', lineHeight: 1.5, margin: 0, flex: 1 }}>
              {cat.desc}
            </p>
            <span style={{ fontSize: 13, fontWeight: 600, color: S.mint }}>
              Explore →
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
