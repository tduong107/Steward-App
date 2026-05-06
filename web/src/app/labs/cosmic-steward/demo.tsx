'use client'

import { CosmicParallaxBg } from '@/components/ui/parallax-cosmic-background'

export function CosmicStewardLabDemo() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <CosmicParallaxBg
        head="Steward"
        text="Watch, Catch, Save"
        loop={true}
        className="cosmic-steward"
      />
    </div>
  )
}
