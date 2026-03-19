'use client'

import { usePathname } from 'next/navigation'
import { MessageCircle } from 'lucide-react'

interface HeaderProps {
  onChatOpen: () => void
}

const titleMap: Record<string, string> = {
  '/home': 'Home',
  '/home/activity': 'Activity',
  '/home/savings': 'Savings',
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

export function Header({ onChatOpen }: HeaderProps) {
  const pathname = usePathname()
  const title = getPageTitle(pathname)

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[var(--color-bg-card)] border-b border-[var(--color-border)]">
      <h1 className="text-lg font-semibold font-[var(--font-serif)] text-[var(--color-ink)]">
        {title}
      </h1>

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
