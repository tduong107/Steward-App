'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, MessageCircle } from 'lucide-react'
import { useWatches } from '@/hooks/use-watches'
import { useSub } from '@/hooks/use-subscription'
import { useChatDrawer } from '@/providers/chat-provider'
import { WatchCard } from '@/components/watch-card'
import { CategoryFilter, watchCategory } from '@/components/category-filter'
import { Skeleton } from '@/components/ui/skeleton'
import { watchLimit } from '@/lib/utils'

export default function DashboardPage() {
  const router = useRouter()
  const { watches, loading } = useWatches()
  const { tier } = useSub()
  const { openChat } = useChatDrawer()
  const [category, setCategory] = useState('')

  const limit = watchLimit(tier)
  const activeWatches = watches.filter((w) => w.status !== 'deleted')
  const triggeredWatches = activeWatches.filter((w) => w.triggered)
  const filteredWatches = category
    ? activeWatches.filter((w) => watchCategory(w) === category)
    : activeWatches

  return (
    <div className="space-y-6">
      {/* Title */}
      <h2 className="text-2xl font-semibold font-[var(--font-serif)] text-[var(--color-ink)]">
        Your Watches
      </h2>

      {/* Category filter */}
      <CategoryFilter selected={category} onChange={setCategory} watches={activeWatches} />

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-[var(--radius-md)]" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && activeWatches.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-card)] py-16 px-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-bg-deep)]">
            <Eye className="h-6 w-6 text-[var(--color-ink-light)]" />
          </div>
          <p className="mt-4 text-base font-semibold text-[var(--color-ink)]">
            No watches yet
          </p>
          <p className="mt-1 text-sm text-[var(--color-ink-mid)] text-center">
            Tell Steward what you want to watch — prices, restocks, tickets, and more.
          </p>
          <button
            onClick={openChat}
            className="mt-5 flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <MessageCircle size={18} />
            Ask Steward
          </button>
        </div>
      )}

      {/* Triggered watches */}
      {!loading && triggeredWatches.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">
              Triggered
            </h3>
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-green-light)] px-1.5 text-xs font-semibold text-[var(--color-green)]">
              {triggeredWatches.length}
            </span>
          </div>
          <div className="space-y-2">
            {triggeredWatches.map((watch) => (
              <WatchCard
                key={watch.id}
                watch={watch}
                onClick={() => router.push(`/home/watch/${watch.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All watches (filtered) */}
      {!loading && filteredWatches.length > 0 && (
        <div className="space-y-3">
          {triggeredWatches.length > 0 && (
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">
              All Watches
            </h3>
          )}
          <div className="space-y-2">
            {filteredWatches.map((watch) => (
              <WatchCard
                key={watch.id}
                watch={watch}
                onClick={() => router.push(`/home/watch/${watch.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Watch count */}
      {!loading && activeWatches.length > 0 && (
        <p className="text-center text-xs text-[var(--color-ink-light)]">
          {activeWatches.length} of {limit} watches used
        </p>
      )}
    </div>
  )
}
