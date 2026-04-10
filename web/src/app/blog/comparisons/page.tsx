import type { Metadata } from 'next'
import Link from 'next/link'
import { articles } from '../_data/articles'

export const metadata: Metadata = {
  title: 'How We Compare — Steward vs Competitors',
  description: 'See how Steward compares to Honey, CamelCamelCamel, and other price trackers. Steward tracks prices, restaurants, campsites, flights, and tickets across any website.',
  alternates: { canonical: 'https://www.joinsteward.app/blog/comparisons' },
}

const S = {
  mint: '#6EE7B7',
  gold: '#F59E0B',
  cream: '#F7F6F3',
  serif: 'Georgia, "Times New Roman", serif',
}

export default function ComparisonsPage() {
  const comparisons = articles.filter(a => a.category === 'comparison')

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px 80px' }}>
      <div style={{ marginBottom: 48 }}>
        <Link href="/blog" style={{ fontSize: 13, color: 'rgba(247,246,243,0.4)', textDecoration: 'none' }}>
          ← Back to Resources
        </Link>
      </div>

      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 30, padding: '6px 16px', marginBottom: 20 }}>
          <span style={{ fontSize: 13 }}>⚡</span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: S.gold }}>How We Compare</span>
        </div>
        <h1 style={{ fontFamily: S.serif, fontSize: 'clamp(32px,5vw,44px)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: S.cream, margin: '0 0 12px' }}>
          Steward vs the <em style={{ color: S.mint }}>competition</em>
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(247,246,243,0.5)', fontWeight: 300, maxWidth: 500 }}>
          See how Steward stacks up against popular price trackers and why we go far beyond just shopping.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {comparisons.map(article => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            style={{
              display: 'block',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 18,
              padding: 24,
              textDecoration: 'none',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 16 }}>{article.icon}</div>
            <h2 style={{ fontFamily: S.serif, fontSize: 18, fontWeight: 700, color: S.cream, lineHeight: 1.3, margin: '0 0 10px' }}>
              {article.title}
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(247,246,243,0.45)', lineHeight: 1.5, margin: '0 0 16px' }}>
              {article.description}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'rgba(247,246,243,0.25)' }}>
                {new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: S.mint }}>Read →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
