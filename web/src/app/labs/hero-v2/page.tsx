import type { Metadata } from 'next'
import { HeroV2Demo } from './demo'

// Noindex — private prototype. /labs/* is in the middleware
// allowlist, so it's URL-accessible without login but never indexed.
export const metadata: Metadata = {
  title: 'Hero v2 — Concierge Spotlight',
  robots: { index: false, follow: false },
}

export default function HeroV2Page() {
  return <HeroV2Demo />
}
