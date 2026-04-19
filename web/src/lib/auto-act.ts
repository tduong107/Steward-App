import type { ActionType, ResponseMode, Watch } from '@/lib/types'

/** Shape of one entry in the `site_cookies` JSON column. Mirrors
 * `SerializedCookie` in the iOS Share Extension. Fields besides name/value
 * are all optional and vary by browser. */
export interface SerializedCookie {
  name: string
  value: string
  domain?: string
  path?: string
  expiresDate?: number // Unix seconds; omitted for session cookies
  isSecure?: boolean
  isHTTPOnly?: boolean
}

/** Result of inspecting a watch's captured session cookies. */
export interface SessionState {
  /** 'active' when cookies exist, status is active, and at least one
   * non-expired cookie remains. 'expired' when cookies exist but all
   * are past their expiry. 'none' when nothing was ever captured. */
  status: 'active' | 'expired' | 'none'
  /** Earliest upcoming cookie expiry, as ISO string. Undefined for 'none'
   * and for cookie sets that contain no dated cookies (session-only). */
  earliestExpiry?: string
  /** Domain cookies are scoped to, if known. */
  domain?: string
  /** Number of cookies stored. Surfaced for debugging only. */
  cookieCount: number
}

/**
 * Inspects a watch's `site_cookies` column and reports whether the stored
 * session is still valid. This is a *best-effort* check — we only parse
 * the expiry dates locally. The cookies may still be rejected by the
 * retailer (revoked, 2FA invalidated, etc.), but a positive result here
 * is a necessary precondition for auto-cart to have any chance of working.
 */
export function inspectSession(
  watch: Pick<Watch, 'site_cookies' | 'cookie_status' | 'cookie_domain'>,
): SessionState {
  if (!watch.site_cookies) {
    return { status: 'none', cookieCount: 0 }
  }

  let cookies: SerializedCookie[] = []
  try {
    const parsed = JSON.parse(watch.site_cookies)
    cookies = Array.isArray(parsed) ? parsed : []
  } catch {
    return { status: 'none', cookieCount: 0, domain: watch.cookie_domain || undefined }
  }

  if (cookies.length === 0) {
    return { status: 'none', cookieCount: 0, domain: watch.cookie_domain || undefined }
  }

  const now = Date.now() / 1000
  const datedCookies = cookies.filter(
    (c): c is SerializedCookie & { expiresDate: number } =>
      typeof c.expiresDate === 'number' && c.expiresDate > 0,
  )
  const validDated = datedCookies.filter((c) => c.expiresDate > now)

  // If every dated cookie has expired, treat the session as expired —
  // the retailer will reject the request. Session-only cookies (no expiry)
  // are excluded from this check because they live only as long as the
  // browser was open; we can't verify them from here.
  if (datedCookies.length > 0 && validDated.length === 0) {
    return {
      status: 'expired',
      cookieCount: cookies.length,
      domain: watch.cookie_domain || undefined,
    }
  }

  // Respect cookie_status set by iOS — if it was explicitly marked inactive
  // (e.g. detected as revoked server-side), show expired.
  if (watch.cookie_status && watch.cookie_status !== 'active') {
    return {
      status: 'expired',
      cookieCount: cookies.length,
      domain: watch.cookie_domain || undefined,
    }
  }

  // Earliest upcoming expiry across all dated cookies.
  const earliestExpirySecs = validDated.length > 0
    ? validDated.reduce((min, c) => Math.min(min, c.expiresDate), validDated[0].expiresDate)
    : undefined

  return {
    status: 'active',
    earliestExpiry: earliestExpirySecs
      ? new Date(earliestExpirySecs * 1000).toISOString()
      : undefined,
    domain: watch.cookie_domain || undefined,
    cookieCount: cookies.length,
  }
}

/**
 * True when this watch's auto-cart path is end-to-end viable right now:
 * functionality is wired (supported domain + price/cart type), the user
 * has opted in (auto_act = true), and the stored session looks alive.
 *
 * False when any prerequisite is missing. Used to decide between showing
 * "✓ Ready to auto-cart" vs "Will fall back to Quick Cart Link."
 */
export function isAutoActReady(
  watch: Pick<Watch, 'action_type' | 'url' | 'auto_act' | 'site_cookies' | 'cookie_status' | 'cookie_domain'>,
): boolean {
  if (!watch.auto_act) return false
  if (!isAutoActFunctional(watch.action_type, watch.url)) return false
  return inspectSession(watch).status === 'active'
}

/**
 * Retailer domains where the `execute-action` edge function can actually
 * attempt an automated cart-add. These are the hostnames the backend
 * pattern-matches against in `steward-supabase/supabase/functions/execute-action/index.ts`.
 *
 * This list intentionally matches iOS (`autoActSupportedForURL` in
 * `DetailScreen.swift`) so both platforms offer/grey-out the same stores.
 * Keep them in sync.
 *
 * Note: Nike / Adidas / Costco appear on the iOS supported list but the
 * backend doesn't have dedicated handlers for them yet — those fall into
 * the generic/Shopify path and may or may not work depending on the
 * specific cart-add URL shape. Kept here for parity with iOS.
 */
export const AUTO_ACT_SUPPORTED_DOMAINS = [
  'amazon.com',
  'target.com',
  'walmart.com',
  'bestbuy.com',
  'nike.com',
  'adidas.com',
  'costco.com',
  'myshopify.com',
  'shopify.com',
] as const

/** True when the URL's host matches a retailer we can attempt auto-cart on. */
export function isAutoActSupportedForURL(url: string): boolean {
  const lower = url.toLowerCase()
  return AUTO_ACT_SUPPORTED_DOMAINS.some((d) => lower.includes(d))
}

/**
 * Computes the response mode we should *display* for a watch.
 *
 * Why this exists: the backend only acts on the `auto_act` boolean column,
 * but the web UI presents a 3-way picker (`response_mode`). iOS historically
 * writes `auto_act = true` directly without updating `response_mode`, so a
 * watch created via iOS with Auto-Act enabled looks like `response_mode:
 * 'notify'` in the DB.
 *
 * To keep the web UI honest, we treat `auto_act` as the source of truth
 * when it's set, and fall back to `response_mode` otherwise.
 */
export function effectiveResponseMode(
  watch: Pick<Watch, 'response_mode' | 'auto_act'>,
): ResponseMode {
  if (watch.auto_act) return 'stewardActs'
  return watch.response_mode || 'notify'
}

/**
 * Human-readable label for the "Steward Acts" option, varying by watch
 * action type. Returns null for `notify` watches where the option
 * shouldn't render at all. Matches iOS `autoActSection`.
 */
export function autoActLabelFor(actionType: ActionType): string | null {
  switch (actionType) {
    case 'price':
    case 'cart':
      return 'Auto Add to Cart'
    case 'book':
      return 'Auto Book'
    case 'form':
      return 'Auto Fill & Submit'
    case 'notify':
      return null
  }
}

/**
 * Whether auto-act is currently wired up end-to-end for this watch. Only
 * price/cart watches on supported retailers have a working backend path
 * today — book/form are UI-only placeholders.
 */
export function isAutoActFunctional(actionType: ActionType, url: string): boolean {
  if (actionType !== 'price' && actionType !== 'cart') return false
  return isAutoActSupportedForURL(url)
}

/**
 * Subtitle shown under the "Steward Acts" row. For every path we make
 * the Smart Cart Link fallback explicit — users always know they'll get
 * *something* when their watch triggers, even if the auto-action half
 * doesn't fire. This is the core of the Tier 6 honesty reframe.
 */
export function autoActSubtitleFor(actionType: ActionType, url: string): string {
  const supported = isAutoActSupportedForURL(url)
  switch (actionType) {
    case 'price':
    case 'cart':
      return supported
        ? 'Steward tries to add to cart automatically within your spending limit. If the retailer declines or your session has expired, you\'ll get a Smart Cart Link notification instead.'
        : 'Auto-cart isn\'t wired up for this retailer yet — you\'ll get a Smart Cart Link notification on trigger.'
    case 'book':
      return 'Auto-book is coming soon for Premium users. For now, triggers send a notification with a one-tap booking link.'
    case 'form':
      return 'Coming soon. For now, triggers send a notification with a link to the form.'
    case 'notify':
      return ''
  }
}
