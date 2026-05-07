'use client'

import { CosmicParallaxBg } from '@/components/ui/parallax-cosmic-background'
import {
  Component as ProductSpotlightHero,
  sampleProducts,
  type FloatingProduct,
} from '@/components/ui/product-spotlight-hero-section'

// 5 featured Steward use cases — each with category-matched imagery and
// metadata that reads correctly when the item flies to the spotlight
// (e.g. campsites show "Available · Jun 14–16" instead of "Price · $X").
const STEWARD_PRODUCTS: FloatingProduct[] = [
  {
    id: 1,
    name: 'Nike Dunk Low Panda',
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

export function SpotlightStewardLabDemo() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Cosmic background fills the viewport, behind everything else.
          head + text are intentionally empty so the cosmic component's own
          title/subtitle don't compete with the hero's H1. */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <CosmicParallaxBg head="" text="" className="cosmic-steward" loop={true} />
      </div>

      {/* Product spotlight hero on top. transparentBg + transparentStage
          drop the section bg AND the right-column box bg so the cosmic
          starfield shows through everywhere. */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <ProductSpotlightHero
          transparentBg
          transparentStage
          heading={{
            line1: 'Watch anything.',
            line2: 'Save everything.',
          }}
          subheading="Steward watches the prices, restocks, and reservations you care about — and pings you the moment they break your way."
          ctaLabel="Try It Free →"
          ctaHref="/signup"
          products={STEWARD_PRODUCTS}
        />
      </div>
    </div>
  )
}
