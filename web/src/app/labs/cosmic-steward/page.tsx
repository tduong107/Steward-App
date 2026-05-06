import type { Metadata } from 'next'
import { CosmicStewardLabDemo } from './demo'

export const metadata: Metadata = {
  title: 'Cosmic Parallax — Steward theme — Lab',
  robots: { index: false, follow: false },
}

export default function CosmicStewardLabPage() {
  return <CosmicStewardLabDemo />
}
