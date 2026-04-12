'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Star,
  ThumbsUp,
  Minus,
  AlertTriangle,
  Lock,
  Info,
  ChevronDown,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useWatches } from '@/hooks/use-watches'
import { useSub } from '@/hooks/use-subscription'
import { PaywallDialog } from '@/components/paywall-dialog'
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
  { label: string; color: string; bgColor: string; hex: string; icon: typeof Star; emoji: string }
> = {
  greatDeal: {
    label: 'Great Deal',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    hex: '#10b981',
    icon: Star,
    emoji: '\u{1F31F}',
  },
  goodPrice: {
    label: 'Good Price',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    hex: '#22c55e',
    icon: ThumbsUp,
    emoji: '\u{1F44D}',
  },
  fairPrice: {
    label: 'Fair Price',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    hex: '#3b82f6',
    icon: Minus,
    emoji: '\u2796',
  },
  overpriced: {
    label: 'Overpriced',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    hex: '#f97316',
    icon: TrendingUp,
    emoji: '\u{1F4C8}',
  },
  suspiciousDeal: {
    label: 'Suspicious Deal',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    hex: '#ef4444',
    icon: AlertTriangle,
    emoji: '\u26A0\uFE0F',
  },
}

// ── Enhanced Sparkline chart (SVG) ──
function Sparkline({
  prices,
  low,
  high,
  current,
  uniqueId,
}: {
  prices: number[]
  low: number
  high: number
  current: number
  uniqueId: string
}) {
  if (prices.length < 2) return null
  const width = 220
  const height = 52
  const padding = 6
  const range = high - low || 1

  const points = prices.map((p, i) => {
    const x = padding + (i / (prices.length - 1)) * (width - padding * 2)
    const y = padding + (1 - (p - low) / range) * (height - padding * 2)
    return { x, y }
  })

  const polylinePoints = points.map((pt) => `${pt.x},${pt.y}`).join(' ')

  // Gradient fill area
  const areaPath = [
    `M ${points[0].x},${points[0].y}`,
    ...points.slice(1).map((pt) => `L ${pt.x},${pt.y}`),
    `L ${points[points.length - 1].x},${height}`,
    `L ${points[0].x},${height}`,
    'Z',
  ].join(' ')

  const isDown = prices[prices.length - 1] < prices[0]
  const gradientId = `sparkGrad-${uniqueId}`
  const strokeColor = isDown ? '#10b981' : '#f97316'

  const lastPt = points[points.length - 1]

  return (
    <svg
      width={width}
      height={height}
      className="shrink-0"
      style={{ transition: 'all 0.3s ease' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Current price dot with glow */}
      <circle cx={lastPt.x} cy={lastPt.y} r="6" fill={strokeColor} opacity="0.2" />
      <circle cx={lastPt.x} cy={lastPt.y} r="3.5" fill={strokeColor} />
    </svg>
  )
}

// ── Price Range Bar ──
function PriceRangeBar({
  low,
  avg,
  high,
  current,
}: {
  low: number
  avg: number
  high: number
  current: number
}) {
  const range = high - low || 1
  const avgPercent = ((avg - low) / range) * 100
  const currentPercent = ((current - low) / range) * 100

  return (
    <div className="w-full space-y-1.5">
      <div className="flex justify-between text-[10px] font-medium text-[var(--color-ink-light)]">
        <span className="text-emerald-500">${low.toFixed(2)}</span>
        <span className="text-[var(--color-ink-mid)]">${avg.toFixed(2)}</span>
        <span className="text-orange-500">${high.toFixed(2)}</span>
      </div>
      <div className="relative h-2 w-full rounded-full bg-[var(--color-bg-deep)] overflow-hidden">
        {/* Gradient track */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(to right, #10b981, #3b82f6, #f97316)',
            opacity: 0.25,
          }}
        />
        {/* Average marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-[var(--color-ink-light)] opacity-40"
          style={{ left: `${avgPercent}%` }}
        />
        {/* Current price indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-white shadow-md"
          style={{
            left: `${Math.max(2, Math.min(98, currentPercent))}%`,
            transform: `translateX(-50%) translateY(-50%)`,
            background:
              currentPercent < 40 ? '#10b981' : currentPercent < 70 ? '#3b82f6' : '#f97316',
          }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-[var(--color-ink-light)]">
        <span>Low</span>
        <span>Avg</span>
        <span>High</span>
      </div>
    </div>
  )
}

// ── Deal Rating Guide Tooltip ──
function DealGuideTooltip() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-full bg-[var(--color-bg-deep)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-ink-mid)] transition-all duration-200 hover:bg-[var(--color-border)]"
      >
        <Info size={12} />
        Deal Ratings
        <ChevronDown
          size={12}
          className="transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-20 mt-2 w-72 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 shadow-xl"
          style={{
            animation: 'fade-in-up 0.25s cubic-bezier(0.25,0.46,0.45,0.94) both',
          }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-mid)] mb-3">
            Deal Rating Guide
          </p>
          <div className="space-y-2">
            {(
              Object.entries(RATING_CONFIG) as [DealRating, (typeof RATING_CONFIG)[DealRating]][]
            ).map(([key, config]) => (
              <div key={key} className="flex items-center gap-2.5">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-xs"
                  style={{ background: `${config.hex}18` }}
                >
                  {config.emoji}
                </span>
                <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
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
      const ratingOrder: DealRating[] = [
        'greatDeal',
        'goodPrice',
        'fairPrice',
        'overpriced',
        'suspiciousDeal',
      ]
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
      {/* Scoped animations */}
      <style>{`
        @keyframes pi-fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pi-glowPulse {
          0%, 100% { box-shadow: 0 0 8px var(--glow-color, transparent); }
          50% { box-shadow: 0 0 20px var(--glow-color, transparent); }
        }
        @keyframes pi-countIn {
          from { opacity: 0; transform: translateY(8px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pi-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .pi-stagger { animation: pi-fadeSlideUp 0.5s cubic-bezier(0.25,0.46,0.45,0.94) both; }
        .pi-card-hover {
          transition: transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94),
                      box-shadow 0.25s cubic-bezier(0.25,0.46,0.45,0.94),
                      border-color 0.25s ease;
        }
        .pi-card-hover:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06);
        }
        .pi-card-hover:hover .pi-card-accent {
          opacity: 1;
        }
        .pi-card-hover:hover .pi-emoji-icon {
          transform: scale(1.08);
        }
      `}</style>

      {/* Header */}
      <div className="pi-stagger" style={{ animationDelay: '0ms' }}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-mid, var(--color-accent)))',
              boxShadow: '0 4px 16px color-mix(in srgb, var(--color-accent) 30%, transparent)',
            }}
          >
            <BarChart3 size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--color-ink)]">
              Price Insights
            </h2>
            <p className="text-sm text-[var(--color-ink-mid)]">
              Deal quality analysis & price trends
            </p>
          </div>
        </div>
      </div>

      {/* Free user overlay */}
      {isFree && (
        <div
          className="pi-stagger flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--color-border)] py-16 px-6"
          style={{
            animationDelay: '100ms',
            background: 'linear-gradient(135deg, var(--color-bg-card) 0%, var(--color-bg-deep) 100%)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              background: 'linear-gradient(135deg, var(--color-bg-deep), var(--color-border))',
            }}
          >
            <Lock className="h-7 w-7 text-[var(--color-ink-light)]" />
          </div>
          <p className="mt-5 text-lg font-bold text-[var(--color-ink)]">
            Unlock Price Insights
          </p>
          <p className="mt-2 text-sm text-[var(--color-ink-mid)] text-center max-w-sm leading-relaxed">
            Upgrade to Pro to see deal quality ratings, price history charts, and trend analysis for
            all your watches.
          </p>
          <button
            onClick={() => setShowPaywall(true)}
            className="mt-6 flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg active:scale-95"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 80%, #000))',
              boxShadow: '0 4px 16px color-mix(in srgb, var(--color-accent) 30%, transparent)',
            }}
          >
            <BarChart3 size={16} />
            Upgrade to Pro
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && !isFree && (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-3xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-56 rounded-2xl" />
            <Skeleton className="h-56 rounded-2xl" />
            <Skeleton className="h-56 rounded-2xl" />
          </div>
        </div>
      )}

      {!loading && !isFree && (
        <>
          {/* ── Glass Hero Summary Card ── */}
          {insights.length > 0 && (
            <div
              className="pi-stagger relative overflow-hidden rounded-3xl border border-[var(--color-accent)]/15 p-6"
              style={{
                animationDelay: '80ms',
                background:
                  'linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 8%, var(--color-bg-card)), color-mix(in srgb, var(--color-accent) 3%, var(--color-bg-card)))',
              }}
            >
              {/* Decorative gradient orbs */}
              <div
                className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full opacity-[0.07]"
                style={{
                  background: 'radial-gradient(circle, var(--color-accent), transparent)',
                }}
              />
              <div
                className="pointer-events-none absolute -bottom-12 -left-12 h-32 w-32 rounded-full opacity-[0.05]"
                style={{
                  background: 'radial-gradient(circle, var(--color-accent), transparent)',
                }}
              />

              <div className="relative z-10 flex items-start justify-between gap-4">
                {/* Left: tracking count */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-ink-mid)]">
                    Tracking
                  </p>
                  <p
                    className="text-4xl font-extrabold tracking-tight text-[var(--color-ink)] mt-1"
                    style={{
                      animation: 'pi-countIn 0.6s cubic-bezier(0.25,0.46,0.45,0.94) 0.2s both',
                    }}
                  >
                    {summaryStats.trackingCount}
                    <span className="text-lg font-semibold text-[var(--color-ink-mid)] ml-1.5">
                      price{summaryStats.trackingCount === 1 ? '' : 's'}
                    </span>
                  </p>
                </div>

                {/* Right: 30-day avg */}
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-ink-mid)]">
                    30-Day Avg
                  </p>
                  <div
                    className="flex items-center gap-1.5 justify-end mt-1"
                    style={{
                      animation: 'pi-countIn 0.6s cubic-bezier(0.25,0.46,0.45,0.94) 0.35s both',
                    }}
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full"
                      style={{
                        background:
                          summaryStats.avgChange <= 0
                            ? 'rgba(16,185,129,0.12)'
                            : 'rgba(249,115,22,0.12)',
                      }}
                    >
                      {summaryStats.avgChange <= 0 ? (
                        <ArrowDownRight size={16} className="text-emerald-500" />
                      ) : (
                        <ArrowUpRight size={16} className="text-orange-500" />
                      )}
                    </div>
                    <span
                      className={`text-3xl font-extrabold tracking-tight ${
                        summaryStats.avgChange <= 0 ? 'text-emerald-500' : 'text-orange-500'
                      }`}
                    >
                      {Math.abs(summaryStats.avgChange).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Rating distribution pills */}
              <div className="relative z-10 mt-5 flex flex-wrap gap-2">
                {(Object.entries(summaryStats.ratingCounts) as [DealRating, number][])
                  .filter(([, count]) => count > 0)
                  .map(([rating, count], idx) => {
                    const config = RATING_CONFIG[rating]
                    return (
                      <div
                        key={rating}
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 border"
                        style={{
                          animation: `pi-fadeSlideUp 0.4s cubic-bezier(0.25,0.46,0.45,0.94) ${0.4 + idx * 0.08}s both`,
                          background: `${config.hex}0D`,
                          borderColor: `${config.hex}20`,
                        }}
                      >
                        <span className="text-xs">{config.emoji}</span>
                        <span
                          className={`text-[11px] font-bold ${config.color}`}
                        >
                          {count}
                        </span>
                        <span className="text-[11px] font-medium text-[var(--color-ink-mid)]">
                          {config.label}
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* ── Per-Watch Price Insights Grid ── */}
          {insights.length > 0 && (
            <div className="space-y-4">
              <div
                className="pi-stagger flex items-center justify-between"
                style={{ animationDelay: '160ms' }}
              >
                <h3 className="text-lg font-bold tracking-tight text-[var(--color-ink)]">
                  Your Watches
                </h3>
                <DealGuideTooltip />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.map((insight, idx) => {
                  const config = RATING_CONFIG[insight.rating]
                  const isDown = insight.priceChange30d < 0
                  const isAtLow =
                    Math.abs(insight.currentPrice - insight.lowestPrice) < 0.01
                  const isAtHigh =
                    Math.abs(insight.currentPrice - insight.highestPrice) < 0.01

                  return (
                    <div
                      key={insight.watchId}
                      className="pi-stagger pi-card-hover cursor-pointer rounded-2xl border border-[var(--color-border)] overflow-hidden"
                      style={{
                        animationDelay: `${200 + idx * 60}ms`,
                        background: 'var(--color-bg-card)',
                      }}
                      onClick={() => router.push(`/home/watch/${insight.watchId}`)}
                    >
                      {/* Card top accent line */}
                      <div
                        className="h-1 w-full opacity-50 transition-opacity duration-300 pi-card-accent"
                        style={{
                          background: `linear-gradient(90deg, ${config.hex}, ${config.hex}60)`,
                        }}
                      />

                      <div className="p-4 space-y-4">
                        {/* Header: emoji + name + badge */}
                        <div className="flex items-start gap-3">
                          <div
                            className="pi-emoji-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300"
                            style={{
                              background: 'var(--color-bg-deep)',
                            }}
                          >
                            <span className="text-xl">{insight.watch.emoji || '\u{1F440}'}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-bold text-[var(--color-ink)]">
                              {insight.watch.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span
                                className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border"
                                style={{
                                  '--glow-color': `${config.hex}30`,
                                  background: `${config.hex}10`,
                                  borderColor: `${config.hex}25`,
                                  color: config.hex,
                                } as React.CSSProperties}
                              >
                                {config.emoji} {config.label}
                              </span>
                              {isAtLow && (
                                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                                  At Low
                                </span>
                              )}
                              {isAtHigh && (
                                <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-500">
                                  At High
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Price + change */}
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-2xl font-extrabold tracking-tight text-[var(--color-ink)]">
                              ${insight.currentPrice.toFixed(2)}
                            </p>
                          </div>
                          <div
                            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                              isDown
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : insight.priceChange30d > 0
                                  ? 'bg-orange-500/10 text-orange-500'
                                  : 'bg-[var(--color-bg-deep)] text-[var(--color-ink-light)]'
                            }`}
                          >
                            {isDown ? (
                              <ArrowDownRight size={14} />
                            ) : insight.priceChange30d > 0 ? (
                              <ArrowUpRight size={14} />
                            ) : null}
                            {insight.priceChange30d !== 0
                              ? `${Math.abs(insight.percentChange30d).toFixed(1)}%`
                              : 'No change'}
                          </div>
                        </div>

                        {/* Sparkline chart */}
                        <div className="flex justify-center">
                          <Sparkline
                            prices={insight.prices.map((p) => p.price)}
                            low={insight.lowestPrice}
                            high={insight.highestPrice}
                            current={insight.currentPrice}
                            uniqueId={insight.watchId}
                          />
                        </div>

                        {/* Price range bar */}
                        <PriceRangeBar
                          low={insight.lowestPrice}
                          avg={insight.averagePrice}
                          high={insight.highestPrice}
                          current={insight.currentPrice}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && insights.length === 0 && (
            <div
              className="pi-stagger flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--color-border)] py-14 px-6"
              style={{
                animationDelay: '100ms',
                background:
                  'linear-gradient(135deg, var(--color-bg-card) 0%, var(--color-bg-deep) 100%)',
              }}
            >
              <div className="animate-float flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-bg-deep)]">
                <BarChart3 className="h-6 w-6 text-[var(--color-ink-light)]" />
              </div>
              <p className="mt-4 text-base font-bold text-[var(--color-ink)]">No price data yet</p>
              <p className="mt-1.5 text-sm text-[var(--color-ink-mid)] text-center max-w-xs leading-relaxed">
                When Steward collects enough price data from your watches, deal ratings and trends
                will appear here.
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
