'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Eye,
  Plus,
  AlertTriangle,
  Crown,
  Search,
  Zap,
} from 'lucide-react'
import posthog from 'posthog-js'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useWatches } from '@/hooks/use-watches'
import { useSub } from '@/hooks/use-subscription'
import { useChatDrawer } from '@/providers/chat-provider'
import { WatchCard } from '@/components/watch-card'
import { CategoryFilter, watchCategory } from '@/components/category-filter'
import { PaywallDialog } from '@/components/paywall-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { OnboardingChecklist } from '@/components/onboarding-checklist'
import { watchLimit, tierLabel, maxFrequencyForTier, isFrequencyAllowed, timeAgo, getDomain } from '@/lib/utils'
import type { CheckResult } from '@/lib/types'

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const { watches, loading } = useWatches()
  const { tier } = useSub()
  const { openChat } = useChatDrawer()
  const searchParams = useSearchParams()
  const [category, setCategory] = useState('')
  const [showPaywall, setShowPaywall] = useState(false)
  const [upgradedTier, setUpgradedTier] = useState<string | null>(null)

  // Show upgrade confirmation if redirected from Stripe checkout
  useEffect(() => {
    const upgraded = searchParams.get('upgraded')
    if (upgraded) {
      setUpgradedTier(upgraded === 'premium' ? 'Premium' : 'Pro')
      const url = new URL(window.location.href)
      url.searchParams.delete('upgraded')
      window.history.replaceState({}, '', url.toString())
      setTimeout(() => setUpgradedTier(null), 6000)
    }
  }, [searchParams])

  const limit = watchLimit(tier)
  const activeWatches = watches.filter((w) => w.status !== 'deleted')
  const isAtLimit = activeWatches.length >= limit
  const isOverLimit = activeWatches.length > limit
  const triggeredWatches = activeWatches.filter((w) => w.triggered)

  // Detect watches with expired dates (client-side)
  const expiredWatches = activeWatches.filter((w) => {
    if (w.triggered || w.status === 'paused') return false
    const text = `${w.condition || ''} ${w.url || ''}`
    const today = new Date(); today.setHours(0,0,0,0)
    const dateMatch = text.match(/date=(\d{4}-\d{2}-\d{2})/i) ||
      text.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2})(?:,?\s*(\d{4}))?/i)
    if (!dateMatch) return false
    let watchDate: Date | null = null
    if (dateMatch[0].includes('=')) {
      watchDate = new Date(dateMatch[1])
    } else {
      const months: Record<string, number> = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11}
      const m = months[dateMatch[1].toLowerCase().slice(0,3)]
      const d = parseInt(dateMatch[2])
      const y = dateMatch[3] ? parseInt(dateMatch[3]) : today.getFullYear()
      if (m !== undefined) watchDate = new Date(y, m, d)
    }
    return watchDate && !isNaN(watchDate.getTime()) && watchDate < today
  })
  const filteredWatches = category
    ? activeWatches.filter((w) => {
        const cat = watchCategory(w)
        if (category === 'product') return cat === 'product' || cat === 'general' || cat === ''
        return cat === category
      })
    : activeWatches

  const overLimitCount = Math.max(0, activeWatches.length - limit)

  // ─── Tier enforcement: auto-downgrade frequencies that exceed tier ─────
  const [hasEnforced, setHasEnforced] = useState(false)
  useEffect(() => {
    if (hasEnforced || loading || !user || activeWatches.length === 0) return
    const maxFreq = maxFrequencyForTier(tier)
    const needsDowngrade = activeWatches.filter(
      (w) => w.check_frequency && !isFrequencyAllowed(w.check_frequency, tier),
    )
    if (needsDowngrade.length > 0) {
      // Single batch update instead of N individual updates
      const watchIds = needsDowngrade.map(w => w.id)
      supabaseRef.current
        .from('watches')
        .update({ check_frequency: maxFreq })
        .in('id', watchIds)
        .then(() => {
          console.log(`[tier-enforcement] Downgraded ${needsDowngrade.length} watches to ${maxFreq}`)
          setHasEnforced(true)
        })
    } else {
      setHasEnforced(true)
    }
  }, [activeWatches, tier, loading, user, hasEnforced])

  // --- Savings data for preview card ---
  const supabaseRef = useRef(createClient())
  const [checkResults, setCheckResults] = useState<CheckResult[]>([])

  // Filter to price-related watches (matches iOS)
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

  useEffect(() => {
    if (!user || priceWatches.length === 0) return
    let cancelled = false

    const fetchResults = async () => {
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
      if (!cancelled) setCheckResults(results.flat())
    }

    fetchResults()
    return () => { cancelled = true }
  }, [user, priceWatches])

  // Match iOS logic: savings = highestPrice - currentPrice per watch
  const savingsData = useMemo(() => {
    const watchMap = new Map(priceWatches.map((w) => [w.id, w]))
    const drops: { name: string; emoji: string; imageUrl: string | null; amount: number }[] = []
    let total = 0

    // Group prices by watch
    const pricesByWatch = new Map<string, number[]>()
    for (const cr of checkResults) {
      if (cr.price === null || cr.price === undefined) continue
      const list = pricesByWatch.get(cr.watch_id) || []
      list.push(cr.price)
      pricesByWatch.set(cr.watch_id, list)
    }

    for (const [watchId, prices] of pricesByWatch) {
      const watch = watchMap.get(watchId)
      if (!watch || prices.length < 2) continue

      const highestPrice = Math.max(...prices)
      const currentPrice = prices[prices.length - 1]
      const saved = Math.max(0, highestPrice - currentPrice)

      if (saved > 0) {
        total += saved
        drops.push({
          name: watch.name,
          emoji: watch.emoji || '👀',
          imageUrl: watch.image_url || null,
          amount: saved,
        })
      }
    }

    // Sort by biggest savings first
    drops.sort((a, b) => b.amount - a.amount)
    return { total, drops: drops.slice(0, 2) }
  }, [checkResults, priceWatches])

  // Price watches for insights card — reuse priceWatches instead of re-filtering
  const priceWatchCount = priceWatches.length

  // ─── Weekly stats: checks + triggers in last 7 days (matches iOS) ───
  const [weeklyChecks, setWeeklyChecks] = useState(0)
  const [weeklyTriggers, setWeeklyTriggers] = useState(0)
  useEffect(() => {
    if (!user) return
    const fetchStats = async () => {
      const supabase = supabaseRef.current
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 7)
      const cutoffStr = cutoff.toISOString()

      const [totalRes, triggeredRes] = await Promise.all([
        supabase
          .from('check_results')
          .select('*', { count: 'exact', head: true })
          .gte('checked_at', cutoffStr),
        supabase
          .from('check_results')
          .select('*', { count: 'exact', head: true })
          .gte('checked_at', cutoffStr)
          .eq('changed', true),
      ])
      setWeeklyChecks(totalRes.count ?? 0)
      setWeeklyTriggers(triggeredRes.count ?? 0)
    }
    fetchStats()
  }, [user])

  // Time saved: each check ≈ 1 minute of manual browsing
  const timeSavedLabel = useMemo(() => {
    const mins = weeklyChecks
    if (mins < 60) return `${mins}m`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `~${h}h ${m}m` : `~${h}h`
  }, [weeklyChecks])

  const firstName = profile?.display_name?.split(' ')[0] || 'there'
  const [searchQuery, setSearchQuery] = useState('')

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  // Search filter
  const searchedWatches = useMemo(() => {
    if (!searchQuery.trim()) return filteredWatches
    const q = searchQuery.toLowerCase()
    return filteredWatches.filter(w =>
      w.name.toLowerCase().includes(q) ||
      w.condition?.toLowerCase().includes(q) ||
      w.url?.toLowerCase().includes(q)
    )
  }, [filteredWatches, searchQuery])

  return (
    <div className="animate-fade-up overflow-x-hidden">
      {/* ── Row 1: Greeting + Inline Stats ── */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--color-ink)]">
            {greeting}, {firstName}
          </h1>
          <p className="text-[13px] text-[var(--color-ink-mid)] mt-0.5">
            {activeWatches.length === 0
              ? 'Let Steward watch the web for you.'
              : `Steward is monitoring ${activeWatches.length} watch${activeWatches.length === 1 ? '' : 'es'} for you`}
          </p>
        </div>
        {weeklyChecks > 0 && (
          <div className="hidden sm:flex items-center gap-5">
            <div className="text-center relative px-2">
              <div className="text-lg font-extrabold text-[var(--color-ink)] tracking-tight leading-tight">{weeklyChecks.toLocaleString()}</div>
              <div className="text-[10.5px] font-semibold text-[var(--color-ink-light)] uppercase tracking-wider mt-px">Checks</div>
              <div className="absolute right-[-10px] top-0.5 w-px h-7 bg-[var(--color-border)]" />
            </div>
            <div className="text-center relative px-2">
              <div className="text-lg font-extrabold text-[var(--color-ink)] tracking-tight leading-tight">{weeklyTriggers}</div>
              <div className="text-[10.5px] font-semibold text-[var(--color-ink-light)] uppercase tracking-wider mt-px">Triggers</div>
              <div className="absolute right-[-10px] top-0.5 w-px h-7 bg-[var(--color-border)]" />
            </div>
            {savingsData.total > 0 && (
              <div className="text-center px-2">
                <div className="text-lg font-extrabold text-[var(--color-accent)] tracking-tight leading-tight">${savingsData.total.toFixed(2)}</div>
                <div className="text-[10.5px] font-semibold text-[var(--color-ink-light)] uppercase tracking-wider mt-px">Saved</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Upgrade Success Banner ── */}
      {upgradedTier && (
        <div className="flex items-center gap-3 px-5 py-4 mb-5 rounded-[var(--radius-lg)] border border-[var(--color-accent)]/30 bg-[var(--color-accent-light)]">
          <span className="text-2xl">🎉</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-[var(--color-accent)]">Welcome to Steward {upgradedTier}!</p>
            <p className="text-xs text-[var(--color-ink-mid)] mt-0.5">Your plan has been upgraded. A receipt has been sent to your email.</p>
          </div>
          <button onClick={() => setUpgradedTier(null)} className="text-[var(--color-ink-light)] hover:text-[var(--color-ink)] text-lg cursor-pointer">×</button>
        </div>
      )}

      {/* ── Onboarding Checklist (only on first run) ── */}
      <OnboardingChecklist />

      {/* ── Watch Limit Warning Banner ── */}
      {!loading && isAtLimit && (
        <button
          type="button"
          onClick={() => { posthog.capture('upgrade_banner_clicked', { current_tier: tier, is_over_limit: isOverLimit }); setShowPaywall(true) }}
          className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all duration-200 hover:opacity-90 animate-fade-in-up [animation-delay:50ms] cursor-pointer ${
            isOverLimit
              ? 'bg-red-500/10 border border-red-500/30'
              : 'bg-amber-500/10 border border-amber-500/30'
          }`}
        >
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            isOverLimit ? 'bg-red-500/20' : 'bg-amber-500/20'
          }`}>
            {isOverLimit ? (
              <AlertTriangle size={18} className="text-red-500" />
            ) : (
              <Crown size={18} className="text-amber-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${isOverLimit ? 'text-red-400' : 'text-amber-400'}`}>
              {isOverLimit
                ? `Over the ${limit}-watch limit`
                : `You've used all ${limit} watches`}
            </p>
            <p className="text-xs text-[var(--color-ink-mid)] mt-0.5">
              Upgrade to {tier === 'free' ? 'Pro' : 'Premium'} for {tier === 'free' ? '7' : '15'} watches and faster checks
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-[var(--color-accent)] px-3 py-1.5 text-xs font-bold text-white">
            Upgrade
          </span>
        </button>
      )}

      {/* ── AI Command Bar (compact) ── */}
      <button
        onClick={() => openChat()}
        className="w-full flex items-center gap-3 bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] px-4 py-3 mb-5 cursor-pointer transition-all hover:border-[var(--color-green)] hover:shadow-[0_0_0_3px_rgba(5,150,105,0.08)] text-left"
      >
        <div
          className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #059669, #6EE7B7)', boxShadow: '0 2px 8px rgba(5,150,105,0.25)' }}
        >
          <Zap size={16} className="text-white" />
        </div>
        <span className="flex-1 text-sm text-[var(--color-ink-light)] font-medium">Ask Steward to watch something...</span>
        <div className="hidden sm:flex items-center gap-1">
          <kbd className="text-[10px] font-semibold px-1.5 py-px rounded bg-[var(--color-bg-deep)] text-[var(--color-ink-light)] border border-[var(--color-border)]">⌘K</kbd>
        </div>
      </button>

      {/* ── Steward is working for you (matches iOS) ── */}
      {!loading && weeklyChecks > 0 && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-card)] px-5 py-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">✨</span>
            <span className="text-[14px] font-bold text-[var(--color-ink)]">Steward is working for you</span>
          </div>
          <div className="flex items-center gap-6 mb-3">
            <div className="text-center">
              <div className="text-lg font-extrabold text-[var(--color-accent)]">{weeklyChecks.toLocaleString()}</div>
              <div className="text-[11px] text-[var(--color-ink-light)]">Checks</div>
            </div>
            <div className="w-px h-6 bg-[var(--color-border)]" />
            <div className="text-center">
              <div className="text-lg font-extrabold text-[var(--color-accent)]">{timeSavedLabel}</div>
              <div className="text-[11px] text-[var(--color-ink-light)]">Time saved</div>
            </div>
            <div className="w-px h-6 bg-[var(--color-border)]" />
            <div className="text-center">
              <div className="text-lg font-extrabold text-[var(--color-gold)]">{weeklyTriggers}</div>
              <div className="text-[11px] text-[var(--color-ink-light)]">Triggers</div>
            </div>
            {savingsData.total > 0 && (
              <>
                <div className="w-px h-6 bg-[var(--color-border)]" />
                <div className="text-center">
                  <div className="text-lg font-extrabold text-[var(--color-green)]">${savingsData.total.toFixed(2)}</div>
                  <div className="text-[11px] text-[var(--color-ink-light)]">Savings</div>
                </div>
              </>
            )}
          </div>
          <p className="text-[12px] text-[var(--color-ink-light)]">
            {weeklyChecks.toLocaleString()} automated checks in the last 7 days &mdash; that&apos;s {timeSavedLabel} you didn&apos;t spend manually browsing
          </p>
        </div>
      )}

      {/* ── Triggered Watches (prominent cards like iOS) ── */}
      {!loading && triggeredWatches.length > 0 && (
        <div className="space-y-3 mb-5">
          {triggeredWatches.map((watch) => (
            <div
              key={watch.id}
              className="rounded-[var(--radius-lg)] border border-[var(--color-accent)] bg-[var(--color-accent-light)] px-5 py-4 cursor-pointer transition-all hover:shadow-[var(--shadow-sm)]"
              onClick={() => {
                posthog.capture('watch_triggered_cta_clicked', { watch_id: watch.id, action_type: watch.action_type, watch_name: watch.name, platform: 'web' })
                router.push(`/home/watch/${watch.id}`)
              }}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--color-accent)] text-[var(--color-bg)] text-[11px] font-bold tracking-wide mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-bg)]" style={{ animation: 'pulseGlow 2s ease-in-out infinite' }} />
                {watch.action_type === 'book' ? 'READY TO BOOK' : watch.action_type === 'price' ? 'PRICE TARGET HIT' : watch.action_type === 'cart' ? 'READY TO ADD TO CART' : 'CHANGE DETECTED'}
              </div>
              {/* Content */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-[16px] font-bold text-[var(--color-ink)]">
                    {watch.emoji} {watch.name}
                  </div>
                  <div className="text-[14px] text-[var(--color-accent)] mt-1">
                    {watch.change_note || 'Condition met'}
                  </div>
                </div>
                {watch.action_url ? (
                  <a
                    href={watch.action_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation()
                      posthog.capture('action_completed', { watch_id: watch.id, action_type: watch.action_type, platform: 'web' })
                    }}
                    className="shrink-0 px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-bg)] text-[13px] font-bold cursor-pointer hover:opacity-90 transition-opacity no-underline"
                  >
                    {watch.action_type === 'book' ? 'Open & Reserve →' : watch.action_type === 'price' ? 'Open & Buy →' : 'View →'}
                  </a>
                ) : (
                  <div className="shrink-0 px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-bg)] text-[13px] font-bold cursor-pointer hover:opacity-90 transition-opacity">
                    View Details →
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Expired Date Watches ── */}
      {!loading && expiredWatches.length > 0 && (
        <div className="space-y-3 mb-5">
          {expiredWatches.map((watch) => (
            <div
              key={`expired-${watch.id}`}
              className="rounded-[var(--radius-lg)] border border-orange-500/30 bg-orange-500/5 px-5 py-4 transition-all duration-300"
              style={{ opacity: 1 }}
            >
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-500/15 text-orange-500 text-[11px] font-bold tracking-wide mb-3">
                <span>📅</span> DATE PASSED
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-[16px] font-bold text-[var(--color-ink)]">
                    {watch.emoji} {watch.name}
                  </div>
                  <div className="text-[13px] text-orange-500/80 mt-1">
                    The date for this watch has passed. Update or remove to free up a slot.
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => {
                      openChat(`I need to update my "${watch.name}" watch. The date has passed. Can you help me set a new date?`)
                    }}
                    className="shrink-0 px-4 py-2.5 rounded-[var(--radius-md)] bg-orange-500/15 text-orange-500 text-[13px] font-bold cursor-pointer hover:bg-orange-500/25 transition-colors"
                  >
                    Update
                  </button>
                  <button
                    onClick={async (e) => {
                      const card = (e.target as HTMLElement).closest('[class*="rounded-"]') as HTMLElement
                      if (card) {
                        card.style.opacity = '0'
                        card.style.transform = 'translateX(100px)'
                        card.style.maxHeight = card.scrollHeight + 'px'
                        requestAnimationFrame(() => { card.style.maxHeight = '0'; card.style.marginBottom = '0'; card.style.padding = '0'; card.style.overflow = 'hidden' })
                      }
                      setTimeout(async () => {
                        await supabaseRef.current.from('watches').update({ status: 'deleted' }).eq('id', watch.id)
                      }, 350)
                    }}
                    className="shrink-0 px-4 py-2.5 rounded-[var(--radius-md)] bg-red-500/10 text-red-500 text-[13px] font-bold cursor-pointer hover:bg-red-500/20 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Row 4: Filter Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 overflow-hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <h2 className="text-base font-bold text-[var(--color-ink)] mr-2 shrink-0">Your Watches</h2>
          {['', 'reservation', 'travel', 'product'].map(cat => {
            const labels: Record<string, string> = { '': 'All', reservation: 'Reservations', travel: 'Travel', product: 'Products' }
            const counts: Record<string, number> = {
              '': activeWatches.length,
              reservation: activeWatches.filter(w => watchCategory(w) === 'reservation').length,
              travel: activeWatches.filter(w => watchCategory(w) === 'travel').length,
              product: activeWatches.filter(w => ['product', ''].includes(watchCategory(w))).length,
            }
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-[13px] font-medium px-3.5 py-1.5 rounded-full border cursor-pointer transition-all whitespace-nowrap ${
                  category === cat
                    ? 'bg-[var(--color-accent)] text-[var(--color-bg)] border-transparent'
                    : 'bg-[var(--color-bg-deep)] text-[var(--color-ink-mid)] border-[var(--color-border)] hover:border-[var(--color-border-mid)] hover:text-[var(--color-ink)]'
                }`}
                style={{ fontFamily: 'inherit' }}
              >
                {labels[cat]} <span className="font-normal opacity-60 ml-0.5">{counts[cat]}</span>
              </button>
            )
          })}
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-card)] focus-within:border-[var(--color-green)] focus-within:shadow-[0_0_0_3px_rgba(5,150,105,0.08)] transition-all">
          <Search size={13} className="text-[var(--color-ink-light)]" />
          <input
            type="text"
            placeholder="Search watches..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="border-none outline-none text-[13px] text-[var(--color-ink)] bg-transparent w-[160px] placeholder:text-[var(--color-ink-light)]"
            style={{ fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {/* ── Row 5: Watch Card Grid ── */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[130px] w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      )}

      {!loading && searchedWatches.length === 0 && activeWatches.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-card)] py-16 px-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-bg-deep)]">
            <Eye className="h-6 w-6 text-[var(--color-ink-light)]" />
          </div>
          <p className="mt-4 text-base font-semibold text-[var(--color-ink)]">No watches yet</p>
          <p className="mt-1 text-sm text-[var(--color-ink-mid)] text-center">Tell Steward what you want to watch — prices, restocks, tickets, and more.</p>
          <button
            onClick={() => openChat()}
            className="mt-5 flex items-center gap-2 rounded-full text-sm font-semibold text-white px-5 py-2.5 cursor-pointer transition-all hover:-translate-y-px"
            style={{ background: 'linear-gradient(180deg, #22C55E 0%, #16A34A 100%)', fontFamily: 'inherit' }}
          >
            <Plus size={16} /> Create your first watch
          </button>
        </div>
      )}

      {!loading && searchedWatches.length === 0 && activeWatches.length > 0 && (
        <p className="text-center text-sm text-[var(--color-ink-light)] py-8">No watches match your search.</p>
      )}

      {!loading && searchedWatches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {searchedWatches.map((watch) => (
            <div
              key={watch.id}
              onClick={() => router.push(`/home/watch/${watch.id}`)}
              className={`rounded-[var(--radius-lg)] border px-5 py-4 cursor-pointer transition-all hover:shadow-[var(--shadow-sm)] hover:-translate-y-px ${
                watch.triggered
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]'
                  : watch.needs_attention
                  ? 'border-[var(--color-gold)] bg-[var(--color-gold-light)]'
                  : 'border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-border-mid)]'
              }`}
            >
              {/* Row: icon + name */}
              <div className="flex items-center gap-3 mb-3">
                {watch.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={watch.image_url} alt="" className="w-11 h-11 rounded-[var(--radius-md)] object-cover shrink-0 bg-[var(--color-bg-deep)]" />
                ) : (
                  <div className="w-11 h-11 rounded-[var(--radius-md)] bg-[var(--color-bg-deep)] flex items-center justify-center text-[22px] shrink-0">
                    {watch.emoji || '👀'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-[var(--color-ink)] truncate">{watch.name}</div>
                  <div className="text-[13px] text-[var(--color-ink-mid)] mt-0.5 truncate">{watch.condition || 'Watching'}</div>
                </div>
              </div>
              {/* Meta row */}
              <div className="flex items-center justify-between text-[13px] text-[var(--color-ink-light)]">
                <span>{watch.last_checked ? timeAgo(watch.last_checked) : 'Not checked yet'} · {getDomain(watch.url)}</span>
                <span className={`font-semibold ${
                  watch.triggered ? 'text-[var(--color-accent)]' : watch.needs_attention ? 'text-[var(--color-gold)]' : 'text-[var(--color-ink-light)]'
                }`}>
                  {watch.triggered ? '● Triggered' : watch.needs_attention ? '● Attention' : '● Watching'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom row removed — Activity and Savings have dedicated sidebar pages */}

      {/* Watch count footer */}
      {!loading && activeWatches.length > 0 && (
        <p className={`text-center text-xs mt-4 ${isAtLimit ? 'font-semibold text-[var(--color-gold)]' : 'text-[var(--color-ink-light)]'}`}>
          {activeWatches.length} of {limit} watches
          {isAtLimit && (
            <button onClick={() => setShowPaywall(true)} className="ml-1.5 text-[var(--color-accent)] underline underline-offset-2 hover:opacity-80 cursor-pointer">
              Upgrade
            </button>
          )}
        </p>
      )}

      <PaywallDialog open={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  )
}
