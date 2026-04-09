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
export const metadata: Metadata = {
  title: 'Best Restaurant Reservation Tracker: Get Hard-to-Book Tables',
  description:
    'How to get reservations at Carbone, Don Angie, and other impossible restaurants. Steward monitors Resy and OpenTable for cancellations automatically.',
  alternates: {
    canonical:
      'https://www.joinsteward.app/blog/best-restaurant-reservation-tracker',
  },
  openGraph: {
    title: 'Best Restaurant Reservation Tracker for Hard-to-Book Tables',
    description:
      'Monitor Resy and OpenTable for cancellations at top restaurants. Get instant alerts when tables open up.',
    url: 'https://www.joinsteward.app/blog/best-restaurant-reservation-tracker',
    type: 'article',
  },
}

/* ── Feature cards data ── */
const featureCards = [
  {
    emoji: '\uD83C\uDF7D',
    title: 'Monitor Any Restaurant',
    body: "Share a Resy or OpenTable link to Steward, or just say \u2018Watch Carbone for Friday 8pm, 2 guests.\u2019 Steward monitors for openings.",
  },
  {
    emoji: '\uD83D\uDD14',
    title: 'Instant Table Alerts',
    body: 'When a cancellation matches your criteria \u2014 restaurant, date, time, party size \u2014 Steward sends a push notification with a direct link to book.',
  },
  {
    emoji: '\u2726',
    title: 'AI Understands Context',
    body: "Natural language setup: \u2018Find me a table at Don Angie for Saturday dinner, 4 people.\u2019 Steward figures out the rest.",
  },
]

/* ── Popular restaurants ── */
const restaurants = [
  'Carbone',
  'Don Angie',
  '4 Charles Prime Rib',
  'Tatiana',
  'Nobu',
  'Atomix',
  'Le Bernardin',
  'Eleven Madison Park',
  'The Bear',
  'Bestia',
]

/* ── FAQ data ── */
const faqs = [
  {
    question: 'What restaurants does Steward work with?',
    answer:
      'Steward monitors restaurants listed on Resy and OpenTable \u2014 which covers the vast majority of high-demand restaurants in New York, Los Angeles, San Francisco, Chicago, Miami, and other major cities. Simply share a restaurant link or tell the AI what you\u2019re looking for.',
  },
  {
    question: 'Can Steward book the reservation for me?',
    answer:
      'On Premium, Steward can take automated actions when availability is detected. For restaurants, this means sending you a direct link to the exact reservation slot so you can book with one tap \u2014 faster than anyone manually browsing.',
  },
  {
    question: 'How quickly will I be notified?',
    answer:
      'The moment a cancellation is detected that matches your restaurant, date, time, and party size, Steward sends a push notification to your phone. Check frequency depends on your plan \u2014 up to every 2 hours on Premium.',
  },
]

/* ── JSON-LD schemas ── */
const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline:
    'Best Restaurant Reservation Tracker: Get Hard-to-Book Tables',
  description:
    'How to get reservations at Carbone, Don Angie, and other impossible restaurants. Steward monitors Resy and OpenTable for cancellations automatically.',
  datePublished: '2026-04-09',
  dateModified: '2026-04-09',
  author: { '@type': 'Organization', name: 'Steward' },
  publisher: { '@type': 'Organization', name: 'Steward' },
  mainEntityOfPage:
    'https://www.joinsteward.app/blog/best-restaurant-reservation-tracker',
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
export default function BestRestaurantReservationTrackerPage() {
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
        <span style={{ opacity: 0.6 }}>Guides</span>
        <span style={{ margin: '0 8px', opacity: 0.4 }}>/</span>
        <span>Best Restaurant Reservation Tracker</span>
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
          How to Get Reservations at the Hardest Restaurants to Book
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
          Carbone, Don Angie, 4 Charles Prime Rib, Tatiana &mdash; tables go in
          seconds. Here&apos;s the secret.
        </p>
        <p
          style={{
            fontSize: 13,
            color: 'rgba(247,246,243,0.35)',
            margin: 0,
          }}
        >
          Published April 9, 2026 &middot; 6 min read
        </p>
      </header>

      {/* ── The Reservation Problem ── */}
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
          The Reservation Problem
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
            Getting a table at the hottest restaurants feels impossible.
            Carbone releases reservations at midnight and they&apos;re gone by
            12:01am. Don Angie, 4 Charles Prime Rib, and Tatiana are the same
            story &mdash; hundreds of people hitting the Resy app at the exact
            moment reservations drop, and in seconds, everything is booked
            solid for weeks.
          </p>
          <p style={{ margin: 0 }}>
            But the real opportunity isn&apos;t the initial release &mdash;
            it&apos;s cancellations. People change plans constantly.
            A prime Saturday 8pm table at Nobu might open up at 2pm on a
            Wednesday. A coveted Atomix slot could appear at 6am. These
            cancellations are the best-kept secret for scoring reservations at
            impossible restaurants. The catch? They happen at completely random
            times.
          </p>
          <p style={{ margin: 0 }}>
            You could spend hours manually refreshing Resy, checking
            OpenTable, and scrolling through time slots hoping to find an
            opening. Or you could settle for a 5pm Tuesday instead of the
            Friday dinner you actually wanted. Le Bernardin, Eleven Madison
            Park, Bestia in LA &mdash; the same pattern plays out everywhere.
            The demand is overwhelming, and the supply is tiny.
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
              <li>Checking Resy every hour</li>
              <li>Missing cancellations at 3am</li>
              <li>Settling for a 5pm Tuesday</li>
            </ul>
          </div>

          {/* With Steward */}
          <div
            style={{
              background: 'rgba(110,231,183,0.06)',
              border: '1px solid rgba(110,231,183,0.2)',
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
              <li>24/7 Resy monitoring</li>
              <li>Instant alert: &ldquo;Table found!&rdquo;</li>
              <li>Your ideal date, time, and party size</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── How Steward Tracks Reservations ── */}
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
          How Steward Tracks Reservations
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

      {/* ── Popular Restaurants ── */}
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
          Popular Restaurants People Track
        </h2>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          {restaurants.map((name) => (
            <span
              key={name}
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
              <span>{'\uD83C\uDF7D'}</span>
              {name}
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
          Stop refreshing Resy
        </h2>
        <p
          style={{
            fontSize: 16,
            color: dimCream,
            margin: '0 0 32px',
          }}
        >
          Let Steward watch for cancellations at your favorite restaurants.
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
