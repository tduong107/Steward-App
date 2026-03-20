'use client'

import { useEffect, type ReactNode } from 'react'

/**
 * Client wrapper for the landing page that initializes scroll-reveal
 * and other interactive behaviors.
 */
export function LandingWrapper({ children }: { children: ReactNode }) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement
            // Check for CSS animation-delay
            const style = getComputedStyle(el)
            const delayStr = style.animationDelay || '0s'
            const delayMs = parseFloat(delayStr) * (delayStr.includes('ms') ? 1 : 1000)

            if (delayMs > 0) {
              setTimeout(() => el.classList.add('visible'), delayMs)
            } else {
              el.classList.add('visible')
            }
            observer.unobserve(el)
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
    )

    // Small delay to ensure DOM is ready
    requestAnimationFrame(() => {
      const elements = document.querySelectorAll('.landing-reveal')
      elements.forEach((el) => observer.observe(el))
    })

    return () => observer.disconnect()
  }, [])

  return <>{children}</>
}
