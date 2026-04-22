'use client'

import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import {
  COLORS,
  FONTS,
  FPS,
  REAL_WATCHES,
  SCENES,
  TOTAL_FRAMES,
  type RealWatch,
} from './constants'

// ---------- Timing helpers ----------

const s = (sec: number) => Math.round(sec * FPS) // seconds → frames
const easeOut = Easing.bezier(0.16, 1, 0.3, 1)
const easeInOut = Easing.bezier(0.45, 0, 0.55, 1)
const easeIn = Easing.bezier(0.55, 0, 0.68, 0)
const overshoot = Easing.bezier(0.34, 1.3, 0.64, 1)

// Utility: map 0..1 progress into a value range
function lerp(t: number, a: number, b: number) {
  return a + (b - a) * t
}

// ---------- Main composition ----------

export function StewardHeroVideo() {
  return (
    <AbsoluteFill style={{ background: COLORS.bgDeep, overflow: 'hidden' }}>
      <AmbientBackground />

      {/* Scene 1: Hook */}
      <Sequence from={s(SCENES.HOOK.start)} durationInFrames={s(SCENES.HOOK.dur + 0.4)} layout="none">
        <SceneHook />
      </Sequence>

      {/* Scene 2: Spot & Share */}
      <Sequence
        from={s(SCENES.SHARE.start - 0.3)}
        durationInFrames={s(SCENES.SHARE.dur + 0.6)}
        layout="none"
      >
        <SceneShare />
      </Sequence>

      {/* Scene 3: AI concierge chat */}
      <Sequence
        from={s(SCENES.CHAT.start - 0.3)}
        durationInFrames={s(SCENES.CHAT.dur + 0.6)}
        layout="none"
      >
        <SceneChat />
      </Sequence>

      {/* Scene 4: Real watches grid */}
      <Sequence
        from={s(SCENES.WATCHES.start - 0.3)}
        durationInFrames={s(SCENES.WATCHES.dur + 0.6)}
        layout="none"
      >
        <SceneWatches />
      </Sequence>

      {/* Scene 5: Notification arrives */}
      <Sequence
        from={s(SCENES.NOTIFY.start - 0.3)}
        durationInFrames={s(SCENES.NOTIFY.dur + 0.6)}
        layout="none"
      >
        <SceneNotify />
      </Sequence>

      {/* Scene 6: CTA */}
      <Sequence
        from={s(SCENES.CTA.start - 0.3)}
        durationInFrames={s(SCENES.CTA.dur + 0.3)}
        layout="none"
      >
        <SceneCTA />
      </Sequence>

      <SceneLabel />
      <Grain />
    </AbsoluteFill>
  )
}

// =====================================================================
// Ambient background — slow drifting mint + gold radials on deep bg
// =====================================================================

function AmbientBackground() {
  const frame = useCurrentFrame()
  const drift = (frame / FPS) * 4 // slow degrees
  const mintX = 20 + 10 * Math.sin((frame / FPS) * 0.3)
  const goldY = 80 + 8 * Math.cos((frame / FPS) * 0.25)
  return (
    <AbsoluteFill
      style={{
        background: `
          radial-gradient(ellipse 60% 40% at ${mintX}% 25%, rgba(110, 231, 183, 0.12), transparent 60%),
          radial-gradient(ellipse 55% 45% at 80% ${goldY}%, rgba(245, 158, 11, 0.08), transparent 60%),
          linear-gradient(${drift}deg, ${COLORS.bgDeep} 0%, ${COLORS.forest} 55%, ${COLORS.bgDeep} 100%)
        `,
      }}
    />
  )
}

// Subtle grain / vignette sold as an overlay.
function Grain() {
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.35) 100%)
        `,
      }}
    />
  )
}

// =====================================================================
// Scene label (top-right progress pill). Tiny indicator of which scene.
// =====================================================================

function SceneLabel() {
  const frame = useCurrentFrame()
  const totalDur = TOTAL_FRAMES
  const progress = frame / totalDur
  return (
    <div
      style={{
        position: 'absolute',
        top: 40,
        right: 44,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontFamily: FONTS.body,
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: COLORS.creamDim,
      }}
    >
      <span style={{ color: COLORS.mint }}>✦</span>
      <span>Steward</span>
      <span
        style={{
          width: 120,
          height: 2,
          background: COLORS.border,
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${progress * 100}%`,
            background: COLORS.mint,
          }}
        />
      </span>
    </div>
  )
}

// =====================================================================
// Scene 1: Hook — "Scalpers have bots. Now you have a concierge."
// Word-by-word reveal, mirroring the real hero animation on the landing.
// =====================================================================

function SceneHook() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const line1Words = ['Scalpers', 'have', 'bots.']
  const line2Words = ['Now', 'you', 'have', 'a', 'concierge.']

  const sceneDur = s(SCENES.HOOK.dur)
  const exit = interpolate(frame, [sceneDur - 8, sceneDur + 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeInOut,
  })
  const exitLift = -60 * exit
  const exitOpacity = 1 - exit

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONTS.serif,
        transform: `translateY(${exitLift}px)`,
        opacity: exitOpacity,
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 1400, padding: '0 60px' }}>
        <div
          style={{
            fontSize: 110,
            fontWeight: 700,
            lineHeight: 1.05,
            color: COLORS.cream,
            letterSpacing: '-0.02em',
          }}
        >
          {line1Words.map((word, i) => (
            <RevealWord key={`l1-${i}`} word={word} delay={i * 5 + 6} fps={fps} />
          ))}
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 110,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
          }}
        >
          {line2Words.map((word, i) => {
            const isConcierge = word === 'concierge.'
            return (
              <RevealWord
                key={`l2-${i}`}
                word={word}
                delay={30 + i * 5}
                fps={fps}
                italic={isConcierge}
                color={isConcierge ? COLORS.mint : COLORS.cream}
              />
            )
          })}
        </div>

        {/* Subtitle */}
        <SubtleFadeIn delay={55}>
          <div
            style={{
              marginTop: 42,
              fontFamily: FONTS.body,
              fontSize: 26,
              color: COLORS.creamDim,
              fontWeight: 400,
              letterSpacing: '0.01em',
            }}
          >
            Your personalized AI that levels the playing field.
          </div>
        </SubtleFadeIn>
      </div>
    </AbsoluteFill>
  )
}

function RevealWord({
  word,
  delay,
  fps,
  italic = false,
  color = COLORS.cream,
}: {
  word: string
  delay: number
  fps: number
  italic?: boolean
  color?: string
}) {
  const frame = useCurrentFrame()
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200, mass: 0.5, stiffness: 100 },
    durationInFrames: 30,
  })
  const y = lerp(progress, 40, 0)
  const opacity = progress
  return (
    <span
      style={{
        display: 'inline-block',
        transform: `translateY(${y}px)`,
        opacity,
        marginRight: word === 'a' ? 14 : 22,
        color,
        fontStyle: italic ? 'italic' : 'normal',
      }}
    >
      {word}
    </span>
  )
}

function SubtleFadeIn({
  children,
  delay,
  duration = 24,
}: {
  children: React.ReactNode
  delay: number
  duration?: number
}) {
  const frame = useCurrentFrame()
  const t = interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOut,
  })
  return <div style={{ opacity: t, transform: `translateY(${(1 - t) * 16}px)` }}>{children}</div>
}

// =====================================================================
// Scene 2: Spot + Share  — iPhone with product, tap share, Steward.
// =====================================================================

function SceneShare() {
  const frame = useCurrentFrame()
  const sceneDur = s(SCENES.SHARE.dur)

  // Enter/exit fade for the whole scene
  const enter = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOut,
  })
  const exit = interpolate(frame, [sceneDur - 4, sceneDur + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeInOut,
  })

  // Phase flags (seconds within the scene)
  const localSec = frame / FPS
  const productShown = localSec > 0.2
  const cursorTapShare = localSec > 1.9 && localSec < 2.6
  const shareSheetOpen = localSec > 2.3
  const stewardPulse = localSec > 3.3
  const cursorTapSteward = localSec > 4.0 && localSec < 4.7
  const stewardTapped = localSec > 4.4

  // Share sheet slide-in
  const sheetProgress = interpolate(
    frame,
    [s(2.3), s(3.0)],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut },
  )

  // Phone enters with a soft lift
  const phoneScale = interpolate(frame, [0, 18], [0.92, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOut,
  })

  return (
    <AbsoluteFill style={{ opacity: enter * (1 - exit) }}>
      {/* Header caption */}
      <Caption
        kicker="Step 1"
        title={<>Spot anything. Tap Share. Pick <em style={{ color: COLORS.mint, fontStyle: 'italic' }}>Steward</em>.</>}
        sub="Your AI concierge lives in the share sheet."
        startFrame={0}
      />

      {/* Phone mockup centered-ish, slightly right */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            transform: `scale(${phoneScale})`,
            transformOrigin: 'center 60%',
            position: 'relative',
          }}
        >
          <PhoneFrame>
            {/* Product view (Safari-like) */}
            <ProductView watch={REAL_WATCHES[0]} />

            {/* Tap highlight on share button */}
            {cursorTapShare && <ShareButtonTapRing />}

            {/* Share sheet */}
            <ShareSheet
              progress={sheetProgress}
              stewardPulse={stewardPulse}
              stewardTapped={stewardTapped}
            />
          </PhoneFrame>

          {/* Cursor animation */}
          <SceneCursor scene="share" />
        </div>
      </div>
    </AbsoluteFill>
  )
}

function Caption({
  kicker,
  title,
  sub,
  startFrame,
  side = 'left',
}: {
  kicker: string
  title: React.ReactNode
  sub?: string
  startFrame: number
  side?: 'left' | 'right' | 'center'
}) {
  const frame = useCurrentFrame()
  const t = interpolate(frame, [startFrame, startFrame + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOut,
  })
  const align = side === 'center' ? 'center' : side
  return (
    <div
      style={{
        position: 'absolute',
        top: 130,
        left: side === 'right' ? 'auto' : side === 'center' ? 0 : 88,
        right: side === 'right' ? 88 : side === 'center' ? 0 : 'auto',
        textAlign: align,
        maxWidth: side === 'center' ? '100%' : 600,
        padding: side === 'center' ? '0 60px' : 0,
        fontFamily: FONTS.body,
        opacity: t,
        transform: `translateX(${side === 'left' ? -(1 - t) * 24 : side === 'right' ? (1 - t) * 24 : 0}px)`,
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: COLORS.mint,
          marginBottom: 16,
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          fontFamily: FONTS.serif,
          fontSize: 58,
          fontWeight: 700,
          lineHeight: 1.1,
          color: COLORS.cream,
          letterSpacing: '-0.02em',
          marginBottom: sub ? 16 : 0,
        }}
      >
        {title}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 22,
            color: COLORS.creamDim,
            fontWeight: 400,
            lineHeight: 1.5,
            maxWidth: 540,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  )
}

// ---------- Phone frame (iOS-ish) ----------
const PHONE_W = 380
const PHONE_H = 800

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: PHONE_W,
        height: PHONE_H,
        borderRadius: 52,
        background: '#0a0a0a',
        padding: 10,
        boxShadow: '0 40px 120px rgba(0,0,0,0.55), 0 0 0 2px rgba(255,255,255,0.08)',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 18,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 124,
          height: 30,
          borderRadius: 18,
          background: '#000',
          zIndex: 3,
        }}
      />
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 42,
          overflow: 'hidden',
          background: COLORS.bgDeep,
          position: 'relative',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function ProductView({ watch }: { watch: RealWatch }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#FAFBFC',
        color: '#111',
      }}
    >
      {/* Safari URL bar */}
      <div
        style={{
          marginTop: 56,
          marginLeft: 12,
          marginRight: 12,
          padding: '10px 14px',
          background: '#EEEEF1',
          borderRadius: 12,
          fontFamily: FONTS.body,
          fontSize: 13,
          color: '#5c5c66',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ opacity: 0.55 }}>🔒</span>
        <span>nike.com/airforce-1</span>
      </div>
      {/* Product image + details */}
      <div style={{ flex: 1, padding: '24px 20px', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            background: '#F3F4F6',
            borderRadius: 18,
            height: 260,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 120,
          }}
        >
          👟
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: FONTS.body,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#6B7280',
          }}
        >
          Men's Shoes
        </div>
        <div
          style={{
            marginTop: 6,
            fontFamily: FONTS.body,
            fontSize: 22,
            fontWeight: 600,
            color: '#111',
            letterSpacing: '-0.01em',
          }}
        >
          {watch.name}
        </div>
        <div
          style={{
            marginTop: 12,
            fontFamily: FONTS.body,
            fontSize: 24,
            fontWeight: 700,
            color: '#111',
          }}
        >
          ${watch.wasPrice?.toFixed(2)}
        </div>
      </div>
      {/* Bottom bar with share button */}
      <div
        style={{
          height: 70,
          background: '#F3F4F6',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingBottom: 16,
        }}
      >
        <BottomIcon symbol="‹" />
        <BottomIcon symbol="›" faded />
        <BottomIcon symbol="⇪" highlight />
        <BottomIcon symbol="▯" />
        <BottomIcon symbol="⊞" />
      </div>
    </div>
  )
}

function BottomIcon({
  symbol,
  highlight = false,
  faded = false,
}: {
  symbol: string
  highlight?: boolean
  faded?: boolean
}) {
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        color: faded ? '#C7CAD1' : highlight ? '#3B82F6' : '#1F2937',
        fontWeight: 300,
      }}
    >
      {symbol}
    </div>
  )
}

function ShareButtonTapRing() {
  const frame = useCurrentFrame()
  const local = frame - s(1.9)
  const scale = interpolate(local, [0, 18], [0.5, 2.6], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOut,
  })
  const opacity = interpolate(local, [0, 6, 20], [0, 0.8, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 30,
        width: 80,
        height: 80,
        marginLeft: -32,
        borderRadius: '50%',
        border: `3px solid ${COLORS.mint}`,
        transform: `scale(${scale})`,
        opacity,
        pointerEvents: 'none',
      }}
    />
  )
}

function ShareSheet({
  progress,
  stewardPulse,
  stewardTapped,
}: {
  progress: number
  stewardPulse: boolean
  stewardTapped: boolean
}) {
  const frame = useCurrentFrame()
  const translateY = lerp(1 - progress, 0, 420)

  const stewardPulseScale = stewardPulse
    ? 1 + 0.08 * Math.sin(((frame - s(3.3)) / FPS) * 2.4 * Math.PI)
    : 1

  const stewardTapScale = stewardTapped
    ? interpolate(frame, [s(4.4), s(4.55)], [1, 1.18], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: overshoot,
      })
    : 1

  const stewardFlash = stewardTapped
    ? interpolate(frame, [s(4.4), s(4.6), s(4.9)], [0, 1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0

  if (progress <= 0.005) return null

  return (
    <div
      style={{
        position: 'absolute',
        left: 8,
        right: 8,
        bottom: 8,
        transform: `translateY(${translateY}px)`,
        background: 'rgba(36, 36, 40, 0.92)',
        backdropFilter: 'blur(20px)',
        borderRadius: 24,
        padding: '20px 18px 28px',
        color: '#fff',
        fontFamily: FONTS.body,
      }}
    >
      <div
        style={{
          width: 40,
          height: 4,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.35)',
          margin: '0 auto 18px',
        }}
      />
      <div
        style={{
          display: 'flex',
          gap: 10,
          overflow: 'hidden',
          paddingBottom: 6,
        }}
      >
        {SHARE_APPS.map((app) => {
          const isSteward = app.key === 'steward'
          return (
            <div
              key={app.key}
              style={{
                minWidth: 70,
                textAlign: 'center',
                transform: isSteward ? `scale(${stewardPulseScale * stewardTapScale})` : 'scale(1)',
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 14,
                  background: app.bg,
                  margin: '0 auto 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 30,
                  color: app.color ?? '#fff',
                  fontFamily: app.font ?? 'inherit',
                  fontWeight: app.weight ?? 500,
                  boxShadow: isSteward
                    ? `0 0 0 3px ${COLORS.mint}, 0 0 ${stewardPulse ? 24 : 0}px rgba(110,231,183,${stewardPulse ? 0.7 : 0})`
                    : 'none',
                  border: isSteward ? 'none' : '0.5px solid rgba(255,255,255,0.08)',
                  position: 'relative',
                }}
              >
                {app.glyph}
                {isSteward && stewardFlash > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 14,
                      background: 'rgba(255,255,255,0.7)',
                      opacity: stewardFlash,
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: isSteward ? COLORS.mint : 'rgba(255,255,255,0.75)',
                  fontWeight: isSteward ? 600 : 400,
                  letterSpacing: '0.01em',
                }}
              >
                {app.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const SHARE_APPS = [
  { key: 'airdrop', glyph: '◎', label: 'AirDrop', bg: '#0B67FF', color: '#fff' },
  { key: 'messages', glyph: '💬', label: 'Messages', bg: '#3CB85D' },
  { key: 'mail', glyph: '✉︎', label: 'Mail', bg: '#0C7DFB', color: '#fff', weight: 600 as const },
  {
    key: 'steward',
    glyph: '✦',
    label: 'Steward',
    bg: `linear-gradient(135deg, ${COLORS.forest}, #1B4D34)`,
    color: COLORS.mint,
    font: FONTS.serif,
    weight: 700 as const,
  },
  { key: 'copy', glyph: '⎘', label: 'Copy', bg: '#3A3A3C', color: '#fff' },
  { key: 'notes', glyph: '📝', label: 'Notes', bg: '#FDD84A' },
  { key: 'reminders', glyph: '◉', label: 'Reminders', bg: '#2A2A2C', color: '#FF5952' },
]

// ---------- Cursor (SVG pointer) ----------

function SceneCursor({ scene }: { scene: 'share' }) {
  const frame = useCurrentFrame()

  // Share scene cursor: off-screen → share button → steward icon
  if (scene !== 'share') return null

  const t1 = interpolate(frame, [s(0.6), s(2.0)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeInOut,
  })
  const t2 = interpolate(frame, [s(2.8), s(4.3)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeInOut,
  })

  // Cursor relative to phone container. Phone is 380×800 positioned in
  // center. We map cursor to position inside the phone then to scene
  // coordinates. Simpler: place cursor absolute within the phone.
  // Start position off the bottom-right of phone.
  const startX = PHONE_W + 120
  const startY = PHONE_H + 40
  // Share button at bottom-center inside phone
  const shareX = PHONE_W / 2 + 8
  const shareY = PHONE_H - 36
  // Steward icon inside share sheet (4th tile): roughly x = 12 + 3.5*(70+10) = 292
  const stewardX = 12 + 3.5 * 80 + 29 // center of 4th tile
  const stewardY = PHONE_H - 110

  let x = startX
  let y = startY
  if (t1 > 0 && t2 <= 0) {
    x = lerp(t1, startX, shareX)
    y = lerp(t1, startY, shareY)
  } else if (t2 > 0) {
    x = lerp(t2, shareX, stewardX)
    y = lerp(t2, shareY, stewardY)
  }

  // Fade out after last tap
  const fade = interpolate(frame, [s(4.55), s(4.9)], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeInOut,
  })

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-8px, -2px)',
        pointerEvents: 'none',
        opacity: fade,
        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))',
      }}
    >
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
        <path
          d="M2 2 L2 28 L9 22 L13 32 L17 30 L13 20 L22 20 Z"
          fill="#fff"
          stroke="#111"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

// =====================================================================
// Scene 3: AI concierge chat
// =====================================================================

function SceneChat() {
  const frame = useCurrentFrame()
  const sceneDur = s(SCENES.CHAT.dur)

  const enter = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOut,
  })
  const exit = interpolate(frame, [sceneDur - 4, sceneDur + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeInOut,
  })

  return (
    <AbsoluteFill style={{ opacity: enter * (1 - exit) }}>
      <Caption
        kicker="Step 2"
        title={
          <>
            Your concierge <em style={{ color: COLORS.mint, fontStyle: 'italic' }}>understands</em> what you want.
          </>
        }
        sub="Just say it. Steward builds the watch in seconds."
        startFrame={0}
        side="left"
      />

      <div
        style={{
          position: 'absolute',
          right: 140,
          top: 200,
          bottom: 100,
          width: 720,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          fontFamily: FONTS.body,
        }}
      >
        {/* Chat card */}
        <div
          style={{
            background: COLORS.bgCard,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 24,
            padding: 28,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            boxShadow: '0 40px 120px rgba(0,0,0,0.4)',
          }}
        >
          {/* Window chrome */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
            <div
              style={{
                marginLeft: 16,
                fontSize: 13,
                color: COLORS.creamDim,
                letterSpacing: '0.08em',
              }}
            >
              Steward · New Watch
            </div>
          </div>

          {/* User bubble — types in */}
          <UserBubble text="Watch Nike Air Force 1 and ping me when any retailer drops below $80" startFrame={10} />

          {/* Typing dots */}
          <TypingDots startFrame={70} endFrame={100} />

          {/* AI bubble */}
          <AIBubble startFrame={95}>
            <div>
              On it. Watching <strong style={{ color: COLORS.cream }}>Nike Air Force 1</strong> across
              Amazon, eBay, StockX, and nike.com. I'll ping you the instant the best price drops below{' '}
              <strong style={{ color: COLORS.mint }}>$80</strong>.
            </div>
          </AIBubble>

          {/* Watch card materializes */}
          <WatchMiniCard startFrame={125} watch={REAL_WATCHES[0]} />
        </div>
      </div>
    </AbsoluteFill>
  )
}

function UserBubble({ text, startFrame }: { text: string; startFrame: number }) {
  const frame = useCurrentFrame()
  const charCount = Math.max(0, Math.min(text.length, Math.floor((frame - startFrame) * 1.6)))
  const enter = interpolate(frame, [startFrame - 6, startFrame + 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOut,
  })
  const showCursor = charCount < text.length && frame > startFrame
  return (
    <div
      style={{
        alignSelf: 'flex-end',
        maxWidth: '78%',
        padding: '14px 18px',
        background: COLORS.mint,
        color: COLORS.bgDeep,
        borderRadius: '18px 18px 4px 18px',
        fontSize: 19,
        lineHeight: 1.45,
        fontWeight: 500,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 12}px)`,
      }}
    >
      {text.slice(0, charCount)}
      {showCursor && <BlinkingCaret />}
    </div>
  )
}

function BlinkingCaret() {
  const frame = useCurrentFrame()
  const visible = Math.floor(frame / 8) % 2 === 0
  return (
    <span
      style={{
        display: 'inline-block',
        width: 2,
        height: '1em',
        background: COLORS.bgDeep,
        marginLeft: 2,
        verticalAlign: 'text-bottom',
        opacity: visible ? 0.9 : 0,
      }}
    />
  )
}

function TypingDots({ startFrame, endFrame }: { startFrame: number; endFrame: number }) {
  const frame = useCurrentFrame()
  if (frame < startFrame || frame > endFrame) return null
  const local = frame - startFrame
  return (
    <div
      style={{
        alignSelf: 'flex-start',
        padding: '14px 18px',
        background: 'rgba(110, 231, 183, 0.08)',
        border: `1px solid rgba(110, 231, 183, 0.22)`,
        borderRadius: '18px 18px 18px 4px',
        display: 'flex',
        gap: 6,
      }}
    >
      {[0, 1, 2].map((i) => {
        const phase = ((local + i * 6) / 4) * Math.PI
        const bob = 2 + 4 * Math.abs(Math.sin(phase))
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: COLORS.mint,
              transform: `translateY(${-bob}px)`,
            }}
          />
        )
      })}
    </div>
  )
}

function AIBubble({ startFrame, children }: { startFrame: number; children: React.ReactNode }) {
  const frame = useCurrentFrame()
  const enter = interpolate(frame, [startFrame, startFrame + 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOut,
  })
  return (
    <div
      style={{
        alignSelf: 'flex-start',
        maxWidth: '82%',
        padding: '14px 18px',
        background: 'rgba(110, 231, 183, 0.08)',
        border: `1px solid rgba(110, 231, 183, 0.22)`,
        color: COLORS.creamDim,
        borderRadius: '18px 18px 18px 4px',
        fontSize: 19,
        lineHeight: 1.45,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 12}px)`,
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: COLORS.mint,
          marginBottom: 6,
          fontWeight: 600,
        }}
      >
        <span style={{ marginRight: 6 }}>✦</span>Steward
      </div>
      {children}
    </div>
  )
}

function WatchMiniCard({ watch, startFrame }: { watch: RealWatch; startFrame: number }) {
  const frame = useCurrentFrame()
  const t = interpolate(frame, [startFrame, startFrame + 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: overshoot,
  })
  return (
    <div
      style={{
        marginTop: 'auto',
        padding: 18,
        borderRadius: 18,
        background: COLORS.bgElev,
        border: `1px solid ${COLORS.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        opacity: t,
        transform: `translateY(${(1 - t) * 20}px) scale(${lerp(t, 0.92, 1)})`,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: 'rgba(110, 231, 183, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 30,
        }}
      >
        {watch.emoji}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: COLORS.mint,
          }}
        >
          Watching · Best Price
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, color: COLORS.cream, marginTop: 2 }}>
          {watch.name}
        </div>
        <div style={{ fontSize: 14, color: COLORS.creamDim, marginTop: 2 }}>
          Target: below $80 · checked every 5 min
        </div>
      </div>
      <div
        style={{
          padding: '6px 12px',
          border: `1px solid ${COLORS.mint}`,
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          color: COLORS.mint,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        Active
      </div>
    </div>
  )
}

// =====================================================================
// Scene 4: Real watches right now
// =====================================================================

function SceneWatches() {
  const frame = useCurrentFrame()
  const sceneDur = s(SCENES.WATCHES.dur)

  const enter = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOut,
  })
  const exit = interpolate(frame, [sceneDur - 4, sceneDur + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeInOut,
  })

  const picked = REAL_WATCHES.slice(0, 8) // show 8 for 4x2 grid

  return (
    <AbsoluteFill style={{ opacity: enter * (1 - exit) }}>
      <Caption
        kicker="Right now"
        title={
          <>
            Steward is watching <em style={{ color: COLORS.mint, fontStyle: 'italic' }}>these</em>.
          </>
        }
        sub="Real watches, pulled from our production database this second."
        startFrame={0}
        side="center"
      />

      <div
        style={{
          position: 'absolute',
          top: 380,
          left: 0,
          right: 0,
          bottom: 60,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: 20,
          padding: '0 80px',
        }}
      >
        {picked.map((w, i) => (
          <WatchCard key={i} watch={w} index={i} sceneDur={sceneDur} />
        ))}
      </div>
    </AbsoluteFill>
  )
}

function WatchCard({
  watch,
  index,
  sceneDur,
}: {
  watch: RealWatch
  index: number
  sceneDur: number
}) {
  const frame = useCurrentFrame()
  const delay = 18 + index * 6
  const enter = interpolate(frame, [delay, delay + 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: overshoot,
  })

  // Price drop reveal for 'drop' status — animate price number from
  // wasPrice down to nowPrice.
  const priceRevealStart = 60 + index * 4
  const priceRevealDur = 40
  const priceT = interpolate(
    frame,
    [priceRevealStart, priceRevealStart + priceRevealDur],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut },
  )
  const animatedPrice =
    watch.status === 'drop' && watch.wasPrice != null && watch.nowPrice != null
      ? lerp(priceT, watch.wasPrice, watch.nowPrice)
      : watch.nowPrice

  const badgeColor =
    watch.status === 'drop'
      ? COLORS.mint
      : watch.status === 'available'
      ? COLORS.gold
      : COLORS.creamDim

  const badgeBg =
    watch.status === 'drop'
      ? 'rgba(110, 231, 183, 0.14)'
      : watch.status === 'available'
      ? 'rgba(245, 158, 11, 0.14)'
      : 'rgba(255,255,255,0.06)'

  const badgeLabel =
    watch.status === 'drop' ? 'Price drop' : watch.status === 'available' ? 'Available' : 'Watching'

  // subtle hover-pulse for drop/available cards
  const highlightCard = watch.status !== 'watching'
  const pulse = highlightCard
    ? 1 + 0.015 * Math.sin(((frame - delay) / FPS) * 2 * Math.PI)
    : 1

  return (
    <div
      style={{
        background: COLORS.bgCard,
        border: highlightCard
          ? `1px solid ${watch.accent ?? COLORS.mint}`
          : `1px solid ${COLORS.border}`,
        borderRadius: 20,
        padding: '20px 22px',
        opacity: enter,
        transform: `translateY(${(1 - enter) * 30}px) scale(${lerp(enter, 0.95, 1) * pulse})`,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        fontFamily: FONTS.body,
        boxShadow: highlightCard
          ? `0 0 0 1px ${watch.accent ?? COLORS.mint}22, 0 20px 60px rgba(0,0,0,0.35)`
          : '0 20px 60px rgba(0,0,0,0.25)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top row: emoji + badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
          }}
        >
          {watch.emoji}
        </div>
        <div
          style={{
            padding: '4px 10px',
            borderRadius: 999,
            background: badgeBg,
            color: badgeColor,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          {badgeLabel}
        </div>
      </div>

      {/* Name */}
      <div
        style={{
          fontSize: 17,
          fontWeight: 600,
          color: COLORS.cream,
          lineHeight: 1.25,
          letterSpacing: '-0.005em',
        }}
      >
        {watch.name}
      </div>

      {/* Retailer */}
      <div
        style={{
          fontSize: 12,
          color: COLORS.creamDim,
          fontWeight: 500,
          letterSpacing: '0.02em',
          textTransform: 'lowercase',
        }}
      >
        {watch.retailer}
      </div>

      {/* Price / note */}
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'baseline', gap: 10 }}>
        {watch.status === 'drop' && watch.wasPrice != null && (
          <>
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: COLORS.mint,
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              ${animatedPrice?.toFixed(watch.nowPrice && watch.nowPrice % 1 !== 0 ? 2 : 0)}
            </div>
            <div
              style={{
                fontSize: 14,
                color: COLORS.creamFaint,
                textDecoration: 'line-through',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              ${watch.wasPrice.toFixed(watch.wasPrice % 1 !== 0 ? 2 : 0)}
            </div>
          </>
        )}
        {watch.status === 'available' && (
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: COLORS.gold,
            }}
          >
            Spots just opened
          </div>
        )}
        {watch.status === 'watching' && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            {watch.nowPrice != null && (
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: COLORS.cream,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                ${watch.nowPrice.toFixed(watch.nowPrice % 1 !== 0 ? 2 : 0)}
              </div>
            )}
            <div style={{ fontSize: 13, color: COLORS.creamDim }}>{watch.note}</div>
          </div>
        )}
      </div>

      {/* Accent bar at bottom if drop */}
      {highlightCard && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            height: 3,
            width: `${enter * 100}%`,
            background: watch.accent ?? COLORS.mint,
            opacity: 0.85,
          }}
        />
      )}
    </div>
  )
}

// =====================================================================
// Scene 5: Notification arrives
// =====================================================================

function SceneNotify() {
  const frame = useCurrentFrame()
  const sceneDur = s(SCENES.NOTIFY.dur)

  const enter = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOut,
  })
  const exit = interpolate(frame, [sceneDur - 4, sceneDur + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeInOut,
  })

  const phoneLift = interpolate(frame, [0, 20], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOut,
  })

  return (
    <AbsoluteFill style={{ opacity: enter * (1 - exit) }}>
      <Caption
        kicker="Step 3"
        title={
          <>
            The moment it drops, <em style={{ color: COLORS.mint, fontStyle: 'italic' }}>you're first.</em>
          </>
        }
        sub="Push notification. One tap to buy. Before anyone else."
        startFrame={0}
        side="right"
      />

      {/* Lock-screen phone */}
      <div
        style={{
          position: 'absolute',
          left: 200,
          top: 150,
          bottom: 80,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            transform: `translateY(${phoneLift}px)`,
          }}
        >
          <PhoneFrame>
            <LockScreen />
          </PhoneFrame>
        </div>
      </div>
    </AbsoluteFill>
  )
}

function LockScreen() {
  const frame = useCurrentFrame()

  // Notification slides in from top
  const notifProgress = interpolate(frame, [s(0.8), s(1.5)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: overshoot,
  })
  const notifY = lerp(1 - notifProgress, 0, -120)
  const notifOpacity = notifProgress

  // Ripple tap effect
  const tapStart = s(3.3)
  const ripple = interpolate(frame, [tapStart, tapStart + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOut,
  })
  const rippleOpacity = interpolate(frame, [tapStart, tapStart + 6, tapStart + 20], [0, 0.7, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Notification press-down
  const pressScale =
    frame >= tapStart && frame < tapStart + 12
      ? interpolate(frame, [tapStart, tapStart + 6, tapStart + 12], [1, 0.97, 1], {
          easing: easeInOut,
        })
      : 1

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `
          radial-gradient(ellipse 80% 50% at 50% 0%, rgba(110, 231, 183, 0.12), transparent 60%),
          linear-gradient(180deg, #06070A, #0a1310 55%, #060807)
        `,
        position: 'relative',
        fontFamily: FONTS.body,
        color: COLORS.cream,
      }}
    >
      {/* Time */}
      <div style={{ paddingTop: 90, textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 500, letterSpacing: '0.02em', opacity: 0.7 }}>
          Wednesday, April 22
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 200,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            marginTop: 2,
          }}
        >
          9:41
        </div>
      </div>

      {/* Notification */}
      <div
        style={{
          position: 'absolute',
          top: 250 + notifY,
          left: 14,
          right: 14,
          opacity: notifOpacity,
          transform: `scale(${pressScale})`,
          padding: 14,
          background: 'rgba(28, 28, 32, 0.78)',
          backdropFilter: 'blur(30px)',
          borderRadius: 18,
          boxShadow: '0 16px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${COLORS.forest}, #1B4D34)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: COLORS.mint,
              fontFamily: FONTS.serif,
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            ✦
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.65)',
            }}
          >
            Steward
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>now</div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.cream, marginBottom: 4 }}>
          Nike Air Force 1 just dropped
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)', lineHeight: 1.4 }}>
          <span style={{ color: COLORS.mint, fontWeight: 600 }}>$56 on eBay</span> (was $100). Tap to
          open the deal.
        </div>

        {/* Tap ripple */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 120,
            height: 120,
            marginLeft: -60,
            marginTop: -60,
            borderRadius: '50%',
            border: `2px solid ${COLORS.mint}`,
            transform: `scale(${lerp(ripple, 0.4, 2.2)})`,
            opacity: rippleOpacity,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Cursor / tap indicator */}
      {frame >= tapStart - 6 && frame < tapStart + 20 && <TapIndicator startFrame={tapStart - 6} />}
    </div>
  )
}

function TapIndicator({ startFrame }: { startFrame: number }) {
  const frame = useCurrentFrame()
  const appear = interpolate(frame, [startFrame, startFrame + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOut,
  })
  return (
    <div
      style={{
        position: 'absolute',
        right: 90,
        top: 320,
        opacity: appear,
      }}
    >
      <svg width="32" height="40" viewBox="0 0 28 36" fill="none">
        <path
          d="M2 2 L2 28 L9 22 L13 32 L17 30 L13 20 L22 20 Z"
          fill="#fff"
          stroke="#111"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

// =====================================================================
// Scene 6: CTA — Get started for free
// =====================================================================

function SceneCTA() {
  const frame = useCurrentFrame()

  const enter = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOut,
  })

  const wordmarkLift = interpolate(frame, [0, 26], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOut,
  })

  const buttonEnter = interpolate(frame, [18, 42], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: overshoot,
  })

  const shimmerX = interpolate(frame, [50, s(SCENES.CTA.dur)], [-100, 400], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeInOut,
  })

  const urlFade = interpolate(frame, [35, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOut,
  })

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONTS.serif,
        opacity: enter,
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 1400, padding: '0 60px' }}>
        {/* Small kicker */}
        <SubtleFadeIn delay={6}>
          <div
            style={{
              fontFamily: FONTS.body,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: COLORS.mint,
              marginBottom: 22,
            }}
          >
            Your concierge is ready
          </div>
        </SubtleFadeIn>

        {/* Wordmark / headline */}
        <div
          style={{
            fontSize: 130,
            fontWeight: 700,
            lineHeight: 1.05,
            color: COLORS.cream,
            letterSpacing: '-0.03em',
            transform: `translateY(${wordmarkLift}px)`,
          }}
        >
          Get started{' '}
          <em style={{ fontStyle: 'italic', color: COLORS.mint }}>for free.</em>
        </div>

        {/* CTA button with shimmer */}
        <div
          style={{
            marginTop: 56,
            display: 'inline-flex',
            transform: `scale(${lerp(buttonEnter, 0.88, 1)})`,
            opacity: buttonEnter,
          }}
        >
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              padding: '22px 44px',
              borderRadius: 999,
              background: COLORS.mint,
              color: COLORS.bgDeep,
              fontFamily: FONTS.body,
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: '0.005em',
              boxShadow: '0 24px 80px rgba(110, 231, 183, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            {/* Shimmer */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)',
                transform: `translateX(${shimmerX}%)`,
                pointerEvents: 'none',
              }}
            />
            <span style={{ position: 'relative' }}>Start for free</span>
            <span style={{ position: 'relative', fontSize: 30, transform: 'translateY(-1px)' }}>→</span>
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            marginTop: 38,
            fontFamily: FONTS.body,
            fontSize: 22,
            color: COLORS.creamDim,
            letterSpacing: '0.02em',
            opacity: urlFade,
          }}
        >
          <span style={{ color: COLORS.mint, marginRight: 8 }}>✦</span>
          joinsteward.app
        </div>

        {/* Feature row */}
        <SubtleFadeIn delay={50}>
          <div
            style={{
              marginTop: 44,
              display: 'flex',
              justifyContent: 'center',
              gap: 18,
              fontFamily: FONTS.body,
              fontSize: 15,
              color: COLORS.creamDim,
              flexWrap: 'wrap',
            }}
          >
            <FeatureChip>🏷️ Price drops</FeatureChip>
            <FeatureChip>🍽️ Reservations</FeatureChip>
            <FeatureChip>✈️ Flights</FeatureChip>
            <FeatureChip>📅 Campsites</FeatureChip>
            <FeatureChip>🎫 Tickets</FeatureChip>
            <FeatureChip>📦 Restocks</FeatureChip>
          </div>
        </SubtleFadeIn>
      </div>
    </AbsoluteFill>
  )
}

function FeatureChip({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '8px 14px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${COLORS.border}`,
      }}
    >
      {children}
    </div>
  )
}
