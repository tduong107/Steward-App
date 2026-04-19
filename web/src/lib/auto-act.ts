import type { ActionType, ResponseMode, Watch } from '@/lib/types'

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
 * Subtitle shown under the "Steward Acts" row. Mirrors iOS messaging —
 * "Coming soon for this store" for price/cart watches on unsupported
 * retailers, generic "Coming soon" for book/form which aren't wired yet.
 */
export function autoActSubtitleFor(actionType: ActionType, url: string): string {
  const supported = isAutoActSupportedForURL(url)
  switch (actionType) {
    case 'price':
    case 'cart':
      return supported
        ? 'Steward automatically adds to cart within your spending limit.'
        : 'Coming soon for this store.'
    case 'book':
      return 'Coming soon for Premium users.'
    case 'form':
      return 'Coming soon.'
    case 'notify':
      return ''
  }
}
