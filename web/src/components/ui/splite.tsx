'use client'

/**
 * SplineScene — wraps @splinetool/react-spline with two perf wins:
 *
 * 1. Lazy-loaded via dynamic import + Suspense fallback (so the
 *    ~600 KB Spline runtime never lands in the initial bundle).
 *
 * 2. IntersectionObserver pauses the 3D render loop when the canvas
 *    scrolls out of view. Spline normally drives a continuous 60fps
 *    rAF loop even when the canvas is below the fold, which on the
 *    landing page meant the GPU was busy painting an off-screen
 *    robot while the user was reading the pricing table further
 *    down. We capture the Spline `Application` instance from
 *    onLoad and call `.stop()` / `.play()` based on visibility.
 *
 * Reduced-motion preference fully halts playback after the initial
 * load (the scene still renders one frame, then freezes).
 */
import { Suspense, lazy, useEffect, useRef } from 'react'
const Spline = lazy(() => import('@splinetool/react-spline'))

// Minimal type for the bits of the Spline Application we touch — the
// real type comes from @splinetool/runtime which we don't import
// directly here to keep the wrapper lean.
type SplineApp = {
  stop: () => void
  play: () => void
}

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<SplineApp | null>(null)
  const visibleRef = useRef<boolean>(true)

  // Hook up IntersectionObserver once the wrapper mounts. We can't
  // know when Spline has loaded ahead of time, so the observer
  // tracks visibility immediately and onLoad consults `visibleRef`
  // before deciding whether to play or stop.
  useEffect(() => {
    const node = wrapRef.current
    if (!node) return
    if (typeof window === 'undefined') return

    // Honor prefers-reduced-motion: never run the render loop.
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const isVisible = entry.isIntersecting && entry.intersectionRatio > 0
          visibleRef.current = isVisible
          const app = appRef.current
          if (!app) continue
          if (reduced) {
            app.stop()
            continue
          }
          if (isVisible) app.play()
          else app.stop()
        }
      },
      // 256px rootMargin: start the loop a bit before the canvas
      // scrolls into view so the user doesn't see a frozen first
      // frame snap awake.
      { rootMargin: '256px 0px', threshold: 0 },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

  const handleLoad = (app: SplineApp) => {
    appRef.current = app
    if (typeof window === 'undefined') return
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (reduced || !visibleRef.current) {
      app.stop()
    }
  }

  return (
    <div ref={wrapRef} className={className} style={{ width: '100%', height: '100%' }}>
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <span className="loader"></span>
          </div>
        }
      >
        <Spline
          scene={scene}
          className={className}
          onLoad={handleLoad}
        />
      </Suspense>
    </div>
  )
}
