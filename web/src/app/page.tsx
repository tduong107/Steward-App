/**
 * Landing page — Server Component composition root (Phase 10).
 *
 * Previously the entire landing was wrapped in a single ~1800-line
 * `'use client'` LandingClientPage. That meant every section's static
 * markup (Footer, FinalCTA, PriceFeature, all the helpers) shipped
 * as JS that React had to hydrate on the main thread.
 *
 * Now this page is a Server Component that composes the sections
 * directly. Static-content sections (Footer, FinalCTA, PriceFeature,
 * helpers) are pure Server Components — their HTML ships with no
 * accompanying JS. Interactive sections (Nav, LandingHero,
 * AIFeature, LandingHIW, LandingUseCases, PlatformShowcase, Pricing,
 * FAQ) are 'use client' islands that hydrate independently.
 *
 * GlobalBg + CursorSpotlight + ScrollRevealInit are tiny client
 * effects that mount once at the root.
 */

export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/server'

// Server-rendered chrome
import { GlobalBg } from '@/components/landing-fx/global-bg'
import { CursorSpotlight } from '@/components/landing-fx/cursor-spotlight'
import { ScrollRevealInit } from '@/components/landing-fx/scroll-reveal-init'

// Client islands (above-the-fold; eager import so they're ready on
// first paint)
import { Nav } from '@/components/landing/nav'
import { LandingHero } from '@/components/landing-hero'

// Server-rendered sections (markup-only; zero JS)
import { PriceFeature } from '@/components/landing/price-feature'
import { FinalCTA } from '@/components/landing/final-cta'
import { Footer } from '@/components/landing/footer'

// Client islands (heavy interactive sections — split into async
// chunks so they don't block the hero TTI)
import { AIFeature } from '@/components/landing/ai-feature'
const LandingHIW = nextDynamic(
  () => import('@/components/landing-hiw').then((m) => m.LandingHIW),
)
const LandingUseCases = nextDynamic(
  () => import('@/components/landing-use-cases').then((m) => m.LandingUseCases),
)
const PlatformShowcase = nextDynamic(
  () => import('@/components/landing/platform-showcase').then((m) => m.PlatformShowcase),
)
const Pricing = nextDynamic(
  () => import('@/components/landing/pricing').then((m) => m.Pricing),
)
const FAQ = nextDynamic(
  () => import('@/components/landing/faq').then((m) => m.FAQ),
)

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/home')
  }

  return (
    <div
      style={{
        background: 'var(--forest, #0A0C0B)',
        minHeight: '100vh',
        color: '#F7F6F3',
        position: 'relative',
      }}
    >
      {/* Concierge-restyle global layers — fixed-position, pointer-
          events:none. They sit behind/under all section content. */}
      <GlobalBg />
      <CursorSpotlight />
      <ScrollRevealInit />
      <Nav />
      <LandingHero />
      <PriceFeature />
      <AIFeature />
      <LandingHIW />
      <LandingUseCases />
      <PlatformShowcase />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  )
}
