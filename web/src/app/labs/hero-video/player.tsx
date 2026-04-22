'use client'

import { Player } from '@remotion/player'
import { StewardHeroVideo } from '@/remotion/StewardHeroVideo'
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from '@/remotion/constants'

export function HeroVideoPlayer() {
  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col items-center justify-center p-8 gap-6">
      <div
        style={{
          width: '100%',
          maxWidth: 1280,
          aspectRatio: `${WIDTH} / ${HEIGHT}`,
          boxShadow: '0 40px 120px rgba(139, 92, 246, 0.15)',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Player
          component={StewardHeroVideo}
          compositionWidth={WIDTH}
          compositionHeight={HEIGHT}
          fps={FPS}
          durationInFrames={TOTAL_FRAMES}
          controls
          loop
          autoPlay
          acknowledgeRemotionLicense
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      <div className="text-sm text-white/50 max-w-xl text-center leading-relaxed">
        Private preview · {Math.round(TOTAL_FRAMES / FPS)}s loop at {FPS}fps ·
        {' '}{WIDTH}×{HEIGHT}. Captions serve as the visual narration; drop an
        MP3 into <code className="text-white/70">public/voiceover/</code> and wire
        it into <code className="text-white/70">StewardHeroVideo.tsx</code> to
        add voice.
      </div>
    </div>
  )
}
