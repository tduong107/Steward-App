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
          boxShadow: '0 40px 120px rgba(110, 231, 183, 0.18)',
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

      <div className="text-sm text-white/50 max-w-2xl text-center leading-relaxed">
        Private preview · 30-second interactive explainer at {FPS}fps · {WIDTH}×{HEIGHT}. Brand tokens
        and copy mirror the live landing page. The 8 watches shown in the "Right now" scene are real,
        pulled from production Supabase on 2026-04-22. Captions narrate the story; drop an MP3 into{' '}
        <code className="text-white/70">public/voiceover/</code> and wire it in{' '}
        <code className="text-white/70">StewardHeroVideo.tsx</code> to add voiceover.
      </div>
    </div>
  )
}
