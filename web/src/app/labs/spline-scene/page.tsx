import type { Metadata } from 'next'
import { SplineSceneBasic } from './demo'

// Noindex — private preview. /labs/* is already in the middleware
// allowlist, so no login required but not surfaced to search.
export const metadata: Metadata = {
  title: 'Spline Scene — Interactive 3D',
  robots: { index: false, follow: false },
}

export default function SplineScenePage() {
  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-8">
      <div className="w-full max-w-6xl">
        <SplineSceneBasic />
      </div>
    </div>
  )
}
