export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[var(--color-bg)] px-6">
      <div className="text-center max-w-md">
        <span className="text-6xl mb-6 block">🏠</span>

        <h1 className="text-4xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-3">
          Steward
        </h1>

        <p className="text-lg text-[var(--color-ink-mid)] mb-10">
          Watch the web for you
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] text-white font-medium px-6 py-3 text-base transition-opacity hover:opacity-90"
          >
            Get Started
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center justify-center text-[var(--color-accent)] font-medium text-sm hover:underline"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
