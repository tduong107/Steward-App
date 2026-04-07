'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Shield,
  Star,
  ThumbsUp,
  Minus,
  AlertTriangle,
  Lock,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useWatches } from '@/hooks/use-watches'
import { useSub } from '@/hooks/use-subscription'
import { PaywallDialog } from '@/components/paywall-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { timeAgo } from '@/lib/utils'
import type { CheckResult, Watch } from '@/lib/types'

// ── Deal Rating (matches iOS DealAnalysis.swift) ──
type DealRating = 'greatDeal' | 'goodPrice' | 'fairPrice' | 'overpriced' | 'suspiciousDeal'

interface DealInsight {
  watchId: string
  watch: Watch
  currentPrice: number
  lowestPrice: number
  highestPrice: number
  averagePrice: number
  priceChange30d: number
  percentChange30d: number
  rating: DealRating
  prices: { price: number; date: string }[]
}

// ── Deal Analyzer (matches iOS DealAnalyzer) ──
function analyzeDeal(
  currentPrice: number,
  prices: { price: number; date: string }[],
): DealRating {
  if (prices.length < 2) return 'fairPrice'

  const avg = prices.reduce((s, p) => s + p.price, 0) / prices.length
  const lowest = Math.min(...prices.map((p) => p.price))
  const highest = Math.max(...prices.map((p) => p.price))
  const range = highest - lowest

  // Fake deal detection: price was jacked up then "discounted"
  if (range > 0 && highest > avg * 1.5 && currentPrice > avg * 0.9) {
    return 'suspiciousDeal'
  }

  const percentBelowAvg = avg > 0 ? ((avg - currentPrice) / avg) * 100 : 0

  if (percentBelowAvg >= 15) return 'greatDeal'
  if (percentBelowAvg >= 5) return 'goodPrice'
  if (percentBelowAvg >= -5) return 'fairPrice'
  return 'overpriced'
}

const RATING_CONFIG: Record<
  DealRating,
  { label: string; color: string; bgColor: string; icon: typeof Star; emoji: string }
> = {
  greatDeal: {
    label: 'Great Deal',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    icon: Star,
    emoji: '🌟',
  },
  goodPrice: {
    label: 'Good Price',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    icon: ThumbsUp,
    emoji: '👍',
  },
  fairPrice: {
    label: 'Fair Price',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    icon: Minus,
    emoji: '➖',
  },
  overpriced: {
    label: 'Overpriced',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    icon: TrendingUp,
    emoji: '📈',
  },
  suspiciousDeal: {
    label: 'Suspicious Deal',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    icon: AlertTriangle,
    emoji: '⚠️',
  },
}

// ── Mini sparkline chart (SVG) ──
function Sparkline({
  prices,
  low,
  high,
  current,
}: {
  prices: number[]
  low: number
  high: number
  current: number
}) {
  if (prices.length < 2) return null
  const width = 120
  const height = 40
  const padding = 4
  const range = high - low || 1

  const points = prices.map((p, i) => {
    const x = padding + (i / (prices.length - 1)) * (width - padding * 2)
    const y = padding + (1 - (p - low) / range) * (height - padding * 2)
    return `${x},${y}`
  })

  const isDown = prices.length >= 2 && prices[prices.length - 1] < prices[0]
  const strokeColor = isDown ? '#10b981' : '#f97316'

  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Current price dot */}
      <circle
        cx={padding + ((prices.length - 1) / (prices.length - 1)) * (width - padding * 2)}
        cy={padding + (1 - (current - low) / range) * (height - padding * 2)}
        r="3"
        fill={strokeColor}
      />
    </svg>
  )
}

export default function PriceInsightsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { watches } = useWatches()
  const { tier } = useSub()
  const [checkResults, setCheckResults] = useState<CheckResult[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaywall, setShowPaywall] = useState(false)
  const supabaseRef = useRef(createClient())

  // Gate for free users
  const isFree = tier === 'free'

  useEffect(() => {
    if (isFree) {
      setShowPaywall(true)
      setLoading(false)
    }
  }, [isFree])

  // Filter to price-related watches
  const priceWatches = useMemo(
    () =>
      watches.filter(
        (w) =>
          w.status !== 'deleted' &&
          (w.action_type === 'price' ||
            w.condition?.toLowerCase().includes('price') ||
            w.action_label?.toLowerCase().includes('price')),
      ),
    [watches],
  )

  // Fetch check results
  useEffect(() => {
    if (!user || priceWatches.length === 0 || isFree) {
      setLoading(false)
      return
    }

    const fetchResults = async () => {
      setLoading(true)
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 90)
      const cutoffStr = cutoff.toISOString()

      const promises = priceWatches.map(async (w) => {
        const { data } = await supabaseRef.current
          .from('check_results')
          .select('id, watch_id, price, checked_at')
          .eq('watch_id', w.id)
          .not('price', 'is', null)
          .gte('checked_at', cutoffStr)
          .order('checked_at', { ascending: true })
        return (data as CheckResult[]) ?? []
      })

      const results = await Promise.all(promises)
      setCheckResults(results.flat())
      setLoading(false)
    }

    fetchResults()
  }, [user, priceWatches, isFree])

  // Build deal insights per watch
  const insights = useMemo(() => {
    const watchMap = new Map(priceWatches.map((w) => [w.id, w]))
    const resultsByWatch = new Map<string, { price: number; date: string }[]>()

    for (const cr of checkResults) {
      if (cr.price === null || cr.price === undefined) continue
      const list = resultsByWatch.get(cr.watch_id) || []
      list.push({ price: cr.price, date: cr.checked_at })
      resultsByWatch.set(cr.watch_id, list)
    }

    const items: DealInsight[] = []
    for (const [watchId, prices] of resultsByWatch) {
      const watch = watchMap.get(watchId)
      if (!watch || prices.length < 2) continue

      const priceValues = prices.map((p) => p.price)
      const currentPrice = priceValues[priceValues.length - 1]
      const lowestPrice = Math.min(...priceValues)
      const highestPrice = Math.max(...priceValues)
      const averagePrice = priceValues.reduce((s, p) => s + p, 0) / priceValues.length

      // 30-day change
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const recentPrices = prices.filter((p) => new Date(p.date) >= thirtyDaysAgo)
      const oldPrice = recentPrices.length > 0 ? recentPrices[0].price : priceValues[0]
      const priceChange30d = currentPrice - oldPrice
      const percentChange30d = oldPrice > 0 ? (priceChange30d / oldPrice) * 100 : 0

      const rating = analyzeDeal(currentPrice, prices)

      items.push({
        watchId,
        watch,
        currentPrice,
        lowestPrice,
        highestPrice,
        averagePrice,
        priceChange30d,
        percentChange30d,
        rating,
        prices,
      })
    }

    // Sort: great deals first, then by biggest % drop
    items.sort((a, b) => {
      const ratingOrder: DealRating[] = ['greatDeal', 'goodPrice', 'fairPrice', 'overpriced', 'suspiciousDeal']
      const aIdx = ratingOrder.indexOf(a.rating)
      const bIdx = ratingOrder.indexOf(b.rating)
      if (aIdx !== bIdx) return aIdx - bIdx
      return a.percentChange30d - b.percentChange30d
    })

    return items
  }, [checkResults, priceWatches])

  // Summary stats
  const summaryStats = useMemo(() => {
    const ratingCounts: Record<DealRating, number> = {
      greatDeal: 0,
      goodPrice: 0,
      fairPrice: 0,
      overpriced: 0,
      suspiciousDeal: 0,
    }
    for (const i of insights) {
      ratingCounts[i.rating]++
    }
    const avgChange =
      insights.length > 0
        ? insights.reduce((s, i) => s + i.percentChange30d, 0) / insights.length
        : 0
    return { ratingCounts, avgChange, trackingCount: insights.length }
  }, [insights])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--color-ink)]">
            Price Insights
          </h2>
          <BarChart3 size={20} className="text-[var(--color-accent)]" />
        </div>
        <p className="mt-1 text-sm text-[var(--color-ink-mid)]">
          Deal quality analysis & price trends for your watches
        </p>
      </div>

      {/* Free user overlay */}
      {isFree && (
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-card)] py-16 px-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-bg-deep)]">
            <Lock className="h-6 w-6 text-[var(--color-ink-light)]" />
          </div>
          <p className="mt-4 text-base font-semibold text-[var(--color-ink)]">
            Unlock Price Insights
          </p>
          <p className="mt-1 text-sm text-[var(--color-ink-mid)] text-center max-w-xs">
            Upgrade to Pro to see deal quality ratings, price history charts, and trend analysis for all your watches.
          </p>
          <button
            onClick={() => setShowPaywall(true)}
            className="mt-5 flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-95"
          >
            <BarChart3 size={16} />
            Upgrade to Pro
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && !isFree && (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {!loading && !isFree && (
        <>
          {/* ── Summary Card (matches iOS summaryCard) ── */}
          {insights.length > 0 && (
            <Card className="overflow-hidden border-[var(--color-accent)]/20">
              <CardContent className="space-y-4 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-mid)]">
                      Tracking
                    </p>
                    <p className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">
                      {summaryStats.trackingCount} price{summaryStats.trackingCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-mid)]">
                      30-Day Avg
                    </p>
                    <div className="flex items-center gap-1 justify-end">
                      {summaryStats.avgChange <= 0 ? (
                        <ArrowDownRight size={16} className="text-emerald-500" />
                      ) : (
                        <ArrowUpRight size={16} className="text-orange-500" />
                      )}
                      <span
                        className={`text-lg font-bold ${
                          summaryStats.avgChange <= 0 ? 'text-emerald-500' : 'text-orange-500'
                        }`}
                      >
                        {Math.abs(summaryStats.avgChange).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rating distribution badges */}
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(summaryStats.ratingCounts) as [DealRating, number][])
                    .filter(([, count]) => count > 0)
                    .map(([rating, count]) => {
                      const config = RATING_CONFIG[rating]
                      return (
                        <div
                          key={rating}
                          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${config.bgColor}`}
                        >
                          <span className="text-xs">{config.emoji}</span>
                          <span className={`text-[11px] font-semibold ${config.color}`}>
                            {count} {config.label}
                          </span>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Deal Rating Legend (matches iOS) ── */}
          {insights.length > 0 && (
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-mid)] mb-3">
                Deal Rating Guide
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(RATING_CONFIG) as [DealRating, typeof RATING_CONFIG[DealRating]][]).map(
                  ([key, config]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-sm">{config.emoji}</span>
                      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {/* ── Per-Watch Price Insights (matches iOS priceRows) ── */}
          {insights.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold tracking-tight text-[var(--color-ink)]">
                Your Watches
              </h3>

              {insights.map((insight) => {
                const config = RATING_CONFIG[insight.rating]
                const isDown = insight.priceChange30d < 0
                const isAtLow = Math.abs(insight.currentPrice - insight.lowestPrice) < 0.01
                const isAtHigh = Math.abs(insight.currentPrice - insight.highestPrice) < 0.01

                return (
                  <Card
                    key={insight.watchId}
                    className="cursor-pointer transition-all hover:shadow-md hover:border-[var(--color-accent-mid)]"
                    onClick={() => router.push(`/home/watch/${insight.watchId}`)}
                  >
                    <CardContent className="py-3 space-y-3">
                      {/* Top: emoji + name + rating badge */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-bg-deep)]">
                          <span className="text-lg">{insight.watch.emoji || '👀'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                            {insight.watch.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.bgColor} ${config.color}`}>
                              {config.emoji} {config.label}
                            </span>
                            {isAtLow && (
                              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                                Low
                              </span>
                            )}
                            {isAtHigh && (
                              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-500">
                                High
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Current price */}
                        <div className="shrink-0 text-right">
                          <p className="text-base font-bold text-[var(--color-ink)]">
                            ${insight.currentPrice.toFixed(2)}
                          </p>
                          <div className={`flex items-center gap-0.5 justify-end text-[11px] font-medium ${isDown ? 'text-emerald-500' : insight.priceChange30d > 0 ? 'text-orange-500' : 'text-[var(--color-ink-light)]'}`}>
                            {isDown ? (
                              <ArrowDownRight size={12} />
                            ) : insight.priceChange30d > 0 ? (
                              <ArrowUpRight size={12} />
                            ) : null}
                            {insight.priceChange30d !== 0
                              ? `${Math.abs(insight.percentChange30d).toFixed(1)}%`
                              : 'No change'}
                          </div>
                        </div>
                      </div>

                      {/* Sparkline chart */}
                      <div className="flex items-center gap-3">
                        <Sparkline
                          prices={insight.prices.map((p) => p.price)}
                          low={insight.lowestPrice}
                          high={insight.highestPrice}
                          current={insight.currentPrice}
                        />
                        <div className="flex-1 flex items-center justify-between text-[10px] text-[var(--color-ink-light)]">
                          <div>
                            <span className="block font-medium">Low</span>
                            <span className="text-emerald-500 font-semibold">
                              ${insight.lowestPrice.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="block font-medium">Avg</span>
                            <span className="font-semibold text-[var(--color-ink-mid)]">
                              ${insight.averagePrice.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="block font-medium">High</span>
                            <span className="text-orange-500 font-semibold">
                              ${insight.highestPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Empty state */}
          {!loading && insights.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-card)] py-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-bg-deep)]">
                <BarChart3 className="h-5 w-5 text-[var(--color-ink-light)]" />
              </div>
              <p className="mt-3 text-sm font-medium text-[var(--color-ink)]">
                No price data yet
              </p>
              <p className="mt-1 text-xs text-[var(--color-ink-mid)] text-center max-w-xs">
                When Steward collects enough price data from your watches, deal ratings and trends will appear here.
              </p>
            </div>
          )}
        </>
      )}

      {/* Paywall dialog */}
      <PaywallDialog open={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  )
}
