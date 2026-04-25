'use client'

/**
 * CursorSpotlight — fixed, mix-blend-mode:screen radial mint glow that
 * follows the cursor with smoothing. Mount once at the landing root.
 *
 * - Disabled on touch devices (no cursor) and when prefers-reduced-motion.
 * - Pure DOM mutation via ref + RAF. No React state per frame.
 * - Lerp factor 0.12 for a slightly trailing, expensive-feeling pointer.
 */

import { useEffect, useRef } from 'react'

const SIZE = 600 // px

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
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const cur = { x: target.x, y: target.y }

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX
      target.y = e.clientY
      if (!visible) {
        el.style.opacity = '1'
        visible = true
      }
    }
    const onLeave = () => {
      el.style.opacity = '0'
      visible = false
    }

    const loop = () => {
      cur.x += (target.x - cur.x) * 0.12
      cur.y += (target.y - cur.y) * 0.12
      el.style.transform = `translate3d(${cur.x - SIZE / 2}px, ${cur.y - SIZE / 2}px, 0)`
      raf = requestAnimationFrame(loop)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)
    loop()

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      cancelAnimationFrame(raf)
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
        mixBlendMode: 'screen',
        opacity: 0,
        transition: 'opacity 0.4s ease',
        background:
          'radial-gradient(circle, rgba(110, 231, 183, 0.18) 0%, rgba(110, 231, 183, 0.08) 30%, transparent 65%)',
        willChange: 'transform',
      }}
    />
  )
}
