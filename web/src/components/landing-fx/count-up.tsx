'use client'

/**
 * CountUp — animates 0 → target with ease-out-quart over 1800ms when
 * scrolled into view. Uses IntersectionObserver (threshold 0.5).
 *
 * Honors prefers-reduced-motion by snapping to the final value.
 */

import { useEffect, useRef, useState } from 'react'

const DURATION_MS = 1800

// ease-out-quart
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)

export function CountUp({
  to,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
  style,
}: {
  to: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof window === 'undefined') return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setValue(to)
      return
    }

    let raf = 0
    let start = 0
    let played = false

    const animate = (t: number) => {
      if (!start) start = t
      const elapsed = t - start
      const progress = Math.min(elapsed / DURATION_MS, 1)
      setValue(to * easeOutQuart(progress))
      if (progress < 1) raf = requestAnimationFrame(animate)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !played) {
          played = true
          raf = requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 },
    )
    io.observe(el)

    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [to])

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  )
}
