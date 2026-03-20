export const dynamic = 'force-dynamic'

import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LandingWrapper } from '@/components/landing-wrapper'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/home')
  }

  return (
    <LandingWrapper>
    <div className="min-h-dvh bg-[#0A0C0B] text-white overflow-x-hidden">
      {/* ── Ambient glow orbs ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-[#2A5C45]/20 blur-[120px] animate-drift-slow" />
        <div className="absolute top-1/3 -right-60 h-[500px] w-[500px] rounded-full bg-[#6EE7B7]/10 blur-[100px] animate-drift-slow-reverse" />
        <div className="absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full bg-[#F59E0B]/5 blur-[100px] animate-drift-slow" />
      </div>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0A0C0B]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/steward-logo.png"
              alt="Steward"
              width={34}
              height={34}
              className="rounded-lg transition-transform duration-300 group-hover:scale-110"
            />
            <span className="text-xl font-semibold font-[var(--font-serif)] text-[#6EE7B7]">
              Steward
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-8 text-sm text-white/60">
            <a href="#how-it-works" className="hover:text-white transition-colors duration-300">How it Works</a>
            <a href="#use-cases" className="hover:text-white transition-colors duration-300">Use Cases</a>
            <a href="#pricing" className="hover:text-white transition-colors duration-300">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-white/60 hover:text-white transition-colors duration-300"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-[#2A5C45] px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#3A7C5A] hover:shadow-lg hover:shadow-[#2A5C45]/25"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-24 pb-20 md:pt-36 md:pb-32 text-center">
        {/* Status badge */}
        <div className="landing-reveal inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-5 py-2 text-xs font-medium text-white/60 mb-8 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6EE7B7] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6EE7B7]"></span>
          </span>
          Now monitoring the web for thousands of users
        </div>

        <h1 className="landing-reveal [animation-delay:100ms] text-5xl md:text-7xl lg:text-8xl font-bold font-[var(--font-serif)] text-white leading-[1.05] max-w-4xl mx-auto tracking-tight">
          Your AI concierge that{' '}
          <span className="relative">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6EE7B7] via-[#3A7C5A] to-[#6EE7B7] bg-[length:200%_auto] animate-shimmer">
              watches the web
            </span>
          </span>
        </h1>

        <p className="landing-reveal [animation-delay:200ms] mt-8 text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
          Steward monitors prices, restocks, reservations, and availability — then notifies you or acts on your behalf. Never miss a deal again.
        </p>

        <div className="landing-reveal [animation-delay:300ms] mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="group relative w-full sm:w-auto rounded-full bg-gradient-to-r from-[#2A5C45] to-[#3A7C5A] px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:shadow-xl hover:shadow-[#2A5C45]/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Start Watching for Free
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </span>
          </Link>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto rounded-full border border-white/[0.12] bg-white/[0.04] px-8 py-4 text-base font-medium text-white/80 transition-all duration-300 hover:bg-white/[0.08] hover:border-white/[0.2] backdrop-blur-sm"
          >
            See How It Works
          </a>
        </div>

        <p className="landing-reveal [animation-delay:400ms] mt-6 text-xs text-white/30">
          Free plan includes 3 watches · No credit card required
        </p>

        {/* Hero visual — mock dashboard card */}
        <div className="landing-reveal [animation-delay:500ms] mt-20 mx-auto max-w-3xl rounded-2xl border border-white/[0.08] bg-white/[0.03] p-1 backdrop-blur-sm shadow-2xl shadow-black/50 text-left">
          <div className="rounded-xl bg-gradient-to-b from-white/[0.06] to-transparent p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Image src="/steward-logo.png" alt="" width={28} height={28} className="rounded-md" />
              <span className="text-sm font-medium text-white/60">Steward Dashboard</span>
              <span className="ml-auto flex items-center gap-1.5 text-xs text-[#6EE7B7]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6EE7B7] animate-pulse" />
                3 watches active
              </span>
            </div>
            <div className="space-y-3">
              {[
                { emoji: '👟', name: 'Nike Air Max 90', status: 'Price dropped to $89', accent: true, badge: '↓ $41 saved' },
                { emoji: '🏕️', name: 'Yosemite Camp IV', status: 'Checking daily', accent: false, badge: '' },
                { emoji: '🍽️', name: 'Resy — Carbone NYC', status: 'Watching for openings', accent: false, badge: '' },
              ].map((item, i) => (
                <div
                  key={item.name}
                  className={`grid grid-cols-[40px_1fr_auto] items-center gap-3 rounded-xl px-4 py-3 transition-all duration-500 ${
                    item.accent
                      ? 'bg-[#2A5C45]/20 border border-[#2A5C45]/30'
                      : 'bg-white/[0.03] border border-white/[0.06]'
                  } animate-fade-in-up`}
                  style={{ animationDelay: `${700 + i * 150}ms` }}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06] text-xl">{item.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white/90 truncate">{item.name}</p>
                    <p className={`text-xs ${item.accent ? 'text-[#6EE7B7]' : 'text-white/40'}`}>{item.status}</p>
                  </div>
                  {item.badge ? (
                    <span className="text-xs font-semibold text-[#6EE7B7] bg-[#6EE7B7]/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                      {item.badge}
                    </span>
                  ) : <span />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust bar / Stats ── */}
      <section className="relative z-10 border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '24/7', label: 'Web monitoring' },
              { value: '100+', label: 'Supported stores' },
              { value: '<2min', label: 'Alert delivery' },
              { value: '50%', label: 'Avg. yearly savings' },
            ].map((stat, i) => (
              <div key={stat.label} className="landing-reveal" style={{ animationDelay: `${i * 100}ms` }}>
                <p className="text-3xl md:text-4xl font-bold font-[var(--font-serif)] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-white/40">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="relative z-10 border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="text-center mb-20">
            <span className="landing-reveal inline-block text-xs font-semibold tracking-[0.2em] uppercase text-[#6EE7B7]/60 mb-4">How it Works</span>
            <h2 className="landing-reveal [animation-delay:100ms] text-3xl md:text-5xl font-bold font-[var(--font-serif)] text-white">
              Three steps to savings
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: '💬',
                title: 'Tell Steward what to watch',
                desc: 'Paste a URL or describe what you\'re looking for. Our AI sets up the perfect watch in seconds.',
              },
              {
                step: '02',
                icon: '👀',
                title: 'We monitor 24/7',
                desc: 'Steward checks on your schedule — prices, stock, availability, reservations — whatever matters to you.',
              },
              {
                step: '03',
                icon: '🎯',
                title: 'Get notified or we act',
                desc: 'Instant alerts via push, email, or SMS. On Premium, Steward can even add items to your cart.',
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="landing-reveal group relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 transition-all duration-500 hover:bg-white/[0.05] hover:border-white/[0.15] hover:shadow-xl hover:shadow-[#2A5C45]/5"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <span className="text-xs font-mono font-bold text-[#6EE7B7]/40 tracking-wider">{item.step}</span>
                <div className="mt-4 mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] border border-white/[0.08] text-3xl transition-transform duration-300 group-hover:scale-110">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section id="use-cases" className="relative z-10 border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="text-center mb-20">
            <span className="landing-reveal inline-block text-xs font-semibold tracking-[0.2em] uppercase text-[#F59E0B]/60 mb-4">Use Cases</span>
            <h2 className="landing-reveal [animation-delay:100ms] text-3xl md:text-5xl font-bold font-[var(--font-serif)] text-white">
              What can Steward watch?
            </h2>
            <p className="landing-reveal [animation-delay:200ms] mt-4 text-white/40 max-w-xl mx-auto">
              From everyday shopping to hard-to-get reservations — Steward has you covered.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { emoji: '🏷️', title: 'Price Drops', desc: 'Track prices on Amazon, Target, Best Buy, Nike, and any online store.', color: 'from-[#2A5C45]/20 to-transparent' },
              { emoji: '📦', title: 'Restocks', desc: 'Get notified the moment sold-out items are back in stock.', color: 'from-[#1E4A8A]/20 to-transparent' },
              { emoji: '🏕️', title: 'Campsite Availability', desc: 'Watch for campsite openings at popular parks and recreation areas.', color: 'from-[#27AE60]/20 to-transparent' },
              { emoji: '🎫', title: 'Event Tickets', desc: 'Monitor ticket drops and price changes on StubHub and more.', color: 'from-[#F59E0B]/20 to-transparent' },
              { emoji: '✈️', title: 'Flight Prices', desc: 'Track flights on Kayak, Google Flights, and Skyscanner for the best fares.', color: 'from-[#6EE7B7]/15 to-transparent' },
              { emoji: '🍽️', title: 'Restaurant Reservations', desc: 'Watch for Resy openings at your favorite hard-to-book restaurants.', color: 'from-[#C0392B]/15 to-transparent' },
            ].map((item, i) => (
              <div
                key={item.title}
                className="landing-reveal group relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition-all duration-500 hover:bg-white/[0.05] hover:border-white/[0.15] overflow-hidden"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Subtle gradient bg */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10">
                  <span className="text-3xl block mb-4 transition-transform duration-300 group-hover:scale-110">{item.emoji}</span>
                  <h3 className="text-base font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-white/40 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="relative z-10 border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="text-center mb-20">
            <span className="landing-reveal inline-block text-xs font-semibold tracking-[0.2em] uppercase text-[#6EE7B7]/60 mb-4">Pricing</span>
            <h2 className="landing-reveal [animation-delay:100ms] text-3xl md:text-5xl font-bold font-[var(--font-serif)] text-white">
              Simple, transparent pricing
            </h2>
            <p className="landing-reveal [animation-delay:200ms] mt-4 text-white/40 max-w-xl mx-auto">
              Start free and upgrade when you need more.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Free */}
            <div className="landing-reveal rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 flex flex-col transition-all duration-300 hover:border-white/[0.15]">
              <h3 className="text-lg font-semibold font-[var(--font-serif)] text-white">Free</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-sm text-white/30 ml-1">/ forever</span>
              </div>
              <ul className="space-y-3.5 text-sm text-white/50 flex-1">
                {['Up to 3 watches', 'Daily check frequency', 'Push & email notifications', 'AI watch setup assistant'].map(f => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className="text-[#6EE7B7] mt-0.5">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="mt-8 block text-center rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/80 transition-all duration-300 hover:bg-white/[0.08]">
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="landing-reveal [animation-delay:100ms] rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 flex flex-col transition-all duration-300 hover:border-white/[0.15]">
              <h3 className="text-lg font-semibold font-[var(--font-serif)] text-white">Pro</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-white">$4.99</span>
                <span className="text-sm text-white/30 ml-1">/ month</span>
              </div>
              <ul className="space-y-3.5 text-sm text-white/50 flex-1">
                {['Up to 7 watches', 'Check every 12 hours', 'Quick Link actions', 'Price insights & deal alerts', 'SMS notifications'].map(f => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className="text-[#6EE7B7] mt-0.5">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="mt-8 block text-center rounded-full bg-[#2A5C45] px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#3A7C5A] hover:shadow-lg hover:shadow-[#2A5C45]/25">
                Start Pro
              </Link>
              <p className="mt-3 text-center text-xs text-white/30">or $29.99/year (save 50%)</p>
            </div>

            {/* Premium */}
            <div className="landing-reveal [animation-delay:200ms] relative rounded-2xl border-2 border-[#2A5C45] bg-white/[0.02] p-7 flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-[#2A5C45]/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#F5C842] px-4 py-1 text-[10px] font-bold text-[#0A0C0B] tracking-wider">
                BEST VALUE
              </div>
              <h3 className="text-lg font-semibold font-[var(--font-serif)] text-white">Premium</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-white">$9.99</span>
                <span className="text-sm text-white/30 ml-1">/ month</span>
              </div>
              <ul className="space-y-3.5 text-sm text-white/50 flex-1">
                {[
                  { text: 'Up to 15 watches', special: false },
                  { text: 'Check every 2 hours', special: false },
                  { text: 'Steward Acts — auto add to cart', special: true },
                  { text: 'Everything in Pro', special: false },
                  { text: 'Priority support', special: false },
                ].map(f => (
                  <li key={f.text} className="flex items-start gap-2.5">
                    <span className={`mt-0.5 ${f.special ? 'text-[#F59E0B] font-bold' : 'text-[#6EE7B7]'}`}>
                      {f.special ? '✦' : '✓'}
                    </span>
                    <span className={f.special ? 'text-white/80' : ''}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="mt-8 block text-center rounded-full bg-[#2A5C45] px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#3A7C5A] hover:shadow-lg hover:shadow-[#2A5C45]/25">
                Start Premium
              </Link>
              <p className="mt-3 text-center text-xs text-white/30">or $59.99/year (save 50%)</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative z-10 border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32 text-center">
          {/* Glow behind CTA */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-[300px] w-[300px] rounded-full bg-[#2A5C45]/20 blur-[80px]" />
          </div>

          <div className="relative z-10">
            <h2 className="landing-reveal text-4xl md:text-6xl font-bold font-[var(--font-serif)] text-white mb-6">
              Stop overpaying.<br />Start watching.
            </h2>
            <p className="landing-reveal [animation-delay:100ms] text-lg text-white/40 mb-12 max-w-xl mx-auto">
              Set up your first watch in under 30 seconds — our AI assistant does the heavy lifting.
            </p>
            <Link
              href="/signup"
              className="landing-reveal [animation-delay:200ms] inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#6EE7B7] to-[#3A7C5A] px-10 py-4 text-base font-semibold text-[#0A0C0B] transition-all duration-300 hover:shadow-xl hover:shadow-[#6EE7B7]/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              Create Your Free Account
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <Image src="/steward-logo.png" alt="Steward" width={24} height={24} className="rounded-md" />
            <span className="text-sm font-semibold font-[var(--font-serif)] text-[#6EE7B7]">
              Steward
            </span>
            <span className="text-xs text-white/20 ml-1">Your AI Concierge</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <a href="#pricing" className="hover:text-white transition-colors duration-300">Pricing</a>
            <Link href="/login" className="hover:text-white transition-colors duration-300">Sign In</Link>
            <Link href="/signup" className="hover:text-white transition-colors duration-300">Sign Up</Link>
          </div>
          <p className="text-xs text-white/20">
            &copy; {new Date().getFullYear()} Steward. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
    </LandingWrapper>
  )
}
