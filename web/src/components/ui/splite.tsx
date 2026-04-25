'use client'

/**
 * SplineScene — wraps @splinetool/react-spline with three perf wins:
 *
 * 1. **Deferred mount** (Phase 8): the Spline runtime + the ~380 KB
 *    .splinecode binary are NOT fetched on initial render. We wait
 *    until the browser reports idle time (or 1500ms post-mount,
 *    whichever fires first) before flipping `shouldMount` to true.
 *    During the wait, a CSS-only mint glow placeholder fills the
 *    canvas region so the layout doesn't shift when Spline arrives.
 *    This means hero TTI is no longer competing with Spline init.
 *
 * 2. Lazy-loaded via dynamic `import('@splinetool/react-spline')`
 *    (so the runtime never lands in the initial JS bundle even
 *    after `shouldMount` flips).
 *
 * 3. IntersectionObserver pauses the 3D render loop when the canvas
 *    scrolls out of view — capturing the Spline `Application` instance
 *    via onLoad and calling `.stop()` / `.play()` based on visibility.
 *
 * Reduced-motion: skips deferred mount entirely (Spline never loads;
 * the placeholder remains as the final visual). Saves the runtime
 * cost completely for users who opted out of motion.
 */
import { Suspense, lazy, useEffect, useRef, useState } from 'react'
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

// Idle-time fallback in milliseconds. If `requestIdleCallback` isn't
// available (Safari ≤ 17.5 doesn't ship it natively), or if the
// browser never reports idle time within this budget, we mount
// anyway so the user eventually sees the scene.
const IDLE_FALLBACK_MS = 1500

export function SplineScene({ scene, className }: SplineSceneProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<SplineApp | null>(null)
  const visibleRef = useRef<boolean>(true)
  const [shouldMount, setShouldMount] = useState(false)

  // PERF: schedule the Spline mount for the first idle slot the
  // browser hands us, with a 1.5s ceiling. This means hero animations
  // and content can paint + become interactive before we start the
  // GPU/network work to load the 3D scene.
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Honor reduced-motion: skip Spline entirely. The placeholder
    // remains as the visual.
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (reduced) return

    let timeoutId = 0
    let idleId = 0

    const fire = () => setShouldMount(true)

    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    const w = window as IdleWindow

    if (typeof w.requestIdleCallback === 'function') {
      idleId = w.requestIdleCallback(fire, { timeout: IDLE_FALLBACK_MS })
    } else {
      timeoutId = window.setTimeout(fire, IDLE_FALLBACK_MS)
    }

    return () => {
      if (idleId && typeof w.cancelIdleCallback === 'function') {
        w.cancelIdleCallback(idleId)
      }
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [])

  // IntersectionObserver runs as soon as the wrapper mounts, even if
  // Spline isn't loaded yet. Once Spline loads, onLoad consults
  // visibleRef to decide whether to play or stop immediately.
  useEffect(() => {
    const node = wrapRef.current
    if (!node) return
    if (typeof window === 'undefined') return

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
    <div
      ref={wrapRef}
      className={className}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      {/* CSS-only placeholder: a soft mint radial glow that matches
          the Spline scene's lighting silhouette. Sits in the same
          layout box so there's no shift when Spline mounts on top of
          it. Fades out via CSS once Spline takes over the canvas
          (via the `data-spline-loaded` attribute). */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 50% 60% at 50% 55%, rgba(110,231,183,0.18), rgba(110,231,183,0.04) 50%, transparent 75%)',
          opacity: shouldMount ? 0 : 1,
          transition: 'opacity 0.6s ease',
          pointerEvents: 'none',
        }}
      />
      {shouldMount && (
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <span className="loader"></span>
            </div>
          }
        >
          <Spline scene={scene} className={className} onLoad={handleLoad} />
        </Suspense>
      )}
    </div>
  )
}
