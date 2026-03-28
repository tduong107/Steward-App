'use client'

import { usePathname } from 'next/navigation'
import { MessageCircle, Crown } from 'lucide-react'
import { useSub } from '@/hooks/use-subscription'

interface HeaderProps {
  onChatOpen: () => void
}

const titleMap: Record<string, string> = {
  '/home': 'Home',
  '/home/activity': 'Activity',
  '/home/savings': 'Savings',
  '/home/price-insights': 'Price Insights',
  '/home/settings': 'Settings',
}

function getPageTitle(pathname: string): string {
  // Exact match first
  if (titleMap[pathname]) return titleMap[pathname]

  // Prefix match for nested routes
  const match = Object.entries(titleMap).find(
    ([path]) => path !== '/home' && pathname.startsWith(path)
  )
  return match ? match[1] : 'Steward'
}

const tierColors: Record<string, { bg: string; text: string; border: string }> = {
  free: {
    bg: 'bg-[var(--color-bg-deep)]',
    text: 'text-[var(--color-ink-mid)]',
    border: 'border-[var(--color-border)]',
  },
  pro: {
    bg: 'bg-[var(--color-accent-light)]',
    text: 'text-[var(--color-accent)]',
    border: 'border-[var(--color-accent)]/30',
  },
  premium: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    border: 'border-amber-500/30',
  },
}

export function Header({ onChatOpen }: HeaderProps) {
  const pathname = usePathname()
  const title = getPageTitle(pathname)
  const { tier } = useSub()
  const colors = tierColors[tier] || tierColors.free

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] bg-[var(--color-bg-card)] border-b border-[var(--color-border)]">
      <div className="flex items-center gap-2.5">
        <h1 className="text-lg font-semibold font-[var(--font-serif)] text-[var(--color-ink)]">
          {title}
        </h1>
        {/* Tier badge */}
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text} ${colors.border}`}>
          {tier !== 'free' && <Crown size={10} />}
          {tier}
        </span>
      </div>

      <button
        onClick={onChatOpen}
        className="p-2 rounded-[var(--radius-lg)] text-[var(--color-ink-mid)] hover:bg-[var(--color-bg-deep)] transition-colors"
        aria-label="Open chat"
      >
        <MessageCircle size={22} />
      </button>
    </header>
  )
}
