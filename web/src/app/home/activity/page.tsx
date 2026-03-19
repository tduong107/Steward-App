'use client'

import { useMemo, useState } from 'react'
import { useActivities } from '@/hooks/use-activities'
import { ActivityTimeline } from '@/components/activity-timeline'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
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
    <div className="space-y-6">
      {/* Title */}
      <h2 className="text-2xl font-semibold font-[var(--font-serif)] text-[var(--color-ink)]">
        Activity
      </h2>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150',
              filter === tab.key
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-bg-deep)] text-[var(--color-ink-mid)] hover:bg-[var(--color-border)]',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
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

      {/* Activity timeline */}
      {!loading && <ActivityTimeline activities={filtered} />}
    </div>
  )
}
