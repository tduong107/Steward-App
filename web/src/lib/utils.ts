import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Get domain from URL
export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

// Format relative time ("2 hours ago", "just now", etc.)
export function timeAgo(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Format next check time
export function nextCheckLabel(lastChecked: string | null, frequency: string): string {
  if (!lastChecked) return 'Checking soon'
  const last = new Date(lastChecked)
  const intervalMs = frequencyToMs(frequency)
  const next = new Date(last.getTime() + intervalMs)
  const now = new Date()
  const diff = next.getTime() - now.getTime()
  if (diff <= 0) return 'Checking soon'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) return `Next check in ${hours}h ${minutes}m`
  return `Next check in ${minutes}m`
}

function frequencyToMs(freq: string): number {
  switch (freq) {
    case 'Every 2 hours': return 2 * 60 * 60 * 1000
    case 'Every 4 hours': return 4 * 60 * 60 * 1000
    case 'Every 6 hours': return 6 * 60 * 60 * 1000
    case 'Every 12 hours': return 12 * 60 * 60 * 1000
    default: return 24 * 60 * 60 * 1000
  }
}

// Map SF Symbol icon names to Lucide icon names
export function mapIcon(sfSymbol: string): string {
  const iconMap: Record<string, string> = {
    'bell.fill': 'bell',
    'bell.badge.fill': 'bell-ring',
    'cart.fill': 'shopping-cart',
    'cart.fill.badge.plus': 'shopping-cart',
    'cart.badge.plus': 'shopping-cart',
    'tag.fill': 'tag',
    'eye.fill': 'eye',
    'eye.slash.fill': 'eye-off',
    'checkmark.circle.fill': 'check-circle',
    'xmark.circle.fill': 'x-circle',
    'exclamationmark.triangle.fill': 'alert-triangle',
    'arrow.clockwise': 'refresh-cw',
    'sparkles': 'sparkles',
    'star.fill': 'star',
    'trash.fill': 'trash-2',
    'link': 'link',
    'dollarsign.circle.fill': 'dollar-sign',
    'bolt.fill': 'zap',
    'hand.thumbsup.fill': 'thumbs-up',
    'paperplane.fill': 'send',
    'gearshape.fill': 'settings',
    'person.fill': 'user',
  }
  return iconMap[sfSymbol] || 'circle'
}

// Map icon color name to CSS color variable
export function iconColor(colorName: string): string {
  const colorMap: Record<string, string> = {
    accent: 'var(--color-accent)',
    gold: 'var(--color-gold)',
    red: 'var(--color-red)',
    blue: 'var(--color-blue)',
    green: 'var(--color-green)',
    inkLight: 'var(--color-ink-light)',
  }
  return colorMap[colorName] || 'var(--color-ink-mid)'
}

// Subscription tier helpers
export function watchLimit(tier: string): number {
  switch (tier) {
    case 'premium': return 15
    case 'pro': return 7
    default: return 3
  }
}

export function tierLabel(tier: string): string {
  switch (tier) {
    case 'premium': return 'Premium'
    case 'pro': return 'Pro'
    default: return 'Free'
  }
}
