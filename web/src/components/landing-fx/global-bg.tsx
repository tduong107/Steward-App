/**
 * GlobalBg — fixed-position layer behind all page content.
 *
 * Phase 9 perf: this is now a server component. Two key changes vs.
 * prior implementation:
 *
 * 1. **`filter: blur(80px)` removed from the aurora blobs.** A blur
 *    filter on a fixed-position element forces the compositor to
 *    allocate a separate texture, run a 5-tap separable Gaussian
 *    over the entire 720×720 / 560×560 region, and re-composite
 *    every paint. Even though the blobs are static now, every page
 *    paint (scroll, repaint, hover anywhere) was paying that cost.
 *
 *    Replaced with `radial-gradient(circle, <color> 0%, <color>
 *    transparent 70%)`. Visually identical (a soft circular glow
 *    falling off to transparent), but it's just a single solid paint
 *    — zero blur compositor work.
 *
 * 2. **Aurora-drift infinite animation removed.** The 26s + 30s
 *    `transform`/`scale` loops kept the compositor "warm" even when
 *    the page was completely idle (driving rAF ticks for the blob
 *    layer). The drift was so slow + subtle that almost no user ever
 *    noticed it; killing it removes a continuous background cost.
 *
 * 3. **No `'use client'`, no `useEffect`, no `useState`** — there's
 *    no longer any media-query work to do (the drift animation that
 *    needed the prefers-reduced-motion gate is gone). Now this
 *    renders as a pure server component, shipping zero JS to the
 *    client for the background layer.
 */

export function GlobalBg() {
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
      {/* Mint grid lattice — two thin gradients masked to a centered
          ellipse so the lines fade into the page edges. Static, no
          animation. The mask is the only borderline-expensive thing
          here and we keep it because it's the signature look. */}
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

      {/* Aurora blob — deep green, near hero. Pure radial-gradient now;
          no filter:blur, no animation. The 720x720 block is purely
          declarative paint. */}
      <div
        style={{
          position: 'absolute',
          left: '8%',
          top: '14%',
          width: 720,
          height: 720,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(42, 92, 69, 0.45) 0%, rgba(42, 92, 69, 0.18) 35%, rgba(42, 92, 69, 0) 70%)',
        }}
      />

      {/* Aurora blob — mint-2, lower (warm bottom wash). */}
      <div
        style={{
          position: 'absolute',
          left: '40%',
          top: '78%',
          width: 560,
          height: 560,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(167, 243, 208, 0.10) 0%, rgba(167, 243, 208, 0.04) 40%, rgba(167, 243, 208, 0) 70%)',
        }}
      />
    </div>
  )
}
