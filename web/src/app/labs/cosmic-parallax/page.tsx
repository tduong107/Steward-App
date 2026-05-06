import type { Metadata } from 'next'
import { CosmicParallaxLabDemo } from './demo'

export const metadata: Metadata = {
  title: 'Cosmic Parallax — Lab',
  robots: { index: false, follow: false },
}

export default function CosmicParallaxLabPage() {
  return <CosmicParallaxLabDemo />
}
