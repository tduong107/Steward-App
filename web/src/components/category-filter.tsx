'use client'

import {
  ShoppingBag,
  Plane,
  UtensilsCrossed,
  Ticket,
  Eye,
  LayoutGrid,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Watch } from '@/lib/types'

interface CategoryFilterProps {
  selected: string
  onChange: (value: string) => void
  watches: Watch[]
}

interface CategoryInfo {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number }>
}

const allCategories: CategoryInfo[] = [
  { id: 'product', label: 'Product', icon: ShoppingBag },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'reservation', label: 'Reservation', icon: UtensilsCrossed },
  { id: 'ticket', label: 'Events', icon: Ticket },
  { id: 'general', label: 'General', icon: Eye },
]

/** Maps a watch to its user-facing category — mirrors iOS watchCategory(for:) */
export function watchCategory(watch: Watch): string {
  switch (watch.watch_mode) {
    case 'search':
      return 'product'
    case 'camping':
      return 'travel'
    case 'resy':
      return 'reservation'
    case 'ticket':
      return 'ticket'
    case 'travel':
      return 'travel'
    default: {
      // Infer from action_type for url-mode watches
      switch (watch.action_type) {
        case 'price':
        case 'cart':
          return 'product'
        case 'book': {
          const url = (watch.url || '').toLowerCase()
          if (url.includes('resy.com') || url.includes('opentable.com')) {
            return 'reservation'
          }
          return 'general'
        }
        default:
          return 'general'
      }
    }
  }
}

export function CategoryFilter({ selected, onChange, watches }: CategoryFilterProps) {
  // Only show categories that have at least one watch (matching iOS availableCategories)
  const presentCategories = new Set(watches.map(watchCategory))
  const available = allCategories.filter((c) => presentCategories.has(c.id))

  // Don't show filter bar if fewer than 2 categories (matching iOS)
  if (available.length < 2) return null

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {/* "All" pill */}
      <button
        type="button"
        onClick={() => onChange('')}
        className={cn(
          'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-150',
          selected === ''
            ? 'bg-[var(--color-accent)] text-white'
            : 'bg-[var(--color-bg-deep)] text-[var(--color-ink-mid)] hover:bg-[var(--color-border)]',
        )}
      >
        <LayoutGrid size={12} />
        All
      </button>

      {available.map((cat) => {
        const Icon = cat.icon
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-150',
              selected === cat.id
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-bg-deep)] text-[var(--color-ink-mid)] hover:bg-[var(--color-border)]',
            )}
          >
            <Icon size={12} />
            {cat.label}
          </button>
        )
      })}
    </div>
  )
}
