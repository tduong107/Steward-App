'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, Monitor, Coffee, Plane, TreePine, Music, X } from 'lucide-react'
import { useChatDrawer } from '@/providers/chat-provider'

const quickActions = [
  { icon: Monitor, label: 'Track a product price on any website', hint: 'Paste URL', query: 'Product' },
  { icon: Coffee, label: 'Watch for restaurant reservations', hint: 'Resy, OpenTable', query: 'Reservation' },
  { icon: Plane, label: 'Monitor flight prices', hint: 'Kayak, Google', query: 'Travel' },
  { icon: TreePine, label: 'Watch for campsite availability', hint: 'Recreation.gov', query: 'Camping' },
  { icon: Music, label: 'Watch for concert ticket drops', hint: 'Any ticket site', query: 'Tickets' },
]

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { openChat } = useChatDrawer()

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (open) onClose()
        // The parent handles opening
      }
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  const handleAction = () => {
    onClose()
    openChat()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) handleAction()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[100px]"
      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.15s cubic-bezier(0.16,1,0.3,1)' }}
      onClick={onClose}
    >
      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } } @keyframes cmdSlide { from { opacity: 0; transform: translateY(-12px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }`}</style>
      <div
        className="w-[580px] max-w-[calc(100vw-32px)] bg-[var(--color-bg-card)] rounded-[var(--radius-xl)] overflow-hidden"
        style={{ boxShadow: 'var(--shadow-xl)', animation: 'cmdSlide 0.25s cubic-bezier(0.16,1,0.3,1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Input area */}
        <form onSubmit={handleSubmit} className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)]">
          <Search size={18} className="text-[var(--color-ink-light)] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Paste a URL or describe what to watch..."
            className="flex-1 border-none outline-none text-base text-[var(--color-ink)] bg-transparent placeholder:text-[var(--color-ink-light)]"
            style={{ fontFamily: 'inherit' }}
          />
          <kbd className="text-[11px] font-medium px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-bg-deep)] text-[var(--color-ink-light)]">
            ESC
          </kbd>
        </form>

        {/* Suggestions */}
        <div className="px-4 py-3">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-[var(--color-ink-light)] px-2 py-1.5">
            Quick Actions
          </div>
          {quickActions.map(action => (
            <div
              key={action.label}
              onClick={() => handleAction()}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] cursor-pointer transition-all hover:bg-[var(--color-bg-deep)] group"
            >
              <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--color-bg-deep)] flex items-center justify-center text-[var(--color-ink-mid)] group-hover:bg-[var(--color-green-light)] group-hover:text-[var(--color-accent)] transition-colors">
                <action.icon size={16} />
              </div>
              <span className="text-sm text-[var(--color-ink)] font-medium group-hover:text-[var(--color-ink)]">
                {action.label}
              </span>
              <span className="ml-auto text-[11px] text-[var(--color-ink-light)]">
                {action.hint}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
