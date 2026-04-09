import type { Metadata } from 'next'
import Link from 'next/link'
import CategoryCoverage from '@/components/blog/category-coverage'
import ComparisonTable from '@/components/blog/comparison-table'

/* ── Design tokens ── */
const mint = '#6EE7B7'
const forest = '#0F2018'
const green = '#1C3D2E'
const green2 = '#2A5C45'
const gold = '#F59E0B'
const cream = '#F7F6F3'
const bg = '#080A08'
const serif = 'Georgia, "Times New Roman", serif'
const dimCream = 'rgba(247,246,243,0.55)'

const APP_STORE_URL =
  'https://apps.apple.com/us/app/steward-concierge/id6760180137'
const WEB_APP_URL = '/signup'

/* ── SEO Metadata ── */
export const metadata: Metadata = {
  title: 'Steward vs Honey (2026): Beyond Coupon Codes',
  description:
    'Honey finds coupons at checkout. Steward tracks prices, restaurants, campsites, flights, and event tickets across any website. See the full comparison.',
  alternates: {
    canonical: 'https://www.joinsteward.app/blog/steward-vs-honey',
  },
  openGraph: {
    title: 'Steward vs Honey: Beyond Coupon Codes',
    description:
      'Honey finds coupons at checkout. Steward tracks prices, restaurants, campsites, flights, and event tickets across any website.',
    url: 'https://www.joinsteward.app/blog/steward-vs-honey',
    type: 'article',
  },
}

/* ── Comparison table data ── */
const comparisonGroups = [
  {
    category: 'What It Tracks',
    rows: [
      { feature: 'Price drops across retailers', steward: true, competitor: false },
      { feature: 'Coupon codes at checkout', steward: false, competitor: true },
      {
        feature: 'Restaurant reservations (Resy, OpenTable)',
        steward: true,
        competitor: false,
        highlight: true,
      },
      {
        feature: 'Campsite availability (Recreation.gov)',
        steward: true,
        competitor: false,
        highlight: true,
      },
      {
        feature: 'Flight fare changes',
        steward: true,
        competitor: false,
        highlight: true,
      },
      {
        feature: 'Event ticket restocks (Ticketmaster)',
        steward: true,
        competitor: false,
        highlight: true,
      },
      { feature: 'Works on any URL', steward: true, competitor: false },
    ],
  },
  {
    category: 'How It Works',
    rows: [
      { feature: 'Browser extension required', steward: false, competitor: true },
      { feature: 'Native iOS app', steward: true, competitor: false },
      {
        feature: 'Push notifications',
        steward: true,
        competitor: 'Chrome only' as string | boolean,
      },
      {
        feature: 'Email & SMS alerts',
        steward: 'Pro+' as string | boolean,
        competitor: false,
      },
      { feature: 'AI-powered setup', steward: true, competitor: false },
      { feature: 'Share from any app (iOS)', steward: true, competitor: false },
    ],
  },
  {
    category: 'Intelligence',
    rows: [
      { feature: 'Price history tracking', steward: true, competitor: false },
      {
        feature: 'Fake deal detection',
        steward: 'Premium' as string | boolean,
        competitor: false,
      },
      { feature: 'Natural language conditions', steward: true, competitor: false },
    ],
  },
]

/* ── Feature highlight cards data ── */
const featureCards = [
  {
    emoji: '\uD83C\uDF10',
    title: 'Track More Than Shopping',
    body: 'While Honey is limited to coupon codes at checkout, Steward monitors restaurant reservations on Resy, campsite cancellations on Recreation.gov, flight fares on Google Flights, and ticket restocks on Ticketmaster.',
  },
  {
    emoji: '\uD83D\uDCF1',
    title: 'No Extension Required',
    body: 'Honey requires a browser extension. Steward has a native iOS app with push notifications and a Share Extension \u2014 share any URL from Safari, Chrome, or any app to start tracking instantly.',
  },
  {
    emoji: '\u2726',
    title: 'AI That Understands You',
    body: "Just tell Steward what you want: \u2018Track Nike Dunk Low under $90\u2019 or \u2018Find me a table at Carbone for Friday.\u2019 The AI handles everything \u2014 no forms, no filters, no dropdowns.",
  },
]

/* ── How it works steps ── */
const steps = [
  { emoji: '\uD83D\uDD17', label: 'Share any URL' },
  { emoji: '\uD83D\uDCAC', label: 'Tell Steward what to watch' },
  { emoji: '\uD83D\uDD14', label: 'Get notified instantly' },
]

/* ── FAQ data ── */
const faqs = [
  {
    question: 'Is Steward a browser extension like Honey?',
    answer:
      'No. Steward is a standalone iOS app and web app. There is no browser extension to install. You simply share a URL from any app on your phone, or paste it into the web app, and Steward starts monitoring it for you. This means it works with Safari, Chrome, Firefox, or any browser.',
  },
  {
    question: 'Can Steward find coupon codes?',
    answer:
      'Steward focuses on price tracking and monitoring, not coupon codes. It watches for real price drops, availability changes, and restocks across any website \u2014 including restaurants, campsites, flights, and events that Honey cannot track at all. If you want coupons and price monitoring, you can use both tools together.',
  },
  {
    question: 'Does Steward cost more than Honey?',
    answer:
      'Steward has a free tier with 3 active trackers and push notifications. The Pro plan unlocks unlimited trackers, email and SMS alerts, faster check intervals, and premium features like fake deal detection. Honey is free but only covers coupon codes at checkout.',
  },
]

/* ── JSON-LD schemas ── */
const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Steward vs Honey (2026): Beyond Coupon Codes',
  description:
    'Honey finds coupons at checkout. Steward tracks prices, restaurants, campsites, flights, and event tickets across any website. See the full comparison.',
  datePublished: '2026-04-09',
  dateModified: '2026-04-09',
  author: { '@type': 'Organization', name: 'Steward' },
  publisher: { '@type': 'Organization', name: 'Steward' },
  mainEntityOfPage: 'https://www.joinsteward.app/blog/steward-vs-honey',
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}

/* ══════════════════════════════════════════════
   Page Component
   ══════════════════════════════════════════════ */
export default function StewardVsHoneyPage() {
  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* ── Breadcrumbs ── */}
      <nav
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '20px 24px 0',
          fontSize: 13,
          color: dimCream,
        }}
        aria-label="Breadcrumb"
      >
        <Link href="/blog" style={{ color: mint, textDecoration: 'none' }}>
          Blog
        </Link>
        <span style={{ margin: '0 8px', opacity: 0.4 }}>/</span>
        <span style={{ opacity: 0.6 }}>Comparisons</span>
        <span style={{ margin: '0 8px', opacity: 0.4 }}>/</span>
        <span>Steward vs Honey</span>
      </nav>

      {/* ── Hero ── */}
      <header
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '48px 24px 0',
        }}
      >
        <h1
          style={{
            fontFamily: serif,
            fontSize: 'clamp(36px, 5vw, 52px)',
            fontWeight: 700,
            lineHeight: 1.15,
            color: cream,
            margin: '0 0 16px',
          }}
        >
          Steward vs Honey
        </h1>
        <p
          style={{
            fontSize: 16,
            color: dimCream,
            lineHeight: 1.6,
            margin: '0 0 12px',
            maxWidth: 560,
          }}
        >
          One finds coupons at checkout. The other watches the entire web for you.
        </p>
        <p
          style={{
            fontSize: 13,
            color: 'rgba(247,246,243,0.35)',
            margin: 0,
          }}
        >
          Published April 9, 2026 &middot; 5 min read
        </p>
      </header>

      {/* ── TL;DR Card ── */}
      <div
        style={{
          maxWidth: 720,
          margin: '40px auto 0',
          padding: '0 24px',
        }}
      >
        <div
          style={{
            background: green,
            borderLeft: `3px solid ${gold}`,
            borderRadius: 10,
            padding: '24px 28px',
          }}
        >
          <h2
            style={{
              fontFamily: serif,
              fontSize: 20,
              fontWeight: 700,
              color: gold,
              margin: '0 0 14px',
            }}
          >
            TL;DR
          </h2>
          <ul
            style={{
              margin: 0,
              padding: '0 0 0 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              color: cream,
              fontSize: 15,
              lineHeight: 1.6,
            }}
          >
            <li>Honey applies coupon codes at checkout for online shopping</li>
            <li>
              Steward monitors prices, restaurant reservations, campsites, flights,
              and event tickets across any website &mdash; 24/7
            </li>
            <li>
              Steward uses AI to set up tracking in seconds. No browser extension
              needed.
            </li>
          </ul>
        </div>
      </div>

      {/* ── Category Coverage ── */}
      <CategoryCoverage competitorName="Honey" competitorCategories={['shopping']} />

      {/* ── Comparison Table ── */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
        <h2
          style={{
            fontFamily: serif,
            fontSize: 'clamp(24px, 3.5vw, 32px)',
            fontWeight: 700,
            color: cream,
            margin: '56px 0 0',
          }}
        >
          Feature-by-Feature Comparison
        </h2>
      </div>

      <ComparisonTable competitorName="Honey" groups={comparisonGroups} />

      {/* ── Feature highlight cards ── */}
      <div
        style={{
          maxWidth: 720,
          margin: '56px auto 0',
          padding: '0 24px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 20,
          }}
        >
          {featureCards.map((card) => (
            <div
              key={card.title}
              style={{
                background: green,
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.06)',
                padding: '28px 24px',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: green2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  marginBottom: 16,
                }}
              >
                {card.emoji}
              </div>
              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: cream,
                  margin: '0 0 10px',
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: dimCream,
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── How Steward Works ── */}
      <div
        style={{
          maxWidth: 720,
          margin: '72px auto 0',
          padding: '0 24px',
        }}
      >
        <h2
          style={{
            fontFamily: serif,
            fontSize: 'clamp(24px, 3.5vw, 32px)',
            fontWeight: 700,
            color: cream,
            margin: '0 0 36px',
            textAlign: 'center',
          }}
        >
          How Steward Works
        </h2>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: 0,
            flexWrap: 'wrap',
          }}
        >
          {steps.map((step, i) => (
            <div
              key={step.label}
              style={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  width: 160,
                }}
              >
                {/* Number circle */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'rgba(110,231,183,0.12)',
                    border: `2px solid ${mint}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 16,
                    color: mint,
                    marginBottom: 12,
                  }}
                >
                  {i + 1}
                </div>
                {/* Emoji */}
                <div style={{ fontSize: 28, marginBottom: 10 }}>{step.emoji}</div>
                {/* Label */}
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: cream,
                    lineHeight: 1.4,
                  }}
                >
                  {step.label}
                </div>
              </div>
              {/* Dashed connector */}
              {i < steps.length - 1 && (
                <div
                  style={{
                    width: 48,
                    borderTop: '2px dashed rgba(110,231,183,0.25)',
                    alignSelf: 'center',
                    marginTop: -30,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── FAQ Section ── */}
      <div
        style={{
          maxWidth: 720,
          margin: '72px auto 0',
          padding: '0 24px',
        }}
      >
        <h2
          style={{
            fontFamily: serif,
            fontSize: 'clamp(24px, 3.5vw, 32px)',
            fontWeight: 700,
            color: cream,
            margin: '0 0 28px',
          }}
        >
          Frequently Asked Questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {faqs.map((faq) => (
            <div
              key={faq.question}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: '24px 28px',
              }}
            >
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: cream,
                  margin: '0 0 10px',
                }}
              >
                {faq.question}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: dimCream,
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA Section ── */}
      <div
        style={{
          margin: '80px 0 0',
          padding: '64px 24px',
          textAlign: 'center',
          background: `linear-gradient(180deg, transparent 0%, rgba(110,231,183,0.04) 100%)`,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <h2
          style={{
            fontFamily: serif,
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 700,
            color: cream,
            margin: '0 0 12px',
          }}
        >
          Stop settling for coupons
        </h2>
        <p
          style={{
            fontSize: 16,
            color: dimCream,
            margin: '0 0 32px',
          }}
        >
          Track prices, restaurants, campsites, flights, and more.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 14,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href={APP_STORE_URL}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 28px',
              borderRadius: 10,
              background: mint,
              color: bg,
              fontWeight: 700,
              fontSize: 16,
              textDecoration: 'none',
            }}
          >
            {/* Apple icon */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ flexShrink: 0 }}
            >
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            iOS App
          </Link>
          <Link
            href={WEB_APP_URL}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 28px',
              borderRadius: 10,
              background: 'transparent',
              color: cream,
              fontWeight: 700,
              fontSize: 16,
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            Try Free on Web
          </Link>
        </div>
      </div>
    </>
  )
}
