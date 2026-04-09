import type { Metadata } from 'next'
import Link from 'next/link'
import { articles } from './_data/articles'

export const metadata: Metadata = {
  title: 'Blog — Price Tracking, Reservations & More',
  description: 'Steward blog: comparisons with Honey, CamelCamelCamel, and guides on tracking campsites, restaurant reservations, flights, and event tickets.',
  alternates: { canonical: 'https://www.joinsteward.app/blog' },
  openGraph: {
    title: 'Steward Blog — Price Tracking, Reservations & More',
    description: 'Comparisons, guides, and tips on tracking prices, restaurants, campsites, flights, and event tickets with Steward.',
    url: 'https://www.joinsteward.app/blog',
    type: 'website',
  },
}

const S = {
  mint: '#6EE7B7',
  forest: '#0F2018',
  green: '#1C3D2E',
  green2: '#2A5C45',
  gold: '#F59E0B',
  cream: '#F7F6F3',
  bg: '#080A08',
  serif: 'Georgia, "Times New Roman", serif',
}

export default function BlogIndexPage() {
  const comparisons = articles.filter(a => a.category === 'comparison')
  const guides = articles.filter(a => a.category === 'guide')

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px 80px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.18)', borderRadius: 30, padding: '6px 16px', marginBottom: 24 }}>
          <span style={{ fontSize: 13, color: S.mint }}>✦</span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: S.mint }}>Steward Blog</span>
        </div>
        <h1 style={{ fontFamily: S.serif, fontSize: 'clamp(32px,5vw,48px)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: S.cream, margin: '0 0 16px' }}>
          Comparisons, guides &amp;{' '}
          <em style={{ color: S.mint }}>insights</em>
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(247,246,243,0.5)', fontWeight: 300, maxWidth: 500, margin: '0 auto' }}>
          Learn how Steward stacks up against competitors and discover new ways to track the things that matter to you.
        </p>
      </div>

      {/* Comparisons */}
      <section style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: S.gold, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 20, padding: '4px 12px' }}>
            Comparisons
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {comparisons.map(article => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </section>

      {/* Guides */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: S.mint, background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.18)', borderRadius: 20, padding: '4px 12px' }}>
            Guides
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {guides.map(article => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </section>
    </div>
  )
}

function ArticleCard({ article }: { article: typeof articles[number] }) {
  return (
    <Link
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
      onMouseEnter={undefined}
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
        <span style={{ fontSize: 13, fontWeight: 600, color: S.mint }}>
          Read →
        </span>
      </div>
    </Link>
  )
}
