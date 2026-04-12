'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useActivities } from '@/hooks/use-activities'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { ActivityTimeline } from '@/components/activity-timeline'
import { Skeleton } from '@/components/ui/skeleton'
import { Eye, Clock, Zap, MousePointerClick } from 'lucide-react'
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

/* ── Animated number (ref-based, no re-renders) ── */
function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!ref.current || value === 0) return
    const start = performance.now()
    let frame: number
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = eased * value
      if (ref.current) ref.current.textContent = String(Math.round(current))
      if (progress < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])
  return <span ref={ref}>0</span>
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

  const filterCounts = useMemo(() => {
    const counts: Record<FilterKey, number> = { all: activities.length, alerts: 0, actions: 0, lifecycle: 0 }
    for (const a of activities) {
      if (filterColors.alerts.includes(a.icon_color_name)) counts.alerts++
      if (filterColors.actions.includes(a.icon_color_name)) counts.actions++
      if (filterColors.lifecycle.includes(a.icon_color_name)) counts.lifecycle++
    }
    return counts
  }, [activities])

  const stats = [
    { icon: Eye, label: 'Checks', animatedValue: weeklyChecks, staticDisplay: null, color: 'var(--color-accent)', bg: 'var(--color-accent-light)' },
    { icon: Clock, label: 'Time Saved', animatedValue: null, staticDisplay: timeSavedLabel, color: 'var(--color-blue)', bg: 'var(--color-blue-light)' },
    { icon: Zap, label: 'Triggers', animatedValue: weeklyTriggers, staticDisplay: null, color: 'var(--color-gold)', bg: 'var(--color-gold-light)' },
    { icon: MousePointerClick, label: 'Actions', animatedValue: actionCount, staticDisplay: null, color: 'var(--color-accent)', bg: 'var(--color-accent-light)' },
  ]

  return (
    <div className="act-page">
      {/* Header */}
      <div className="act-header">
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-ink)] mb-1">
          Activity
        </h1>
        <p className="text-[13px] text-[var(--color-ink-mid)]">
          Everything happening with your watches
        </p>
      </div>

      {/* Stats Dashboard */}
      {weeklyChecks > 0 && (
        <div className="act-stats-card">
          <div className="act-stats-header">
            <div className="act-stats-glow" />
            <h2 className="text-[14px] font-bold text-[var(--color-ink)] relative z-10">
              Steward&apos;s Work
            </h2>
            <span className="text-[11px] text-[var(--color-ink-light)] relative z-10">Last 7 days</span>
          </div>
          <div className="act-stats-grid">
            {stats.map((stat, i) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="act-stat-item" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="act-stat-icon" style={{ backgroundColor: stat.bg, color: stat.color }}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="act-stat-number" style={{ color: stat.color }}>
                    {stat.staticDisplay ? stat.staticDisplay : <AnimatedNumber value={stat.animatedValue!} />}
                  </div>
                  <div className="act-stat-label">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pill Filter Tabs */}
      <div className="act-pills">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`act-pill ${filter === tab.key ? 'act-pill-active' : 'act-pill-inactive'}`}
            style={{ fontFamily: 'inherit' }}
          >
            {tab.label}
            {filterCounts[tab.key] > 0 && (
              <span className={`act-pill-badge ${filter === tab.key ? 'act-pill-badge-active' : ''}`}>
                {filterCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-[var(--radius-lg)] bg-[var(--color-bg-card)] border border-[var(--color-border)]">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      {!loading && (
        <ActivityTimeline activities={filtered} />
      )}

      {/* ===== Page-level styles ===== */}
      <style>{`
        .act-page {
          animation: act-fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes act-fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Header */
        .act-header {
          margin-bottom: 20px;
          animation: act-fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* Stats card - glass gradient */
        .act-stats-card {
          position: relative;
          overflow: hidden;
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          background: linear-gradient(135deg, var(--color-bg-card), var(--color-accent-light));
          padding: 20px;
          margin-bottom: 20px;
          animation: act-fadeUp 0.45s 0.05s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .act-stats-header {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 16px;
        }

        .act-stats-glow {
          position: absolute;
          top: -40px;
          right: -40px;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--color-accent) 0%, transparent 70%);
          opacity: 0.06;
          animation: act-pulseGlow 4s ease-in-out infinite;
        }

        @keyframes act-pulseGlow {
          0%, 100% { opacity: 0.06; transform: scale(1); }
          50% { opacity: 0.12; transform: scale(1.15); }
        }

        .act-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        @media (max-width: 480px) {
          .act-stats-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .act-stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 14px 8px;
          border-radius: var(--radius-md);
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow-xs);
          animation: act-statPop 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .act-stat-item:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        @keyframes act-statPop {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .act-stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
        }

        .act-stat-number {
          font-size: 22px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
        }

        .act-stat-label {
          font-size: 11px;
          color: var(--color-ink-light);
          font-weight: 500;
        }

        /* Pill filters */
        .act-pills {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          animation: act-fadeUp 0.5s 0.1s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .act-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: inherit;
        }

        .act-pill-active {
          background: var(--color-accent);
          color: var(--color-bg);
          border-color: transparent;
          box-shadow: 0 2px 8px color-mix(in srgb, var(--color-accent) 30%, transparent);
        }

        .act-pill-inactive {
          background: var(--color-bg-deep);
          color: var(--color-ink-mid);
          border-color: var(--color-border);
        }

        .act-pill-inactive:hover {
          border-color: var(--color-border-mid);
          color: var(--color-ink);
          background: var(--color-bg-card);
        }

        .act-pill-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          background: color-mix(in srgb, var(--color-ink) 10%, transparent);
          color: var(--color-ink-mid);
        }

        .act-pill-badge-active {
          background: color-mix(in srgb, var(--color-bg) 25%, transparent);
          color: var(--color-bg);
        }
      `}</style>
    </div>
  )
}
