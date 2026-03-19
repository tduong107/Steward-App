'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Activity,
  PiggyBank,
  Settings,
  LogOut,
  MessageCircle,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface SidebarProps {
  onChatOpen: () => void
}

const navItems = [
  { label: 'Home', icon: Home, href: '/dashboard' },
  { label: 'Activity', icon: Activity, href: '/dashboard/activity' },
  { label: 'Savings', icon: PiggyBank, href: '/dashboard/savings' },
  { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
] as const

export function Sidebar({ onChatOpen }: SidebarProps) {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(href)

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-[var(--color-bg-card)] border-r border-[var(--color-border)]">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 pt-6 pb-4">
          <span className="text-2xl" role="img" aria-label="Steward logo">
            🏠
          </span>
          <span className="text-xl font-semibold font-[var(--font-serif)] text-[var(--color-accent)]">
            Steward
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 px-3 mt-2">
          {navItems.map(({ label, icon: Icon, href }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-[var(--radius-lg)] px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]'
                    : 'text-[var(--color-ink-mid)] hover:bg-[var(--color-bg-deep)]'
                }`}
              >
                <Icon size={20} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User area */}
        <div className="border-t border-[var(--color-border)] px-4 py-4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-ink)] truncate">
              {profile?.display_name ?? 'User'}
            </p>
          </div>
          <button
            onClick={signOut}
            className="shrink-0 p-1.5 rounded-[var(--radius-lg)] text-[var(--color-ink-mid)] hover:bg-[var(--color-bg-deep)] transition-colors"
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ── */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--color-bg-card)] border-t border-[var(--color-border)]">
        <nav className="relative flex items-center justify-around h-16 px-2">
          {navItems.map(({ label, icon: Icon, href }, index) => {
            const active = isActive(href)

            // Insert floating chat button in the center (after index 1)
            const chatButton =
              index === 2 ? (
                <button
                  key="chat-fab"
                  onClick={onChatOpen}
                  className="flex items-center justify-center w-12 h-12 -mt-5 rounded-full bg-[var(--color-accent)] text-white shadow-lg active:scale-95 transition-transform"
                  aria-label="Open chat"
                >
                  <MessageCircle size={22} />
                </button>
              ) : null

            return (
              <>
                {chatButton}
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center gap-0.5 py-1 px-2 transition-colors ${
                    active
                      ? 'text-[var(--color-accent)]'
                      : 'text-[var(--color-ink-light)]'
                  }`}
                >
                  <Icon size={22} />
                  <span className="text-[10px] font-medium">{label}</span>
                </Link>
              </>
            )
          })}
        </nav>
      </div>
    </>
  )
}
