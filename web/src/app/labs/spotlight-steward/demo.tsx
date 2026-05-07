'use client'

import { CosmicParallaxBg } from '@/components/ui/parallax-cosmic-background'
import {
  Component as ProductSpotlightHero,
  sampleProducts,
} from '@/components/ui/product-spotlight-hero-section'

// Steward-flavoured key products (first 5 = featured spotlights). Background
// items inherit the original Unsplash dataset so the floating field stays
// dense and varied.
const STEWARD_PRODUCTS = [
  { id: 1,  name: 'Nike Dunk Low Panda',          price: '$89.99',  score: 92, image: sampleProducts[0].image },
  { id: 2,  name: 'AirPods Pro 2',                price: '$199.00', score: 88, image: sampleProducts[1].image },
  { id: 3,  name: 'Cartier Love Bracelet',        price: '$625.00', score: 84, image: sampleProducts[2].image },
  { id: 4,  name: 'JBL Charge 5',                 price: '$129.50', score: 91, image: sampleProducts[3].image },
  { id: 5,  name: 'Patagonia Travel Pack',        price: '$159.90', score: 89, image: sampleProducts[4].image },
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

      {/* Product spotlight hero on top. transparentBg=true drops the
          component's own dark gradient so the cosmic shows through. */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <ProductSpotlightHero
          transparentBg
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
