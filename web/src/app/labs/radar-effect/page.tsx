import type { Metadata } from 'next'
import { RadarEffectLabDemo } from './demo'

export const metadata: Metadata = {
  title: 'Endless Ways to Save — Radar View',
  robots: { index: false, follow: false },
}

export default function RadarEffectLabPage() {
  return <RadarEffectLabDemo />
}
