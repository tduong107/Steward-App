'use client'

import { useMemo, useState } from 'react'
import { useActivities } from '@/hooks/use-activities'
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
  const [filter, setFilter] = useState<FilterKey>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return activities
    const colors = filterColors[filter]
    return activities.filter((a) => colors.includes(a.icon_color_name))
  }, [activities, filter])

  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-ink)] mb-1">Activity</h1>
      <p className="text-[13px] text-[var(--color-ink-mid)] mb-5">Everything happening with your watches</p>

      {/* Tab bar */}
      <div className="flex gap-1.5 mb-5">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-[7px] rounded-[var(--radius-md)] text-[13px] font-medium cursor-pointer transition-all border ${
              filter === tab.key
                ? 'bg-[var(--color-accent)] text-white border-transparent shadow-[var(--shadow-xs)]'
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
