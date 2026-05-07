'use client'

import { CosmicParallaxBg } from '@/components/ui/parallax-cosmic-background'
import {
  SpotlightProductField,
  sampleProducts,
  type FloatingProduct,
} from '@/components/ui/product-spotlight-hero-section'
import { AppStoreButton } from '@/components/ui/app-store-button'
import { EyebrowPill } from '@/components/landing-fx/eyebrow-pill'

// 5 featured Steward use cases — each with category-matched imagery and
// metadata that reads correctly when the item flies to the spotlight
// (e.g. campsites show "Available · Jun 14–16" instead of "Price · $X").
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
  // Background floats (15) — keep the original Unsplash dataset for visual density.
  ...sampleProducts.slice(5),
]

const SERIF =
  'Georgia, "Times New Roman", "Iowan Old Style", "Hoefler Text", serif'

export function SpotlightStewardLabDemo() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Cosmic background fills the viewport, behind everything else.
          head + text are intentionally empty so the cosmic component's own
          title/subtitle don't compete with the hero copy. */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <CosmicParallaxBg head="" text="" className="cosmic-steward" loop={true} />
      </div>

      {/* Hero on top: production copy on the left, spotlight field on the right. */}
      <section
        className="relative z-10 flex min-h-screen items-center py-12"
        style={{ overflow: 'hidden' }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[80vh]">
            {/* Left Column — mirrors the production marketing hero */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              {/* Eyebrow */}
              <div className="mb-7">
                <EyebrowPill icon="✦">Now on the App Store &amp; Web</EyebrowPill>
              </div>

              {/* Headline — capped at 72px so "Scalpers have bots" fits the
                  lg half-column without breaking mid-line. Below lg the grid
                  collapses and the font scales with viewport width, matching
                  the production hero's natural responsive behavior. */}
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

              {/* Subhead — center on mobile, left-align on lg via Tailwind
                  classes (no inline `margin: 0 auto` so the lg:mx-0 actually
                  wins). max-w-[520px] keeps the line length readable. */}
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

              {/* CTAs — Start for free uses .btn-primary (~56px tall, 14px
                  radius, 26px horizontal padding). The App Store badge is
                  forced to identical metrics so the two buttons read as a
                  matched pair with the .btn-ghost translucent treatment. */}
              <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                <a
                  href="/signup"
                  className="btn-primary"
                >
                  Start for free <span aria-hidden="true">→</span>
                </a>
                <a
                  href="https://apps.apple.com/us/app/steward-concierge/id6760180137"
                  target="_blank"
                  rel="noopener noreferrer"
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

            {/* Right Column — animated spotlight field, fully transparent */}
            <SpotlightProductField
              products={STEWARD_PRODUCTS}
              transparentStage
              className="order-1 lg:order-2"
            />
          </div>
        </div>
      </section>
    </div>
  )
}
