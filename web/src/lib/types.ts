export type WatchStatus = 'watching' | 'triggered' | 'paused' | 'deleted'
export type ActionType = 'price' | 'cart' | 'book' | 'form' | 'notify'
export type ResponseMode = 'notify' | 'quickLink' | 'stewardActs'
export type CheckFrequency = 'Daily' | 'Every 12 hours' | 'Every 6 hours' | 'Every 4 hours' | 'Every 2 hours'
export type SubscriptionTier = 'free' | 'pro' | 'premium'
export type IconColorName = 'accent' | 'gold' | 'red' | 'blue' | 'inkLight' | 'green'

export interface Watch {
  id: string
  user_id: string
  name: string
  emoji: string
  url: string
  condition: string
  action_type: ActionType
  action_label: string
  action_url: string | null
  status: WatchStatus
  triggered: boolean
  change_note: string | null
  notify_channels: string
  check_frequency: CheckFrequency
  last_checked: string | null
  preferred_check_time: string | null
  image_url: string | null
  watch_mode: string
  search_query: string | null
  consecutive_failures: number
  last_error: string | null
  needs_attention: boolean
  alt_source_url: string | null
  alt_source_domain: string | null
  alt_source_price: number | null
  alt_source_found_at: string | null
  auto_act: boolean
  spending_limit: number | null
  response_mode: ResponseMode
  coupon_code: string | null
  action_executed: boolean
  action_executed_at: string | null
  // Session cookies captured via the iOS Share Extension's in-app browser
  // login flow. Required for execute-action to succeed on auth-walled
  // retailers (Amazon, Target, Walmart, Best Buy). See StewardShare/LoginWebView.swift.
  site_cookies: string | null
  cookie_domain: string | null
  cookie_status: string | null
  price_confidence: string | null
  notify_any_price_drop: boolean
  last_price: number | null
  last_result_text: string | null
  affiliate_network: string | null
  affiliate_url: string | null
  is_affiliated: boolean
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  user_id: string
  watch_id: string | null
  icon: string
  icon_color_name: IconColorName
  label: string
  subtitle: string | null
  created_at: string
}

export interface CheckResult {
  id: string
  watch_id: string
  result_data: Record<string, unknown>
  changed: boolean
  price: number | null
  checked_at: string
  created_at: string
}

export type SubscriptionSource = 'none' | 'apple' | 'stripe'

export interface Profile {
  id: string
  display_name: string | null
  device_token: string | null
  phone_number: string | null
  notification_email: string | null
  spending_limit: number | null
  auto_act_default: boolean
  subscription_tier: SubscriptionTier
  subscription_source: SubscriptionSource
  email_alerts: boolean
  sms_alerts: boolean
  created_at: string
  updated_at: string
}

export interface SharedWatch {
  share_id: string
  emoji: string
  name: string
  url: string
  condition: string
  action_label: string
  action_type: ActionType
  check_frequency: CheckFrequency
  image_url: string | null
  shared_by_name: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'steward'
  text: string
  suggestions?: string[]
  watchData?: Partial<Watch>
  productLinks?: ProductLink[]
  dismiss?: boolean
  /** When present, the drawer should auto-create this watch (matches iOS CREATE_WATCH flow) */
  autoCreateWatch?: Partial<Watch>
}

export interface ProductLink {
  title: string
  url: string
  price: string
  image?: string
  store?: string
}
