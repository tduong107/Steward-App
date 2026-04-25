'use client'

/**
 * GlobalBg — fixed-position layer that sits behind all page content.
 *
 * Two layers:
 *   1. Mint dot/grid lattice (`linear-gradient`s × 2, masked to a
 *      vignette). Static.
 *   2. Three aurora blobs (deep green near top, mint mid, mint-2 lower)
 *      that drift on a 22-30s ease-in-out keyframe.
 *
 * The aurora drift is paused under prefers-reduced-motion (handled
 * inline because each blob has its own animation-delay).
 */

import { useEffect, useState } from 'react'

export function GlobalBg() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const driftAnim = reduced ? 'none' : 'aurora-drift'

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Mint grid lattice */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(to right, rgba(110, 231, 183, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(110, 231, 183, 0.04) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage:
            'radial-gradient(ellipse 80% 70% at 50% 40%, #000 20%, transparent 90%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 70% at 50% 40%, #000 20%, transparent 90%)',
        }}
      />

      {/* Aurora blob — deep green, near hero */}
      <div
        style={{
          position: 'absolute',
          left: '8%',
          top: '14%',
          width: 720,
          height: 720,
          borderRadius: '50%',
          background: 'rgba(42, 92, 69, 0.5)',
          filter: 'blur(100px)',
          animation: `${driftAnim} 26s ease-in-out infinite`,
          willChange: 'transform',
        }}
      />

      {/* Aurora blob — mint, mid-page */}
      <div
        style={{
          position: 'absolute',
          right: '6%',
          top: '38%',
          width: 540,
          height: 540,
          borderRadius: '50%',
          background: 'rgba(110, 231, 183, 0.18)',
          filter: 'blur(100px)',
          animation: `${driftAnim} 22s ease-in-out -8s infinite`,
          willChange: 'transform',
        }}
      />

      {/* Aurora blob — mint-2, lower */}
      <div
        style={{
          position: 'absolute',
          left: '40%',
          top: '78%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'rgba(167, 243, 208, 0.10)',
          filter: 'blur(100px)',
          animation: `${driftAnim} 30s ease-in-out -14s infinite`,
          willChange: 'transform',
        }}
      />
    </div>
  )
}
