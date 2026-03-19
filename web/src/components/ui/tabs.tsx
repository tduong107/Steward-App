import * as React from 'react'
import { cn } from '@/lib/utils'

export interface Tab {
  label: string
  value: string
}

export interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (value: string) => void
  className?: string
}

function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-1 border-b border-[var(--color-border)]',
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === activeTab
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative px-4 py-2.5 text-sm font-medium transition-colors duration-150',
              isActive
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-ink-light)] hover:text-[var(--color-ink)]',
            )}
          >
            {tab.label}
            {isActive && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[var(--color-accent)]" />
            )}
          </button>
        )
      })}
    </div>
  )
}

export { Tabs }
