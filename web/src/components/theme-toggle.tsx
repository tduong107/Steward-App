'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/providers/theme-provider'

interface ThemeToggleProps {
  /** Compact mode shows just the icon (for nav bars) */
  compact?: boolean
  /** Dark-page variant for the landing page (always light icons) */
  landing?: boolean
}

export function ThemeToggle({ compact, landing }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  // Determine effective mode
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  const toggle = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  if (compact) {
    return (
      <button
        onClick={toggle}
        className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors duration-200 ${
          landing
            ? 'text-white/60 hover:text-white hover:bg-white/[0.08]'
            : 'text-[var(--color-ink-mid)] hover:bg-[var(--color-bg-deep)]'
        }`}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-3 rounded-[var(--radius-lg)] px-3 py-2.5 text-sm font-medium text-[var(--color-ink-mid)] hover:bg-[var(--color-bg-deep)] transition-colors w-full"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
      {isDark ? 'Light Mode' : 'Dark Mode'}
    </button>
  )
}
