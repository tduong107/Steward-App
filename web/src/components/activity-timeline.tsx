'use client'

import {
  Bell,
  BellRing,
  ShoppingCart,
  Tag,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Star,
  Trash2,
  Link,
  DollarSign,
  Zap,
  ThumbsUp,
  Send,
  Settings,
  User,
  Circle,
} from 'lucide-react'
import type { Activity } from '@/lib/types'
import { cn, mapIcon, iconColor, timeAgo } from '@/lib/utils'
import type { LucideProps } from 'lucide-react'

const lucideIcons: Record<string, React.ComponentType<LucideProps>> = {
  bell: Bell,
  'bell-ring': BellRing,
  'shopping-cart': ShoppingCart,
  tag: Tag,
  eye: Eye,
  'eye-off': EyeOff,
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  'alert-triangle': AlertTriangle,
  'refresh-cw': RefreshCw,
  sparkles: Sparkles,
  star: Star,
  'trash-2': Trash2,
  link: Link,
  'dollar-sign': DollarSign,
  zap: Zap,
  'thumbs-up': ThumbsUp,
  send: Send,
  settings: Settings,
  user: User,
  circle: Circle,
}

function getDateGroup(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (target.getTime() === today.getTime()) return 'Today'
  if (target.getTime() === yesterday.getTime()) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

interface ActivityTimelineProps {
  activities: Activity[]
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-2xl">📭</p>
        <p className="mt-2 text-sm text-[var(--color-ink-mid)]">No activity yet</p>
      </div>
    )
  }

  // Group activities by date
  const grouped: { label: string; items: Activity[] }[] = []
  let currentGroup: string | null = null

  for (const activity of activities) {
    const group = getDateGroup(activity.created_at)
    if (group !== currentGroup) {
      currentGroup = group
      grouped.push({ label: group, items: [] })
    }
    grouped[grouped.length - 1].items.push(activity)
  }

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.label}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-light)]">
            {group.label}
          </h3>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[15px] top-4 bottom-4 w-px bg-[var(--color-border)]" />

            <div className="space-y-0">
              {group.items.map((activity, i) => {
                const iconName = mapIcon(activity.icon)
                const IconComponent = lucideIcons[iconName] || Circle
                const color = iconColor(activity.icon_color_name)

                return (
                  <div
                    key={activity.id}
                    className="relative flex items-start gap-3 py-2.5"
                  >
                    {/* Icon dot */}
                    <div
                      className="relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
                    >
                      <IconComponent
                        className="h-3.5 w-3.5"
                        style={{ color }}
                      />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-sm text-[var(--color-ink)]">{activity.label}</p>
                      {activity.subtitle && (
                        <p className="mt-0.5 text-xs text-[var(--color-ink-mid)]">
                          {activity.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Time */}
                    <span className="shrink-0 pt-1 text-xs text-[var(--color-ink-light)]">
                      {timeAgo(activity.created_at)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
