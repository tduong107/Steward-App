'use client'

import { CosmicParallaxBg } from '@/components/ui/parallax-cosmic-background'

export function CosmicParallaxLabDemo() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <CosmicParallaxBg
        head="EaseMize"
        text="Easy, customizable, Best"
        loop={true}
      />
    </div>
  )
}
