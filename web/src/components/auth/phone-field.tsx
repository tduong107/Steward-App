'use client'

/**
 * PhoneField — international phone-number input for the auth pages.
 *
 * Two parts side by side:
 *   1. Country picker — flag + dial code, opens native <select>
 *      dropdown (accessible by default, keyboard-navigable).
 *   2. Local-number text input — digits only.
 *
 * Parent component owns the `country` and `localNumber` state and
 * derives the E.164 string via `buildE164(country, localNumber)`.
 *
 * Why a native <select> instead of a custom dropdown:
 *   - Keyboard navigation, screen reader semantics, mobile-native
 *     bottom-sheet picker on iOS — all free.
 *   - The visible "trigger" is still styled to look like the rest
 *     of the auth UI; only the open-state list uses the OS-native
 *     dropdown chrome.
 */

import type { ChangeEvent } from 'react'
import { COUNTRIES, type Country } from '@/lib/countries'

interface PhoneFieldProps {
  country: Country
  onCountryChange: (country: Country) => void
  localNumber: string
  onLocalNumberChange: (digits: string) => void
  /** Optional id for the local-number input, for label association. */
  id?: string
  /** Optional autocomplete hint. */
  autoComplete?: string
  /** Disable both controls (e.g., during submit). */
  disabled?: boolean
}

export function PhoneField({
  country,
  onCountryChange,
  localNumber,
  onLocalNumberChange,
  id = 'phone-local',
  autoComplete = 'tel-national',
  disabled = false,
}: PhoneFieldProps) {
  const handleCountryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const next = COUNTRIES.find((c) => c.code === e.target.value)
    if (next) onCountryChange(next)
  }

  const handleLocalChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Strip everything except digits — Supabase wants raw digits combined
    // with the dial code into E.164. We allow the user to type spaces /
    // dashes / parens for readability but drop them on the way out.
    const digits = e.target.value.replace(/\D/g, '')
    onLocalNumberChange(digits)
  }

  return (
    <div className="flex gap-2 items-stretch">
      {/* Country picker — styled wrapper around a native <select>. The
          wrapper shows the chosen flag + dial code; the actual <select>
          sits invisibly on top to capture clicks. */}
      <div className="relative flex items-center rounded-xl border border-[#2A5C45]/30 bg-[#0F2018]/50 px-3 transition-colors focus-within:border-[#6EE7B7]/40">
        <span className="text-base mr-2 leading-none" aria-hidden="true">
          {country.flag}
        </span>
        <span className="text-sm text-[#F7F6F3]/70 select-none">{country.dial}</span>
        <span className="text-[#F7F6F3]/30 ml-1 text-xs select-none" aria-hidden="true">
          ▾
        </span>
        <select
          aria-label="Country"
          value={country.code}
          onChange={handleCountryChange}
          disabled={disabled}
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name} ({c.dial})
            </option>
          ))}
        </select>
      </div>

      {/* Local number input */}
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        value={localNumber}
        onChange={handleLocalChange}
        placeholder="Phone number"
        disabled={disabled}
        className="flex-1 rounded-xl border border-[#2A5C45]/30 bg-[#0F2018]/50 px-4 py-3 text-sm text-[#F7F6F3] placeholder:text-[#F7F6F3]/25 focus:outline-none focus:border-[#6EE7B7]/40 transition-colors disabled:opacity-60"
      />
    </div>
  )
}
