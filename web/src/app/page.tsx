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
        {/* Status badge */}
        <div className="landing-reveal inline-flex items-center gap-2.5 rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface)] px-5 py-2 text-xs font-medium text-[var(--landing-text-mid)] mb-8 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--landing-green)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--landing-green)]"></span>
          </span>
          Saving users an average of $2,400/year
        </div>

        <h1 className="landing-reveal [animation-delay:100ms] text-5xl md:text-7xl lg:text-8xl font-bold font-[var(--font-serif)] text-[var(--landing-text)] leading-[1.05] max-w-4xl mx-auto tracking-tight">
          Stop overpaying.{' '}
          <span className="relative">
            <span className="text-transparent bg-clip-text bg-[length:200%_auto] animate-shimmer" style={{ backgroundImage: 'linear-gradient(to right, var(--landing-shimmer-from), var(--landing-shimmer-via), var(--landing-shimmer-to))' }}>
              Start saving.
            </span>
          </span>
        </h1>

        <p className="landing-reveal [animation-delay:200ms] mt-8 text-lg md:text-xl text-[var(--landing-text-mid)] max-w-2xl mx-auto leading-relaxed">
          Prices keep rising. Steward is your AI-powered watchdog that tracks price drops, restocks, restaurant reservations, campground openings, and flight deals around the clock, so you never miss a deal or pay more than you have to.
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
          Free forever plan included · No credit card required · Set up in 30 seconds
        </p>

        {/* Hero visual — branded marketing asset */}
        <div className="landing-reveal [animation-delay:500ms] mt-20 mx-auto max-w-4xl">
          {/* Dark mode hero */}
          <Image
            src="/assets/hero-dark.svg"
            alt="Steward watches prices, restocks, reservations and more"
            width={1200}
            height={600}
            className="w-full h-auto rounded-2xl hidden dark:block"
            priority
          />
          {/* Light mode hero */}
          <Image
            src="/assets/hero-light.svg"
            alt="Steward watches prices, restocks, reservations and more"
            width={1200}
            height={600}
            className="w-full h-auto rounded-2xl dark:hidden"
            priority
          />
        </div>
      </section>

      {/* ── Trust bar / Stats ── */}
      <section className="relative z-10 border-t border-[var(--landing-border)]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 'Watch Most Things', label: 'More than just a price tracker', small: true },
              { value: '24/7', label: 'Always-on monitoring', small: false },
              { value: 'Up to 2hr', label: 'Check frequency', small: false },
              { value: '30sec', label: 'To set up your first watch', small: false },
            ].map((stat, i) => (
              <div key={stat.label} className="landing-reveal" style={{ animationDelay: `${i * 100}ms` }}>
                <p className={`font-bold font-[var(--font-serif)] text-[var(--landing-accent)] whitespace-nowrap ${stat.small ? 'text-xl md:text-2xl' : 'text-3xl md:text-4xl'}`}>
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
                <span className="italic text-[var(--landing-accent)]">purchase.</span>
              </h2>
              <p className="landing-reveal [animation-delay:200ms] mt-6 text-[var(--landing-text-mid)] leading-relaxed">
                Works across Amazon, Nike, Best Buy, Target, Walmart, and thousands of other retailers. Users save an average of <strong className="text-[var(--landing-text)]">$41 per watched item</strong>.
              </p>
              <p className="landing-reveal [animation-delay:300ms] mt-4 text-[var(--landing-text-mid)] leading-relaxed">
                With the cost of living climbing every year, Steward makes sure you never pay full price when you don&apos;t have to.
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
                No forms. No{' '}
                <span className="italic text-[var(--landing-accent)]">menus.</span>
              </h2>
              <p className="landing-reveal [animation-delay:200ms] mt-6 text-[var(--landing-text-mid)] leading-relaxed">
                Skip the dropdowns and filters. Steward&apos;s AI understands plain English, finds the product, and creates the watch for you in seconds.
              </p>
              <p className="landing-reveal [animation-delay:300ms] mt-4 text-[var(--landing-text-mid)] leading-relaxed">
                Built for busy people. Your time is worth more than refreshing pages and filling out forms.
              </p>
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

      {/* ── How It Works — App Screens ── */}
      <section id="how-it-works" className="relative z-10 border-t border-[var(--landing-border)]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="text-center mb-16">
            <span className="landing-reveal inline-block text-xs font-semibold tracking-[0.2em] uppercase text-[var(--landing-accent-muted)] mb-4">How it Works</span>
            <h2 className="landing-reveal [animation-delay:100ms] text-3xl md:text-5xl font-bold font-[var(--font-serif)] text-[var(--landing-text)]">
              Effortless savings in three steps
            </h2>
            <p className="landing-reveal [animation-delay:200ms] mt-4 text-[var(--landing-text-dim)] max-w-xl mx-auto">
              No complicated setup. No spreadsheets. Just tell Steward what matters to you.
            </p>
          </div>

          {/* App screens showcase */}
          <div className="landing-reveal [animation-delay:300ms] mb-16">
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
                desc: 'Paste a link, share a screenshot, or just describe it. "Watch this Nike shoe for a price drop." "Let me know when Yosemite campsites open for July." Steward understands.',
              },
              {
                step: '02',
                title: 'Steward watches around the clock',
                desc: 'Your AI concierge checks prices, stock levels, campground availability, restaurant openings, and flight fares on your schedule. Every 2 hours, every 12 hours, or daily.',
              },
              {
                step: '03',
                title: 'Get alerted or Steward acts for you',
                desc: 'The instant something changes, you get a push notification with a direct link. On Premium, Steward can even add items to your cart before they sell out again.',
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="landing-reveal group relative rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-card)] p-8 transition-all duration-500 hover:bg-[var(--landing-card-hover)] hover:border-[var(--landing-border-hover)] hover:shadow-xl hover:shadow-[var(--landing-card-shadow)]"
                style={{ animationDelay: `${400 + i * 120}ms` }}
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
            <p className="mt-3 text-xs text-[var(--landing-text-faint)]">Takes 30 seconds. No credit card needed.</p>
          </div>
        </div>
      </section>

      {/* ── Use Cases — Capabilities Grid ── */}
      <section id="use-cases" className="relative z-10 border-t border-[var(--landing-border)]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="text-center mb-16">
            <span className="landing-reveal inline-block text-xs font-semibold tracking-[0.2em] uppercase text-[var(--landing-gold-label)] mb-4">Use Cases</span>
            <h2 className="landing-reveal [animation-delay:100ms] text-3xl md:text-5xl font-bold font-[var(--font-serif)] text-[var(--landing-text)]">
              One app. Endless savings.
            </h2>
            <p className="landing-reveal [animation-delay:200ms] mt-4 text-[var(--landing-text-dim)] max-w-2xl mx-auto">
              Whether you&apos;re hunting for a deal, waiting for a restock, or trying to score an impossible reservation, Steward has your back.
            </p>
          </div>

          {/* Capabilities grid asset */}
          <div className="landing-reveal [animation-delay:300ms]">
            <Image
              src="/assets/capabilities-grid.svg"
              alt="Steward capabilities: Price Drops, Restaurant Tables, Flight Deals, Campsites, Event Tickets, Restocks, AI Chat Setup, Share Extension"
              width={1200}
              height={700}
              className="w-full h-auto"
            />
          </div>

          {/* Callout cards row */}
          <div className="grid md:grid-cols-2 gap-6 mt-16">
            <div className="landing-reveal rounded-2xl overflow-hidden">
              <Image
                src="/assets/callout-price-dark.svg"
                alt="Set your price. We'll watch. Steward checks daily across major retailers."
                width={600}
                height={400}
                className="w-full h-auto"
              />
            </div>
            <div className="landing-reveal [animation-delay:100ms] rounded-2xl overflow-hidden">
              <Image
                src="/assets/callout-table-light.svg"
                alt="Impossible table? Gotcha. Carbone, Nobu, Per Se monitored daily."
                width={600}
                height={400}
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Use cases bottom CTA */}
          <div className="landing-reveal mt-16 text-center">
            <p className="text-[var(--landing-text-mid)] mb-6">
              And that&apos;s just the beginning. Steward can watch <strong className="text-[var(--landing-text)]">most webpages</strong> for <strong className="text-[var(--landing-text)]">most changes</strong>.
            </p>
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

      {/* ── AI Concierge Section ── */}
      <section className="relative z-10 border-t border-[var(--landing-border)]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="landing-reveal inline-block text-xs font-semibold tracking-[0.2em] uppercase text-[var(--landing-accent-muted)] mb-4">Built for Convenience</span>
              <h2 className="landing-reveal [animation-delay:100ms] text-3xl md:text-5xl font-bold font-[var(--font-serif)] text-[var(--landing-text)] leading-tight">
                Your time back.{' '}
                <span className="italic text-[var(--landing-accent)]">Guaranteed.</span>
              </h2>
              <p className="landing-reveal [animation-delay:200ms] mt-6 text-[var(--landing-text-mid)] leading-relaxed">
                The average person spends 3+ hours per week manually checking prices, refreshing pages, and hunting for availability. Steward replaces all of that with a single conversation.
              </p>
              <p className="landing-reveal [animation-delay:300ms] mt-4 text-[var(--landing-text-mid)] leading-relaxed">
                Set it once, forget it. Steward watches while you work, sleep, and live your life.
              </p>

              <div className="landing-reveal [animation-delay:400ms] mt-8 space-y-3">
                {[
                  'Works on iOS and web',
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
                className="landing-reveal [animation-delay:500ms] inline-flex items-center gap-2 mt-8 rounded-full bg-[var(--landing-accent-solid)] px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[var(--landing-accent-hover)] hover:shadow-lg hover:shadow-[var(--landing-card-shadow)]"
              >
                Get Started Free
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
            <div className="landing-reveal [animation-delay:200ms]">
              <Image
                src="/assets/ai-concierge.svg"
                alt="Say it. Steward handles it. AI concierge chat interface."
                width={600}
                height={600}
                className="w-full h-auto"
              />
            </div>
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
                Everything costs more.<br />Steward fights back.
              </h2>
              <p className="landing-reveal [animation-delay:200ms] mt-6 text-[var(--landing-text-mid)] leading-relaxed">
                Groceries up 25%. Flights up 30%. The cost of living keeps climbing, but you don&apos;t have time to constantly check for better prices, wait for restocks, or refresh campground pages hoping for a cancellation.
              </p>
              <p className="landing-reveal [animation-delay:300ms] mt-4 text-[var(--landing-text-mid)] leading-relaxed">
                Steward was built for convenience. Tell it what you want, and your AI concierge handles the rest. No browser tabs. No price alert fatigue. Just real savings delivered to you.
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
              Start free. Upgrade when you see how much you save. Most users make back their subscription cost within the first week.
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
                  { text: 'Steward Acts (auto-execute)', included: false },
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
              <p className="mt-3 text-center text-xs text-[var(--landing-text-faint)]">or $29.99/year (save 50%)</p>
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
                  'Steward Acts (auto-execute actions)',
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
              <p className="mt-3 text-center text-xs text-[var(--landing-text-faint)]">or $59.99/year (save 50%)</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative z-10 border-t border-[var(--landing-border)]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32 text-center">
          {/* Glow behind CTA */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-[300px] w-[300px] rounded-full bg-[var(--landing-glow-green)] blur-[80px]" />
          </div>

          <div className="relative z-10">
            <h2 className="landing-reveal text-4xl md:text-6xl font-bold font-[var(--font-serif)] text-[var(--landing-text)] mb-6">
              Your AI Concierge<br />is{' '}
              <span className="italic text-[var(--landing-accent)]">ready.</span>
            </h2>
            <p className="landing-reveal [animation-delay:100ms] text-lg text-[var(--landing-text-dim)] mb-12 max-w-xl mx-auto">
              Stop refreshing. Stop missing out. Steward watches prices, tables, tickets, and campsites and pings you the moment something moves.
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
