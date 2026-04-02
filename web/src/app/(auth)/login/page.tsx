'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// Format raw phone input to E.164 for Supabase (+1XXXXXXXXXX)
function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('1') && digits.length === 11) return `+${digits}`
  if (digits.length === 10) return `+1${digits}`
  return `+${digits}`
}

// Format for display: (123) 456-7890
function formatDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

const INPUT_CLS =
  'w-full rounded-xl border border-[#2A5C45]/30 bg-[#0F2018]/50 pl-10 pr-4 py-3 text-sm text-[#F7F6F3] placeholder:text-[#F7F6F3]/25 focus:outline-none focus:border-[#6EE7B7]/40 transition-colors'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')           // display value
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const e164 = toE164(phone)

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) { setError('Please enter a valid 10-digit US phone number'); return }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: otpError } = await supabase.auth.signInWithOtp({ phone: e164 })
      if (otpError) { setError(otpError.message); return }
      setOtpSent(true)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (otp.length < 6) { setError('Please enter the 6-digit code'); return }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: e164,
        token: otp,
        type: 'sms',
      })

      if (verifyError) { setError(verifyError.message); return }

      sessionStorage.setItem('steward_just_signed_in', '1')
      router.refresh()
      router.push('/home')
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resending) return
    setResending(true)
    setResent(false)
    setError(null)
    try {
      const supabase = createClient()
      const { error: otpError } = await supabase.auth.signInWithOtp({ phone: e164 })
      if (otpError) { setError(otpError.message) }
      else { setResent(true); setTimeout(() => setResent(false), 5000) }
    } catch {
      setError('Failed to resend. Please try again.')
    } finally {
      setResending(false)
    }
  }

  async function handleAppleSignIn() {
    setError(null)
    setOauthLoading(true)
    try {
      const supabase = createClient()
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (oauthError) { setError(oauthError.message); setOauthLoading(false) }
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

        {!otpSent ? (
          /* ── Step 1: Enter Phone ── */
          <>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-[#F7F6F3] mb-1">Welcome back</h2>
              <p className="text-sm text-[#F7F6F3]/40">Enter your phone number to sign in</p>
            </div>

            <form onSubmit={handleSendCode} className="flex flex-col gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6EE7B7]/40">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                </div>
                {/* Country code badge */}
                <span className="absolute inset-y-0 left-9 flex items-center text-sm text-[#F7F6F3]/30 select-none pointer-events-none">
                  +1
                </span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(formatDisplay(e.target.value))}
                  placeholder="(555) 000-0000"
                  autoComplete="tel-national"
                  className={`${INPUT_CLS} pl-16`}
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-400/10 rounded-xl px-3 py-2.5">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2A5C45] text-[#6EE7B7] font-medium px-4 py-3.5 text-sm transition-all duration-200 hover:bg-[#3A7C5A] disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                  </svg>
                )}
                {loading ? 'Sending code...' : 'Send Verification Code'}
              </button>
            </form>
          </>
        ) : (
          /* ── Step 2: Enter OTP ── */
          <>
            <div className="mb-5">
              <button
                type="button"
                onClick={() => { setOtpSent(false); setOtp(''); setError(null) }}
                className="flex items-center gap-1.5 text-sm text-[#F7F6F3]/40 hover:text-[#F7F6F3]/70 transition-colors mb-4"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                Back
              </button>
              <h2 className="text-lg font-semibold text-[#F7F6F3] mb-1">Check your texts</h2>
              <p className="text-sm text-[#F7F6F3]/40">
                We sent a 6-digit code to <span className="text-[#F7F6F3]/70">+1 {phone}</span>
              </p>
            </div>

            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                autoComplete="one-time-code"
                className="w-full rounded-xl border border-[#6EE7B7]/20 bg-[#0F2018]/50 px-4 py-4 text-2xl text-center tracking-[0.6em] text-[#F7F6F3] placeholder:text-[#F7F6F3]/15 focus:outline-none focus:border-[#6EE7B7]/50 transition-colors font-mono"
              />

              {error && (
                <p className="text-sm text-red-400 bg-red-400/10 rounded-xl px-3 py-2.5">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2A5C45] text-[#6EE7B7] font-medium px-4 py-3.5 text-sm transition-all duration-200 hover:bg-[#3A7C5A] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                )}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-sm text-[#6EE7B7]/50 hover:text-[#6EE7B7] transition-colors text-center py-1 disabled:opacity-50"
              >
                {resending ? 'Sending...' : resent ? '✓ Code resent!' : 'Didn\'t get it? Resend code'}
              </button>
            </form>
          </>
        )}

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
          {oauthLoading ? 'Redirecting...' : 'Continue with Apple'}
        </button>
      </div>
    </div>
  )
}
