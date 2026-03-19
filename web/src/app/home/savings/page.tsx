'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { PiggyBank, TrendingDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useWatches } from '@/hooks/use-watches'
import type { CheckResult } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { timeAgo } from '@/lib/utils'

interface SavingsEntry {
  watchId: string
  watchEmoji: string
  watchName: string
  originalPrice: number
  triggeredPrice: number
  saved: number
  date: string
}

export default function SavingsPage() {
  const { user } = useAuth()
  const { watches } = useWatches()
  const [checkResults, setCheckResults] = useState<CheckResult[]>([])
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef(createClient())

  // Fetch changed check results for all user watches
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
        .select('*')
        .in('watch_id', watchIds)
        .eq('changed', true)
        .order('checked_at', { ascending: false })
        .limit(200)

      if (error) {
        console.error('Failed to fetch check results:', error.message)
      } else {
        setCheckResults((data as CheckResult[]) ?? [])
      }
      setLoading(false)
    }

    fetchResults()
  }, [user, watches])

  // Build savings entries from check results with price data
  const savingsEntries = useMemo(() => {
    const entries: SavingsEntry[] = []
    const watchMap = new Map(watches.map((w) => [w.id, w]))

    for (const cr of checkResults) {
      const data = cr.result_data as Record<string, unknown>
      const triggeredPrice = typeof data?.price === 'number' ? data.price : null
      const originalPrice = typeof data?.original_price === 'number' ? data.original_price : null
      const previousPrice = typeof data?.previous_price === 'number' ? data.previous_price : null

      const basePrice = originalPrice ?? previousPrice
      if (triggeredPrice === null || basePrice === null) continue
      if (triggeredPrice >= basePrice) continue

      const watch = watchMap.get(cr.watch_id)
      if (!watch) continue

      entries.push({
        watchId: cr.watch_id,
        watchEmoji: watch.emoji || '👀',
        watchName: watch.name,
        originalPrice: basePrice,
        triggeredPrice,
        saved: basePrice - triggeredPrice,
        date: cr.checked_at,
      })
    }

    return entries
  }, [checkResults, watches])

  const totalSaved = useMemo(
    () => savingsEntries.reduce((sum, e) => sum + e.saved, 0),
    [savingsEntries],
  )

  return (
    <div className="space-y-6">
      {/* Title */}
      <h2 className="text-2xl font-semibold font-[var(--font-serif)] text-[var(--color-ink)]">
        Savings
      </h2>

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {!loading && (
        <>
          {/* Total savings card */}
          <Card>
            <CardContent className="flex items-center gap-4 py-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-gold-light)]">
                <PiggyBank className="h-6 w-6 text-[var(--color-gold)]" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-ink-light)]">
                  Total Savings
                </p>
                <p className="text-3xl font-bold text-[var(--color-gold)]">
                  ${totalSaved.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Empty state */}
          {savingsEntries.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-card)] py-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-bg-deep)]">
                <TrendingDown className="h-5 w-5 text-[var(--color-ink-light)]" />
              </div>
              <p className="mt-3 text-sm text-[var(--color-ink-mid)]">
                Start watching prices to track your savings
              </p>
            </div>
          )}

          {/* Savings list */}
          {savingsEntries.length > 0 && (
            <div className="space-y-2">
              {savingsEntries.map((entry, i) => (
                <Card key={`${entry.watchId}-${i}`}>
                  <CardContent className="flex items-center gap-3 py-3">
                    <span className="text-xl">{entry.watchEmoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                        {entry.watchName}
                      </p>
                      <p className="text-xs text-[var(--color-ink-mid)]">
                        ${entry.originalPrice.toFixed(2)} &rarr; ${entry.triggeredPrice.toFixed(2)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-[var(--color-green)]">
                        -${entry.saved.toFixed(2)}
                      </p>
                      <p className="text-xs text-[var(--color-ink-light)]">
                        {timeAgo(entry.date)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
