import type { Metadata } from 'next'
import Link from 'next/link'
import CategoryCoverage from '@/components/blog/category-coverage'
import ComparisonTable from '@/components/blog/comparison-table'

const APP_STORE_URL = 'https://apps.apple.com/us/app/steward-concierge/id6760180137'
const WEB_APP_URL = '/signup'

export const metadata: Metadata = {
  title: 'Steward vs CamelCamelCamel (2026): Price Tracking Beyond Amazon',
  description:
    'CamelCamelCamel only tracks Amazon prices. Steward works on any website — Nike, Best Buy, Target — plus restaurants, campsites, flights, and tickets.',
  alternates: {
    canonical: 'https://www.joinsteward.app/blog/steward-vs-camelcamelcamel',
  },
  openGraph: {
    title: 'Steward vs CamelCamelCamel: Price Tracking Beyond Amazon',
    description:
      'CamelCamelCamel only tracks Amazon. Steward works on any URL plus restaurants, campsites, flights, and tickets.',
    url: 'https://www.joinsteward.app/blog/steward-vs-camelcamelcamel',
    type: 'article',
  },
}

const comparisonGroups = [
  {
    category: 'Coverage',
    rows: [
      { feature: 'Amazon price tracking', steward: true, competitor: true },
      {
        feature: 'Nike, Best Buy, Target, Walmart',
        steward: true,
        competitor: false,
        highlight: true,
      },
      {
        feature: 'Any website / URL',
        steward: true,
        competitor: false,
        highlight: true,
      },
      {
        feature: 'Restaurant reservations',
        steward: true,
        competitor: false,
        highlight: true,
      },
      {
        feature: 'Campsite availability',
        steward: true,
        competitor: false,
        highlight: true,
      },
      { feature: 'Flight fare tracking', steward: true, competitor: false },
      { feature: 'Event ticket restocks', steward: true, competitor: false },
    ],
  },
  {
    category: 'Platform & Alerts',
    rows: [
      { feature: 'Native iOS app', steward: true, competitor: false },
      { feature: 'Push notifications', steward: true, competitor: false },
      {
        feature: 'Email alerts',
        steward: 'Pro+' as string | boolean,
        competitor: true as string | boolean,
      },
      {
        feature: 'SMS alerts',
        steward: 'Pro+' as string | boolean,
        competitor: false as string | boolean,
      },
      { feature: 'Browser extension', steward: false, competitor: true },
      {
        feature: 'Share from any app (iOS)',
        steward: true,
        competitor: false,
      },
    ],
  },
  {
    category: 'Intelligence',
    rows: [
      { feature: 'Price history charts', steward: true, competitor: true },
      { feature: 'AI-powered setup', steward: true, competitor: false },
      {
        feature: 'Fake deal detection',
        steward: 'Premium' as string | boolean,
        competitor: false as string | boolean,
      },
      {
        feature: 'Natural language tracking',
        steward: true,
        competitor: false,
      },
      { feature: 'Target price alerts', steward: true, competitor: true },
    ],
  },
]

const featureCards = [
  {
    emoji: '\uD83C\uDF10',
    title: 'Beyond Amazon',
    body: 'CamelCamelCamel only works on Amazon. Steward tracks prices across Nike, Best Buy, Target, Walmart, Costco, Nordstrom, REI, and any other website. Just share the URL.',
  },
  {
    emoji: '\uD83C\uDF7D',
    title: 'Not Just Shopping',
    body: 'Steward goes far beyond price tracking. Monitor restaurant reservations on Resy, campsite cancellations on Recreation.gov, flight fares, and sold-out concert tickets.',
  },
  {
    emoji: '\uD83D\uDCF1',
    title: 'Mobile-First Experience',
    body: 'CamelCamelCamel is a website with a browser extension. Steward is a native iOS app with instant push notifications and an AI chat that sets up tracking in seconds.',
  },
]

const steps = [
  { emoji: '\uD83D\uDD17', label: 'Share any URL' },
  { emoji: '\uD83D\uDCAC', label: 'Tell Steward what to watch' },
  { emoji: '\uD83D\uDD14', label: 'Get notified instantly' },
]

const faqs = [
  {
    question: 'Does Steward track Amazon prices like CamelCamelCamel?',
    answer:
      'Yes! Steward tracks Amazon and thousands of other retailers. Unlike CamelCamelCamel, which is Amazon-only, Steward can monitor prices on Nike, Best Buy, Target, Walmart, Costco, and any other website you share with it.',
  },
  {
    question: 'Do I need a browser extension?',
    answer:
      'No. Steward has a native iOS app with a Share Extension. You can share any URL from Safari, Chrome, or any app directly to Steward. No browser extension required.',
  },
  {
    question: 'Is there a free version?',
    answer:
      'Yes. Steward\u2019s free tier includes 3 trackers with daily checks. Upgrade for more trackers, faster check intervals, SMS alerts, and premium AI features like fake deal detection.',
  },
]

/* ── Inline style helpers ── */
const mint = '#6EE7B7'
const forest = '#0F2018'
const green = '#1C3D2E'
const green2 = '#2A5C45'
const gold = '#F59E0B'
const cream = '#F7F6F3'
const bg = '#080A08'
const serif = 'Georgia, "Times New Roman", serif'

const prose: React.CSSProperties = {
  maxWidth: 720,
  margin: '0 auto',
  padding: '0 24px',
}

export default function StewardVsCamelCamelCamelPage() {
  /* ── JSON-LD: Article ── */
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline:
      'Steward vs CamelCamelCamel (2026): Price Tracking Beyond Amazon',
    description:
      'CamelCamelCamel only tracks Amazon prices. Steward works on any website — Nike, Best Buy, Target — plus restaurants, campsites, flights, and tickets.',
    datePublished: '2026-03-26T12:00:00-07:00',
    // dateModified > datePublished signals active maintenance to AI
    // ranking. Bump when you meaningfully edit the comparison or FAQ.
    dateModified: '2026-04-22T12:00:00-07:00',
    // Per-post OG image (Satori-rendered, 1200×630). Required as
    // ImageObject to clear Rich Results "Missing field 'image'" warning.
    image: {
      '@type': 'ImageObject',
      url: 'https://www.joinsteward.app/blog/steward-vs-camelcamelcamel/opengraph-image',
      width: 1200,
      height: 630,
    },
    // Author is the founder Person entity defined in layout.tsx /about.
    // E-E-A-T: named-author attribution materially lifts AI citation
    // rates and Google rich-result eligibility over org-only.
    author: { '@id': 'https://www.joinsteward.app/about#tienhung' },
    publisher: { '@id': 'https://www.joinsteward.app/#organization' },
    mainEntityOfPage:
      'https://www.joinsteward.app/blog/steward-vs-camelcamelcamel',
  }

  /* ── JSON-LD: FAQPage ── */
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }

  /* ── JSON-LD: BreadcrumbList ── */
  // Hierarchical navigation hint for SERPs and AI crawlers. `position`
  // is 1-indexed by spec.
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.joinsteward.app' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.joinsteward.app/blog' },
      { '@type': 'ListItem', position: 3, name: 'Steward vs CamelCamelCamel', item: 'https://www.joinsteward.app/blog/steward-vs-camelcamelcamel' },
    ],
  }

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
      <nav style={{ ...prose, paddingTop: 28, paddingBottom: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: 'rgba(247,246,243,0.4)',
            flexWrap: 'wrap' as const,
          }}
        >
          <Link
            href="/blog"
            style={{ color: mint, textDecoration: 'none' }}
          >
            Blog
          </Link>
          <span style={{ opacity: 0.4 }}>/</span>
          <span>Comparisons</span>
          <span style={{ opacity: 0.4 }}>/</span>
          <span style={{ color: cream }}>Steward vs CamelCamelCamel</span>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header
        style={{
          ...prose,
          textAlign: 'center' as const,
          paddingTop: 56,
          paddingBottom: 48,
        }}
      >
        <h1
          style={{
            fontFamily: serif,
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 700,
            lineHeight: 1.15,
            color: cream,
            marginBottom: 16,
          }}
        >
          Steward vs CamelCamelCamel
        </h1>
        <p
          style={{
            fontSize: 'clamp(17px, 2.5vw, 20px)',
            color: 'rgba(247,246,243,0.65)',
            maxWidth: 520,
            margin: '0 auto 20px',
            lineHeight: 1.5,
          }}
        >
          CamelCamelCamel tracks Amazon, while Steward tracks everything.
        </p>
        <p
          style={{
            fontSize: 13,
            color: 'rgba(247,246,243,0.35)',
          }}
        >
          {/* Byline + dates. /about hosts the Person entity referenced
              by articleJsonLd.author so crawlers can hop from this
              link to the schema'd identity. */}
          By{' '}
          <Link
            href="/about"
            style={{
              color: 'rgba(247,246,243,0.55)',
              textDecoration: 'underline',
              textDecorationColor: 'rgba(247,246,243,0.25)',
            }}
          >
            Tienhung Duong
          </Link>{' '}
          &middot; Published March 26, 2026 &middot; Updated April 22, 2026 &middot; 5 min read
        </p>
      </header>

      {/* ── TL;DR Card ── */}
      <section style={prose}>
        <div
          style={{
            border: `1px solid ${gold}`,
            borderRadius: 14,
            padding: '28px 28px 24px',
            background: 'rgba(245,158,11,0.04)',
            marginBottom: 56,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              color: gold,
              marginBottom: 16,
            }}
          >
            TL;DR
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: 20,
              display: 'flex',
              flexDirection: 'column' as const,
              gap: 12,
              color: 'rgba(247,246,243,0.8)',
              fontSize: 15,
              lineHeight: 1.65,
            }}
          >
            <li>
              CamelCamelCamel is an Amazon exclusive price tracker with browser
              extension and email alerts.
            </li>
            <li>
              Steward works on any website: Amazon, Nike, Best Buy, Target,
              Walmart, and thousands more. Steward also checks for reservations
              on restaurants, campsites, flights, and event tickets.
            </li>
            <li>
              Steward uses AI to understand any page you share. No browser
              extension needed. Native iOS app with push notifications.
            </li>
          </ul>
        </div>
      </section>

      {/* ── Category Coverage ── */}
      <CategoryCoverage
        competitorName="CamelCamelCamel"
        competitorCategories={['shopping']}
      />

      {/* ── Feature-by-Feature Comparison ── */}
      <section style={prose}>
        <h2
          style={{
            fontFamily: serif,
            fontSize: 28,
            fontWeight: 700,
            color: cream,
            marginBottom: 8,
            marginTop: 56,
          }}
        >
          Feature-by-Feature Comparison
        </h2>
      </section>

      <ComparisonTable
        competitorName="CamelCamelCamel"
        groups={comparisonGroups}
      />

      {/* ── Feature Cards (3-col grid) ── */}
      <section style={{ ...prose, marginTop: 56 }}>
        <div
          className="feature-cards-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
          }}
        >
          {featureCards.map((card) => (
            <div
              key={card.title}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14,
                padding: 24,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 12 }}>
                {card.emoji}
              </div>
              <h3
                style={{
                  fontFamily: serif,
                  fontSize: 18,
                  fontWeight: 700,
                  color: cream,
                  marginBottom: 8,
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: 'rgba(247,246,243,0.65)',
                  margin: 0,
                }}
              >
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Where Amazon-Only Tracking Falls Short ──
          Added April 2026 to push article word count over the 2000
          threshold (was ~1670) and to make the comparison concrete
          with named use cases. Each subsection targets a specific
          long-tail query intent ("how to track Nike sneaker drops",
          "Resy reservation alert", etc.). */}
      <section style={{ ...prose, marginTop: 64 }}>
        <h2
          style={{
            fontFamily: serif,
            fontSize: 28,
            fontWeight: 700,
            color: cream,
            marginBottom: 16,
          }}
        >
          Where Amazon-only tracking falls short
        </h2>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.7,
            color: 'rgba(247,246,243,0.75)',
            marginBottom: 32,
          }}
        >
          Most price-watching tools have an Amazon problem in reverse:
          they assume Amazon is where you&rsquo;d buy, when it often
          isn&rsquo;t. Here are five categories CamelCamelCamel
          can&rsquo;t help you with — every one of which Steward
          handles natively.
        </p>

        <h3
          style={{
            fontFamily: serif,
            fontSize: 20,
            fontWeight: 700,
            color: cream,
            marginTop: 28,
            marginBottom: 10,
          }}
        >
          Sneaker and apparel drops
        </h3>
        <p
          style={{
            fontSize: 15.5,
            lineHeight: 1.7,
            color: 'rgba(247,246,243,0.7)',
            marginBottom: 20,
          }}
        >
          When a Nike Air Max colorway drops at 10 a.m. ET, it&rsquo;s
          gone in two minutes. Resale prices triple by lunch.
          CamelCamelCamel doesn&rsquo;t track Nike, Adidas, On
          Running, or Hoka — those drops live on the brand&rsquo;s own
          site or the SNKRS app, and CCC&rsquo;s database starts and
          ends at amazon.com. Steward, by contrast, watches any URL.
          Paste the SNKRS link, set a condition like &ldquo;back in
          stock in size 10,&rdquo; and you&rsquo;ll get a push
          notification the moment the variant flips to available.
          Same flow for Lululemon&rsquo;s We Made Too Much section,
          Patagonia&rsquo;s Worn Wear, or Aritzia&rsquo;s archive
          sales.
        </p>

        <h3
          style={{
            fontFamily: serif,
            fontSize: 20,
            fontWeight: 700,
            color: cream,
            marginTop: 28,
            marginBottom: 10,
          }}
        >
          Concert and event ticket restocks
        </h3>
        <p
          style={{
            fontSize: 15.5,
            lineHeight: 1.7,
            color: 'rgba(247,246,243,0.7)',
            marginBottom: 20,
          }}
        >
          Tickets sell out in seconds. Then minutes later, somebody&rsquo;s
          cart times out and a single seat reappears. By the time you
          refresh Ticketmaster, it&rsquo;s gone again. The classic
          deal-hunter workflow involves a Chrome tab open all day with
          auto-refresh. CamelCamelCamel can&rsquo;t help here —
          Ticketmaster, AXS, SeatGeek, and StubHub aren&rsquo;t in
          its data model. Steward watches the listing, detects when a
          seat appears, and sends an instant alert with a deep link
          straight to the checkout flow.
        </p>

        <h3
          style={{
            fontFamily: serif,
            fontSize: 20,
            fontWeight: 700,
            color: cream,
            marginTop: 28,
            marginBottom: 10,
          }}
        >
          Restaurant reservations and hard-to-book tables
        </h3>
        <p
          style={{
            fontSize: 15.5,
            lineHeight: 1.7,
            color: 'rgba(247,246,243,0.7)',
            marginBottom: 20,
          }}
        >
          Carbone in New York. Don Angie. Hawksmoor. Funke in Los
          Angeles. These are tables you can&rsquo;t get without a Resy
          bot — or until now. CamelCamelCamel has no concept of
          restaurant reservations because it isn&rsquo;t an Amazon
          product category. Steward monitors Resy and OpenTable for
          cancellations and openings. When a table opens for your
          restaurant, date, time, and party size, you get a push
          notification — and on Premium, an auto-book attempt before
          anyone else can refresh.
        </p>

        <h3
          style={{
            fontFamily: serif,
            fontSize: 20,
            fontWeight: 700,
            color: cream,
            marginTop: 28,
            marginBottom: 10,
          }}
        >
          Campsite cancellations at booked-up parks
        </h3>
        <p
          style={{
            fontSize: 15.5,
            lineHeight: 1.7,
            color: 'rgba(247,246,243,0.7)',
            marginBottom: 20,
          }}
        >
          Yosemite&rsquo;s Upper Pines campground sells out within
          minutes of opening for the summer. Yellowstone, Big Sur, the
          entire Pacific Northwest National Forests system — same
          story. The only way to get a site for a popular weekend is
          to catch a cancellation. Recreation.gov isn&rsquo;t on
          CamelCamelCamel. Steward watches the dates and site numbers
          you actually want, and pings you when something opens. The
          2-hour Premium check frequency is the difference between
          catching a Saturday-night cancellation and watching it
          disappear into someone else&rsquo;s confirmation email.
        </p>

        <h3
          style={{
            fontFamily: serif,
            fontSize: 20,
            fontWeight: 700,
            color: cream,
            marginTop: 28,
            marginBottom: 10,
          }}
        >
          Flight fare drops and mistake fares
        </h3>
        <p
          style={{
            fontSize: 15.5,
            lineHeight: 1.7,
            color: 'rgba(247,246,243,0.7)',
            marginBottom: 20,
          }}
        >
          Google Flights and Kayak run their own price-tracking, but
          neither alerts you the moment a fare crosses your target
          threshold. CamelCamelCamel has no flight data at all.
          Steward lets you paste a Google Flights or Kayak URL, set a
          condition like &ldquo;alert me below $500 round-trip,&rdquo;
          and get a notification when fares drop. It also catches
          mistake fares — those rare moments when an airline
          accidentally lists a $2,000 transcontinental flight for $200
          and the deal evaporates in under an hour.
        </p>

        <h3
          style={{
            fontFamily: serif,
            fontSize: 20,
            fontWeight: 700,
            color: cream,
            marginTop: 28,
            marginBottom: 10,
          }}
        >
          The hidden cost of Amazon-only tracking
        </h3>
        <p
          style={{
            fontSize: 15.5,
            lineHeight: 1.7,
            color: 'rgba(247,246,243,0.7)',
            marginBottom: 0,
          }}
        >
          Even within shopping, Amazon often isn&rsquo;t the cheapest.
          Brand-direct stores routinely undercut Amazon by 10-25% on
          their own products, especially during seasonal sales —
          Nike.com, Lululemon.com, Patagonia.com, and Sonos.com all
          run direct discounts that never appear on Amazon&rsquo;s
          listings. Costco and Sam&rsquo;s Club beat Amazon on bulk
          basics. Best Buy frequently price-matches and tacks on free
          installation. A tracker locked to Amazon-only data shows you
          half the picture and quietly biases you toward the
          higher-price option.
        </p>
      </section>

      {/* ── How Steward Works ── */}
      <section style={{ ...prose, marginTop: 64 }}>
        <h2
          style={{
            fontFamily: serif,
            fontSize: 28,
            fontWeight: 700,
            color: cream,
            textAlign: 'center' as const,
            marginBottom: 36,
          }}
        >
          How Steward Works
        </h2>
        <div
          className="steps-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
            textAlign: 'center' as const,
          }}
        >
          {steps.map((step, i) => (
            <div key={step.label}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(110,231,183,0.08)',
                  border: '1px solid rgba(110,231,183,0.2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  marginBottom: 14,
                }}
              >
                {step.emoji}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase' as const,
                  color: mint,
                  marginBottom: 6,
                }}
              >
                Step {i + 1}
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: cream,
                }}
              >
                {step.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ ...prose, marginTop: 64 }}>
        <h2
          style={{
            fontFamily: serif,
            fontSize: 28,
            fontWeight: 700,
            color: cream,
            marginBottom: 28,
          }}
        >
          Frequently Asked Questions
        </h2>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column' as const,
            gap: 28,
          }}
        >
          {faqs.map((faq) => (
            <div key={faq.question}>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: cream,
                  marginBottom: 8,
                }}
              >
                {faq.question}
              </h3>
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: 'rgba(247,246,243,0.65)',
                  margin: 0,
                }}
              >
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          marginTop: 80,
          padding: '64px 24px',
          textAlign: 'center' as const,
          background:
            'linear-gradient(180deg, rgba(110,231,183,0.06) 0%, transparent 100%)',
          borderTop: '1px solid rgba(110,231,183,0.1)',
        }}
      >
        <h2
          style={{
            fontFamily: serif,
            fontSize: 32,
            fontWeight: 700,
            color: cream,
            marginBottom: 12,
          }}
        >
          Track more than Amazon
        </h2>
        <p
          style={{
            fontSize: 17,
            color: 'rgba(247,246,243,0.6)',
            maxWidth: 520,
            margin: '0 auto 32px',
            lineHeight: 1.55,
          }}
        >
          Monitor prices, restaurants, campsites, flights, and tickets — all
          from one app.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 14,
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
              padding: '14px 28px',
              borderRadius: 12,
              background: mint,
              color: bg,
              fontWeight: 700,
              fontSize: 16,
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
              padding: '14px 28px',
              borderRadius: 12,
              background: 'transparent',
              color: cream,
              fontWeight: 700,
              fontSize: 16,
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            Try Free
          </Link>
        </div>
      </section>

      {/* ── Responsive overrides ── */}
      <style>{`
        @media (max-width: 639px) {
          .feature-cards-grid {
            grid-template-columns: 1fr !important;
          }
          .steps-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </>
  )
}
