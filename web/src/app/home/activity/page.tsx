'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useActivities } from '@/hooks/use-activities'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { ActivityTimeline } from '@/components/activity-timeline'
import { Skeleton } from '@/components/ui/skeleton'
import type { IconColorName } from '@/lib/types'

type FilterKey = 'all' | 'alerts' | 'actions' | 'lifecycle'

const filterTabs: { label: string; key: FilterKey }[] = [
  { label: 'All', key: 'all' },
  { label: 'Alerts', key: 'alerts' },
  { label: 'Actions', key: 'actions' },
  { label: 'Lifecycle', key: 'lifecycle' },
]

const filterColors: Record<FilterKey, IconColorName[]> = {
  all: [],
  alerts: ['red', 'gold'],
  actions: ['accent', 'blue'],
  lifecycle: ['inkLight', 'green'],
}

export default function ActivityPage() {
  const { activities, loading } = useActivities()
  const { user } = useAuth()
  const [filter, setFilter] = useState<FilterKey>('all')
  const supabaseRef = useRef(createClient())
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
        supabase.from('check_results').select('*', { count: 'exact', head: true }).gte('checked_at', cutoffStr),
        supabase.from('check_results').select('*', { count: 'exact', head: true }).gte('checked_at', cutoffStr).eq('changed', true),
      ])
      setWeeklyChecks(totalRes.count ?? 0)
      setWeeklyTriggers(triggeredRes.count ?? 0)
    }
    fetchStats()
  }, [user])

  const timeSavedLabel = useMemo(() => {
    const mins = weeklyChecks
    if (mins < 60) return `${mins}m`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `~${h}h ${m}m` : `~${h}h`
  }, [weeklyChecks])

  const actionCount = activities.filter(a => ['accent', 'blue'].includes(a.icon_color_name)).length

  const filtered = useMemo(() => {
    if (filter === 'all') return activities
    const colors = filterColors[filter]
    return activities.filter((a) => colors.includes(a.icon_color_name))
  }, [activities, filter])

  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-ink)] mb-1">Activity</h1>
      <p className="text-[13px] text-[var(--color-ink-mid)] mb-5">Everything happening with your watches</p>

      {/* Stats card (matches iOS Steward's Work) */}
      {weeklyChecks > 0 && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-card)] px-5 py-4 mb-5">
          <div className="text-[14px] font-bold text-[var(--color-ink)] mb-1">Steward&apos;s Work (Last 7 Days)</div>
          <div className="text-[12px] text-[var(--color-ink-light)] mb-3">{weeklyChecks} follow-up checks · {timeSavedLabel} of browsing saved</div>
          <div className="flex items-center gap-6">
            <div className="text-center"><div className="text-lg font-extrabold text-[var(--color-ink)]">{weeklyChecks}</div><div className="text-[11px] text-[var(--color-ink-light)]">Checks</div></div>
            <div className="w-px h-6 bg-[var(--color-border)]" />
            <div className="text-center"><div className="text-lg font-extrabold text-[var(--color-ink)]">{timeSavedLabel}</div><div className="text-[11px] text-[var(--color-ink-light)]">Time saved</div></div>
            <div className="w-px h-6 bg-[var(--color-border)]" />
            <div className="text-center"><div className="text-lg font-extrabold text-[var(--color-gold)]">{weeklyTriggers}</div><div className="text-[11px] text-[var(--color-ink-light)]">Triggers</div></div>
            <div className="w-px h-6 bg-[var(--color-border)]" />
            <div className="text-center"><div className="text-lg font-extrabold text-[var(--color-accent)]">{actionCount}</div><div className="text-[11px] text-[var(--color-ink-light)]">Actions</div></div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1.5 mb-5">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-[7px] rounded-[var(--radius-md)] text-[13px] font-medium cursor-pointer transition-all border ${
              filter === tab.key
                ? 'bg-[var(--color-accent)] text-[var(--color-bg)] border-transparent shadow-[var(--shadow-xs)]'
                : 'bg-[var(--color-bg-deep)] text-[var(--color-ink-mid)] border-[var(--color-border)] hover:border-[var(--color-border-mid)] hover:text-[var(--color-ink)]'
            }`}
            style={{ fontFamily: 'inherit' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-[30px] w-[30px] rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      {!loading && (
        <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
          <ActivityTimeline activities={filtered} />
        </div>
      )}
    </div>
  )
}
