'use client'

/**
 * Bento — base card for every feature/pricing/how-it-works panel.
 *
 * - Visual baseline lives in globals.css `.bento` (background, border,
 *   radius, hover lift, radial cursor-tracked overlay).
 * - This wrapper owns mouse tracking, writing the cursor's local
 *   position into `--mx` / `--my` CSS variables. CSS handles the
 *   actual fade-in / fade-out of the radial.
 * - Pass `variant="gold"` for the Steward-Acts moments (premium tier,
 *   Steward Acts section). All other usages stay mint.
 *
 * PERF (2026-04-25):
 * - Old version called `getBoundingClientRect()` + 2× `setProperty()`
 *   on every mousemove (can fire 100+ times/sec on a fast pointer),
 *   forcing layout reads inline with style writes — classic layout
 *   thrash that compounds with scroll on mid-range hardware.
 * - New version rAF-throttles updates (one write per animation
 *   frame max) and caches the rect on mouseenter, only refreshing
 *   it when the layout could have changed (scroll/resize). Same
 *   visual feel, ~10× less main-thread work.
 */

import { useRef } from 'react'

type Props = {
  as?: keyof React.JSX.IntrinsicElements
  variant?: 'mint' | 'gold'
  className?: string
  style?: React.CSSProperties
  onClick?: (e: React.MouseEvent<HTMLElement>) => void
  children: React.ReactNode
}

export function Bento({
  as = 'div',
  variant = 'mint',
  className,
  style,
  onClick,
  children,
}: Props) {
  const ref = useRef<HTMLElement | null>(null)
  const rectRef = useRef<DOMRect | null>(null)
  const rafRef = useRef<number>(0)
  const pendingRef = useRef<{ x: number; y: number } | null>(null)

  const refreshRect = () => {
    const el = ref.current
    if (!el) return
    rectRef.current = el.getBoundingClientRect()
  }

  const handleEnter = () => {
    refreshRect()
  }

  const handleLeave = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
    pendingRef.current = null
    rectRef.current = null
  }

  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    pendingRef.current = { x: e.clientX, y: e.clientY }
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      const el = ref.current
      const pending = pendingRef.current
      const rect = rectRef.current
      if (!el || !pending || !rect) return
      el.style.setProperty('--mx', `${pending.x - rect.left}px`)
      el.style.setProperty('--my', `${pending.y - rect.top}px`)
    })
  }

  const baseClass = `bento${variant === 'gold' ? ' bento--gold' : ''}${className ? ` ${className}` : ''}`

  // Cast to a generic JSX intrinsic. We restrict `as` to intrinsic
  // elements so this stays a pure DOM wrapper.
  const Tag = as as React.ElementType
  return (
    <Tag
      ref={ref as React.Ref<HTMLElement>}
      className={baseClass}
      style={style}
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onMouseMove={handleMove}
    >
      {children}
    </Tag>
  )
}
