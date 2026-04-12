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
      <div className="atl-empty">
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

  // Track global item index for staggered animation delays
  let globalIndex = 0

  return (
    <div className="atl-root">
      {grouped.map((group, gi) => (
        <div key={group.label} className="atl-group">
          {/* Sticky date header */}
          <div className="atl-date-header" style={{ animationDelay: `${gi * 60}ms` }}>
            <span className="atl-date-label">{group.label}</span>
            <span className="atl-date-count">{group.items.length}</span>
          </div>

          <div className="atl-items">
            {/* Connecting vertical line */}
            <div className="atl-line" />

            {group.items.map((activity, i) => {
              const iconName = mapIcon(activity.icon)
              const IconComponent = lucideIcons[iconName] || Circle
              const color = iconColor(activity.icon_color_name)
              const itemIndex = globalIndex++

              return (
                <div
                  key={activity.id}
                  className="atl-card"
                  style={{ animationDelay: `${Math.min(itemIndex * 50, 600)}ms` }}
                >
                  {/* Icon circle */}
                  <div
                    className="atl-icon"
                    style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}
                  >
                    <IconComponent
                      className="h-4 w-4"
                      style={{ color }}
                    />
                    {/* Glow dot */}
                    <div
                      className="atl-glow-dot"
                      style={{ backgroundColor: color }}
                    />
                  </div>

                  {/* Content */}
                  <div className="atl-content">
                    <p className="atl-title">{activity.label}</p>
                    {activity.subtitle && (
                      <p className="atl-subtitle">{activity.subtitle}</p>
                    )}
                  </div>

                  {/* Time */}
                  <span className="atl-time">
                    {timeAgo(activity.created_at)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* ===== Timeline styles ===== */}
      <style>{`
        .atl-root {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .atl-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 0;
          background: var(--color-bg-card);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
        }

        /* Date group */
        .atl-group {
          position: relative;
        }

        .atl-date-header {
          position: sticky;
          top: 0;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 0;
          margin-bottom: 8px;
          animation: atl-fadeSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .atl-date-label {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--color-ink-light);
        }

        .atl-date-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 600;
          background: var(--color-bg-deep);
          color: var(--color-ink-mid);
          border: 1px solid var(--color-border);
        }

        /* Items container */
        .atl-items {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-left: 20px;
        }

        /* Connecting vertical line */
        .atl-line {
          position: absolute;
          left: 19px;
          top: 20px;
          bottom: 20px;
          width: 2px;
          border-radius: 1px;
          background: linear-gradient(
            to bottom,
            var(--color-border) 0%,
            var(--color-border-mid) 50%,
            var(--color-border) 100%
          );
          opacity: 0.6;
        }

        /* Activity card */
        .atl-card {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 14px;
          border-radius: var(--radius-md);
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          animation: atl-cardIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .atl-card:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
          border-color: var(--color-border-mid);
        }

        @keyframes atl-cardIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes atl-fadeSlide {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }

        /* Icon */
        .atl-icon {
          position: relative;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          min-width: 36px;
          border-radius: 50%;
          transition: transform 0.2s ease;
        }

        .atl-card:hover .atl-icon {
          transform: scale(1.08);
        }

        .atl-glow-dot {
          position: absolute;
          bottom: 0px;
          right: 0px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 2px solid var(--color-bg-card);
          opacity: 0.9;
        }

        /* Content */
        .atl-content {
          flex: 1;
          min-width: 0;
          padding-top: 2px;
        }

        .atl-title {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--color-ink);
          line-height: 1.35;
        }

        .atl-subtitle {
          margin-top: 2px;
          font-size: 12px;
          color: var(--color-ink-mid);
          line-height: 1.4;
        }

        /* Time */
        .atl-time {
          flex-shrink: 0;
          padding-top: 3px;
          font-size: 11px;
          color: var(--color-ink-light);
          white-space: nowrap;
        }
      `}</style>
    </div>
  )
}
