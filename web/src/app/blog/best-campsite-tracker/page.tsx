import type { Metadata } from 'next'
import Link from 'next/link'

/* ── Design tokens ── */
const mint = '#6EE7B7'
const green = '#1C3D2E'
const green2 = '#2A5C45'
const cream = '#F7F6F3'
const bg = '#080A08'
const serif = 'Georgia, "Times New Roman", serif'
const dimCream = 'rgba(247,246,243,0.55)'

const APP_STORE_URL =
  'https://apps.apple.com/us/app/steward-concierge/id6760180137'
const WEB_APP_URL = '/signup'

/* ── SEO Metadata ── */
// Trimmed page title from 65 chars to 56 to fit Google's ~60-char
// SERP display (the previous "...National Park Reservations" was
// truncating to "...Park Reser..." in search results, hurting CTR).
// The og:title and the visible H1 keep the longer phrasing because
// they're not subject to the SERP truncation.
export const metadata: Metadata = {
  title: 'Best Campsite Tracker: Yosemite & National Parks',
  description:
    'How to snag sold-out campsites at Yosemite, Yellowstone, Big Sur, and other national parks. Steward monitors Recreation.gov cancellations 24/7 and alerts you instantly.',
  alternates: {
    canonical: 'https://www.joinsteward.app/blog/best-campsite-tracker',
  },
  openGraph: {
    title: 'Best Campsite Tracker for National Park Reservations',
    description:
      'Monitor Recreation.gov for campsite cancellations at Yosemite, Yellowstone, Big Sur. Get instant alerts when sites open up.',
    url: 'https://www.joinsteward.app/blog/best-campsite-tracker',
    type: 'article',
  },
}

/* ── Feature cards data ── */
const featureCards = [
  {
    emoji: '\uD83C\uDFD5',
    title: 'Monitor Any Campsite',
    body: 'Share any Recreation.gov campsite URL to Steward. It monitors availability for your specific dates and site preferences.',
  },
  {
    emoji: '\u26A1',
    title: 'Instant Alerts',
    body: 'The moment a cancellation happens, Steward sends a push notification to your phone with a direct link to book \u2014 before anyone else sees it.',
  },
  {
    emoji: '\uD83E\uDD16',
    title: 'AI Setup',
    body: "Just tell Steward: \u2018Watch Yosemite Upper Pines for June 14\u201316.\u2019 The AI handles the rest.",
  },
]

/* ── Supported parks ── */
const parks = [
  { emoji: '\uD83C\uDFDE', name: 'Yosemite' },
  { emoji: '\uD83C\uDF0B', name: 'Yellowstone' },
  { emoji: '\uD83C\uDF0A', name: 'Big Sur' },
  { emoji: '\uD83C\uDFD4', name: 'Glacier' },
  { emoji: '\uD83E\uDEA8', name: 'Grand Canyon' },
  { emoji: '\u26F0', name: 'Zion' },
  { emoji: '\uD83C\uDF35', name: 'Joshua Tree' },
  { emoji: '\uD83C\uDF32', name: 'Sequoia' },
  { emoji: '\uD83C\uDF27', name: 'Olympic' },
  { emoji: '\uD83E\uDEBB', name: 'Acadia' },
]

/* ── FAQ data ── */
const faqs = [
  {
    question: 'What campsites does Steward monitor?',
    answer:
      'Steward works with any campsite listed on Recreation.gov, which covers most national parks, national forests, and federal campgrounds. This includes popular spots like Yosemite Upper Pines, Yellowstone Madison, Big Sur Kirk Creek, Glacier National Park campgrounds, and thousands more. Simply share the Recreation.gov URL and Steward starts watching.',
  },
  {
    question: 'How fast does Steward alert me?',
    answer:
      'Steward checks for cancellations based on your plan \u2014 up to every 2 hours on Premium. The moment a cancellation is detected that matches your dates and preferences, you receive a push notification with a direct link to book on Recreation.gov.',
  },
  {
    question: 'Is Steward free for campsite tracking?',
    answer:
      'Yes! The free plan includes up to 3 trackers with push notifications. This is enough to monitor your top campsite picks. Premium unlocks unlimited trackers, faster check intervals, and automated actions.',
  },
]

/* ── JSON-LD schemas ── */
const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  // Trimmed from "Best Campsite Tracker: Get Yosemite & National Park
  // Reservations" (65 chars) to fit Google's ~60-char SERP display.
  // The full keyword phrasing still lives in the H1, og:title, and
  // article body — only the structured-data `headline` is shortened.
  headline: 'Best Campsite Tracker: Yosemite & National Parks',
  description:
    'How to snag sold-out campsites at Yosemite, Yellowstone, Big Sur, and other national parks. Steward monitors Recreation.gov cancellations 24/7 and alerts you instantly.',
  datePublished: '2026-04-09',
  // Bump this whenever the park list, FAQ, or step-by-step content is
  // meaningfully revised. AI ranking weights `dateModified > datePublished`
  // as a signal that the page is actively maintained.
  dateModified: '2026-04-25',
  author: { '@type': 'Organization', name: 'Steward' },
  publisher: { '@type': 'Organization', name: 'Steward' },
  mainEntityOfPage:
    'https://www.joinsteward.app/blog/best-campsite-tracker',
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

// BreadcrumbList — hierarchical SERP / AI-crawler navigation aid.
const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.joinsteward.app' },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.joinsteward.app/blog' },
    { '@type': 'ListItem', position: 3, name: 'Best Campsite Tracker', item: 'https://www.joinsteward.app/blog/best-campsite-tracker' },
  ],
}

/* ══════════════════════════════════════════════
   Page Component
   ══════════════════════════════════════════════ */
export default function BestCampsiteTrackerPage() {
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
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
        <span style={{ opacity: 0.6 }}>Guides</span>
        <span style={{ margin: '0 8px', opacity: 0.4 }}>/</span>
        <span>Best Campsite Tracker</span>
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
          How to Get Sold-Out Campsites at National Parks
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
          Yosemite, Yellowstone, and Big Sur sites sell out in minutes.
          Here&apos;s how to actually get one.
        </p>
        {/* Published + Updated dates — visible freshness signal.
            Both Google ("Last updated" appears in SERPs) and AI
            answer engines weigh these as recency cues, and human
            readers trust recently-updated guides more than ones with
            only a stale published date. Keep the displayed dates
            in sync with `datePublished` and `dateModified` in the
            articleJsonLd block above this component. */}
        <p
          style={{
            fontSize: 13,
            color: 'rgba(247,246,243,0.35)',
            margin: 0,
          }}
        >
          Published April 9, 2026 &middot; Updated April 25, 2026 &middot; 6 min read
        </p>
      </header>

      {/* ── The Campsite Problem ── */}
      <div
        style={{
          maxWidth: 720,
          margin: '48px auto 0',
          padding: '0 24px',
        }}
      >
        <h2
          style={{
            fontFamily: serif,
            fontSize: 'clamp(24px, 3.5vw, 32px)',
            fontWeight: 700,
            color: cream,
            margin: '0 0 20px',
          }}
        >
          The Campsite Problem
        </h2>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            fontSize: 15,
            color: dimCream,
            lineHeight: 1.75,
          }}
        >
          <p style={{ margin: 0 }}>
            If you&apos;ve ever tried to book a campsite at a popular national
            park, you know the drill. Sites at Yosemite Upper Pines sell out
            within seconds of the 7am PST booking window opening. Yellowstone
            Madison, Big Sur Kirk Creek, and Glacier National Park campgrounds
            are just as brutal. Thousands of people are hitting refresh at the
            exact same moment, and if you&apos;re even a few seconds late,
            everything is gone.
          </p>
          <p style={{ margin: 0 }}>
            But here&apos;s what most people don&apos;t realize: cancellations
            happen constantly. Plans change, trips get rescheduled, and sites
            open back up throughout the day &mdash; often at random times.
            The problem is that these cancellations are unpredictable. A
            prime weekend spot at Kirk Creek might open at 2pm on a Tuesday,
            or 3am on a Sunday. Unless you&apos;re refreshing Recreation.gov
            around the clock, you&apos;ll never see it.
          </p>
          <p style={{ margin: 0 }}>
            Manually refreshing is exhausting and unreliable. You&apos;re
            competing against people who have nothing better to do &mdash;
            and automated bots that snap up sites the instant they appear.
            There has to be a better way.
          </p>
        </div>
      </div>

      {/* ── Before / After ── */}
      <div
        style={{
          maxWidth: 720,
          margin: '48px auto 0',
          padding: '0 24px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
          }}
        >
          {/* Without Steward */}
          <div
            style={{
              background: 'rgba(220,38,38,0.06)',
              border: '1px solid rgba(220,38,38,0.2)',
              borderRadius: 14,
              padding: '28px 24px',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>{'\uD83D\uDE29'}</div>
            <h3
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: '#FCA5A5',
                margin: '0 0 16px',
              }}
            >
              Without Steward
            </h3>
            <ul
              style={{
                margin: 0,
                padding: '0 0 0 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                color: 'rgba(252,165,165,0.8)',
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              <li>Refreshing Recreation.gov every 5 minutes</li>
              <li>Missing cancellations while you sleep</li>
              <li>Losing sites to bots</li>
            </ul>
          </div>

          {/* With Steward */}
          <div
            style={{
              background: 'rgba(110,231,183,0.06)',
              border: `1px solid rgba(110,231,183,0.2)`,
              borderRadius: 14,
              padding: '28px 24px',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>{'\uD83C\uDF89'}</div>
            <h3
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: mint,
                margin: '0 0 16px',
              }}
            >
              With Steward
            </h3>
            <ul
              style={{
                margin: 0,
                padding: '0 0 0 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                color: 'rgba(110,231,183,0.8)',
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              <li>24/7 automated monitoring</li>
              <li>Instant push notification on cancellation</li>
              <li>Direct link to book immediately</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── How Steward Tracks Campsites ── */}
      <div
        style={{
          maxWidth: 720,
          margin: '56px auto 0',
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
          How Steward Tracks Campsites
        </h2>
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

      {/* ── Supported Parks ── */}
      <div
        style={{
          maxWidth: 720,
          margin: '56px auto 0',
          padding: '0 24px',
        }}
      >
        <h2
          style={{
            fontFamily: serif,
            fontSize: 'clamp(24px, 3.5vw, 32px)',
            fontWeight: 700,
            color: cream,
            margin: '0 0 24px',
          }}
        >
          Popular Parks People Track
        </h2>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          {parks.map((park) => (
            <span
              key={park.name}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 20,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontSize: 14,
                fontWeight: 500,
                color: cream,
              }}
            >
              <span>{park.emoji}</span>
              {park.name}
            </span>
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
          background:
            'linear-gradient(180deg, transparent 0%, rgba(110,231,183,0.04) 100%)',
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
          Never miss a campsite again
        </h2>
        <p
          style={{
            fontSize: 16,
            color: dimCream,
            margin: '0 0 32px',
          }}
        >
          Monitor Recreation.gov cancellations 24/7. Get alerted instantly.
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
