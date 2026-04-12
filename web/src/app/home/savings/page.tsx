'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { PiggyBank, TrendingDown, ArrowDownRight, ArrowUpRight, ArrowRight, ChevronDown, Sparkles } from 'lucide-react'
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
  watchImageUrl: string | null
  watchName: string
  highestPrice: number
  currentPrice: number
  saved: number
}

interface PriceChange {
  id: string
  watchId: string
  watchEmoji: string
  watchImageUrl: string | null
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

// ── Animated number (ref-based, no re-renders) ──
function AnimatedNumber({ value, duration = 1400, prefix = '', suffix = '', decimals = 0 }: { value: number; duration?: number; prefix?: string; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!ref.current || value === 0) return
    const start = performance.now()
    let frame: number
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = eased * value
      if (ref.current) ref.current.textContent = `${prefix}${decimals > 0 ? current.toFixed(decimals) : Math.round(current).toLocaleString()}${suffix}`
      if (progress < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [value, duration, prefix, suffix, decimals])
  return <span ref={ref}>{prefix}0{suffix}</span>
}

export default function SavingsPage() {
  const { user } = useAuth()
  const { watches } = useWatches()
  const [checkResults, setCheckResults] = useState<CheckResult[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<SortOption>('newest')
  const [sortOpen, setSortOpen] = useState(false)
  const supabaseRef = useRef(createClient())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Filter to price-related watches only (matches iOS logic)
  const priceWatches = useMemo(
    () =>
      watches.filter(
        (w) =>
          w.action_type === 'price' ||
          w.condition?.toLowerCase().includes('price') ||
          w.action_label?.toLowerCase().includes('price'),
      ),
    [watches],
  )

  // Fetch check results per watch (no global limit — matches iOS per-watch fetch)
  useEffect(() => {
    if (!user || priceWatches.length === 0) {
      setLoading(false)
      return
    }

    const fetchResults = async () => {
      setLoading(true)

      // Calculate 90-day cutoff (matches iOS 90-day window)
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 90)
      const cutoffStr = cutoff.toISOString()

      // Fetch per watch concurrently (matches iOS concurrent TaskGroup approach)
      const allResults: CheckResult[] = []
      const promises = priceWatches.map(async (w) => {
        const { data, error } = await supabaseRef.current
          .from('check_results')
          .select('id, watch_id, price, checked_at')
          .eq('watch_id', w.id)
          .not('price', 'is', null)
          .gte('checked_at', cutoffStr)
          .order('checked_at', { ascending: true })

        if (!error && data) return data as CheckResult[]
        return []
      })

      const results = await Promise.all(promises)
      for (const batch of results) allResults.push(...batch)

      setCheckResults(allResults)
      setLoading(false)
    }

    fetchResults()
  }, [user, priceWatches])

  // ── Per-watch savings (iOS: highest - current) ──
  const savingsEntries = useMemo(() => {
    const watchMap = new Map(priceWatches.map((w) => [w.id, w]))
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
          watchImageUrl: watch.image_url || null,
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
    const watchMap = new Map(priceWatches.map((w) => [w.id, w]))
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
          watchImageUrl: watch.image_url || null,
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

  const animatedProgressValue = mounted && !loading ? progress * 100 : 0

  return (
    <div className="sv-page space-y-8 pb-28">
      {/* ===== HERO HEADER ===== */}
      <div className="sv-fade-slide-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent)]/70 shadow-lg shadow-[var(--color-accent)]/20">
            <PiggyBank className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--color-ink)]">
              Potential Savings
            </h2>
            <p className="text-sm text-[var(--color-ink-mid)]">
              Prices Steward caught dropping for you
            </p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-56 w-full rounded-[var(--radius-xl)]" />
          <Skeleton className="h-16 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-16 w-full rounded-[var(--radius-lg)]" />
        </div>
      )}

      {!loading && (
        <>
          {/* ===== SAVINGS HERO CARD ===== */}
          <div
            className="sv-fade-slide-up sv-hero-card relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-accent)]/20 bg-[var(--color-bg-card)] shadow-[var(--shadow-lg)]"
            style={{ animationDelay: '0.1s' }}
          >
            {/* Gradient accent strip at top */}
            <div className="h-1 w-full bg-gradient-to-r from-[var(--color-accent)]/60 via-[var(--color-accent)] to-[var(--color-green)]" />

            {/* Ambient glow */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-[var(--color-accent)]/8 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-[var(--color-green)]/6 blur-3xl" />

            <div className="relative space-y-5 p-6">
              {/* Top row: milestone badge + total + rank badge */}
              <div className="flex items-center gap-4">
                <div className="sv-pulse-glow flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-accent-light)] to-[var(--color-accent-light)]/50 shadow-inner">
                  <span className="text-3xl">{milestone?.emoji ?? '✨'}</span>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-ink-mid)]">
                    Potential Savings
                  </p>
                  <p className="sv-total-amount text-3xl font-extrabold tracking-tight text-[var(--color-accent)]">
                    {mounted && !loading ? <AnimatedNumber value={totalSaved} duration={1400} prefix="$" decimals={2} /> : '$0.00'}
                  </p>
                </div>
                {milestone && (
                  <div className="sv-milestone-badge flex flex-col items-center gap-1 rounded-2xl border border-[var(--color-accent)]/20 bg-gradient-to-b from-[var(--color-accent-light)] to-[var(--color-accent-light)]/40 px-4 py-2 shadow-sm">
                    <span className="text-base">{milestone.emoji}</span>
                    <span className="text-[9px] font-bold tracking-wide text-[var(--color-accent)]">
                      {milestone.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Animated progress bar */}
              <div className="space-y-2">
                <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--color-bg-deep)] shadow-inner">
                  <div
                    className="sv-progress-bar h-full rounded-full bg-gradient-to-r from-[var(--color-accent)]/60 via-[var(--color-accent)] to-[var(--color-green)] shadow-[0_0_12px_var(--color-accent)/30]"
                    style={{ width: `${Math.max(2, animatedProgressValue)}%` }}
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
                      <Sparkles className="h-3 w-3" /> All milestones reached!
                    </span>
                  )}
                </div>
              </div>

              {/* Top 3 watch breakdown with rank */}
              {savingsEntries.length > 0 && (
                <div className="space-y-1.5 rounded-2xl bg-[var(--color-bg-deep)]/50 p-4 backdrop-blur-sm">
                  {savingsEntries.slice(0, 3).map((entry, i) => (
                    <div
                      key={entry.watchId}
                      className="sv-fade-slide-up flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-[var(--color-bg-card)]/60"
                      style={{ animationDelay: `${0.3 + i * 0.1}s` }}
                    >
                      <span className="text-sm">{rankEmoji(i)}</span>
                      {entry.watchImageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={entry.watchImageUrl} alt="" loading="lazy" className="h-6 w-6 rounded-lg object-cover shrink-0 shadow-sm" />
                      ) : (
                        <span className="text-sm">{entry.watchEmoji}</span>
                      )}
                      <span className="flex-1 truncate text-xs font-medium text-[var(--color-ink)]">
                        {entry.watchName}
                      </span>
                      {/* Mini savings bar */}
                      <div className="hidden sm:block h-1.5 w-16 overflow-hidden rounded-full bg-[var(--color-bg-deep)]">
                        <div
                          className="h-full rounded-full bg-[var(--color-green)]/60"
                          style={{ width: `${totalSaved > 0 ? Math.min(100, (entry.saved / totalSaved) * 100) : 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-[var(--color-green)]">
                        -${entry.saved.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Branding footer */}
              <div className="flex items-center justify-between border-t border-[var(--color-border)]/50 pt-4 text-[10px] text-[var(--color-ink-light)]">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-4 w-4 items-center justify-center rounded-md bg-[var(--color-accent)] text-[7px] font-bold text-white shadow-sm">
                    S
                  </div>
                  <span className="font-medium">Steward</span>
                </div>
                <span>Prices tracked automatically</span>
              </div>
            </div>
          </div>

          {/* ===== PRICE CHANGES TIMELINE ===== */}
          {sortedChanges.length > 0 && (
            <>
              <div className="sv-fade-slide-up flex items-center justify-between" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-[var(--color-accent)]" />
                  <h3 className="text-lg font-bold tracking-tight text-[var(--color-ink)]">
                    Price Changes
                  </h3>
                  <span className="rounded-full bg-[var(--color-accent-light)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-accent)]">
                    {sortedChanges.length}
                  </span>
                </div>
                {/* Sort dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSortOpen(!sortOpen)}
                    className="flex items-center gap-1.5 rounded-full bg-[var(--color-bg-card)] border border-[var(--color-border)] px-3.5 py-2 text-[11px] font-semibold text-[var(--color-accent)] shadow-sm transition-all hover:shadow-md hover:border-[var(--color-accent)]/30"
                  >
                    <ArrowDownRight className="h-3 w-3" />
                    {sortLabels[sort]}
                    <ChevronDown className={`h-3 w-3 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {sortOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                      <div className="absolute right-0 top-full z-20 mt-1.5 w-44 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] py-1 shadow-xl backdrop-blur-lg">
                        {(Object.entries(sortLabels) as [SortOption, string][]).map(([key, label]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => { setSort(key); setSortOpen(false) }}
                            className={`flex w-full items-center justify-between px-4 py-2.5 text-xs transition-all hover:bg-[var(--color-bg-deep)] ${
                              sort === key
                                ? 'font-semibold text-[var(--color-accent)] bg-[var(--color-accent-light)]/50'
                                : 'text-[var(--color-ink)]'
                            }`}
                          >
                            {label}
                            {sort === key && <span className="text-[var(--color-accent)]">&#10003;</span>}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Price change cards */}
              <div className="space-y-3">
                {sortedChanges.map((item, idx) => (
                  <div
                    key={item.id}
                    className="sv-fade-slide-up sv-change-card group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-sm transition-all duration-300 hover:shadow-lg hover:border-[var(--color-border)]/80 hover:-translate-y-0.5"
                    style={{ animationDelay: `${Math.min(0.25 + idx * 0.05, 1)}s` }}
                  >
                    <div className="flex items-center gap-4 p-4">
                      {/* Watch image or emoji */}
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[var(--color-bg-deep)] to-[var(--color-bg-deep)]/60 shadow-inner">
                        {item.watchImageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={item.watchImageUrl} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="text-xl">{item.watchEmoji}</span>
                          </div>
                        )}
                      </div>

                      {/* Name + date */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-accent)]">
                          {item.watchName}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[var(--color-ink-light)]">
                          {timeAgo(item.date)}
                        </p>
                      </div>

                      {/* Price change + percent badge */}
                      <div className="shrink-0 text-right space-y-1.5">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="text-xs text-[var(--color-ink-light)] line-through decoration-[var(--color-ink-light)]/50">
                            ${item.oldPrice.toFixed(2)}
                          </span>
                          <ArrowRight className="h-3 w-3 text-[var(--color-ink-light)]/60" />
                          <span
                            className={`text-sm font-bold ${
                              item.isDecrease ? 'text-[var(--color-green)]' : 'text-[var(--color-red,#ef4444)]'
                            }`}
                          >
                            ${item.newPrice.toFixed(2)}
                          </span>
                        </div>
                        <div
                          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            item.isDecrease
                              ? 'bg-[var(--color-green)]/10 text-[var(--color-green)] shadow-[0_0_8px_var(--color-green)/15]'
                              : 'bg-[var(--color-red,#ef4444)]/10 text-[var(--color-red,#ef4444)] shadow-[0_0_8px_var(--color-red,#ef4444)/15]'
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
                    </div>

                    {/* Bottom accent line on hover */}
                    <div className={`h-0.5 w-full transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${
                      item.isDecrease
                        ? 'bg-gradient-to-r from-transparent via-[var(--color-green)]/40 to-transparent'
                        : 'bg-gradient-to-r from-transparent via-[var(--color-red,#ef4444)]/40 to-transparent'
                    }`} />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Empty state */}
          {savingsEntries.length === 0 && sortedChanges.length === 0 && (
            <div
              className="sv-fade-slide-up flex flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-card)] py-16 shadow-sm"
              style={{ animationDelay: '0.15s' }}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-bg-deep)] to-[var(--color-bg-deep)]/60 shadow-inner">
                <TrendingDown className="h-7 w-7 text-[var(--color-ink-light)]" />
              </div>
              <p className="mt-4 text-sm font-semibold text-[var(--color-ink)]">
                No price changes yet
              </p>
              <p className="mt-1.5 max-w-[260px] text-center text-xs text-[var(--color-ink-mid)]">
                When Steward detects price changes on your watches, they&apos;ll appear here.
              </p>
            </div>
          )}
        </>
      )}

      {/* ===== CSS ANIMATIONS ===== */}
      <style jsx>{`
        /* Staggered fade + slide up entrance */
        .sv-fade-slide-up {
          opacity: 0;
          transform: translateY(16px);
          animation: svFadeSlideUp 0.5s ease-out forwards;
        }

        @keyframes svFadeSlideUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Hero card */

        /* Subtle glow pulse on milestone emoji */
        .sv-pulse-glow {
          animation: svPulseGlow 3s ease-in-out infinite;
        }

        @keyframes svPulseGlow {
          0%, 100% {
            box-shadow: 0 0 0 0 var(--color-accent-light);
          }
          50% {
            box-shadow: 0 0 20px 4px var(--color-accent-light);
          }
        }

        /* Milestone badge shimmer */
        .sv-milestone-badge {
          position: relative;
          overflow: hidden;
        }
        .sv-milestone-badge::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 40%,
            rgba(255, 255, 255, 0.08) 50%,
            transparent 60%
          );
          animation: svShimmer 4s ease-in-out infinite;
        }

        @keyframes svShimmer {
          0% {
            transform: translateX(-100%) rotate(0deg);
          }
          100% {
            transform: translateX(100%) rotate(0deg);
          }
        }

        /* Progress bar glow */
        .sv-progress-bar {
          position: relative;
          transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sv-progress-bar::after {
          content: '';
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 0 8px var(--color-accent);
          opacity: 0.8;
        }

        /* Total amount number glow */
        .sv-total-amount {
          text-shadow: 0 0 30px color-mix(in srgb, var(--color-accent) 20%, transparent);
        }

        /* Change card hover lift */
        .sv-change-card:hover {
          will-change: transform;
        }

        /* Page-level entry animation */
        .sv-page > * {
          animation-fill-mode: both;
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .sv-fade-slide-up {
            animation: none;
            opacity: 1;
            transform: none;
          }
          .sv-pulse-glow {
            animation: none;
          }
          .sv-milestone-badge::after {
            animation: none;
          }
          .sv-progress-bar {
            transition: none;
          }
        }
      `}</style>
    </div>
  )
}
