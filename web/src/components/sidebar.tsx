'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Activity,
  PiggyBank,
  Settings,
  LogOut,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { ThemeToggle } from '@/components/theme-toggle'

interface SidebarProps {
  onChatOpen: () => void
}

const navItems = [
  { label: 'Home', icon: Home, href: '/home' },
  { label: 'Activity', icon: Activity, href: '/home/activity' },
  { label: 'Savings', icon: PiggyBank, href: '/home/savings' },
] as const

export function Sidebar({ onChatOpen }: SidebarProps) {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()

  const isActive = (href: string) =>
    href === '/home'
      ? pathname === '/home'
      : pathname.startsWith(href)

  const settingsActive = pathname.startsWith('/home/settings')

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-[var(--color-bg-card)] border-r border-[var(--color-border)]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 px-5 pt-6 pb-4 transition-opacity hover:opacity-80">
          <Image
            src="/steward-logo.png"
            alt="Steward"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-xl font-semibold font-[var(--font-serif)] text-[var(--color-accent)]">
            Steward
          </span>
        </Link>

        {/* Ask Steward button — matches iOS chat prompt bar */}
        <div className="px-3 mt-1">
          <button
            onClick={onChatOpen}
            className="flex w-full items-center gap-2.5 rounded-2xl border-[1.5px] border-[var(--color-accent-mid)] bg-[var(--color-bg-card)] px-4 py-3 text-left transition-colors hover:bg-[var(--color-accent-light)] shadow-sm"
          >
            <Image
              src="/steward-logo.png"
              alt=""
              width={28}
              height={28}
              className="rounded-md shrink-0"
            />
            <span className="flex-1 text-sm text-[var(--color-ink-mid)]">
              Ask Steward...
            </span>
            <ArrowUpRight size={14} className="shrink-0 text-[var(--color-accent-mid)]" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 px-3 mt-3">
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

        {/* Bottom area: Settings + User + Sign Out */}
        <div className="border-t border-[var(--color-border)] px-3 pt-2 pb-4">
          {/* Settings */}
          <Link
            href="/home/settings"
            className={`flex items-center gap-3 rounded-[var(--radius-lg)] px-3 py-2.5 text-sm font-medium transition-colors ${
              settingsActive
                ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]'
                : 'text-[var(--color-ink-mid)] hover:bg-[var(--color-bg-deep)]'
            }`}
          >
            <Settings size={20} />
            Settings
          </Link>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* User + Sign Out */}
          <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-ink)] truncate">
                {profile?.display_name ?? 'User'}
              </p>
            </div>
            <button
              onClick={signOut}
              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-lg)] text-sm text-[var(--color-ink-mid)] hover:bg-[var(--color-bg-deep)] transition-colors"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ── */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--color-bg-card)] border-t border-[var(--color-border)]">
        <nav className="relative flex items-center justify-around h-16 px-2">
          {/* Home */}
          <Link
            href="/home"
            className={`flex flex-col items-center gap-0.5 py-1 px-2 transition-colors ${
              pathname === '/home'
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-ink-light)]'
            }`}
          >
            <Home size={22} />
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          {/* Savings */}
          <Link
            href="/home/savings"
            className={`flex flex-col items-center gap-0.5 py-1 px-2 transition-colors ${
              pathname.startsWith('/home/savings')
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-ink-light)]'
            }`}
          >
            <PiggyBank size={22} />
            <span className="text-[10px] font-medium">Savings</span>
          </Link>

          {/* Center AI Chat button — sparkle icon like iOS */}
          <button
            onClick={onChatOpen}
            className="flex items-center justify-center w-12 h-12 -mt-5 rounded-full bg-[var(--color-accent)] text-white shadow-lg active:scale-95 transition-transform"
            aria-label="Open Steward AI chat"
          >
            <Sparkles size={22} />
          </button>

          {/* Activity */}
          <Link
            href="/home/activity"
            className={`flex flex-col items-center gap-0.5 py-1 px-2 transition-colors ${
              pathname.startsWith('/home/activity')
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-ink-light)]'
            }`}
          >
            <Activity size={22} />
            <span className="text-[10px] font-medium">Activity</span>
          </Link>

          {/* Settings */}
          <Link
            href="/home/settings"
            className={`flex flex-col items-center gap-0.5 py-1 px-2 transition-colors ${
              pathname.startsWith('/home/settings')
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-ink-light)]'
            }`}
          >
            <Settings size={22} />
            <span className="text-[10px] font-medium">Settings</span>
          </Link>
        </nav>
      </div>
    </>
  )
}
