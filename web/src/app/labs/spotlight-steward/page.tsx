import type { Metadata } from 'next'
import { SpotlightStewardLabDemo } from './demo'

export const metadata: Metadata = {
  title: 'Spotlight on Cosmic — Steward — Lab',
  robots: { index: false, follow: false },
}

export default function SpotlightStewardLabPage() {
  return <SpotlightStewardLabDemo />
}
