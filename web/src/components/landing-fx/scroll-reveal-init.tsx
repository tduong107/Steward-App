'use client'

/**
 * ScrollRevealInit — sets up a single IntersectionObserver that adds
 * a `.visible` class to every element with the `.landing-reveal`
 * class as it crosses into view, which CSS uses to fade-in / slide-up
 * those elements.
 *
 * Returns null. The only reason this exists as a component (rather
 * than living in `landing-client-page.tsx`) is so the rest of the
 * landing page composition can be Server Components — this file
 * carries the only `'use client'` boundary it needs.
 *
 * Honors the per-element `animation-delay` (in CSS) so reveals
 * sequence with the same rhythm as their CSS animations.
 */

import { useEffect } from 'react'

export function ScrollRevealInit() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      return
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement
            const s = getComputedStyle(el)
            const dStr = s.animationDelay || '0s'
            const ms = parseFloat(dStr) * (dStr.includes('ms') ? 1 : 1000)
            if (ms > 0) setTimeout(() => el.classList.add('visible'), ms)
            else el.classList.add('visible')
            obs.unobserve(el)
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -60px 0px' },
    )
    requestAnimationFrame(() => {
      document.querySelectorAll('.landing-reveal').forEach((el) => obs.observe(el))
    })
    return () => obs.disconnect()
  }, [])

  return null
}
