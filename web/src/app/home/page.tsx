'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Eye,
  ArrowUpRight,
  ChevronRight,
  TrendingDown,
  BarChart3,
  Lock,
  Plus,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useWatches } from '@/hooks/use-watches'
import { useSub } from '@/hooks/use-subscription'
import { useChatDrawer } from '@/providers/chat-provider'
import { WatchCard } from '@/components/watch-card'
import { CategoryFilter, watchCategory } from '@/components/category-filter'
import { Skeleton } from '@/components/ui/skeleton'
import { watchLimit } from '@/lib/utils'
import type { CheckResult } from '@/lib/types'

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile } = useAuth()
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

  // --- Savings data for preview card ---
  const supabaseRef = useRef(createClient())
  const [checkResults, setCheckResults] = useState<CheckResult[]>([])

  useEffect(() => {
    if (!user || watches.length === 0) return

    const fetchResults = async () => {
      const watchIds = watches.map((w) => w.id)
      const { data } = await supabaseRef.current
        .from('check_results')
        .select('*')
        .in('watch_id', watchIds)
        .not('price', 'is', null)
        .order('checked_at', { ascending: true })
        .limit(500)

      if (data) setCheckResults(data as CheckResult[])
    }

    fetchResults()
  }, [user, watches])

  // Build savings entries by comparing sequential check prices
  const savingsData = useMemo(() => {
    const watchMap = new Map(watches.map((w) => [w.id, w]))
    const drops: { name: string; emoji: string; amount: number; date: string }[] = []
    let total = 0

    // Group by watch
    const resultsByWatch = new Map<string, CheckResult[]>()
    for (const cr of checkResults) {
      if (cr.price === null || cr.price === undefined) continue
      const list = resultsByWatch.get(cr.watch_id) || []
      list.push(cr)
      resultsByWatch.set(cr.watch_id, list)
    }

    for (const [watchId, results] of resultsByWatch) {
      const watch = watchMap.get(watchId)
      if (!watch || results.length < 2) continue

      for (let i = 1; i < results.length; i++) {
        const prev = results[i - 1]
        const curr = results[i]
        if (prev.price === null || curr.price === null) continue
        if (curr.price >= prev.price) continue

        const saved = prev.price - curr.price
        total += saved
        drops.push({
          name: watch.name,
          emoji: watch.emoji || '👀',
          amount: saved,
          date: curr.checked_at,
        })
      }
    }

    // Sort drops by date descending
    drops.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return { total, drops: drops.slice(0, 2) }
  }, [checkResults, watches])

  // Price watches for insights card
  const priceWatchCount = useMemo(
    () =>
      activeWatches.filter(
        (w) =>
          w.action_type === 'price' ||
          w.condition?.toLowerCase().includes('price') ||
          w.action_label?.toLowerCase().includes('price'),
      ).length,
    [activeWatches],
  )

  const firstName = profile?.display_name?.split(' ')[0] || 'there'

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="animate-fade-in-up">
        <h2 className="text-2xl font-semibold font-[var(--font-serif)] text-[var(--color-ink)]">
          Hello, {firstName}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-ink-mid)]">
          {activeWatches.length === 0
            ? 'Let Steward watch the web for you.'
            : `${activeWatches.length} watch${activeWatches.length === 1 ? '' : 'es'} active`}
        </p>
      </div>

      {/* ── Ask Steward — prominent chat prompt bar (matches iOS) ── */}
      <button
        onClick={openChat}
        className="group flex w-full items-center gap-3 rounded-2xl border-[1.5px] border-[var(--color-accent-mid)] bg-[var(--color-bg-card)] px-4 py-3.5 text-left transition-all duration-200 hover:bg-[var(--color-accent-light)] hover:shadow-md hover:border-[var(--color-accent)] animate-fade-in-up [animation-delay:100ms] cursor-pointer"
      >
        <Image
          src="/steward-logo.png"
          alt=""
          width={36}
          height={36}
          className="rounded-[10px] shrink-0 transition-transform duration-200 group-hover:scale-105"
        />
        <span className="flex-1 text-sm text-[var(--color-ink-mid)]">
          Ask Steward to watch something...
        </span>
        <ArrowUpRight
          size={16}
          className="shrink-0 text-[var(--color-accent-mid)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </button>

      {/* ── Triggered Alerts ── */}
      {!loading && triggeredWatches.length > 0 && (
        <div className="space-y-3 animate-fade-in-up [animation-delay:150ms]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">
              Triggered
            </h3>
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-green-light)] px-1.5 text-xs font-semibold text-[var(--color-green)] animate-pulse-dot">
              {triggeredWatches.length}
            </span>
          </div>
          <div className="space-y-2">
            {triggeredWatches.map((watch, i) => (
              <div
                key={watch.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${200 + i * 60}ms` }}
              >
                <WatchCard
                  watch={watch}
                  onClick={() => router.push(`/home/watch/${watch.id}`)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Savings Preview Card (matches iOS savingsPreviewCard) ── */}
      {!loading && (savingsData.total > 0 || savingsData.drops.length > 0) && (
        <button
          type="button"
          onClick={() => router.push('/home/savings')}
          className="w-full text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[var(--color-accent-mid)] animate-fade-in-up [animation-delay:200ms] cursor-pointer"
        >
          {/* Top row: title + potential savings */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent-light)]">
                <TrendingDown size={16} className="text-[var(--color-accent)]" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-mid)]">
                  Potential Savings
                </p>
                <p className="text-lg font-bold font-[var(--font-serif)] text-[var(--color-accent)]">
                  ${savingsData.total.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Recent price drops */}
          {savingsData.drops.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {savingsData.drops.map((drop, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span>{drop.emoji}</span>
                  <span className="flex-1 truncate text-[var(--color-ink-mid)]">
                    {drop.name}
                  </span>
                  <span className="font-semibold text-[var(--color-accent)]">
                    ↓ ${drop.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-3 flex items-center gap-1 border-t border-[var(--color-border)] pt-3">
            <span className="text-xs font-medium text-[var(--color-accent)]">
              View all savings
            </span>
            <ChevronRight size={12} className="text-[var(--color-accent-mid)]" />
          </div>
        </button>
      )}

      {/* ── Price Insights Card (matches iOS priceInsightsCard) ── */}
      {!loading && priceWatchCount > 0 && (
        <button
          type="button"
          onClick={() =>
            tier === 'free'
              ? router.push('/home/settings')
              : router.push('/home/savings')
          }
          className="w-full text-left flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[var(--color-accent-mid)] animate-fade-in-up [animation-delay:250ms] cursor-pointer"
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
              tier === 'free'
                ? 'bg-[var(--color-bg-deep)]'
                : 'bg-[var(--color-accent-light)]'
            }`}
          >
            <BarChart3
              size={18}
              className={
                tier === 'free'
                  ? 'text-[var(--color-ink-light)]'
                  : 'text-[var(--color-accent)]'
              }
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className={`text-sm font-semibold ${
                  tier === 'free'
                    ? 'text-[var(--color-ink-mid)]'
                    : 'text-[var(--color-ink)]'
                }`}
              >
                Price Insights
              </span>
              {tier === 'free' && (
                <Lock size={11} className="text-[var(--color-ink-light)]" />
              )}
            </div>
            <p className="text-[11px] text-[var(--color-ink-light)]">
              {tier === 'free'
                ? 'Upgrade to unlock price history & deal quality'
                : `Tracking ${priceWatchCount} price watch${priceWatchCount === 1 ? '' : 'es'}`}
            </p>
          </div>
          {tier === 'free' ? (
            <span className="shrink-0 rounded-full bg-[var(--color-accent)] px-2.5 py-1 text-[10px] font-bold text-white">
              PRO
            </span>
          ) : (
            <ChevronRight size={14} className="shrink-0 text-[var(--color-accent-mid)]" />
          )}
        </button>
      )}

      {/* ── Category Filter ── */}
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
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-card)] py-16 px-6 animate-fade-in-up [animation-delay:200ms]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-bg-deep)] animate-float">
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
            className="mt-5 flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-95"
          >
            <Image
              src="/steward-logo.png"
              alt=""
              width={20}
              height={20}
              className="rounded-md"
            />
            Ask Steward
          </button>
        </div>
      )}

      {/* ── All Watches (filtered) ── */}
      {!loading && filteredWatches.length > 0 && (
        <div className="space-y-3">
          {triggeredWatches.length > 0 && (
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">
              All Watches
            </h3>
          )}
          <div className="space-y-2">
            {filteredWatches.map((watch, i) => (
              <div
                key={watch.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${300 + i * 50}ms` }}
              >
                <WatchCard
                  watch={watch}
                  onClick={() => router.push(`/home/watch/${watch.id}`)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Add Watch Card (matches iOS addWatchCard) ── */}
      {!loading && activeWatches.length > 0 && activeWatches.length < limit && (
        <button
          type="button"
          onClick={openChat}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-border)] bg-transparent py-4 text-sm font-medium text-[var(--color-ink-mid)] transition-all duration-200 hover:border-[var(--color-accent-mid)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-light)] cursor-pointer animate-fade-in-up"
          style={{ animationDelay: `${350 + filteredWatches.length * 50}ms` }}
        >
          <Plus size={16} />
          Add a watch
        </button>
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
