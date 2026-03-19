'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      // If email confirmation is required, user.identities will be empty
      // or the session will be null
      if (data.user && !data.session) {
        // Email confirmation is enabled — show success message
        setSuccess(true)
        return
      }

      if (data.user) {
        // Create profile (auto-confirmed, session exists)
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ id: data.user.id, display_name: displayName })

        if (profileError) {
          console.error('Failed to create profile:', profileError.message)
        }

        router.refresh()
        router.push('/home')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-8 text-center">
          <div className="text-4xl mb-4">📬</div>
          <h1 className="text-2xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-3">
            Check your email
          </h1>
          <p className="text-sm text-[var(--color-ink-mid)] mb-6">
            We sent a confirmation link to <strong className="text-[var(--color-ink)]">{email}</strong>. Click the link to activate your account, then come back and sign in.
          </p>
          <Link
            href="/login"
            className="inline-block w-full rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-white font-medium px-4 py-2.5 text-sm transition-opacity hover:opacity-90 text-center"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-8">
        <h1 className="text-2xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-6 text-center">
          Create your account
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-[var(--color-ink-mid)] mb-1.5">
              Display name
            </label>
            <input
              id="displayName"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--color-ink-mid)] mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--color-ink-mid)] mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-sm text-[var(--color-red)] bg-[var(--color-red-light)] rounded-[var(--radius-sm)] px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-white font-medium px-4 py-2.5 text-sm transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-ink-mid)]">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--color-accent)] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
