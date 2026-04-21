import type { Metadata } from 'next'
import { OrbitalTimelineLabDemo } from './demo'

// Noindex — this is a component playground, not a real user-facing
// page. Keep it out of Google and our sitemap (sitemap.ts only emits
// explicit routes, but the meta is defense in depth).
export const metadata: Metadata = {
  title: 'Endless Ways to Save — Orbital View',
  robots: { index: false, follow: false },
}

export default function OrbitalTimelineLabPage() {
  return <OrbitalTimelineLabDemo />
}
