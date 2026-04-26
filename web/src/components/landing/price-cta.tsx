'use client'

/**
 * PriceCTA — tiny client island for the Price Drops section's
 * primary CTA. Carved out so the surrounding `PriceFeature` shell
 * can stay a Server Component despite the analytics `onClick`
 * handler (event handlers cannot be passed to Server Component
 * props in App Router).
 *
 * Phase 10 hot-fix: the original PriceFeature was a Server
 * Component but inlined `onClick={() => track(...)}` on the CTA
 * Link, which crashes at SSR with "Event handlers cannot be
 * passed to Server Component props". Pulling the Magnetic + Link
 * pair into this dedicated client component makes it a hydration
 * island while everything else in PriceFeature stays zero-JS.
 */

import Link from 'next/link'
import { track } from '@vercel/analytics'
import { Magnetic } from '@/components/landing-fx/magnetic'

export function PriceCTA() {
  return (
    <Magnetic strength={0.3}>
      <Link
        href="/signup"
        onClick={() => track('signup_button_click', { location: 'price_feature' })}
        className="btn-primary"
      >
        Start tracking prices <span aria-hidden="true">→</span>
      </Link>
    </Magnetic>
  )
}
