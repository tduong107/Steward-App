import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

/**
 * About page — anchors the Steward brand to a named human (E-E-A-T
 * signals) and serves as the canonical home for the `Person` entity
 * referenced as `author` from every blog Article.
 *
 * Why this page matters for SEO:
 *   - Google + AI answer engines weight content authored by an
 *     identifiable expert higher than content attributed only to an
 *     anonymous brand. Princeton's GEO study put expert-attribution
 *     citation lift at +25–30%.
 *   - The Person JSON-LD here is the @id target the four blog posts
 *     reference via `author: { '@id': '.../about#tienhung' }`. That
 *     cross-link tells crawlers the article author and the founder
 *     are the same entity.
 *   - Provides a real "About" surface for the
 *     Organization → founder linkage and gives social-share crawlers
 *     a clean preview when this URL is shared.
 *
 * If we ever add more team members with their own bylines, copy this
 * page into `app/team/<slug>/page.tsx` and adjust the @id scheme.
 */

const PERSON_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': 'https://www.joinsteward.app/about#tienhung',
  name: 'Tienhung Duong',
  givenName: 'Tienhung',
  familyName: 'Duong',
  jobTitle: 'Founder',
  url: 'https://www.joinsteward.app/about',
  description:
    'Founder of Steward, an AI-powered concierge app that monitors any website for price drops, restocks, restaurant reservations, campsite openings, flight deals, and event ticket restocks.',
  worksFor: { '@id': 'https://www.joinsteward.app/#organization' },
  knowsAbout: [
    'price tracking',
    'web monitoring',
    'restock alerts',
    'restaurant reservations',
    'campsite reservations',
    'flight fare tracking',
    'AI agents',
    'iOS development',
    'consumer software',
  ],
}

const BREADCRUMB_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.joinsteward.app' },
    { '@type': 'ListItem', position: 2, name: 'About', item: 'https://www.joinsteward.app/about' },
  ],
}

export const metadata: Metadata = {
  title: 'About — Founded by Tienhung Duong',
  description:
    'Steward is built by Tienhung Duong. Read why we built an AI concierge for price drops, restocks, restaurant reservations, campsites, flights, and event tickets.',
  alternates: { canonical: 'https://www.joinsteward.app/about' },
  openGraph: {
    title: 'About Steward — Founded by Tienhung Duong',
    description:
      'Why we built an AI concierge for price drops, restocks, restaurant reservations, campsites, flights, and event tickets.',
    url: 'https://www.joinsteward.app/about',
    type: 'profile',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Steward — Founded by Tienhung Duong',
    description:
      'Why we built an AI concierge for price drops, restocks, restaurant reservations, campsites, flights, and event tickets.',
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-dvh bg-[var(--color-bg)] text-[var(--color-ink)]">
      {/* JSON-LD: Person + BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_JSONLD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_JSONLD) }}
      />

      {/* Nav — mirrors privacy/terms pages so the legal/about surfaces
          feel consistent and we get free internal-link equity to the
          homepage. */}
      <nav className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/steward-logo.png"
              alt="Steward"
              width={30}
              height={30}
              className="rounded-lg"
            />
            <span className="text-lg font-semibold font-[var(--font-serif)] text-[var(--color-accent)]">
              Steward
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm text-[var(--color-ink-mid)] hover:text-[var(--color-ink)] transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </nav>

      <article className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        {/* Header — visible Person attribution. Includes a hidden
            <span> with the same name in role="byline" semantics so
            crawlers extracting the author from prose (not just JSON-LD)
            still find it. */}
        <header className="mb-12">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-accent)] mb-3">
            About
          </p>
          <h1 className="text-3xl md:text-5xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4 leading-tight">
            Hi, I&rsquo;m{' '}
            <span itemProp="name">Tienhung Duong</span>.
          </h1>
          <p className="text-base text-[var(--color-ink-mid)] leading-relaxed">
            <span itemProp="jobTitle">Founder</span> of Steward — an AI-powered
            concierge app that monitors any website for price drops, restocks,
            restaurant reservations, campsite openings, flight fare changes,
            and event ticket restocks.
          </p>
        </header>

        <div className="prose-steward space-y-8">
          {/* Why we built Steward */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              Why I built Steward
            </h2>
            <p className="text-[var(--color-ink-mid)] leading-relaxed mb-4">
              The concert tickets sell out in 30 seconds. The campsite at
              Yosemite is gone the moment it&rsquo;s posted. The sneaker drops
              at 10 a.m. and is on resale by 10:01. The Resy reservation you
              actually wanted opens at random and gets snapped up before you
              refresh. Every category I cared about as a consumer had been
              quietly taken over by people running bots — and the people who
              were paying full price were the ones who were &ldquo;playing
              fair.&rdquo;
            </p>
            <p className="text-[var(--color-ink-mid)] leading-relaxed mb-4">
              The existing tools all felt narrow. Honey only does coupons.
              CamelCamelCamel only does Amazon. Browser extensions need you
              to install them per-site. Most of them assume you only care
              about shopping — never restaurants, campsites, flights, or
              tickets. None of them let you just paste a URL and say
              &ldquo;watch this for me.&rdquo;
            </p>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              Steward is the tool I wanted to exist: one app, any URL, any
              category, AI handles the messy parts of figuring out what
              changed and when to ping you. Free to start, no extension to
              install, available on iOS and the web.
            </p>
          </section>

          {/* What I believe */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              What I believe
            </h2>
            <ul className="space-y-4 text-[var(--color-ink-mid)] leading-relaxed">
              <li>
                <strong className="text-[var(--color-ink)]">
                  Software should level the playing field.
                </strong>{' '}
                The people running bots have a permanent advantage over the
                rest of us. Steward exists to give that same kind of leverage
                to a regular shopper or fan or camper — without making them
                learn to code or pay $50/mo for a sneaker tool.
              </li>
              <li>
                <strong className="text-[var(--color-ink)]">
                  Privacy by default.
                </strong>{' '}
                Steward never sells your data and only collects what&rsquo;s
                needed to run the watches you set up. The watches themselves
                are stored encrypted at rest, and the AI inference happens on
                infrastructure we control.
              </li>
              <li>
                <strong className="text-[var(--color-ink)]">
                  Honest pricing.
                </strong>{' '}
                Free is genuinely free — three trackers, real notifications,
                no dark-pattern nags. Pro and Premium exist for people who
                want more capacity or faster checks, not because the free
                tier is artificially crippled.
              </li>
            </ul>
          </section>

          {/* Get in touch */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              Get in touch
            </h2>
            <p className="text-[var(--color-ink-mid)] leading-relaxed mb-3">
              I read every email and reply to most of them within a day.
              Whether you&rsquo;re using Steward today, considering it, or
              have a feature idea — I want to hear from you.
            </p>
            <ul className="space-y-2 text-[var(--color-ink-mid)] leading-relaxed">
              <li>
                Email:{' '}
                <a
                  href="mailto:hello@joinsteward.app"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  hello@joinsteward.app
                </a>
              </li>
              <li>
                Support form:{' '}
                <Link
                  href="/support"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  joinsteward.app/support
                </Link>
              </li>
              <li>
                App Store:{' '}
                <a
                  href="https://apps.apple.com/us/app/steward-concierge/id6760180137"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  Download Steward Concierge for iOS
                </a>
              </li>
              <li>
                Instagram:{' '}
                <a
                  href="https://www.instagram.com/joinsteward/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  @joinsteward
                </a>
              </li>
            </ul>
          </section>
        </div>
      </article>
    </div>
  )
}
