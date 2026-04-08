'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Plus, Bell } from 'lucide-react'

const pageTitles: Record<string, string> = {
  '/home': 'Home',
  '/home/activity': 'Activity',
  '/home/savings': 'Savings',
  '/home/price-insights': 'Price Insights',
  '/home/settings': 'Settings',
}

interface TopbarProps {
  onNewWatch: () => void
  triggeredCount?: number
}

export function Topbar({ onNewWatch, triggeredCount = 0 }: TopbarProps) {
  const pathname = usePathname()
  const router = useRouter()

  // Match the deepest path first
  const title = Object.entries(pageTitles)
    .filter(([path]) => pathname.startsWith(path))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1]
    ?? (pathname.startsWith('/home/watch/') ? 'Watch Details' : 'Home')

  return (
    <header
      className="h-[52px] shrink-0 flex items-center justify-between px-7 sticky top-0 z-15 border-b border-[var(--color-border)]"
      style={{
        background: 'color-mix(in srgb, var(--color-bg-card) 92%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <span className="text-sm font-semibold text-[var(--color-ink)] tracking-tight">
        {title}
      </span>

      <div className="flex items-center gap-2.5">
        {/* New Watch button */}
        <button
          onClick={onNewWatch}
          className="inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-[var(--radius-md)] border-none text-white text-[13px] font-semibold cursor-pointer transition-all hover:-translate-y-px"
          style={{
            background: 'linear-gradient(180deg, #22C55E 0%, #16A34A 100%)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.15)',
            fontFamily: 'inherit',
          }}
        >
          <Plus size={15} strokeWidth={2.5} />
          New Watch
        </button>

        {/* Notification bell — navigates to activity */}
        <button
          onClick={() => router.push('/home/activity')}
          className="relative w-[34px] h-[34px] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-card)] flex items-center justify-center cursor-pointer transition-all hover:bg-[var(--color-bg-deep)] hover:border-[var(--color-border-mid)]"
        >
          <Bell size={17} className="text-[var(--color-ink-mid)]" />
          {triggeredCount > 0 && (
            <div className="absolute top-[5px] right-[5px] w-[7px] h-[7px] rounded-full bg-[var(--color-red)] border-2 border-[var(--color-bg-card)]" />
          )}
        </button>
      </div>
    </header>
  )
}
