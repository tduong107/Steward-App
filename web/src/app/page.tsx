export const dynamic = 'force-dynamic'

import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LandingWrapper } from '@/components/landing-wrapper'
import { LandingThemeToggle } from '@/components/landing-theme-toggle'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/home')
  }

  return (
    <LandingWrapper>
      {/* Structured data for search engines and AI */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'SoftwareApplication',
                name: 'Steward',
                applicationCategory: 'UtilitiesApplication',
                operatingSystem: 'iOS, Web',
                description: 'AI-powered price tracker and web monitoring app that watches for price drops, restocks, restaurant reservations, campsite openings, flight deals, and event tickets',
                url: 'https://www.joinsteward.app',
                offers: [
                  {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                    name: 'Free',
                    description: 'Up to 3 watches, daily check frequency',
                  },
                  {
                    '@type': 'Offer',
                    price: '4.99',
                    priceCurrency: 'USD',
                    name: 'Steward Pro',
                    description: 'Up to 7 watches, 12-hour check frequency, price insights',
                    priceSpecification: {
                      '@type': 'UnitPriceSpecification',
                      price: '4.99',
                      priceCurrency: 'USD',
                      unitCode: 'MON',
                      referenceQuantity: {
                        '@type': 'QuantitativeValue',
                        value: '1',
                        unitCode: 'MON',
                      },
                    },
                  },
                  {
                    '@type': 'Offer',
                    price: '9.99',
                    priceCurrency: 'USD',
                    name: 'Steward Premium',
                    description: 'Up to 15 watches, 2-hour check frequency, auto-execute actions',
                    priceSpecification: {
                      '@type': 'UnitPriceSpecification',
                      price: '9.99',
                      priceCurrency: 'USD',
                      unitCode: 'MON',
                      referenceQuantity: {
                        '@type': 'QuantitativeValue',
                        value: '1',
                        unitCode: 'MON',
                      },
                    },
                  },
                ],
                featureList: [
                  'Price drop alerts across thousands of retailers',
                  'Restaurant reservation monitoring via Resy',
                  'Campsite availability tracking on Recreation.gov',
                  'Flight price tracking across major airlines',
                  'Event ticket restock and price drop alerts',
                  'AI-powered natural language setup',
                  'iOS Share Extension for instant watch creation',
                  'Push notifications with direct action links',
                ],
              },
              {
                '@type': 'Organization',
                name: 'Steward',
                url: 'https://www.joinsteward.app',
                logo: 'https://www.joinsteward.app/steward-logo.png',
              },
              {
                '@type': 'WebSite',
                url: 'https://www.joinsteward.app',
                name: 'Steward',
                description: 'AI-powered price tracker and web monitoring assistant',
              },
            ],
          }),
        }}
      />
    <div className="min-h-dvh bg-[var(--landing-bg)] text-[var(--landing-text)] overflow-x-hidden transition-colors duration-300">
      {/* ── Ambient glow orbs ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-[var(--landing-glow-green)] blur-[120px] animate-drift-slow" />
        <div className="absolute top-1/3 -right-60 h-[500px] w-[500px] rounded-full bg-[var(--landing-glow-mint)] blur-[100px] animate-drift-slow-reverse" />
        <div className="absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full bg-[var(--landing-glow-gold)] blur-[100px] animate-drift-slow" />
      </div>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-[var(--landing-border)] bg-[var(--landing-nav-bg)] backdrop-blur-xl transition-colors duration-300">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/steward-logo.png"
              alt="Steward"
              width={34}
              height={34}
              className="rounded-lg transition-transform duration-300 group-hover:scale-110"
            />
            <span className="text-xl font-semibold font-[var(--font-serif)] text-[var(--landing-accent)]">
              Steward
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-8 text-sm text-[var(--landing-text-mid)]">
            <a href="#how-it-works" className="hover:text-[var(--landing-text)] transition-colors duration-300">How it Works</a>
            <a href="#use-cases" className="hover:text-[var(--landing-text)] transition-colors duration-300">Use Cases</a>
            <a href="#pricing" className="hover:text-[var(--landing-text)] transition-colors duration-300">Pricing</a>
            <a href="#faq" className="hover:text-[var(--landing-text)] transition-colors duration-300">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <LandingThemeToggle />
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--landing-text-mid)] hover:text-[var(--landing-text)] transition-colors duration-300"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-[var(--landing-accent-solid)] px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-[var(--landing-accent-hover)] hover:shadow-lg hover:shadow-[var(--landing-card-shadow)]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-24 pb-20 md:pt-36 md:pb-32 text-center">
        <h1 className="landing-reveal [animation-delay:100ms] text-5xl md:text-7xl lg:text-8xl font-bold font-[var(--font-serif)] text-[var(--landing-text)] leading-[1.05] max-w-4xl mx-auto tracking-tight">
          Stop overpaying{' '}
          <span className="relative">
            <span className="text-transparent bg-clip-text bg-[length:200%_auto] animate-shimmer" style={{ backgroundImage: 'linear-gradient(to right, var(--landing-shimmer-from), var(--landing-shimmer-via), var(--landing-shimmer-to))' }}>
              Start saving
            </span>
          </span>
        </h1>

        <p className="landing-reveal [animation-delay:200ms] mt-8 text-lg md:text-xl text-[var(--landing-text-mid)] max-w-2xl mx-auto leading-relaxed">
          Steward is your AI-powered watchdog that tracks price drops, restocks, restaurant reservations, campground openings, and flight deals around the clock
        </p>

        <div className="landing-reveal [animation-delay:300ms] mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="group relative w-full sm:w-auto rounded-full bg-gradient-to-r from-[#2A5C45] to-[#3A7C5A] px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:shadow-xl hover:shadow-[var(--landing-card-shadow)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Start Saving for Free
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </span>
          </Link>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface)] px-8 py-4 text-base font-medium text-[var(--landing-text-mid)] transition-all duration-300 hover:bg-[var(--landing-surface-hover)] hover:border-[var(--landing-border-hover)] backdrop-blur-sm"
          >
            See How It Works
          </a>
        </div>

        <p className="landing-reveal [animation-delay:400ms] mt-6 text-xs text-[var(--landing-text-faint)]">
          Free forever · No credit card required · Set up in 30 seconds
        </p>

        {/* Hero visual — branded marketing asset */}
        <div className="landing-reveal [animation-delay:500ms] mt-20 mx-auto max-w-4xl">
            <Image
              src="/assets/hero-dark.svg"
              alt="Steward watches prices, restocks, reservations and more"
              width={1200}
              height={630}
              className="w-full h-auto rounded-2xl"
              priority
            />
        </div>
      </section>

      {/* ── Trust bar / Stats ── */}
      <section className="relative z-10 border-t border-[var(--landing-border)]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 'Watch Most Things', label: 'Beyond price tracking', small: true },
              { value: '24/7', label: 'Always-on monitoring', small: false },
              { value: 'Daily+', label: 'Check frequency', small: false },
              { value: '30sec', label: 'To set up your first watch', small: false },
            ].map((stat, i) => (
              <div key={stat.label} className="landing-reveal" style={{ animationDelay: `${i * 100}ms` }}>
                <p className={`font-bold font-[var(--font-serif)] text-[var(--landing-accent)] whitespace-nowrap flex items-end justify-center h-[2.75rem] md:h-[3.5rem] ${stat.small ? 'text-xl md:text-2xl' : 'text-3xl md:text-4xl'}`}>
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-[var(--landing-text-dim)]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature: Price Drops ── */}
      <section className="relative z-10 border-t border-[var(--landing-border)]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="landing-reveal inline-block text-xs font-semibold tracking-[0.2em] uppercase text-[var(--landing-gold-label)] mb-4">Price Drops</span>
              <h2 className="landing-reveal [animation-delay:100ms] text-3xl md:text-5xl font-bold font-[var(--font-serif)] text-[var(--landing-text)] leading-tight">
                Save on every{' '}
                <span className="italic text-[var(--landing-accent)]">purchase</span>
              </h2>
              <p className="landing-reveal [animation-delay:200ms] mt-6 text-[var(--landing-text-mid)] leading-relaxed">
                Works across Amazon, Nike, Best Buy, Target, Walmart, and thousands of other retailers
              </p>
              <p className="landing-reveal [animation-delay:300ms] mt-4 text-[var(--landing-text-mid)] leading-relaxed">
                With the cost of living climbing every year, Steward makes sure you never pay full price when you don&apos;t have to
              </p>
              <Link
                href="/signup"
                className="landing-reveal [animation-delay:400ms] inline-flex items-center gap-2 mt-8 rounded-full bg-[var(--landing-accent-solid)] px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[var(--landing-accent-hover)] hover:shadow-lg hover:shadow-[var(--landing-card-shadow)]"
              >
                Start Tracking Prices
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
            <div className="landing-reveal [animation-delay:200ms]">
              <Image
                src="/assets/feat-price-drop-dark.svg"
                alt="Price drop tracking showing Nike Dunk Low Panda dropping to $89"
                width={600}
                height={450}
                className="w-full h-auto rounded-2xl hidden dark:block"
              />
              <Image
                src="/assets/feat-price-drop-light.svg"
                alt="Price drop tracking showing Nike Dunk Low Panda dropping to $89"
                width={600}
                height={450}
                className="w-full h-auto rounded-2xl dark:hidden"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature: AI Chat ── */}
      <section className="relative z-10 border-t border-[var(--landing-border)]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="landing-reveal order-2 md:order-1">
              <Image
                src="/assets/feat-ai-chat-dark.svg"
                alt="AI chat interface - describe what you want and Steward finds it"
                width={600}
                height={450}
                className="w-full h-auto rounded-2xl hidden dark:block"
              />
              <Image
                src="/assets/feat-ai-chat-light.svg"
                alt="AI chat interface - describe what you want and Steward finds it"
                width={600}
                height={450}
                className="w-full h-auto rounded-2xl dark:hidden"
              />
            </div>
            <div className="order-1 md:order-2">
              <span className="landing-reveal inline-block text-xs font-semibold tracking-[0.2em] uppercase text-[var(--landing-accent-muted)] mb-4">AI Concierge</span>
              <h2 className="landing-reveal [animation-delay:100ms] text-3xl md:text-5xl font-bold font-[var(--font-serif)] text-[var(--landing-text)] leading-tight">
                No forms, no{' '}
                <span className="italic text-[var(--landing-accent)]">menus</span>
              </h2>
              <p className="landing-reveal [animation-delay:200ms] mt-6 text-[var(--landing-text-mid)] leading-relaxed">
                Skip the dropdowns and filters. Steward&apos;s AI understands plain English, finds the product, and creates the watch for you in seconds
              </p>

              <div className="landing-reveal [animation-delay:300ms] mt-6 space-y-3">
                {[
                  'Works on iOS and web',
                  'Share from Safari, Chrome, or any app',
                  'Plain English setup',
                  'Private and secure, no ads',
                ].map(item => (
                  <div key={item} className="flex items-center gap-3 text-sm text-[var(--landing-text-mid)]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--landing-accent-solid)]/15 text-xs text-[var(--landing-green)]">&#10003;</span>
                    {item}
                  </div>
                ))}
              </div>

              <Link
                href="/signup"
                className="landing-reveal [animation-delay:400ms] inline-flex items-center gap-2 mt-8 rounded-full bg-[var(--landing-accent-solid)] px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[var(--landing-accent-hover)] hover:shadow-lg hover:shadow-[var(--landing-card-shadow)]"
              >
                Try the AI Concierge
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="relative z-10 border-t border-[var(--landing-border)]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="text-center mb-16">
            <span className="landing-reveal inline-block text-xs font-semibold tracking-[0.2em] uppercase text-[var(--landing-accent-muted)] mb-4">How it Works</span>
            <h2 className="landing-reveal [animation-delay:100ms] text-3xl md:text-5xl font-bold font-[var(--font-serif)] text-[var(--landing-text)]">
              Effortless savings in three steps
            </h2>
          </div>

          {/* App screens showcase */}
          <div className="landing-reveal [animation-delay:200ms] mb-16">
            <Image
              src="/assets/app-screens.svg"
              alt="Steward app screens showing watches, AI chat, activity log, and savings tracker"
              width={1200}
              height={500}
              className="w-full h-auto"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Tell Steward what you want',
                desc: 'Paste a link, share a screenshot, or just describe it in plain English',
              },
              {
                step: '02',
                title: 'Steward watches around the clock',
                desc: 'Checks prices, stock levels, campground availability, restaurant openings, and flight fares on your schedule',
              },
              {
                step: '03',
                title: 'Get alerted instantly',
                desc: 'The moment something changes, you get a push notification with a direct link to act on it',
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="landing-reveal group relative rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-card)] p-8 transition-all duration-500 hover:bg-[var(--landing-card-hover)] hover:border-[var(--landing-border-hover)] hover:shadow-xl hover:shadow-[var(--landing-card-shadow)]"
                style={{ animationDelay: `${300 + i * 120}ms` }}
              >
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--landing-accent-solid)]/15 text-sm font-bold text-[var(--landing-accent)] mb-5">{item.step}</span>
                <h3 className="text-lg font-semibold text-[var(--landing-text)] mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-[var(--landing-text-dim)] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Mid-section CTA */}
          <div className="landing-reveal mt-16 text-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--landing-accent-solid)] px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:bg-[var(--landing-accent-hover)] hover:shadow-lg hover:shadow-[var(--landing-card-shadow)] hover:scale-[1.02] active:scale-[0.98]"
            >
              Try It Free
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
            <p className="mt-3 text-xs text-[var(--landing-text-faint)]">Takes 30 seconds · No credit card needed</p>
          </div>
        </div>
      </section>

      {/* ── Use Cases — Capabilities Grid ── */}
      <section id="use-cases" className="relative z-10 border-t border-[var(--landing-border)]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="text-center mb-16">
            <span className="landing-reveal inline-block text-xs font-semibold tracking-[0.2em] uppercase text-[var(--landing-gold-label)] mb-4">Use Cases</span>
            <h2 className="landing-reveal [animation-delay:100ms] text-3xl md:text-5xl font-bold font-[var(--font-serif)] text-[var(--landing-text)]">
              One app, endless ways to save
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                ),
                title: 'Price Drops',
                desc: 'Set a target price and get pinged the instant it hits across thousands of retailers',
                tag: 'Nike, Dyson, Apple & more',
              },
              {
                icon: (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m15-3.379a48.474 48.474 0 0 0-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 0 1 6 13.12M12.265 3.11a.375.375 0 1 1-.53 0L12 2.845l.265.265Z" /></svg>
                ),
                title: 'Restaurant Tables',
                desc: 'Impossible reservation? Steward monitors Resy for cancellations and new openings',
                tag: 'Resy & more',
              },
              {
                icon: (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
                ),
                title: 'Flight Deals',
                desc: 'Track fares across airlines and routes, get pinged when prices drop',
                tag: 'Major airlines',
              },
              {
                icon: (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" /></svg>
                ),
                title: 'Campsites',
                desc: 'Yosemite, Yellowstone, Big Sur. Snag that cancellation before anyone else',
                tag: 'Recreation.gov sites',
              },
              {
                icon: (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" /></svg>
                ),
                title: 'Event Tickets',
                desc: 'Concert tickets sold out? Watch for face-value drops and new inventory',
                tag: 'Ticketmaster & more',
              },
              {
                icon: (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>
                ),
                title: 'Restocks',
                desc: 'Limited releases, sold-out sneakers, viral products. Be first in line when they return',
                tag: 'Most URLs work',
              },
              {
                icon: (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
                ),
                title: 'AI Chat Setup',
                desc: 'Just say what you want. Your AI Concierge finds it and sets the watch',
                tag: 'Plain English setup',
              },
              {
                icon: (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" /></svg>
                ),
                title: 'Share Extension',
                desc: 'See something in Safari or Chrome? Tap Share, then Steward. Link loaded and ready',
                tag: 'Works in most apps',
              },
            ].map((item, i) => (
              <div
                key={item.title}
                className="landing-reveal group relative rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-card)] p-6 transition-all duration-500 hover:bg-[var(--landing-card-hover)] hover:border-[var(--landing-border-hover)] hover:shadow-xl hover:shadow-[var(--landing-card-shadow)] overflow-hidden"
                style={{ animationDelay: `${200 + i * 80}ms` }}
              >
                <div className="relative z-10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--landing-surface)] border border-[var(--landing-border)] text-[var(--landing-accent)] mb-4 transition-transform duration-300 group-hover:scale-110">
                    {item.icon}
                  </div>
                  <h3 className="text-base font-semibold text-[var(--landing-text)] mb-2">{item.title}</h3>
                  <p className="text-sm text-[var(--landing-text-dim)] leading-relaxed mb-4">{item.desc}</p>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--landing-green)]">
                    <span>&#10003;</span>
                    <span>{item.tag}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="landing-reveal mt-16 text-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface)] px-8 py-4 text-base font-medium text-[var(--landing-text-mid)] transition-all duration-300 hover:bg-[var(--landing-surface-hover)] hover:border-[var(--landing-border-hover)] backdrop-blur-sm"
            >
              See What You Could Save
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why Steward — Savings ── */}
      <section className="relative z-10 border-t border-[var(--landing-border)]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="landing-reveal order-2 md:order-1">
              <Image
                src="/assets/sq-savings-dark.svg"
                alt="Savings tracker showing $247 in potential savings across 12 deals"
                width={600}
                height={600}
                className="w-full h-auto max-w-md mx-auto"
              />
            </div>
            <div className="order-1 md:order-2">
              <span className="landing-reveal inline-block text-xs font-semibold tracking-[0.2em] uppercase text-[var(--landing-gold-label)] mb-4">Why Steward</span>
              <h2 className="landing-reveal [animation-delay:100ms] text-3xl md:text-5xl font-bold font-[var(--font-serif)] text-[var(--landing-text)] leading-tight">
                Inflation affects us all<br />Steward fights back
              </h2>
              <p className="landing-reveal [animation-delay:200ms] mt-6 text-[var(--landing-text-mid)] leading-relaxed">
                Grocery prices are up 25%, flight prices are up 30%. The cost of living keeps climbing but you don&apos;t have time to constantly check for better prices or refresh pages hoping for a cancellation
              </p>
              <p className="landing-reveal [animation-delay:300ms] mt-4 text-[var(--landing-text-mid)] leading-relaxed">
                Tell Steward what you want and your AI concierge handles the rest. No browser tabs, no price alert fatigue, just real savings delivered to you
              </p>
              <Link
                href="/signup"
                className="landing-reveal [animation-delay:400ms] inline-flex items-center gap-2 mt-8 rounded-full bg-[var(--landing-accent-solid)] px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[var(--landing-accent-hover)] hover:shadow-lg hover:shadow-[var(--landing-card-shadow)]"
              >
                Start Saving Today
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="relative z-10 border-t border-[var(--landing-border)]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="text-center mb-20">
            <span className="landing-reveal inline-block text-xs font-semibold tracking-[0.2em] uppercase text-[var(--landing-accent-muted)] mb-4">Pricing</span>
            <h2 className="landing-reveal [animation-delay:100ms] text-3xl md:text-5xl font-bold font-[var(--font-serif)] text-[var(--landing-text)]">
              Pays for itself with one deal
            </h2>
            <p className="landing-reveal [animation-delay:200ms] mt-4 text-[var(--landing-text-dim)] max-w-xl mx-auto">
              Start free, upgrade when you see how much you save
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Free */}
            <div className="landing-reveal rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-card)] p-7 flex flex-col transition-all duration-300 hover:border-[var(--landing-border-hover)]">
              <h3 className="text-lg font-semibold font-[var(--font-serif)] text-[var(--landing-text)]">Free</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-[var(--landing-text)]">$0</span>
                <span className="text-sm text-[var(--landing-text-faint)] ml-1">/ forever</span>
              </div>
              <ul className="space-y-3.5 text-sm flex-1">
                {[
                  { text: 'Up to 3 watches', included: true },
                  { text: 'Watches once per day', included: true },
                  { text: 'Push notifications (Notify Me)', included: true },
                  { text: 'Notify + Quick Link', included: false },
                  { text: 'Steward Acts', included: false },
                  { text: 'Faster watch frequencies', included: false },
                  { text: 'Price insights & deal alerts', included: false },
                ].map(f => (
                  <li key={f.text} className={`flex items-start gap-2.5 ${f.included ? 'text-[var(--landing-text-mid)]' : 'text-[var(--landing-text-faint)]'}`}>
                    <span className={`mt-0.5 ${f.included ? 'text-[var(--landing-green)]' : 'text-[var(--landing-text-faint)]'}`}>{f.included ? '✓' : '✗'}</span>{f.text}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="mt-8 block text-center rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface)] px-4 py-3 text-sm font-medium text-[var(--landing-text-mid)] transition-all duration-300 hover:bg-[var(--landing-surface-hover)]">
                Get Started Free
              </Link>
            </div>

            {/* Pro */}
            <div className="landing-reveal [animation-delay:100ms] rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-card)] p-7 flex flex-col transition-all duration-300 hover:border-[var(--landing-border-hover)]">
              <h3 className="text-lg font-semibold font-[var(--font-serif)] text-[var(--landing-text)]">Steward Pro</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-[var(--landing-text)]">$4.99</span>
                <span className="text-sm text-[var(--landing-text-faint)] ml-1">/ month</span>
              </div>
              <ul className="space-y-3.5 text-sm text-[var(--landing-text-mid)] flex-1">
                {[
                  'Up to 7 watches',
                  'Watch frequency up to every 12 hours',
                  'Notify + Quick Link response mode',
                  'Price insights & deal alerts',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className="text-[var(--landing-green)] mt-0.5">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="mt-8 block text-center rounded-full bg-[var(--landing-accent-solid)] px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[var(--landing-accent-hover)] hover:shadow-lg hover:shadow-[var(--landing-card-shadow)]">
                Subscribe for $4.99
              </Link>
              <p className="mt-3 text-center text-xs text-[var(--landing-text-faint)]">or $39.99/year (save 33%)</p>
            </div>

            {/* Premium */}
            <div className="landing-reveal [animation-delay:200ms] relative rounded-2xl border-2 border-[var(--landing-accent-solid)] bg-[var(--landing-card)] p-7 flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-[var(--landing-card-shadow)]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#F5C842] px-4 py-1 text-[10px] font-bold text-[#0A0C0B] tracking-wider">
                BEST VALUE
              </div>
              <h3 className="text-lg font-semibold font-[var(--font-serif)] text-[var(--landing-text)]">Steward Premium</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-[var(--landing-text)]">$9.99</span>
                <span className="text-sm text-[var(--landing-text-faint)] ml-1">/ month</span>
              </div>
              <ul className="space-y-3.5 text-sm text-[var(--landing-text-mid)] flex-1">
                {[
                  'Up to 15 watches',
                  'Watch frequency up to every 2 hours',
                  'Steward Acts',
                  'Everything in Pro included',
                  'Priority support',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className="text-[var(--landing-green)] mt-0.5">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="mt-8 block text-center rounded-full bg-[#F59E0B] px-4 py-3 text-sm font-semibold text-[#0A0C0B] transition-all duration-300 hover:bg-[#F5C842] hover:shadow-lg hover:shadow-[var(--landing-card-shadow)]">
                Subscribe for $9.99
              </Link>
              <p className="mt-3 text-center text-xs text-[var(--landing-text-faint)]">or $79.99/year (save 33%)</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="relative z-10 border-t border-[var(--landing-border)]">
        <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
          <div className="text-center mb-16">
            <span className="landing-reveal inline-block text-xs font-semibold tracking-[0.2em] uppercase text-[var(--landing-accent-muted)] mb-4">FAQ</span>
            <h2 className="landing-reveal [animation-delay:100ms] text-3xl md:text-5xl font-bold font-[var(--font-serif)] text-[var(--landing-text)]">
              Common questions
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: 'What can Steward track?',
                a: 'Steward can monitor price drops across thousands of retailers like Amazon, Nike, Best Buy, and Walmart. It also tracks restaurant reservation openings on Resy, campsite availability on Recreation.gov, flight price changes across major airlines, event ticket restocks on Ticketmaster, and product restocks on most e-commerce sites',
              },
              {
                q: 'How does Steward work?',
                a: 'Tell Steward what you want to watch by pasting a link, sharing from another app, or describing it in plain English using our AI chat. Steward then checks for changes on your schedule and sends you a push notification the moment something changes',
              },
              {
                q: 'Is Steward free?',
                a: 'Yes. The free plan includes up to 3 watches with daily check frequency and push notifications. Paid plans start at $4.99/month for faster checks and more watches',
              },
              {
                q: 'What devices does Steward work on?',
                a: 'Steward works on iPhone (iOS app) and on the web at joinsteward.app. The iOS app includes a Share Extension so you can send any link to Steward directly from Safari, Chrome, or any app',
              },
              {
                q: 'How is Steward different from other price trackers?',
                a: 'Most price trackers only work for specific stores or product categories. Steward monitors almost anything on the web including restaurant tables, campsites, flights, event tickets, and product restocks. Plus, you set it up by just describing what you want in plain English',
              },
              {
                q: 'How fast does Steward check for changes?',
                a: 'Free users get daily checks. Pro users get checks up to every 12 hours. Premium users get checks as frequently as every 2 hours. You choose the frequency for each watch',
              },
            ].map((item, i) => (
              <details
                key={i}
                className="landing-reveal group rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-card)] transition-all duration-300 hover:border-[var(--landing-border-hover)]"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <summary className="flex cursor-pointer items-center justify-between p-6 text-[var(--landing-text)] font-medium">
                  {item.q}
                  <svg className="w-5 h-5 text-[var(--landing-text-dim)] transition-transform duration-300 group-open:rotate-45 flex-shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </summary>
                <p className="px-6 pb-6 text-sm text-[var(--landing-text-mid)] leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'What can Steward track?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Steward can monitor price drops across thousands of retailers like Amazon, Nike, Best Buy, and Walmart. It also tracks restaurant reservation openings on Resy, campsite availability on Recreation.gov, flight price changes across major airlines, event ticket restocks on Ticketmaster, and product restocks on most e-commerce sites.',
                },
              },
              {
                '@type': 'Question',
                name: 'How does Steward work?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Tell Steward what you want to watch by pasting a link, sharing from another app, or describing it in plain English using the AI chat. Steward then checks for changes on your schedule and sends you a push notification the moment something changes.',
                },
              },
              {
                '@type': 'Question',
                name: 'Is Steward free?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. The free plan includes up to 3 watches with daily check frequency and push notifications. Paid plans start at $4.99/month for faster checks and more watches.',
                },
              },
              {
                '@type': 'Question',
                name: 'What devices does Steward work on?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Steward works on iPhone (iOS app) and on the web at joinsteward.app. The iOS app includes a Share Extension so you can send any link to Steward directly from Safari, Chrome, or any app.',
                },
              },
              {
                '@type': 'Question',
                name: 'How is Steward different from other price trackers?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Most price trackers only work for specific stores or product categories. Steward monitors almost anything on the web including restaurant tables, campsites, flights, event tickets, and product restocks. Plus, you set it up by just describing what you want in plain English.',
                },
              },
              {
                '@type': 'Question',
                name: 'How fast does Steward check for changes?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Free users get daily checks. Pro users get checks up to every 12 hours. Premium users get checks as frequently as every 2 hours. You choose the frequency for each watch.',
                },
              },
            ],
          }),
        }}
      />

      {/* ── Final CTA ── */}
      <section className="relative z-10 border-t border-[var(--landing-border)]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32 text-center">
          {/* Glow behind CTA */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-[300px] w-[300px] rounded-full bg-[var(--landing-glow-green)] blur-[80px]" />
          </div>

          <div className="relative z-10">
            <h2 className="landing-reveal text-4xl md:text-6xl font-bold font-[var(--font-serif)] text-[var(--landing-text)] mb-6">
              Your AI Concierge is{' '}
              <span className="italic text-[var(--landing-accent)]">ready</span>
            </h2>
            <p className="landing-reveal [animation-delay:100ms] text-lg text-[var(--landing-text-dim)] mb-12 max-w-xl mx-auto">
              Stop refreshing, stop missing out. Steward watches prices, tables, tickets, and campsites and pings you the moment something moves
            </p>
            <Link
              href="/signup"
              className="landing-reveal [animation-delay:200ms] inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--landing-accent-solid)] to-[var(--landing-accent-hover)] px-10 py-4 text-base font-semibold text-white transition-all duration-300 hover:shadow-xl hover:shadow-[var(--landing-card-shadow)] hover:scale-[1.02] active:scale-[0.98]"
            >
              Create Your Free Account
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
            <p className="landing-reveal [animation-delay:300ms] mt-4 text-xs text-[var(--landing-text-faint)]">
              No credit card · Free tier included · joinsteward.app
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-[var(--landing-border)]">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <Image src="/steward-logo.png" alt="Steward" width={24} height={24} className="rounded-md" />
            <span className="text-sm font-semibold font-[var(--font-serif)] text-[var(--landing-accent)]">
              Steward
            </span>
            <span className="text-xs text-[var(--landing-text-faint)] ml-1">Your AI Concierge</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[var(--landing-text-dim)]">
            <a href="#pricing" className="hover:text-[var(--landing-text)] transition-colors duration-300">Pricing</a>
            <Link href="/login" className="hover:text-[var(--landing-text)] transition-colors duration-300">Sign In</Link>
            <Link href="/signup" className="hover:text-[var(--landing-text)] transition-colors duration-300">Sign Up</Link>
          </div>
          <div className="flex items-center gap-6 text-xs text-[var(--landing-text-faint)]">
            <Link href="/privacy" className="hover:text-[var(--landing-text)] transition-colors duration-300">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[var(--landing-text)] transition-colors duration-300">Terms of Service</Link>
            <span>&copy; {new Date().getFullYear()} Steward</span>
          </div>
        </div>
      </footer>
    </div>
    </LandingWrapper>
  )
}
