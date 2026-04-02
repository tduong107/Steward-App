'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('1') && digits.length === 11) return `+${digits}`
  if (digits.length === 10) return `+1${digits}`
  return `+${digits}`
}

function formatDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

const INPUT_CLS =
  'w-full rounded-xl border border-[#2A5C45]/30 bg-[#0F2018]/50 px-4 py-3 text-sm text-[#F7F6F3] placeholder:text-[#F7F6F3]/25 focus:outline-none focus:border-[#6EE7B7]/40 transition-colors'

type Step = 'phone' | 'otp' | 'newPassword'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const e164 = toE164(phone)

  // Step 1 — send OTP
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
      setStep('otp')
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2 — verify OTP (creates a session so we can update password)
  async function handleVerifyOtp(e: React.FormEvent) {
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
      setStep('newPassword')
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 3 — set new password
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) { setError(updateError.message); return }

      // Password updated — go to home
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

  return (
    <div className="w-full max-w-sm">
      <div className="bg-[#1C3D2E]/40 border border-[#2A5C45]/30 rounded-2xl p-7">

        {/* Back to login */}
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-sm text-[#F7F6F3]/40 hover:text-[#F7F6F3]/70 transition-colors mb-6"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Sign In
        </Link>

        {/* ── Step 1: Phone ── */}
        {step === 'phone' && (
          <>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-[#F7F6F3] mb-1">Reset your password</h2>
              <p className="text-sm text-[#F7F6F3]/40">Enter your phone number and we'll text you a verification code</p>
            </div>

            <form onSubmit={handleSendCode} className="flex flex-col gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6EE7B7]/40">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                </div>
                <span className="absolute inset-y-0 left-9 flex items-center text-sm text-[#F7F6F3]/30 select-none pointer-events-none">+1</span>
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

              {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-xl px-3 py-2.5">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2A5C45] text-[#6EE7B7] font-medium px-4 py-3.5 text-sm transition-all duration-200 hover:bg-[#3A7C5A] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Spinner /> : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                  </svg>
                )}
                {loading ? 'Sending code...' : 'Send Verification Code'}
              </button>
            </form>
          </>
        )}

        {/* ── Step 2: OTP ── */}
        {step === 'otp' && (
          <>
            <div className="mb-5">
              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); setError(null) }}
                className="flex items-center gap-1.5 text-sm text-[#F7F6F3]/40 hover:text-[#F7F6F3]/70 transition-colors mb-4"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                Back
              </button>
              <h2 className="text-lg font-semibold text-[#F7F6F3] mb-1">Check your texts</h2>
              <p className="text-sm text-[#F7F6F3]/40">
                Code sent to <span className="text-[#F7F6F3]/70">+1 {phone}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
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

              {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-xl px-3 py-2.5">{error}</p>}

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2A5C45] text-[#6EE7B7] font-medium px-4 py-3.5 text-sm transition-all duration-200 hover:bg-[#3A7C5A] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Spinner /> : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                )}
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-sm text-[#6EE7B7]/50 hover:text-[#6EE7B7] transition-colors text-center py-1 disabled:opacity-50"
              >
                {resending ? 'Sending...' : resent ? '✓ Code resent!' : "Didn't get it? Resend code"}
              </button>
            </form>
          </>
        )}

        {/* ── Step 3: New Password ── */}
        {step === 'newPassword' && (
          <>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-[#F7F6F3] mb-1">Set a new password</h2>
              <p className="text-sm text-[#F7F6F3]/40">Choose a strong password for your account</p>
            </div>

            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              {/* New password */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6EE7B7]/40">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="New password (min 6 characters)"
                  autoComplete="new-password"
                  className={`${INPUT_CLS} pl-10 pr-10`}
                />
                <EyeToggle show={showNew} onToggle={() => setShowNew(v => !v)} />
              </div>

              {/* Confirm password */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6EE7B7]/40">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  className={`${INPUT_CLS} pl-10 pr-10`}
                />
                <EyeToggle show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
              </div>

              {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-xl px-3 py-2.5">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2A5C45] text-[#6EE7B7] font-medium px-4 py-3.5 text-sm transition-all duration-200 hover:bg-[#3A7C5A] disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {loading ? <Spinner /> : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                )}
                {loading ? 'Saving...' : 'Save New Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// ── Shared small components ───────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  )
}

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      tabIndex={-1}
      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#F7F6F3]/25 hover:text-[#F7F6F3]/50 transition-colors"
    >
      {show ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      )}
    </button>
  )
}
