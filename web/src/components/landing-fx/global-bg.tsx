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

      {/* PERF: dropped from 3 aurora blobs (each blur 100px) to 2.
          Section-local blobs in S/02 + S/03 already cover the same
          mid-page real estate, so the third global blob was double-
          stacking blurs there. Blur radius dialed back from 100 → 80
          to halve the GPU shader work per repaint while keeping the
          soft-light feel. */}

      {/* Aurora blob — deep green, near hero */}
      <div
        style={{
          position: 'absolute',
          left: '8%',
          top: '14%',
          width: 720,
          height: 720,
          borderRadius: '50%',
          background: 'rgba(42, 92, 69, 0.45)',
          filter: 'blur(80px)',
          animation: `${driftAnim} 26s ease-in-out infinite`,
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      />

      {/* Aurora blob — mint-2, lower (kept for the warm bottom wash) */}
      <div
        style={{
          position: 'absolute',
          left: '40%',
          top: '78%',
          width: 560,
          height: 560,
          borderRadius: '50%',
          background: 'rgba(167, 243, 208, 0.10)',
          filter: 'blur(80px)',
          animation: `${driftAnim} 30s ease-in-out -14s infinite`,
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      />
    </div>
  )
}
