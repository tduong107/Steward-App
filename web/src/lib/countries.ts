/**
 * Country list for the auth phone-input picker.
 *
 * Curated subset (~50 entries) of countries where Twilio reliably
 * delivers SMS one-time-codes for Supabase phone auth. We prioritize
 * Steward's actual / likely market base: US/Canada, EU, LATAM,
 * APAC, English-speaking commonwealth, and a few high-traffic
 * Middle East + Africa entries.
 *
 * Excluded:
 * - Countries requiring sender-ID pre-registration we haven't done
 *   (e.g., India DLT, Indonesia masking).
 * - Sanctioned / unreachable regions.
 * - Microstates with negligible likelihood of relevance.
 *
 * If users from outside this list show up, they can still be added
 * here without any backend work — the data flows straight through to
 * Supabase / Twilio as the E.164 string `dial + localNumber`.
 *
 * Order: US first (default), then alphabetical by `name`.
 */

export interface Country {
  /** ISO 3166-1 alpha-2 country code (`'US'`, `'GB'`, `'ES'`). Used as React key. */
  code: string
  /** Human-readable country name. Shown in the dropdown list. */
  name: string
  /** E.164 dial code with leading `+` (`'+1'`, `'+44'`, `'+34'`). Concatenated with local digits to build the full number. */
  dial: string
  /** Country flag emoji. Decorative; falls back gracefully on platforms without emoji. */
  flag: string
}

export const COUNTRIES: ReadonlyArray<Country> = [
  // Default first
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  // Alphabetical
  { code: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { code: 'AT', name: 'Austria', dial: '+43', flag: '🇦🇹' },
  { code: 'BE', name: 'Belgium', dial: '+32', flag: '🇧🇪' },
  { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { code: 'CL', name: 'Chile', dial: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', dial: '+57', flag: '🇨🇴' },
  { code: 'CZ', name: 'Czechia', dial: '+420', flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark', dial: '+45', flag: '🇩🇰' },
  { code: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬' },
  { code: 'FI', name: 'Finland', dial: '+358', flag: '🇫🇮' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { code: 'GR', name: 'Greece', dial: '+30', flag: '🇬🇷' },
  { code: 'HK', name: 'Hong Kong', dial: '+852', flag: '🇭🇰' },
  { code: 'HU', name: 'Hungary', dial: '+36', flag: '🇭🇺' },
  { code: 'IE', name: 'Ireland', dial: '+353', flag: '🇮🇪' },
  { code: 'IL', name: 'Israel', dial: '+972', flag: '🇮🇱' },
  { code: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹' },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { code: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾' },
  { code: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽' },
  { code: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
  { code: 'NZ', name: 'New Zealand', dial: '+64', flag: '🇳🇿' },
  { code: 'NO', name: 'Norway', dial: '+47', flag: '🇳🇴' },
  { code: 'PE', name: 'Peru', dial: '+51', flag: '🇵🇪' },
  { code: 'PH', name: 'Philippines', dial: '+63', flag: '🇵🇭' },
  { code: 'PL', name: 'Poland', dial: '+48', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹' },
  { code: 'RO', name: 'Romania', dial: '+40', flag: '🇷🇴' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
  { code: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { code: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷' },
  { code: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸' },
  { code: 'SE', name: 'Sweden', dial: '+46', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', dial: '+41', flag: '🇨🇭' },
  { code: 'TW', name: 'Taiwan', dial: '+886', flag: '🇹🇼' },
  { code: 'TH', name: 'Thailand', dial: '+66', flag: '🇹🇭' },
  { code: 'TR', name: 'Turkey', dial: '+90', flag: '🇹🇷' },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { code: 'VN', name: 'Vietnam', dial: '+84', flag: '🇻🇳' },
] as const

export const DEFAULT_COUNTRY: Country = COUNTRIES[0]

/**
 * Build the E.164 phone string from a chosen country and the local-digits
 * input. Strips non-digit chars from the local part (users may type
 * spaces, dashes, parentheses).
 *
 * Edge case: Canada and US share dial code +1. We send the same E.164
 * to Supabase regardless of which the user picked — Supabase / Twilio
 * route by the actual NPA-NXX, not the picked country code.
 */
export function buildE164(country: Country, localNumber: string): string {
  const digits = localNumber.replace(/\D/g, '')
  return `${country.dial}${digits}`
}

/**
 * Heuristic minimum length for the LOCAL portion (after country code).
 * Used to enable/disable the submit button. We're permissive here —
 * Supabase / Twilio do the authoritative validation server-side.
 *
 * - US/Canada (+1): exactly 10 digits
 * - Most European mobiles: 8-10 digits after country code
 * - Iceland (+354), Norway (+47): 7-8 digits
 *
 * Using 7 as the floor catches the shortest realistic mobile numbers
 * without bouncing legitimate ones.
 */
export const MIN_LOCAL_DIGITS = 7
