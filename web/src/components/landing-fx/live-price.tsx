'use client'

/**
 * LivePrice — animates a price from `start` → `end` in ~1s, holds for
 * a beat, then resets to `start` and replays. Used for hero / feature
 * mocks (Nike Dunk drops from $120 → $89, etc).
 *
 * - Plays only when scrolled into view (IntersectionObserver threshold
 *   0.4) so the animation doesn't burn CPU off-screen.
 * - Honors prefers-reduced-motion: just shows the final price.
 */

import { useEffect, useRef, useState } from 'react'

const ANIM_MS = 1000
const HOLD_MS = 2200

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

export function LivePrice({
  start,
  end,
  decimals = 0,
  prefix = '$',
  className,
  style,
}: {
  start: number
  end: number
  decimals?: number
  prefix?: string
  className?: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(start)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof window === 'undefined') return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setValue(end)
      return
    }

    let raf = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    let inView = false

    const tick = (cycleStart: number) => {
      const animate = (t: number) => {
        const progress = Math.min((t - cycleStart) / ANIM_MS, 1)
        setValue(start + (end - start) * easeOutCubic(progress))
        if (progress < 1) {
          raf = requestAnimationFrame(animate)
        } else if (inView) {
          timer = setTimeout(() => {
            setValue(start)
            timer = setTimeout(() => {
              if (inView) raf = requestAnimationFrame((t2) => tick(t2))
            }, 350)
          }, HOLD_MS)
        }
      }
      raf = requestAnimationFrame(animate)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting
        if (inView) {
          raf = requestAnimationFrame((t) => tick(t))
        } else {
          cancelAnimationFrame(raf)
          if (timer) clearTimeout(timer)
        }
      },
      { threshold: 0.4 },
    )
    io.observe(el)

    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      if (timer) clearTimeout(timer)
    }
  }, [start, end])

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}
      {value.toFixed(decimals)}
    </span>
  )
}
