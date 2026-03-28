'use client'

import { useEffect } from 'react'

/**
 * Adds IntersectionObserver-based scroll reveal to `.landing-reveal` elements.
 * Mount this once on any page that uses the landing-reveal class.
 */
export function ScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // Respect animation-delay from style attribute or CSS class
            const el = entry.target as HTMLElement
            const delay = el.style.animationDelay || ''
            if (delay) {
              const ms = parseFloat(delay) * (delay.includes('ms') ? 1 : 1000)
              setTimeout(() => el.classList.add('visible'), ms)
            } else {
              el.classList.add('visible')
            }
            observer.unobserve(el)
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )

    // Observe all reveal elements
    const elements = document.querySelectorAll('.landing-reveal')
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return null
}
