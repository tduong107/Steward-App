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

        {/* Hero visual — mock dashboard card */}
        <div className="landing-reveal [animation-delay:500ms] mt-20 mx-auto max-w-3xl rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-card)] p-1 backdrop-blur-sm shadow-2xl text-left" style={{ boxShadow: '0 25px 50px -12px var(--landing-card-shadow)' }}>
          <div className="rounded-xl bg-[var(--landing-mock-card-bg)] p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Image src="/steward-logo.png" alt="" width={28} height={28} className="rounded-md" />
              <span className="text-sm font-medium text-[var(--landing-text-mid)]">Steward Dashboard</span>
              <span className="ml-auto flex items-center gap-1.5 text-xs text-[var(--landing-green)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-green)] animate-pulse" />
                5 watches active
              </span>
            </div>
            <div className="space-y-3">
              {[
                { emoji: '👟', name: 'Nike Air Max 90', status: 'Price dropped $41 since last week', accent: true, badge: '↓ $41 saved' },
                { emoji: '✈️', name: 'SFO to Tokyo (Oct)', status: 'Fare dropped to $489 roundtrip', accent: true, badge: '↓ $230' },
                { emoji: '🏕️', name: 'Yosemite Camp IV', status: 'Site opened up for Jul 14-16!', accent: true, badge: 'Available!' },
                { emoji: '🍽️', name: 'Resy - Carbone NYC', status: 'Watching for 2-top openings', accent: false, badge: '' },
                { emoji: '📦', name: 'PS5 Pro Bundle', status: 'Back in stock at Best Buy!', accent: true, badge: 'In Stock' },
              ].map((item, i) => (
                <div
                  key={item.name}
                  className={`grid grid-cols-[40px_1fr_90px] items-center gap-3 rounded-xl px-4 py-3.5 transition-all duration-500 ${
                    item.accent
                      ? 'bg-[var(--landing-accent-solid)]/15 border border-[var(--landing-accent-solid)]/25'
                      : 'bg-[var(--landing-mock-item-bg)] border border-[var(--landing-mock-item-border)]'
                  } animate-fade-in-up`}
                  style={{ animationDelay: `${700 + i * 150}ms` }}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--landing-surface)] text-xl">{item.emoji}</span>
                  <div className="text-center">
                    <p className="text-sm font-medium text-[var(--landing-text)]">{item.name}</p>
                    <p className={`text-xs ${item.accent ? 'text-[var(--landing-green)]' : 'text-[var(--landing-text-dim)]'}`}>{item.status}</p>
                  </div>
                  <div className="flex justify-end">
                    {item.badge && (
                      <span className="text-xs font-semibold text-[var(--landing-green)] bg-[var(--landing-green)]/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust bar / Stats ── */}
      <section className="relative z-10 border-t border-[var(--landing-border)]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '$2,400+', label: 'Avg. yearly savings per user' },
              { value: '24/7', label: 'Always-on monitoring' },
              { value: '<2min', label: 'Time to get alerted' },
              { value: '30sec', label: 'To set up your first watch' },
            ].map((stat, i) => (
              <div key={stat.label} className="landing-reveal" style={{ animationDelay: `${i * 100}ms` }}>
                <p className="text-3xl md:text-4xl font-bold font-[var(--font-serif)] text-[var(--landing-accent)]">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-[var(--landing-text-dim)]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Steward — Cost of Living Section ── */}
      <section className="relative z-10 border-t border-[var(--landing-border)]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
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

            <div className="landing-reveal [animation-delay:200ms] space-y-4">
              {[
                { icon: '💸', title: 'Average user saves $200/month', desc: 'On everyday purchases across electronics, clothing, travel, and more.' },
                { icon: '⏱️', title: 'Built for busy lives', desc: 'Set it once, forget it. Steward watches while you work, sleep, and live your life.' },
                { icon: '🧠', title: 'AI that gets smarter', desc: 'Steward learns the best times to buy, spots pricing patterns, and gives you deal quality scores.' },
                { icon: '🔔', title: 'Never miss the moment', desc: 'Instant push notifications the second a price drops, a campsite opens, or a table becomes available.' },
              ].map((item, i) => (
                <div
                  key={item.title}
                  className="landing-reveal flex items-start gap-4 rounded-xl border border-[var(--landing-border)] bg-[var(--landing-card)] p-5 transition-all duration-300 hover:bg-[var(--landing-card-hover)] hover:border-[var(--landing-border-hover)]"
                  style={{ animationDelay: `${300 + i * 100}ms` }}
                >
                  <span className="text-2xl shrink-0 mt-0.5">{item.icon}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--landing-text)] mb-1">{item.title}</h3>
                    <p className="text-sm text-[var(--landing-text-dim)] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="relative z-10 border-t border-[var(--landing-border)]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="text-center mb-20">
            <span className="landing-reveal inline-block text-xs font-semibold tracking-[0.2em] uppercase text-[var(--landing-accent-muted)] mb-4">How it Works</span>
            <h2 className="landing-reveal [animation-delay:100ms] text-3xl md:text-5xl font-bold font-[var(--font-serif)] text-[var(--landing-text)]">
              Effortless savings in three steps
            </h2>
            <p className="landing-reveal [animation-delay:200ms] mt-4 text-[var(--landing-text-dim)] max-w-xl mx-auto">
              No complicated setup. No spreadsheets. Just tell Steward what matters to you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: '💬',
                title: 'Tell Steward what you want',
                desc: 'Paste a link, share a screenshot, or just describe it. "Watch this Nike shoe for a price drop." "Let me know when Yosemite campsites open for July." Steward understands.',
              },
              {
                step: '02',
                icon: '👀',
                title: 'Steward watches around the clock',
                desc: 'Your AI concierge checks prices, stock levels, campground availability, restaurant openings, and flight fares on your schedule. Every 2 hours, every 12 hours, or daily.',
              },
              {
                step: '03',
                icon: '🎯',
                title: 'Get alerted or Steward acts for you',
                desc: 'The instant something changes, you get a push notification with a direct link. On Premium, Steward can even add items to your cart before they sell out again.',
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="landing-reveal group relative rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-card)] p-8 transition-all duration-500 hover:bg-[var(--landing-card-hover)] hover:border-[var(--landing-border-hover)] hover:shadow-xl hover:shadow-[var(--landing-card-shadow)]"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <span className="text-xs font-mono font-bold text-[var(--landing-accent-faint)] tracking-wider">{item.step}</span>
                <div className="mt-4 mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--landing-surface)] border border-[var(--landing-border)] text-3xl transition-transform duration-300 group-hover:scale-110">
                  {item.icon}
                </div>
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

      {/* ── Use Cases ── */}
      <section id="use-cases" className="relative z-10 border-t border-[var(--landing-border)]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="text-center mb-20">
            <span className="landing-reveal inline-block text-xs font-semibold tracking-[0.2em] uppercase text-[var(--landing-gold-label)] mb-4">Use Cases</span>
            <h2 className="landing-reveal [animation-delay:100ms] text-3xl md:text-5xl font-bold font-[var(--font-serif)] text-[var(--landing-text)]">
              One app. Endless savings.
            </h2>
            <p className="landing-reveal [animation-delay:200ms] mt-4 text-[var(--landing-text-dim)] max-w-2xl mx-auto">
              Whether you&apos;re hunting for a deal, waiting for a restock, or trying to score an impossible reservation, Steward has your back.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                emoji: '🏷️',
                title: 'Price Drop Alerts',
                desc: 'Track prices across Amazon, Target, Best Buy, Nike, Walmart, and thousands more. Get notified the second prices fall. Users save an average of $41 per watched item.',
                color: 'from-[#2A5C45]/20 to-transparent',
              },
              {
                emoji: '📦',
                title: 'Back in Stock Alerts',
                desc: 'That sold-out PS5, limited sneaker drop, or viral skincare product? Steward watches inventory 24/7 and pings you the moment it comes back. Be first in line, not last.',
                color: 'from-[#1E4A8A]/20 to-transparent',
              },
              {
                emoji: '🏕️',
                title: 'Campground Reservations',
                desc: 'Yosemite, Glacier, Yellowstone, Joshua Tree. Campsites book out in seconds but cancellations happen daily. Steward catches openings so you can lock in your dream trip.',
                color: 'from-[#27AE60]/20 to-transparent',
              },
              {
                emoji: '🍽️',
                title: 'Restaurant Reservations',
                desc: 'Score a table at Carbone, Don Angie, or your city\'s hottest spot. Steward monitors Resy and OpenTable for cancellations and new openings, then alerts you instantly.',
                color: 'from-[#C0392B]/15 to-transparent',
              },
              {
                emoji: '✈️',
                title: 'Flight Price Tracking',
                desc: 'Watch routes on Google Flights, Kayak, and Skyscanner. Steward tracks fare changes and notifies you when prices drop. One user saved $230 on a Tokyo roundtrip.',
                color: 'from-[#6EE7B7]/15 to-transparent',
              },
              {
                emoji: '🎫',
                title: 'Event Tickets & Drops',
                desc: 'Concert tickets, limited edition releases, flash sales. Set a watch on any page and Steward will alert you the moment something changes. No more FOMO.',
                color: 'from-[#F59E0B]/20 to-transparent',
              },
            ].map((item, i) => (
              <div
                key={item.title}
                className="landing-reveal group relative rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-card)] p-6 transition-all duration-500 hover:bg-[var(--landing-card-hover)] hover:border-[var(--landing-border-hover)] overflow-hidden"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Subtle gradient bg */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10">
                  <span className="text-3xl block mb-4 transition-transform duration-300 group-hover:scale-110">{item.emoji}</span>
                  <h3 className="text-base font-semibold text-[var(--landing-text)] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[var(--landing-text-dim)] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Use cases CTA */}
          <div className="landing-reveal mt-16 text-center">
            <p className="text-[var(--landing-text-mid)] mb-6">
              And that&apos;s just the beginning. Steward can watch <strong className="text-[var(--landing-text)]">any webpage</strong> for <strong className="text-[var(--landing-text)]">any change</strong>.
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

      {/* ── Convenience / Built for You ── */}
      <section className="relative z-10 border-t border-[var(--landing-border)]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32 text-center">
          <span className="landing-reveal inline-block text-xs font-semibold tracking-[0.2em] uppercase text-[var(--landing-accent-muted)] mb-4">Built for Convenience</span>
          <h2 className="landing-reveal [animation-delay:100ms] text-3xl md:text-5xl font-bold font-[var(--font-serif)] text-[var(--landing-text)] max-w-3xl mx-auto">
            Your time is worth more than refreshing pages
          </h2>
          <p className="landing-reveal [animation-delay:200ms] mt-6 text-[var(--landing-text-mid)] max-w-2xl mx-auto leading-relaxed">
            The average person spends 3+ hours per week manually checking prices and availability. Steward replaces all of that with a single conversation.
          </p>

          <div className="landing-reveal [animation-delay:300ms] grid sm:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
            {[
              { icon: '📱', title: 'Works on any device', desc: 'iOS app and full-featured web app. Your watches sync everywhere.' },
              { icon: '🗣️', title: 'Just talk to it', desc: 'No forms to fill. Describe what you want in plain English and Steward handles the rest.' },
              { icon: '🔒', title: 'Private and secure', desc: 'No ads. No tracking. No selling your data. Steward works for you, not advertisers.' },
            ].map((item, i) => (
              <div key={item.title} className="landing-reveal text-center" style={{ animationDelay: `${400 + i * 100}ms` }}>
                <span className="text-3xl block mb-3">{item.icon}</span>
                <h3 className="text-base font-semibold text-[var(--landing-text)] mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--landing-text-dim)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
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
              Every dollar counts.<br />Let Steward count them for you.
            </h2>
            <p className="landing-reveal [animation-delay:100ms] text-lg text-[var(--landing-text-dim)] mb-12 max-w-xl mx-auto">
              Join thousands of users who stopped overpaying. Set up your first watch in 30 seconds and let your AI concierge do the heavy lifting.
            </p>
            <Link
              href="/signup"
              className="landing-reveal [animation-delay:200ms] inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--landing-accent-solid)] to-[var(--landing-accent-hover)] px-10 py-4 text-base font-semibold text-white transition-all duration-300 hover:shadow-xl hover:shadow-[var(--landing-card-shadow)] hover:scale-[1.02] active:scale-[0.98]"
            >
              Create Your Free Account
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
            <p className="landing-reveal [animation-delay:300ms] mt-4 text-xs text-[var(--landing-text-faint)]">
              Free forever plan available. No credit card required.
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
