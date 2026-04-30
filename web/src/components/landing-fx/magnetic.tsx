'use client'

/**
 * Magnetic — wrap any clickable element to give it a subtle pull toward
 * the cursor. Translate by (cursor - center) × strength on mousemove,
 * snap back on leave.
 *
 * Disabled on coarse pointers and prefers-reduced-motion.
 *
 * Phase 13 perf: cache the bounding rect on `mouseenter` and reuse it
 * for every `mousemove` until `mouseleave`. Previously the handler
 * called `getBoundingClientRect()` on every mousemove (~60 times/sec
 * while hovering), which is a layout read that flushes any pending
 * style invalidations. Cached read = the same visual result with one
 * layout read per hover instead of dozens. Same pattern as Bento.
 */

import { useEffect, useRef } from 'react'

export function Magnetic({
  children,
  strength = 0.3,
  className,
  style,
}: {
  children: React.ReactNode
  strength?: number
  className?: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof window === 'undefined') return

    const coarse = window.matchMedia('(pointer: coarse)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (coarse || reduced) return

    let cachedRect: DOMRect | null = null

    const onEnter = () => {
      cachedRect = el.getBoundingClientRect()
    }
    const onMove = (e: MouseEvent) => {
      const rect = cachedRect
      if (!rect) return
      const dx = e.clientX - (rect.left + rect.width / 2)
      const dy = e.clientY - (rect.top + rect.height / 2)
      el.style.transform = `translate3d(${dx * strength}px, ${dy * strength}px, 0)`
    }
    const onLeave = () => {
      cachedRect = null
      el.style.transform = 'translate3d(0, 0, 0)'
    }

    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [strength])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        display: 'inline-flex',
        transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'transform',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
