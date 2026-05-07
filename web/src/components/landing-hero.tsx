'use client'

// Production hero — cosmic-steward starfield + spotlight product field on
// the right, the canonical "Scalpers have bots / Now you have a concierge"
// headline + dual CTAs on the left. Replaces the prior Spline-robot hero.
//
// Critical preserved bits:
// - 'use client' (cosmic + spotlight both use hooks).
// - track() analytics on the two CTAs (same event names + locations).
// - The visually-hidden AI-SEO definition block — high-value GEO/LLM
//   citation surface; do not delete without replacing somewhere else.
// - Named LandingHero export (page.tsx and labs/hero-v2 import this).

import { track } from '@vercel/analytics'
import {
  SpotlightProductField,
  sampleProducts,
  type FloatingProduct,
} from '@/components/ui/product-spotlight-hero-section'
import { AppStoreButton } from '@/components/ui/app-store-button'
import { EyebrowPill } from '@/components/landing-fx/eyebrow-pill'

const SERIF = 'Georgia, "Times New Roman", "Iowan Old Style", "Hoefler Text", serif'

// 5 featured Steward use cases — first 5 of products[] are the items that
// fly to the spotlight on a rotation; remaining 15 are background floats.
// Each has a category-typed `meta` so the bubbles read correctly per
// category (e.g. campsites show "Available · Jun 14–16" not "Price · $X").
const STEWARD_PRODUCTS: FloatingProduct[] = [
  {
    id: 1,
    name: 'Limited Sneaker Drop',
    price: '$89.99',
    score: 92,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1760&auto=format&fit=crop',
    meta: {
      primary:   { label: 'Price',  value: '$89.99', icon: 'dollar' },
      secondary: { label: 'Score',  value: '92/100', icon: 'dollar', useScoreWheel: true },
    },
  },
  {
    id: 2,
    name: 'Carbone NY · Friday',
    price: 'Found',
    score: 90,
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1760&auto=format&fit=crop',
    meta: {
      primary:   { label: 'Found',   value: 'Fri 8pm',  icon: 'check' },
      secondary: { label: 'Party',   value: '2 guests', icon: 'calendar' },
    },
  },
  {
    id: 3,
    name: 'SFO → Tokyo Round Trip',
    price: '$1,120',
    score: 88,
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1760&auto=format&fit=crop',
    meta: {
      primary:   { label: 'Price',  value: '$1,120',     icon: 'dollar' },
      secondary: { label: 'Route',  value: 'SFO → HND',  icon: 'plane' },
    },
  },
  {
    id: 4,
    name: 'Yosemite · Upper Pines',
    price: 'Available',
    score: 91,
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1760&auto=format&fit=crop',
    meta: {
      primary:   { label: 'Available', value: 'Jun 14–16', icon: 'tent' },
      secondary: { label: 'Site',      value: '#47',       icon: 'check' },
    },
  },
  {
    id: 5,
    name: 'Kendrick Lamar · The Forum',
    price: '$245',
    score: 87,
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1760&auto=format&fit=crop',
    meta: {
      primary:   { label: 'Face Value', value: '$245',  icon: 'ticket' },
      secondary: { label: 'Date',       value: 'Jul 14', icon: 'calendar' },
    },
  },
  // Background floats (15) — original Unsplash dataset for visual density.
  ...sampleProducts.slice(5),
]

export function LandingHero() {
  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
      }}
    >
      {/* No bg here — the page-level CosmicParallaxBg in page.tsx provides
          the starfield, gradient, and horizon glow for every section,
          including this hero. We just lay content on top. */}

      {/* Hero content */}
      <div className="relative z-10 flex min-h-screen items-center py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[80vh]">
            {/* Left Column — copy + CTAs */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              {/* Eyebrow */}
              <div className="mb-7">
                <EyebrowPill icon="✦">Now on the App Store &amp; Web</EyebrowPill>
              </div>

              {/* Headline — capped at 72px so "Scalpers have bots" fits the
                  lg half-column on a single line. Below lg the grid
                  collapses and the font scales with viewport width. */}
              <h1
                style={{
                  fontFamily: SERIF,
                  lineHeight: 1.0,
                  letterSpacing: '-0.03em',
                  color: 'var(--ink, #fff)',
                  margin: 0,
                  marginBottom: 28,
                  fontSize: 'clamp(36px, 5.2vw, 72px)',
                  fontWeight: 700,
                }}
              >
                Scalpers have bots
                <br />
                <em className="italic-accent">Now you have a&nbsp;concierge</em>
              </h1>

              {/* AI-SEO definition block.
                  Visually hidden but in the DOM, so ChatGPT, Perplexity,
                  and Google AI Overviews can extract a crisp 40-60 word
                  "What is Steward?" answer when crawling. The visible H1
                  + subhead stay poetic; this carries the explicit, entity-
                  rich definition that gets cited in AI answers (Princeton
                  GEO study found this format the highest-citation pattern).
                  Mirrors the FAQ "What is Steward?" answer for consistency. */}
              <p
                style={{
                  position: 'absolute',
                  width: 1,
                  height: 1,
                  padding: 0,
                  margin: -1,
                  overflow: 'hidden',
                  clip: 'rect(0,0,0,0)',
                  whiteSpace: 'nowrap',
                  border: 0,
                }}
              >
                Steward is an AI-powered personal concierge app for iOS and
                web that monitors any website for price drops, restocks,
                restaurant reservations on Resy and OpenTable, campsite
                openings on Recreation.gov, flight fare changes, and event
                ticket restocks on Ticketmaster — alerting you the moment
                something opens up. Free to start, with Pro and Premium
                tiers.
              </p>

              {/* Subhead — center on mobile, left-align on lg via Tailwind
                  classes (avoid inline `margin: 0 auto` which would beat
                  lg:mx-0). max-w-[520px] keeps the line length readable. */}
              <p
                style={{
                  fontSize: 17,
                  lineHeight: 1.65,
                  color: 'rgba(247, 246, 243, 0.65)',
                  fontWeight: 300,
                  marginBottom: 36,
                }}
                className="mx-auto lg:mx-0 max-w-[520px]"
              >
                Be the first to snag deals, hard to get reservations, and
                sold-out tickets with Steward. Your personalized AI concierge
                that levels the playing field.
              </p>

              {/* CTAs — Start for free is .btn-primary (~56px tall, 14px
                  radius, 26px horizontal padding); the App Store badge is
                  matched to the same metrics with the .btn-ghost-style
                  translucent treatment so the two buttons read as a pair. */}
              <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                <a
                  href="/signup"
                  onClick={() => track('signup_button_click', { location: 'hero' })}
                  className="btn-primary"
                >
                  Start for free <span aria-hidden="true">→</span>
                </a>
                <a
                  href="https://apps.apple.com/us/app/steward-concierge/id6760180137"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('app_store_click', { location: 'hero' })}
                  aria-label="Download Steward on the App Store"
                  className="inline-flex"
                >
                  <AppStoreButton
                    variant="ghost"
                    className={[
                      // Size & shape matched to .btn-primary
                      '!h-[56px] !px-[22px] !rounded-[14px]',
                      // Cosmic-friendly translucent treatment, mint hover
                      '!bg-white/[0.04] !border !border-white/[0.12] !text-white',
                      'hover:!bg-white/[0.08] hover:!border-emerald-400/50',
                      'transition-colors',
                    ].join(' ')}
                  />
                </a>
              </div>
            </div>

            {/* Right Column — animated spotlight field, fully transparent
                so the cosmic starfield is the only layer behind the floats. */}
            <SpotlightProductField
              products={STEWARD_PRODUCTS}
              transparentStage
              className="order-1 lg:order-2"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
