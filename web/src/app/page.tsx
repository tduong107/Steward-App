export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/home')
  }

  return (
    <div className="min-h-dvh bg-[var(--color-bg)]">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            <span className="text-xl font-semibold font-[var(--font-serif)] text-[var(--color-accent)]">
              Steward
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--color-ink-mid)] hover:text-[var(--color-ink)] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-16 md:pt-32 md:pb-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-light)] px-4 py-1.5 text-xs font-semibold text-[var(--color-accent)] mb-6">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-mint)] animate-pulse-dot" />
          Now monitoring the web for thousands of users
        </div>

        <h1 className="text-4xl md:text-6xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] leading-tight max-w-3xl mx-auto">
          Your personal web watcher that{' '}
          <span className="text-[var(--color-accent)]">saves you money</span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-[var(--color-ink-mid)] max-w-2xl mx-auto leading-relaxed">
          Steward monitors websites for price drops, restocks, and availability changes — then notifies you or acts on your behalf. Never miss a deal again.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto rounded-[var(--radius-lg)] bg-[var(--color-accent)] px-8 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
          >
            Start Watching for Free
          </Link>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-card)] px-8 py-3.5 text-base font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-bg-deep)]"
          >
            See How It Works
          </a>
        </div>

        <p className="mt-4 text-xs text-[var(--color-ink-light)]">
          Free plan includes 3 watches. No credit card required.
        </p>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="border-t border-[var(--color-border)] bg-[var(--color-bg-card)]">
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
          <h2 className="text-center text-3xl md:text-4xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
            How Steward works
          </h2>
          <p className="text-center text-[var(--color-ink-mid)] mb-16 max-w-xl mx-auto">
            Three simple steps to never miss a deal, restock, or price drop again.
          </p>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent-light)] mb-5">
                <span className="text-3xl">💬</span>
              </div>
              <h3 className="text-lg font-semibold font-[var(--font-serif)] text-[var(--color-ink)] mb-2">
                1. Tell Steward what to watch
              </h3>
              <p className="text-sm text-[var(--color-ink-mid)] leading-relaxed">
                Paste a URL or describe what you&apos;re looking for in plain language. Our AI assistant helps you set up the perfect watch in seconds.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-gold-light)] mb-5">
                <span className="text-3xl">👀</span>
              </div>
              <h3 className="text-lg font-semibold font-[var(--font-serif)] text-[var(--color-ink)] mb-2">
                2. Steward monitors 24/7
              </h3>
              <p className="text-sm text-[var(--color-ink-mid)] leading-relaxed">
                We check websites on your schedule — from daily to every 2 hours. Price tracking, stock monitoring, availability checks, and more.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-green-light)] mb-5">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold font-[var(--font-serif)] text-[var(--color-ink)] mb-2">
                3. Get notified or let us act
              </h3>
              <p className="text-sm text-[var(--color-ink-mid)] leading-relaxed">
                Receive instant alerts via push, email, or SMS. On Premium, Steward can even add items to your cart automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
          <h2 className="text-center text-3xl md:text-4xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
            What can Steward watch?
          </h2>
          <p className="text-center text-[var(--color-ink-mid)] mb-16 max-w-xl mx-auto">
            From everyday shopping to hard-to-get reservations — Steward has you covered.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { emoji: '🏷️', title: 'Price Drops', desc: 'Track prices on Amazon, Target, Best Buy, Nike, and any online store.' },
              { emoji: '📦', title: 'Restocks', desc: 'Get notified the moment sold-out items are back in stock.' },
              { emoji: '🏕️', title: 'Campsite Availability', desc: 'Watch for campsite openings at popular parks and recreation areas.' },
              { emoji: '🎫', title: 'Event Tickets', desc: 'Monitor ticket drops and price changes on StubHub and more.' },
              { emoji: '✈️', title: 'Flight Prices', desc: 'Track flights on Kayak, Google Flights, and Skyscanner for the best fares.' },
              { emoji: '🍽️', title: 'Restaurant Reservations', desc: 'Watch for Resy openings at your favorite hard-to-book restaurants.' },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 transition-colors hover:border-[var(--color-accent-mid)]"
              >
                <span className="text-2xl block mb-3">{item.emoji}</span>
                <h3 className="text-base font-semibold text-[var(--color-ink)] mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-[var(--color-ink-mid)] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="border-t border-[var(--color-border)] bg-[var(--color-bg-card)]">
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
          <h2 className="text-center text-3xl md:text-4xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-center text-[var(--color-ink-mid)] mb-16 max-w-xl mx-auto">
            Start free and upgrade when you need more. All plans include AI-powered watch setup.
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Free */}
            <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg)] p-6 flex flex-col">
              <h3 className="text-lg font-semibold font-[var(--font-serif)] text-[var(--color-ink)]">
                Free
              </h3>
              <div className="mt-3 mb-5">
                <span className="text-4xl font-bold text-[var(--color-ink)]">$0</span>
                <span className="text-sm text-[var(--color-ink-light)]"> / forever</span>
              </div>
              <ul className="space-y-3 text-sm text-[var(--color-ink-mid)] flex-1">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-green)] mt-0.5">&#10003;</span>
                  Up to 3 watches
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-green)] mt-0.5">&#10003;</span>
                  Daily check frequency
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-green)] mt-0.5">&#10003;</span>
                  Push & email notifications
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-green)] mt-0.5">&#10003;</span>
                  AI watch setup assistant
                </li>
              </ul>
              <Link
                href="/signup"
                className="mt-6 block text-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2.5 text-sm font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-bg-deep)]"
              >
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg)] p-6 flex flex-col">
              <h3 className="text-lg font-semibold font-[var(--font-serif)] text-[var(--color-ink)]">
                Pro
              </h3>
              <div className="mt-3 mb-5">
                <span className="text-4xl font-bold text-[var(--color-ink)]">$4.99</span>
                <span className="text-sm text-[var(--color-ink-light)]"> / month</span>
              </div>
              <ul className="space-y-3 text-sm text-[var(--color-ink-mid)] flex-1">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-green)] mt-0.5">&#10003;</span>
                  Up to 7 watches
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-green)] mt-0.5">&#10003;</span>
                  Check every 12 hours
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-green)] mt-0.5">&#10003;</span>
                  Quick Link actions
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-green)] mt-0.5">&#10003;</span>
                  Price insights & deal alerts
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-green)] mt-0.5">&#10003;</span>
                  SMS notifications
                </li>
              </ul>
              <Link
                href="/signup"
                className="mt-6 block text-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Start Pro
              </Link>
              <p className="mt-2 text-center text-xs text-[var(--color-ink-light)]">
                or $29.99/year (save 50%)
              </p>
            </div>

            {/* Premium */}
            <div className="relative rounded-[var(--radius-xl)] border-2 border-[var(--color-accent)] bg-[var(--color-bg)] p-6 flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-gold)] px-3 py-0.5 text-xs font-bold text-white">
                BEST VALUE
              </div>
              <h3 className="text-lg font-semibold font-[var(--font-serif)] text-[var(--color-ink)]">
                Premium
              </h3>
              <div className="mt-3 mb-5">
                <span className="text-4xl font-bold text-[var(--color-ink)]">$9.99</span>
                <span className="text-sm text-[var(--color-ink-light)]"> / month</span>
              </div>
              <ul className="space-y-3 text-sm text-[var(--color-ink-mid)] flex-1">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-green)] mt-0.5">&#10003;</span>
                  Up to 15 watches
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-green)] mt-0.5">&#10003;</span>
                  Check every 2 hours
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-0.5 font-bold">&#10038;</span>
                  <span className="text-[var(--color-ink)]">Steward Acts — auto add to cart</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-green)] mt-0.5">&#10003;</span>
                  Everything in Pro
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-green)] mt-0.5">&#10003;</span>
                  Priority support
                </li>
              </ul>
              <Link
                href="/signup"
                className="mt-6 block text-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Start Premium
              </Link>
              <p className="mt-2 text-center text-xs text-[var(--color-ink-light)]">
                or $59.99/year (save 50%)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social Proof / Stats ── */}
      <section className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '24/7', label: 'Web monitoring' },
              { value: '100+', label: 'Supported stores' },
              { value: '<2min', label: 'Alert delivery' },
              { value: '50%', label: 'Avg. savings on yearly' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl md:text-3xl font-bold font-[var(--font-serif)] text-[var(--color-accent)]">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-[var(--color-ink-mid)]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="border-t border-[var(--color-border)] bg-[var(--color-deep-forest)]">
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-28 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-[var(--font-serif)] text-white mb-4">
            Stop overpaying. Start watching.
          </h2>
          <p className="text-lg text-[var(--color-mint)] mb-10 max-w-xl mx-auto">
            Set up your first watch in under 30 seconds — our AI assistant does the heavy lifting for you.
          </p>
          <Link
            href="/signup"
            className="inline-flex rounded-[var(--radius-lg)] bg-[var(--color-mint)] px-8 py-3.5 text-base font-semibold text-[var(--color-deep-forest)] transition-opacity hover:opacity-90"
          >
            Create Your Free Account
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-card)]">
        <div className="mx-auto max-w-5xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏠</span>
            <span className="text-sm font-semibold font-[var(--font-serif)] text-[var(--color-accent)]">
              Steward
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[var(--color-ink-mid)]">
            <a href="#pricing" className="hover:text-[var(--color-ink)] transition-colors">
              Pricing
            </a>
            <Link href="/login" className="hover:text-[var(--color-ink)] transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="hover:text-[var(--color-ink)] transition-colors">
              Sign Up
            </Link>
          </div>
          <p className="text-xs text-[var(--color-ink-light)]">
            &copy; {new Date().getFullYear()} Steward. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
