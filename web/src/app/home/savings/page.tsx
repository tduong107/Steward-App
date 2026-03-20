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

  // Fetch all check results with prices for user watches
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
        .not('price', 'is', null)
        .order('checked_at', { ascending: true })
        .limit(500)

      if (error) {
        console.error('Failed to fetch check results:', error.message)
      } else {
        setCheckResults((data as CheckResult[]) ?? [])
      }
      setLoading(false)
    }

    fetchResults()
  }, [user, watches])

  // Build savings entries by comparing sequential check prices per watch
  const savingsEntries = useMemo(() => {
    const entries: SavingsEntry[] = []
    const watchMap = new Map(watches.map((w) => [w.id, w]))

    // Group check results by watch (already sorted by checked_at ascending)
    const resultsByWatch = new Map<string, CheckResult[]>()
    for (const cr of checkResults) {
      if (cr.price === null || cr.price === undefined) continue
      const list = resultsByWatch.get(cr.watch_id) || []
      list.push(cr)
      resultsByWatch.set(cr.watch_id, list)
    }

    // For each watch, compare consecutive prices to find drops
    for (const [watchId, results] of resultsByWatch) {
      const watch = watchMap.get(watchId)
      if (!watch || results.length < 2) continue

      for (let i = 1; i < results.length; i++) {
        const prev = results[i - 1]
        const curr = results[i]
        if (prev.price === null || curr.price === null) continue
        if (curr.price >= prev.price) continue // only track drops

        entries.push({
          watchId,
          watchEmoji: watch.emoji || '👀',
          watchName: watch.name,
          originalPrice: prev.price,
          triggeredPrice: curr.price,
          saved: prev.price - curr.price,
          date: curr.checked_at,
        })
      }
    }

    // Sort by date descending (most recent first)
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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
          {/* Potential savings card */}
          <Card>
            <CardContent className="flex items-center gap-4 py-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-gold-light)]">
                <PiggyBank className="h-6 w-6 text-[var(--color-gold)]" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-ink-light)]">
                  Potential Savings
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
