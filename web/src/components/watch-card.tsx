'use client'

import Image from 'next/image'
import { ChevronRight } from 'lucide-react'
import type { Watch } from '@/lib/types'
import { cn, getDomain } from '@/lib/utils'

interface WatchCardProps {
  watch: Watch
  onClick: () => void
}

export function WatchCard({ watch, onClick }: WatchCardProps) {
  const isTriggered = watch.triggered
  const needsAttention = watch.needs_attention

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3 text-left transition-all duration-200 hover:shadow-md hover:bg-[var(--color-bg-deep)] hover:-translate-y-[1px] active:translate-y-0 active:shadow-sm cursor-pointer',
        isTriggered && 'border-l-[3px] border-l-[var(--color-accent)]',
        needsAttention && !isTriggered && 'border-l-[3px] border-l-[var(--color-gold)]',
      )}
    >
      {/* Left: Image or emoji */}
      <div className="shrink-0">
        {watch.image_url ? (
          <Image
            src={watch.image_url}
            alt={watch.name}
            width={56}
            height={56}
            className="h-12 w-12 sm:h-14 sm:w-14 rounded-[var(--radius-sm)] object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-accent-light)]">
            <span className="text-2xl">{watch.emoji || '👀'}</span>
          </div>
        )}
      </div>

      {/* Middle: Info */}
      <div className="min-w-0 flex-1">
        {/* Row 1: Name + triggered dot */}
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-[var(--color-ink)]">
            {watch.name}
          </span>
          {isTriggered && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-green)] animate-pulse-dot" />
          )}
        </div>

        {/* Row 2: Status text */}
        <p className="mt-0.5 truncate text-xs">
          {needsAttention ? (
            <span className="text-[var(--color-gold)]">Needs attention</span>
          ) : isTriggered ? (
            <span className="text-[var(--color-green)]">{watch.change_note || 'Triggered'}</span>
          ) : (
            <span className="text-[var(--color-ink-mid)]">{watch.condition}</span>
          )}
        </p>

        {/* Row 3: Domain */}
        <p className="mt-0.5 truncate text-xs text-[var(--color-ink-light)]">
          {getDomain(watch.url)}
        </p>
      </div>

      {/* Right: Chevron */}
      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-ink-light)] transition-transform duration-200 group-hover:translate-x-0.5" />
    </button>
  )
}
