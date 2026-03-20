'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [smsAlerts, setSmsAlerts] = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (authMethod === 'phone' && !phone) {
      setError('Phone number is required')
      return
    }

    if (authMethod === 'email' && !email) {
      setError('Email is required')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      if (authMethod === 'phone') {
        // Phone signup: create account with phone + password, then verify with OTP
        if (!otpSent) {
          // First, sign up with phone and password
          const { error: signUpError } = await supabase.auth.signUp({
            phone,
            password,
            options: {
              data: {
                display_name: fullName,
                phone_number: phone,
                email: email || undefined,
                sms_alerts: smsAlerts,
                email_alerts: emailAlerts,
              },
            },
          })

          if (signUpError) {
            setError(signUpError.message)
            return
          }

          setOtpSent(true)
          return
        }

        // Verify OTP
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          phone,
          token: otp,
          type: 'sms',
        })

        if (verifyError) {
          setError(verifyError.message)
          return
        }

        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            display_name: fullName,
            phone_number: phone,
            email: email || null,
            sms_alerts: smsAlerts,
            email_alerts: emailAlerts,
          })

          sessionStorage.setItem('steward_just_signed_in', '1')
          router.refresh()
          router.push('/home')
        }
      } else {
        // Email signup
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: fullName,
              phone_number: phone || undefined,
              sms_alerts: smsAlerts,
              email_alerts: emailAlerts,
            },
          },
        })

        if (signUpError) {
          setError(signUpError.message)
          return
        }

        if (data.user && !data.session) {
          setSuccess(true)
          return
        }

        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            display_name: fullName,
            phone_number: phone || null,
            sms_alerts: smsAlerts,
            email_alerts: emailAlerts,
          })

          sessionStorage.setItem('steward_just_signed_in', '1')
          router.refresh()
          router.push('/home')
        }
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

  if (success) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-[#1C3D2E] border border-[#2A5C45]/30 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">📬</div>
          <h2 className="text-2xl font-bold font-[var(--font-serif)] text-[#F7F6F3] mb-3">
            Check your email
          </h2>
          <p className="text-sm text-[#F7F6F3]/60 mb-6">
            We sent a confirmation link to <strong className="text-[#F7F6F3]">{email}</strong>. Click the link to activate your account, then come back and sign in.
          </p>
          <Link
            href="/login"
            className="inline-block w-full rounded-xl bg-[#2A5C45] text-white font-medium px-4 py-3 text-sm transition-opacity hover:opacity-90 text-center"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      {/* Sign In / Create Account tabs */}
      <div className="flex rounded-xl bg-[#1C3D2E]/50 p-1 mb-6">
        <Link
          href="/login"
          className="flex-1 text-center py-2.5 text-sm font-medium rounded-lg text-[#F7F6F3]/50 transition-all duration-200"
        >
          Sign In
        </Link>
        <div className="flex-1 text-center py-2.5 text-sm font-semibold rounded-lg bg-[#2A5C45] text-white">
          Create Account
        </div>
      </div>

      <div className="bg-[#1C3D2E]/40 border border-[#2A5C45]/30 rounded-2xl p-7">
        {/* Phone / Email toggle */}
        <div className="flex rounded-xl bg-[#0F2018] p-1 mb-6">
          <button
            type="button"
            onClick={() => { setAuthMethod('phone'); setError(null); setOtpSent(false) }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              authMethod === 'phone' ? 'bg-[#2A5C45] text-[#6EE7B7]' : 'text-[#F7F6F3]/40'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>
            Phone
          </button>
          <button
            type="button"
            onClick={() => { setAuthMethod('email'); setError(null); setOtpSent(false) }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              authMethod === 'email' ? 'bg-[#2A5C45] text-[#6EE7B7]' : 'text-[#F7F6F3]/40'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
            Email
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Full Name */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-[#6EE7B7]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
            </div>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              className="w-full rounded-xl border border-[#2A5C45]/30 bg-[#0F2018]/50 pl-10 pr-4 py-3 text-sm text-[#F7F6F3] placeholder:text-[#F7F6F3]/25 focus:outline-none focus:border-[#6EE7B7]/40 transition-colors"
            />
          </div>

          {/* Phone Number (primary when phone mode, optional when email mode) */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-[#6EE7B7]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>
            </div>
            <input
              type="tel"
              required={authMethod === 'phone'}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={authMethod === 'phone' ? 'Phone Number' : 'Phone Number (optional, for SMS alerts)'}
              className="w-full rounded-xl border border-[#2A5C45]/30 bg-[#0F2018]/50 pl-10 pr-4 py-3 text-sm text-[#F7F6F3] placeholder:text-[#F7F6F3]/25 focus:outline-none focus:border-[#6EE7B7]/40 transition-colors"
            />
          </div>

          {/* Email (primary when email mode, optional when phone mode) */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-[#6EE7B7]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
            </div>
            <input
              type="email"
              required={authMethod === 'email'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={authMethod === 'email' ? 'Email' : 'Email (optional, for alerts)'}
              className="w-full rounded-xl border border-[#2A5C45]/30 bg-[#0F2018]/50 pl-10 pr-4 py-3 text-sm text-[#F7F6F3] placeholder:text-[#F7F6F3]/25 focus:outline-none focus:border-[#6EE7B7]/40 transition-colors"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-[#6EE7B7]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
            </div>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              className="w-full rounded-xl border border-[#2A5C45]/30 bg-[#0F2018]/50 pl-10 pr-4 py-3 text-sm text-[#F7F6F3] placeholder:text-[#F7F6F3]/25 focus:outline-none focus:border-[#6EE7B7]/40 transition-colors"
            />
          </div>

          {/* OTP input (phone mode, after OTP sent) */}
          {authMethod === 'phone' && otpSent && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-[#6EE7B7]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" /></svg>
              </div>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter verification code"
                maxLength={6}
                className="w-full rounded-xl border border-[#6EE7B7]/30 bg-[#0F2018]/50 pl-10 pr-4 py-3 text-sm text-[#F7F6F3] placeholder:text-[#F7F6F3]/25 focus:outline-none focus:border-[#6EE7B7]/40 transition-colors"
              />
            </div>
          )}

          {/* Alert preferences */}
          <div className="flex flex-col gap-3 mt-1">
            <label className="flex items-center gap-3 cursor-pointer group">
              <button
                type="button"
                role="switch"
                aria-checked={smsAlerts}
                onClick={() => setSmsAlerts(!smsAlerts)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                  smsAlerts ? 'bg-[#6EE7B7]' : 'bg-[#2A5C45]/50'
                }`}
              >
                <span className={`inline-block h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  smsAlerts ? 'translate-x-[22px]' : 'translate-x-[2px]'
                }`} />
              </button>
              <span className={`flex items-center gap-2 text-sm transition-colors ${smsAlerts ? 'text-[#6EE7B7]' : 'text-[#F7F6F3]/40'}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>
                SMS alerts
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <button
                type="button"
                role="switch"
                aria-checked={emailAlerts}
                onClick={() => setEmailAlerts(!emailAlerts)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                  emailAlerts ? 'bg-[#6EE7B7]' : 'bg-[#2A5C45]/50'
                }`}
              >
                <span className={`inline-block h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  emailAlerts ? 'translate-x-[22px]' : 'translate-x-[2px]'
                }`} />
              </button>
              <span className={`flex items-center gap-2 text-sm transition-colors ${emailAlerts ? 'text-[#6EE7B7]' : 'text-[#F7F6F3]/40'}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
                Email alerts
              </span>
            </label>
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
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" /></svg>
            {loading
              ? (otpSent ? 'Verifying...' : 'Creating account...')
              : (otpSent ? 'Verify Code' : 'Create Account')
            }
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

        <p className="mt-5 text-center text-xs text-[#F7F6F3]/30">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="text-[#6EE7B7]/50 hover:underline">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-[#6EE7B7]/50 hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
