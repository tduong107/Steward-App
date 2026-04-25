'use client'

/**
 * CursorSpotlight — fixed radial mint glow that follows the cursor.
 *
 * PERF v2 (2026-04-25):
 * - Removed `mix-blend-mode: screen`. Blend modes force the compositor
 *   to recomposite the entire viewport beneath the blended layer on
 *   every frame, which was the primary source of scroll jank reported
 *   on mid-range hardware. We use a translucent gradient on top of
 *   page content instead — slightly less "glow" feel but ~zero scroll
 *   cost.
 * - Shrunk the disc from 600 → 360 px. Smaller layer = less GPU
 *   memory + less fill-rate.
 * - RAF loop short-circuits after 1.5s of cursor inactivity (target
 *   reached, no movement queued) so we stop driving frames when the
 *   user isn't moving. Resumes on the next mousemove.
 * - Already disabled on coarse pointers and prefers-reduced-motion.
 */

import { useEffect, useRef } from 'react'

const SIZE = 360 // px — was 600

export function CursorSpotlight() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof window === 'undefined') return

    // Skip on coarse pointers (touch) and reduced-motion preference.
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (coarse || reduced) {
      el.style.display = 'none'
      return
    }

    let raf = 0
    let visible = false
    let lastMove = 0
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const cur = { x: target.x, y: target.y }

    const start = () => {
      if (raf) return
      raf = requestAnimationFrame(loop)
    }
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX
      target.y = e.clientY
      lastMove = performance.now()
      if (!visible) {
        el.style.opacity = '1'
        visible = true
      }
      start()
    }
    const onLeave = () => {
      el.style.opacity = '0'
      visible = false
      // Stop after the fade-out finishes
      setTimeout(stop, 400)
    }

    const loop = () => {
      cur.x += (target.x - cur.x) * 0.14
      cur.y += (target.y - cur.y) * 0.14
      el.style.transform = `translate3d(${cur.x - SIZE / 2}px, ${cur.y - SIZE / 2}px, 0)`

      const dx = target.x - cur.x
      const dy = target.y - cur.y
      const settled = Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5
      const idle = performance.now() - lastMove > 1500

      if (settled && idle) {
        // Snap to final position and stop the RAF loop until the next
        // mousemove. Avoids 60fps work while the cursor is parked.
        el.style.transform = `translate3d(${target.x - SIZE / 2}px, ${target.y - SIZE / 2}px, 0)`
        raf = 0
        return
      }

      raf = requestAnimationFrame(loop)
    }

    document.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    start()

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      stop()
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: SIZE,
        height: SIZE,
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 30,
        opacity: 0,
        transition: 'opacity 0.35s ease',
        background:
          'radial-gradient(circle, rgba(110, 231, 183, 0.14) 0%, rgba(110, 231, 183, 0.05) 35%, transparent 70%)',
        willChange: 'transform',
      }}
    />
  )
}
