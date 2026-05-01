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
import { Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode } from 'react'
const Spline = lazy(() => import('@splinetool/react-spline'))

// CROSS-BROWSER (Phase 12): error boundary around the Spline canvas.
// Safari has documented WebGL context-loss bugs and the @splinetool
// runtime can throw at decode time on malformed/corrupted .splinecode
// fetches. Without a boundary, a Spline error bubbles up and crashes
// the entire page tree (React 19 unmounts the parent). With this in
// place, a Spline failure just leaves the static mint-glow placeholder
// visible and the rest of the hero stays interactive.
class SplineErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: unknown) {
    if (typeof console !== 'undefined') {
      console.warn('[SplineScene] runtime error caught — falling back to placeholder', error)
    }
  }
  render() {
    return this.state.hasError ? null : this.props.children
  }
}

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

// Deferred-mount delay in milliseconds. Long enough for hero text +
// CTAs to paint and become interactive before Spline starts its GPU/
// network work; short enough that real users see the robot soon after
// landing on the page.
const MOUNT_DELAY_MS = 1500

export function SplineScene({ scene, className }: SplineSceneProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<SplineApp | null>(null)
  const visibleRef = useRef<boolean>(true)
  const [shouldMount, setShouldMount] = useState(false)

  // PERF: defer the Spline mount by 1.5s after the wrapper paints.
  // This gives hero animations + content time to become interactive
  // before we start the GPU/network work to load the 3D scene.
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Honor reduced-motion: skip Spline entirely. The placeholder
    // remains as the visual.
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (reduced) return

    // PERF: the landing-hero stage that hosts this canvas is hidden
    // via `display: none` at max-width: 767px (see .hero-stage-desktop
    // in landing-hero.tsx). Without this guard the component still
    // mounts in the React tree on mobile, which triggers the dynamic
    // Spline import + the .splinecode binary fetch + WebGL init for a
    // canvas that's never visible. Gating the deferred mount on the
    // desktop breakpoint drops ~562 KiB of JS + ~380 KiB of binary
    // from every mobile pageload.
    const isDesktop = window.matchMedia('(min-width: 768px)').matches
    if (!isDesktop) return

    // SAFARI FIX (May-01): we previously raced requestIdleCallback
    // (with `{timeout: 1500}`) against a setTimeout fallback. Safari
    // 17.6+ implements rIC but doesn't honor the timeout strictly —
    // when the page has any ongoing work (aurora background, cursor
    // spotlight RAF, CSS keyframes on the floating cards), Safari can
    // park rIC indefinitely. A user reported the robot didn't appear
    // until the first mouse move, which is the next event that wakes
    // Safari's scheduler. Chrome respects the timeout, so it didn't
    // show this. We don't actually need rIC's "wait for true idle"
    // semantic — we just want a deferred mount with a known upper
    // bound. setTimeout is deterministic everywhere.
    const timeoutId = window.setTimeout(
      () => setShouldMount(true),
      MOUNT_DELAY_MS,
    )

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [])

  // IntersectionObserver runs as soon as the wrapper mounts, even if
  // Spline isn't loaded yet. Once Spline loads, onLoad consults
  // visibleRef to decide whether to play or stop immediately.
  // Phase 9: also pause on `document.visibilitychange` so the WebGL
  // render loop doesn't keep ticking when the user has the tab in the
  // background. (Most browsers throttle hidden-tab rAF to ~1Hz, but
  // explicit stop is cheaper and frees the GPU context entirely.)
  useEffect(() => {
    const node = wrapRef.current
    if (!node) return
    if (typeof window === 'undefined') return

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    const tabHiddenRef = { current: document.visibilityState === 'hidden' }

    const apply = () => {
      const app = appRef.current
      if (!app) return
      if (reduced || tabHiddenRef.current || !visibleRef.current) app.stop()
      else app.play()
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibleRef.current =
            entry.isIntersecting && entry.intersectionRatio > 0
        }
        apply()
      },
      // 256px rootMargin: start the loop a bit before the canvas
      // scrolls into view so the user doesn't see a frozen first
      // frame snap awake.
      { rootMargin: '256px 0px', threshold: 0 },
    )
    io.observe(node)

    const onVisibility = () => {
      tabHiddenRef.current = document.visibilityState === 'hidden'
      apply()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
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
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        // CROSS-BROWSER (Phase 12b + Apr-30 follow-up): force an atomic
        // GPU compositor layer on the canvas wrapper AND isolate it from
        // ancestor compositing. Safari composites WebGL canvases on a
        // separate layer from regular HTML; if any ancestor has a
        // `transform`, the canvas layer tracks that ancestor with a
        // frame of lag during scroll, producing a visible "swimming" /
        // "robot drifting" effect. The earlier translateZ(0) +
        // backface-visibility:hidden hints alone weren't enough — Safari
        // still chased an ancestor transform on landing-hero's stage.
        // We removed that ancestor transform, AND we add `contain: paint;
        // isolation: isolate;` here so any future ancestor transform
        // can't reintroduce the bug: the compositor must keep all paint
        // for this subtree inside this wrapper's bounding box.
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        willChange: 'transform',
        contain: 'layout paint',
        isolation: 'isolate',
      }}
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
        <SplineErrorBoundary>
          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center">
                <span className="loader"></span>
              </div>
            }
          >
            <Spline scene={scene} className={className} onLoad={handleLoad} />
          </Suspense>
        </SplineErrorBoundary>
      )}
    </div>
  )
}
