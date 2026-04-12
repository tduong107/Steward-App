'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Activity,
  PiggyBank,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Lock,
  Crown,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useWatches } from '@/hooks/use-watches'
import { useSub } from '@/hooks/use-subscription'
import { useActivities } from '@/hooks/use-activities'
import { PaywallDialog } from '@/components/paywall-dialog'

interface SidebarProps {
  onChatOpen: () => void
}

const navItems = [
  { label: 'Home', icon: Home, href: '/home' },
  { label: 'Activity', icon: Activity, href: '/home/activity' },
  { label: 'Savings', icon: PiggyBank, href: '/home/savings' },
  { label: 'Price Insights', icon: BarChart3, href: '/home/price-insights', proOnly: true },
] as const

export function Sidebar({ onChatOpen }: SidebarProps) {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const { tier } = useSub()
  const { activities } = useActivities()
  const { watches } = useWatches()
  const triggeredCount = watches.filter(w => w.triggered && w.status !== 'deleted').length
  const [showPaywall, setShowPaywall] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const showUpgrade = tier === 'free'

  const isActive = (href: string) =>
    href === '/home' ? pathname === '/home' : pathname.startsWith(href)

  const settingsActive = pathname.startsWith('/home/settings')

  // Count unread alerts (activities from last 24h)
  const recentAlertCount = activities.filter(a => {
    const created = new Date(a.created_at)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return created > dayAgo
  }).length

  const initials = (profile?.display_name ?? 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const tierLabel = tier === 'premium' ? 'Premium' : tier === 'pro' ? 'Pro' : 'Free'

  const sidebarContent = (
    <>
      {/* Logo + Brand */}
      <div className="flex items-center gap-[11px] px-[18px] pt-[22px] pb-3">
        <Link href="/" className="flex items-center gap-[11px] transition-opacity hover:opacity-80">
          <Image
            src="/steward-logo.png"
            alt="Steward"
            width={36}
            height={36}
            className="rounded-xl shrink-0"
          />
          <span className="text-[19px] font-extrabold text-[var(--color-ink)] tracking-tight">
            Steward
          </span>
        </Link>
      </div>

      {/* Command trigger — opens chat */}
      <div className="px-3 mb-3.5">
        <button
          onClick={onChatOpen}
          className="flex w-full items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-deep)] text-[14px] text-[var(--color-ink-light)] cursor-pointer transition-all hover:border-[var(--color-border-mid)] hover:bg-[var(--color-bg)]"
          style={{ fontFamily: 'inherit' }}
        >
          <Search size={14} className="shrink-0" />
          <span className="flex-1 text-left">Ask Steward...</span>
          <kbd className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--color-border)] text-[var(--color-ink-light)]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 overflow-y-auto">
        {navItems.map(({ label, icon: Icon, href, ...rest }) => {
          const active = isActive(href)
          const isProLocked = 'proOnly' in rest && rest.proOnly && showUpgrade
          return (
            <Link
              key={href}
              href={isProLocked ? '#' : href}
              onClick={(e) => {
                if (isProLocked) { e.preventDefault(); setShowPaywall(true) }
                setMobileOpen(false)
              }}
              className={`relative flex items-center gap-2.5 px-3 py-[9px] rounded-[var(--radius-md)] mb-px text-[15px] font-medium cursor-pointer transition-all ${
                active
                  ? 'bg-[var(--color-green-light)] text-[var(--color-accent)] font-semibold'
                  : 'text-[var(--color-ink-mid)] hover:bg-[var(--color-bg-deep)] hover:text-[var(--color-ink)]'
              }`}
            >
              {/* Active indicator bar */}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-[3px] bg-[var(--color-accent)]" />
              )}
              <Icon size={18} />
              {label}
              {isProLocked && <Lock size={12} className="ml-auto text-[var(--color-ink-light)]" />}
              {label === 'Home' && triggeredCount > 0 && (
                <span className="ml-auto text-[10px] font-bold px-[6px] py-px rounded-full bg-[var(--color-accent)] text-[#0F2018]">
                  {triggeredCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* iOS App CTA */}
      <div className="px-3 mb-2">
        <a
          href="https://apps.apple.com/us/app/steward-concierge/id6760180137"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setMobileOpen(false)}
          className="flex w-full items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-bg-deep)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-accent-light)] transition-all group"
        >
          <svg className="w-[15px] h-[15px] text-[var(--color-ink-light)] group-hover:text-[var(--color-accent)] transition-colors" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          <div className="flex-1 text-left">
            <span className="text-[12px] font-bold text-[var(--color-ink-mid)] group-hover:text-[var(--color-accent)] transition-colors">
              Get iOS App
            </span>
          </div>
          <svg className="w-3.5 h-3.5 text-[var(--color-ink-faint)] group-hover:text-[var(--color-accent)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>

      {/* Subscription tier */}
      <div className="px-3 mb-2">
        <button
          onClick={() => { setShowPaywall(true); setMobileOpen(false) }}
          className={`flex w-full items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-md)] transition-all cursor-pointer ${
            tier === 'premium'
              ? 'bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 hover:bg-[var(--color-gold)]/15'
              : tier === 'pro'
              ? 'bg-[var(--color-accent-light)] border border-[var(--color-accent)]/20 hover:bg-[var(--color-accent-mid)]/30'
              : 'bg-[var(--color-bg-deep)] border border-[var(--color-border)] hover:bg-[var(--color-bg)]'
          }`}
        >
          <Crown size={15} className={
            tier === 'premium' ? 'text-[var(--color-gold)]'
            : tier === 'pro' ? 'text-[var(--color-accent)]'
            : 'text-[var(--color-ink-light)]'
          } />
          <div className="flex-1 text-left">
            <span className={`text-[12px] font-bold uppercase tracking-wide ${
              tier === 'premium' ? 'text-[var(--color-gold)]'
              : tier === 'pro' ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-ink-mid)]'
            }`}>
              {tierLabel} Plan
            </span>
          </div>
          {tier === 'free' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-accent)] text-white">
              Upgrade
            </span>
          )}
        </button>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--color-border)] px-3 pt-2.5 pb-3.5">
        {/* Settings */}
        <Link
          href="/home/settings"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-2.5 px-3 py-[9px] rounded-[var(--radius-md)] text-[15px] font-medium cursor-pointer transition-all ${
            settingsActive
              ? 'bg-[var(--color-green-light)] text-[var(--color-accent)] font-semibold'
              : 'text-[var(--color-ink-mid)] hover:bg-[var(--color-bg-deep)] hover:text-[var(--color-ink)]'
          }`}
        >
          <Settings size={18} />
          Settings
        </Link>

        {/* User card */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 mt-1.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-extrabold shrink-0"
            style={{
              background: 'linear-gradient(135deg, #6EE7B7, #059669)',
              boxShadow: '0 2px 6px rgba(5,150,105,0.25)',
            }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-[var(--color-ink)] truncate">
              {profile?.display_name ?? 'User'}
            </p>
            <p className="text-[11px] font-semibold text-[var(--color-accent)]">
              {tierLabel}
            </p>
          </div>
          <button
            onClick={signOut}
            className="shrink-0 p-1.5 rounded-[var(--radius-sm)] text-[var(--color-ink-light)] hover:bg-[var(--color-bg-deep)] hover:text-[var(--color-ink-mid)] transition-colors"
            aria-label="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[264px] shrink-0 flex-col bg-[var(--color-bg-card)] border-r border-[var(--color-border)] h-dvh sticky top-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-30 w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-bg-card)] border border-[var(--color-border)] flex items-center justify-center shadow-sm"
      >
        <Menu size={18} className="text-[var(--color-ink-mid)]" />
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-[var(--color-bg-card)] flex flex-col shadow-xl animate-fade-up">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--color-ink-light)] hover:bg-[var(--color-bg-deep)]"
            >
              <X size={16} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <PaywallDialog open={showPaywall} onClose={() => setShowPaywall(false)} />
    </>
  )
}
