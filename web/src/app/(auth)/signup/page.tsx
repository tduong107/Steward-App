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
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({ id: data.user.id, display_name: displayName })

        if (profileError) {
          console.error('Failed to create profile:', profileError.message)
        }
      }

      router.refresh()
      router.push('/dashboard')
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
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
