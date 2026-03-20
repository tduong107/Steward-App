'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { PiggyBank, TrendingDown, ArrowDownRight, ArrowUpRight, ArrowRight, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useWatches } from '@/hooks/use-watches'
import type { CheckResult } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { timeAgo } from '@/lib/utils'

// ── Milestone tiers (matches iOS SavingsTracker.swift) ──
const milestones = [
  { amount: 5, label: 'First Sprout', emoji: '🌱' },
  { amount: 15, label: 'Growing Saver', emoji: '🌿' },
  { amount: 50, label: 'Money Tree', emoji: '🌳' },
  { amount: 100, label: 'Big Saver', emoji: '💰' },
  { amount: 250, label: 'Champion', emoji: '🏆' },
  { amount: 500, label: 'Sharpshooter', emoji: '🎯' },
  { amount: 1000, label: 'Royalty', emoji: '👑' },
]

function currentMilestone(amount: number) {
  return [...milestones].reverse().find((m) => amount >= m.amount) ?? null
}
function nextMilestone(amount: number) {
  return milestones.find((m) => amount < m.amount) ?? null
}
function milestoneProgress(amount: number) {
  const curr = currentMilestone(amount)
  const next = nextMilestone(amount)
  if (!next) return 1
  const base = curr?.amount ?? 0
  const range = next.amount - base
  return range > 0 ? Math.min(1, (amount - base) / range) : 0
}

// ── Types ──
interface WatchSavings {
  watchId: string
  watchEmoji: string
  watchName: string
  highestPrice: number
  currentPrice: number
  saved: number
}

interface PriceChange {
  id: string
  watchId: string
  watchEmoji: string
  watchName: string
  oldPrice: number
  newPrice: number
  date: string
  priceDifference: number
  percentChange: number
  isDecrease: boolean
}

type SortOption = 'newest' | 'oldest' | 'biggest' | 'name'

const rankEmoji = (i: number) => ['🥇', '🥈', '🥉'][i] ?? '•'

export default function SavingsPage() {
  const { user } = useAuth()
  const { watches } = useWatches()
  const [checkResults, setCheckResults] = useState<CheckResult[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<SortOption>('newest')
  const [sortOpen, setSortOpen] = useState(false)
  const supabaseRef = useRef(createClient())

  // Fetch all check results with prices
  useEffect(() => {
    if (!user || watches.length === 0) {
      setLoading(false)
      return
    }

    const fetchResults = async () => {
      setLoading(true)
      const watchIds = watches.map((w) => w.id)

      const { data, error } = await supabaseRef.current
        .from('check_results')
        .select('id, watch_id, price, checked_at')
        .in('watch_id', watchIds)
        .not('price', 'is', null)
        .order('checked_at', { ascending: true })
        .limit(1000)

      if (error) {
        console.error('Failed to fetch check results:', error.message)
      } else {
        setCheckResults((data as CheckResult[]) ?? [])
      }
      setLoading(false)
    }

    fetchResults()
  }, [user, watches])

  // ── Per-watch savings (iOS: highest - current) ──
  const savingsEntries = useMemo(() => {
    const watchMap = new Map(watches.map((w) => [w.id, w]))
    const entries: WatchSavings[] = []

    const resultsByWatch = new Map<string, number[]>()
    for (const cr of checkResults) {
      if (cr.price === null || cr.price === undefined) continue
      const list = resultsByWatch.get(cr.watch_id) || []
      list.push(cr.price)
      resultsByWatch.set(cr.watch_id, list)
    }

    for (const [watchId, prices] of resultsByWatch) {
      const watch = watchMap.get(watchId)
      if (!watch || prices.length < 2) continue

      const highestPrice = Math.max(...prices)
      const currentPrice = prices[prices.length - 1]
      const saved = Math.max(0, highestPrice - currentPrice)

      if (saved > 0) {
        entries.push({
          watchId,
          watchEmoji: watch.emoji || '👀',
          watchName: watch.name,
          highestPrice,
          currentPrice,
          saved,
        })
      }
    }

    entries.sort((a, b) => b.saved - a.saved)
    return entries
  }, [checkResults, watches])

  const totalSaved = useMemo(
    () => savingsEntries.reduce((sum, e) => sum + e.saved, 0),
    [savingsEntries],
  )

  // ── Price change history (iOS: consecutive price changes) ──
  const priceChanges = useMemo(() => {
    const watchMap = new Map(watches.map((w) => [w.id, w]))
    const items: PriceChange[] = []

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
        if (Math.abs(curr.price - prev.price) < 0.01) continue

        const priceDifference = curr.price - prev.price
        const percentChange = prev.price > 0 ? (priceDifference / prev.price) * 100 : 0

        items.push({
          id: `${watchId}-${i}-${curr.checked_at}`,
          watchId,
          watchEmoji: watch.emoji || '👀',
          watchName: watch.name,
          oldPrice: prev.price,
          newPrice: curr.price,
          date: curr.checked_at,
          priceDifference,
          percentChange,
          isDecrease: curr.price < prev.price,
        })
      }
    }

    return items
  }, [checkResults, watches])

  // ── Sorted price changes ──
  const sortedChanges = useMemo(() => {
    const items = [...priceChanges]
    switch (sort) {
      case 'newest':
        return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      case 'oldest':
        return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      case 'biggest':
        return items.sort((a, b) => Math.abs(b.priceDifference) - Math.abs(a.priceDifference))
      case 'name':
        return items.sort((a, b) => a.watchName.localeCompare(b.watchName))
    }
  }, [priceChanges, sort])

  const sortLabels: Record<SortOption, string> = {
    newest: 'Newest',
    oldest: 'Oldest',
    biggest: 'Biggest Savings',
    name: 'Watch Name',
  }

  const milestone = currentMilestone(totalSaved)
  const next = nextMilestone(totalSaved)
  const progress = milestoneProgress(totalSaved)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold font-[var(--font-serif)] text-[var(--color-ink)]">
            Potential Savings
          </h2>
          <span className="text-[var(--color-accent)]">✦</span>
        </div>
        <p className="mt-1 text-sm text-[var(--color-ink-mid)]">
          Prices Steward caught dropping for you
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {!loading && (
        <>
          {/* ── Milestone Card (matches iOS SavingsMilestoneCard) ── */}
          <Card className="overflow-hidden border-[var(--color-accent)]/20">
            <CardContent className="space-y-4 py-5">
              {/* Top row: milestone badge + total + rank badge */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-light)]">
                  <span className="text-2xl">{milestone?.emoji ?? '✨'}</span>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-mid)]">
                    Potential Savings
                  </p>
                  <p className="text-2xl font-bold font-[var(--font-serif)] text-[var(--color-accent)]">
                    ${totalSaved.toFixed(2)}
                  </p>
                </div>
                {milestone && (
                  <div className="flex flex-col items-center gap-0.5 rounded-[var(--radius-md)] border border-[var(--color-accent)]/20 bg-[var(--color-accent-light)] px-3 py-1.5">
                    <span className="text-xs">{milestone.emoji}</span>
                    <span className="text-[9px] font-bold text-[var(--color-accent)]">
                      {milestone.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-deep)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)]/60 via-[var(--color-accent)] to-[var(--color-green)] transition-all duration-700"
                    style={{ width: `${Math.max(2, progress * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-medium">
                  {milestone ? (
                    <span className="text-[var(--color-accent)]">
                      {milestone.emoji} ${milestone.amount}
                    </span>
                  ) : (
                    <span className="text-[var(--color-ink-light)]">$0</span>
                  )}
                  {next ? (
                    <span className="text-[var(--color-ink-light)]">
                      Next: {next.emoji} ${next.amount}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[var(--color-accent)]">
                      ✦ All milestones reached!
                    </span>
                  )}
                </div>
              </div>

              {/* Top 3 watch breakdown with rank */}
              {savingsEntries.length > 0 && (
                <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-deep)]/50 p-3 space-y-2">
                  {savingsEntries.slice(0, 3).map((entry, i) => (
                    <div key={entry.watchId} className="flex items-center gap-2.5">
                      <span className="text-sm">{rankEmoji(i)}</span>
                      <span className="text-sm">{entry.watchEmoji}</span>
                      <span className="flex-1 truncate text-xs font-medium text-[var(--color-ink)]">
                        {entry.watchName}
                      </span>
                      <span className="text-xs font-bold text-[var(--color-green)]">
                        -${entry.saved.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Branding footer */}
              <div className="flex items-center justify-between text-[10px] text-[var(--color-ink-light)]">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-3.5 w-3.5 items-center justify-center rounded bg-[var(--color-accent)] text-[7px] font-bold text-white">
                    S
                  </div>
                  <span className="font-medium">Steward</span>
                </div>
                <span>Prices tracked automatically</span>
              </div>
            </CardContent>
          </Card>

          {/* ── Price Changes Section (matches iOS) ── */}
          {sortedChanges.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold font-[var(--font-serif)] text-[var(--color-ink)]">
                  Price Changes
                </h3>
                {/* Sort dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSortOpen(!sortOpen)}
                    className="flex items-center gap-1 rounded-full bg-[var(--color-accent-light)] px-3 py-1.5 text-[11px] font-semibold text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent-light)]/80"
                  >
                    <ArrowDownRight className="h-2.5 w-2.5" />
                    {sortLabels[sort]}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {sortOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                      <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-card)] py-1 shadow-lg">
                        {(Object.entries(sortLabels) as [SortOption, string][]).map(([key, label]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => { setSort(key); setSortOpen(false) }}
                            className={`flex w-full items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-[var(--color-bg-deep)] ${
                              sort === key
                                ? 'font-semibold text-[var(--color-accent)]'
                                : 'text-[var(--color-ink)]'
                            }`}
                          >
                            {label}
                            {sort === key && <span className="text-[var(--color-accent)]">✓</span>}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Price change rows */}
              <div className="space-y-2">
                {sortedChanges.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="flex items-center gap-3 py-3">
                      {/* Watch emoji */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-bg-deep)]">
                        <span className="text-lg">{item.watchEmoji}</span>
                      </div>

                      {/* Name + date */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                          {item.watchName}
                        </p>
                        <p className="text-[11px] text-[var(--color-ink-light)]">
                          {timeAgo(item.date)}
                        </p>
                      </div>

                      {/* Price change + percent */}
                      <div className="shrink-0 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-xs text-[var(--color-ink-light)] line-through">
                            ${item.oldPrice.toFixed(2)}
                          </span>
                          <ArrowRight className="h-2.5 w-2.5 text-[var(--color-ink-light)]" />
                          <span
                            className={`text-sm font-semibold ${
                              item.isDecrease ? 'text-[var(--color-green)]' : 'text-[var(--color-red,#ef4444)]'
                            }`}
                          >
                            ${item.newPrice.toFixed(2)}
                          </span>
                        </div>
                        <div
                          className={`flex items-center gap-0.5 justify-end text-[11px] font-medium ${
                            item.isDecrease ? 'text-[var(--color-green)]' : 'text-[var(--color-red,#ef4444)]'
                          }`}
                        >
                          {item.isDecrease ? (
                            <ArrowDownRight className="h-3 w-3" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3" />
                          )}
                          {Math.abs(item.percentChange).toFixed(1)}%
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Empty state */}
          {savingsEntries.length === 0 && sortedChanges.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-card)] py-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-bg-deep)]">
                <TrendingDown className="h-5 w-5 text-[var(--color-ink-light)]" />
              </div>
              <p className="mt-3 text-sm font-medium text-[var(--color-ink)]">
                No price changes yet
              </p>
              <p className="mt-1 text-xs text-[var(--color-ink-mid)]">
                When Steward detects price changes on your watches, they&apos;ll appear here.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
