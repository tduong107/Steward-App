'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function SupportPage() {
  const [form, setForm] = useState({ name: '', email: '', category: 'general', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Something went wrong')
      }

      setStatus('success')
      setForm({ name: '', email: '', category: 'general', message: '' })
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <div className="min-h-dvh bg-[var(--landing-bg)] text-[var(--landing-text)] overflow-x-hidden transition-colors duration-300">
      {/* Nav */}
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
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm font-medium text-[var(--landing-text-mid)] hover:text-[var(--landing-text)] transition-colors duration-300"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="relative z-10 mx-auto max-w-2xl px-6 py-24 md:py-32">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold font-[var(--font-serif)] text-[var(--landing-text)] mb-4">
            Get in Touch
          </h1>
          <p className="text-[var(--landing-text-mid)] max-w-lg mx-auto">
            Have a question, found a bug, or want to request a feature? We&apos;d love to hear from you
          </p>
        </div>

        {status === 'success' ? (
          <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-card)] p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--landing-accent-solid)]/15 mx-auto mb-6">
              <svg className="w-8 h-8 text-[var(--landing-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold font-[var(--font-serif)] text-[var(--landing-text)] mb-3">
              Message sent
            </h2>
            <p className="text-[var(--landing-text-mid)] mb-8">
              Thanks for reaching out. We&apos;ll get back to you as soon as possible
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface)] px-6 py-3 text-sm font-medium text-[var(--landing-text-mid)] transition-all duration-300 hover:bg-[var(--landing-surface-hover)]"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-card)] p-8 md:p-10 space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[var(--landing-text-mid)] mb-2">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-[var(--landing-border)] bg-[var(--landing-surface)] px-4 py-3 text-sm text-[var(--landing-text)] placeholder:text-[var(--landing-text-faint)] focus:outline-none focus:border-[var(--landing-accent-solid)] transition-colors duration-300"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--landing-text-mid)] mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-[var(--landing-border)] bg-[var(--landing-surface)] px-4 py-3 text-sm text-[var(--landing-text)] placeholder:text-[var(--landing-text-faint)] focus:outline-none focus:border-[var(--landing-accent-solid)] transition-colors duration-300"
                />
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-[var(--landing-text-mid)] mb-2">
                Category
              </label>
              <select
                id="category"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full rounded-xl border border-[var(--landing-border)] bg-[var(--landing-surface)] px-4 py-3 text-sm text-[var(--landing-text)] focus:outline-none focus:border-[var(--landing-accent-solid)] transition-colors duration-300 appearance-none"
              >
                <option value="general">General Question</option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="billing">Billing</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-[var(--landing-text-mid)] mb-2">
                Message
              </label>
              <textarea
                id="message"
                required
                rows={5}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Tell us what's on your mind..."
                className="w-full rounded-xl border border-[var(--landing-border)] bg-[var(--landing-surface)] px-4 py-3 text-sm text-[var(--landing-text)] placeholder:text-[var(--landing-text-faint)] focus:outline-none focus:border-[var(--landing-accent-solid)] transition-colors duration-300 resize-none"
              />
            </div>

            {status === 'error' && (
              <div className="rounded-xl bg-[var(--landing-surface)] border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {errorMsg || 'Something went wrong. Please try again'}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full rounded-full bg-[var(--landing-accent-solid)] px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-[var(--landing-accent-hover)] hover:shadow-lg hover:shadow-[var(--landing-card-shadow)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'sending' ? 'Sending...' : 'Send Message'}
            </button>

            <p className="text-center text-xs text-[var(--landing-text-faint)]">
              You can also email us directly at{' '}
              <a href="mailto:tienduong107@gmail.com" className="text-[var(--landing-accent)] hover:underline">
                tienduong107@gmail.com
              </a>
            </p>
          </form>
        )}
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--landing-border)]">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <Image src="/steward-logo.png" alt="Steward" width={24} height={24} className="rounded-md" />
            <span className="text-sm font-semibold font-[var(--font-serif)] text-[var(--landing-accent)]">
              Steward
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-[var(--landing-text-faint)]">
            <Link href="/privacy" className="hover:text-[var(--landing-text)] transition-colors duration-300">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[var(--landing-text)] transition-colors duration-300">Terms of Service</Link>
            <span>&copy; {new Date().getFullYear()} Steward</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
