'use client'

import { CosmicParallaxBg } from '@/components/ui/parallax-cosmic-background'
import {
  SpotlightProductField,
  sampleProducts,
  type FloatingProduct,
} from '@/components/ui/product-spotlight-hero-section'
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
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[80vh]">
            {/* Left Column — mirrors the production marketing hero */}
            <div className="space-y-6 text-center lg:text-left order-2 lg:order-1">
              <div>
                <EyebrowPill icon="✦">Now on the App Store &amp; Web</EyebrowPill>
              </div>

              <h1
                style={{
                  fontFamily: SERIF,
                  lineHeight: 0.98,
                  letterSpacing: '-0.03em',
                  color: 'var(--ink, #fff)',
                  margin: 0,
                  fontSize: 'clamp(40px, 6vw, 88px)',
                  fontWeight: 700,
                }}
              >
                Scalpers have bots
                <br />
                <em className="italic-accent">Now you have a&nbsp;concierge</em>
              </h1>

              <p
                style={{
                  fontSize: 17,
                  lineHeight: 1.65,
                  color: 'rgba(247, 246, 243, 0.65)',
                  fontWeight: 300,
                  maxWidth: 520,
                  margin: '0 auto',
                }}
                className="lg:mx-0"
              >
                Be the first to snag deals, hard to get reservations, and
                sold-out tickets with Steward. Your personalized AI concierge
                that levels the playing field.
              </p>

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
                  className="btn-ghost"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="var(--mint, #6EE7B7)"
                    aria-hidden="true"
                  >
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  iOS App
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
