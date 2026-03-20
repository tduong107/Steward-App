'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      if (authMethod === 'phone') {
        // Phone login with password
        const { error: signInError } = await supabase.auth.signInWithPassword({
          phone,
          password,
        })

        if (signInError) {
          setError(signInError.message)
          return
        }

        sessionStorage.setItem('steward_just_signed_in', '1')
        router.refresh()
        router.push('/home')
      } else {
        // Email login
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          setError(signInError.message)
          return
        }

        sessionStorage.setItem('steward_just_signed_in', '1')
        router.refresh()
        router.push('/home')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAppleSignIn() {
    setError(null)
    setOauthLoading(true)

    try {
      const supabase = createClient()
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (oauthError) {
        setError(oauthError.message)
        setOauthLoading(false)
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setOauthLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Sign In / Create Account tabs */}
      <div className="flex rounded-xl bg-[#1C3D2E]/50 p-1 mb-6">
        <div className="flex-1 text-center py-2.5 text-sm font-semibold rounded-lg bg-[#2A5C45] text-white">
          Sign In
        </div>
        <Link
          href="/signup"
          className="flex-1 text-center py-2.5 text-sm font-medium rounded-lg text-[#F7F6F3]/50 transition-all duration-200"
        >
          Create Account
        </Link>
      </div>

      <div className="bg-[#1C3D2E]/40 border border-[#2A5C45]/30 rounded-2xl p-7">
        {/* Phone / Email toggle */}
        <div className="flex rounded-xl bg-[#0F2018] p-1 mb-6">
          <button
            type="button"
            onClick={() => { setAuthMethod('phone'); setError(null) }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              authMethod === 'phone' ? 'bg-[#2A5C45] text-[#6EE7B7]' : 'text-[#F7F6F3]/40'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>
            Phone
          </button>
          <button
            type="button"
            onClick={() => { setAuthMethod('email'); setError(null) }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              authMethod === 'email' ? 'bg-[#2A5C45] text-[#6EE7B7]' : 'text-[#F7F6F3]/40'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
            Email
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {authMethod === 'phone' ? (
            <>
              {/* Phone Number */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-[#6EE7B7]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="w-full rounded-xl border border-[#2A5C45]/30 bg-[#0F2018]/50 pl-10 pr-4 py-3 text-sm text-[#F7F6F3] placeholder:text-[#F7F6F3]/25 focus:outline-none focus:border-[#6EE7B7]/40 transition-colors"
                />
              </div>
            </>
          ) : (
            <>
              {/* Email */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-[#6EE7B7]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full rounded-xl border border-[#2A5C45]/30 bg-[#0F2018]/50 pl-10 pr-4 py-3 text-sm text-[#F7F6F3] placeholder:text-[#F7F6F3]/25 focus:outline-none focus:border-[#6EE7B7]/40 transition-colors"
                />
              </div>
            </>
          )}

          {/* Password (shown for both phone and email) */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-[#6EE7B7]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-[#2A5C45]/30 bg-[#0F2018]/50 pl-10 pr-4 py-3 text-sm text-[#F7F6F3] placeholder:text-[#F7F6F3]/25 focus:outline-none focus:border-[#6EE7B7]/40 transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 rounded-xl px-3 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2A5C45] text-[#6EE7B7] font-medium px-4 py-3.5 text-sm transition-all duration-200 hover:bg-[#3A7C5A] disabled:opacity-50 disabled:cursor-not-allowed mt-1"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#2A5C45]/30" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#152E21] px-3 text-[#F7F6F3]/30">or</span>
          </div>
        </div>

        {/* Apple Sign In */}
        <button
          type="button"
          onClick={handleAppleSignIn}
          disabled={oauthLoading}
          className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-white px-4 py-3.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          {oauthLoading ? 'Redirecting...' : 'Sign in with Apple'}
        </button>
      </div>
    </div>
  )
}
