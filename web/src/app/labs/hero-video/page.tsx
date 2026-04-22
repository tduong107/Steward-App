import type { Metadata } from 'next'
import { HeroVideoPlayer } from './player'

// Noindex — private preview for internal use, not a real page.
// /labs/* is already in the middleware auth allowlist.
export const metadata: Metadata = {
  title: 'Hero Video — Orbital Loop',
  robots: { index: false, follow: false },
}

export default function HeroVideoLabPage() {
  return <HeroVideoPlayer />
}
