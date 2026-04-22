'use client'

import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import {
  Package,
  Plane,
  Share2,
  Sparkles,
  Tent,
  Ticket,
  TrendingDown,
  UtensilsCrossed,
} from 'lucide-react'
import {
  FPS,
  ORBIT,
  TIMING,
  TOTAL_FRAMES,
  USE_CASES,
  angleForNode,
  nodePosition,
} from './constants'

const ICONS: Record<number, React.ComponentType<{ size: number; color: string; strokeWidth?: number }>> = {
  1: TrendingDown,
  2: UtensilsCrossed,
  3: Plane,
  4: Tent,
  5: Ticket,
  6: Package,
  7: Sparkles,
  8: Share2,
}

const FONT_STACK =
  '"Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

const ease = Easing.bezier(0.16, 1, 0.3, 1)
const easeInOut = Easing.bezier(0.45, 0, 0.55, 1)

// ---------- Main composition ----------

export function StewardHeroVideo() {
  const introEnd = Math.round(TIMING.INTRO_END * FPS) // 75
  const orbitInEnd = Math.round(TIMING.ORBIT_IN_END * FPS) // 150
  const allActiveStart = Math.round(
    (TIMING.ORBIT_IN_END +
      TIMING.NODES_PER_CYCLE * TIMING.SECONDS_PER_NODE) *
      FPS,
  ) // 750
  const allActiveEnd = Math.round(TIMING.ALL_ACTIVE_END * FPS) // 810

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <BackgroundGradient />

      <Sequence durationInFrames={introEnd + 15} layout="none">
        <IntroBrand endFrame={introEnd} />
      </Sequence>

      {/* Orbit fades in over the intro's tail and stays for the rest */}
      <Sequence from={introEnd - 20} layout="none">
        <OrbitStage
          orbitInDuration={orbitInEnd - (introEnd - 20)}
          allActiveStart={allActiveStart}
          allActiveEnd={allActiveEnd}
        />
      </Sequence>

      {/* Bottom caption for each use case, sequenced one after another */}
      <Sequence from={orbitInEnd} durationInFrames={allActiveStart - orbitInEnd} layout="none">
        <CaptionStrip />
      </Sequence>

      {/* All-lit beat */}
      <Sequence from={allActiveStart} durationInFrames={allActiveEnd - allActiveStart + 30} layout="none">
        <AllActiveHeadline />
      </Sequence>

      {/* Outro tagline */}
      <Sequence from={allActiveEnd - 20} layout="none">
        <Outro startDelay={20} />
      </Sequence>
    </AbsoluteFill>
  )
}

// ---------- Background ----------

function BackgroundGradient() {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const drift = interpolate(frame, [0, durationInFrames], [0, 360])
  return (
    <AbsoluteFill
      style={{
        background: `
          radial-gradient(ellipse at 30% 20%, rgba(139, 92, 246, 0.18), transparent 60%),
          radial-gradient(ellipse at 75% 80%, rgba(6, 182, 212, 0.14), transparent 55%),
          radial-gradient(ellipse at 50% 50%, rgba(236, 72, 153, 0.05), transparent 70%),
          linear-gradient(${drift}deg, #050510 0%, #0b0820 50%, #050510 100%)
        `,
      }}
    />
  )
}

// ---------- Intro brand mark ----------

function IntroBrand({ endFrame }: { endFrame: number }) {
  const frame = useCurrentFrame()

  const wordmarkOpacity = interpolate(
    frame,
    [0, 15, endFrame - 15, endFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut },
  )
  const wordmarkScale = interpolate(frame, [0, 30], [0.88, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  })
  const wordmarkLift = interpolate(frame, [endFrame - 15, endFrame], [0, -40], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeInOut,
  })
  const subOpacity = interpolate(
    frame,
    [15, 30, endFrame - 20, endFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut },
  )

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT_STACK,
      }}
    >
      <div
        style={{
          textAlign: 'center',
          transform: `translateY(${wordmarkLift}px) scale(${wordmarkScale})`,
          opacity: wordmarkOpacity,
        }}
      >
        <div
          style={{
            fontSize: 128,
            fontWeight: 600,
            letterSpacing: '-0.04em',
            color: 'white',
            textShadow: '0 0 40px rgba(139, 92, 246, 0.35)',
          }}
        >
          Steward
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 32,
            fontWeight: 400,
            letterSpacing: '0.02em',
            color: 'rgba(255,255,255,0.7)',
            opacity: subOpacity,
          }}
        >
          Your AI concierge
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ---------- Orbit stage (rings + nodes + connections) ----------

function OrbitStage({
  orbitInDuration,
  allActiveStart,
  allActiveEnd,
}: {
  orbitInDuration: number
  allActiveStart: number
  allActiveEnd: number
}) {
  const frame = useCurrentFrame()
  const globalFrame = frame // inside Sequence, useCurrentFrame is local; we already placed from

  // Base rotation — very slow drift for life
  const rotation = interpolate(globalFrame, [0, TOTAL_FRAMES], [0, Math.PI * 0.5])

  const ringOpacity = interpolate(globalFrame, [0, orbitInDuration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  })

  const orbitScale = interpolate(globalFrame, [0, orbitInDuration], [0.85, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  })

  // Figure out which node is "active" during the cycle phase. orbitInDuration
  // is the fade-in window; after that, we begin cycling at our local frame.
  const cycleLocalFrame = globalFrame - orbitInDuration
  const framesPerNode = TIMING.SECONDS_PER_NODE * FPS
  const activeIndex =
    cycleLocalFrame < 0
      ? -1
      : globalFrame >= allActiveStart
      ? -2 // sentinel: all active
      : Math.min(
          Math.floor(cycleLocalFrame / framesPerNode),
          TIMING.NODES_PER_CYCLE - 1,
        )

  // Progress within the current active node (0..1) for subtle pulse
  const activeProgress =
    activeIndex >= 0
      ? (cycleLocalFrame % framesPerNode) / framesPerNode
      : 0

  const allActiveProgress = interpolate(
    globalFrame,
    [allActiveStart, allActiveStart + 20],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease },
  )

  const orbitFadeOut = interpolate(
    globalFrame,
    [allActiveEnd - 10, allActiveEnd + 20],
    [1, 0.15],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut },
  )

  return (
    <AbsoluteFill
      style={{
        opacity: orbitFadeOut,
        transform: `scale(${orbitScale})`,
        transformOrigin: `${ORBIT.CX}px ${ORBIT.CY}px`,
      }}
    >
      {/* Rings + connections rendered in SVG */}
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: 'absolute', inset: 0, opacity: ringOpacity }}
      >
        <defs>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <stop offset="45%" stopColor="rgba(139, 92, 246, 0.55)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" />
          </radialGradient>
          <linearGradient id="connGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.8)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* Outer, middle, inner rings */}
        <circle
          cx={ORBIT.CX}
          cy={ORBIT.CY}
          r={ORBIT.R}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={1}
          strokeDasharray="2 6"
        />
        <circle
          cx={ORBIT.CX}
          cy={ORBIT.CY}
          r={ORBIT.R * 0.72}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
          strokeDasharray="2 8"
        />
        <circle
          cx={ORBIT.CX}
          cy={ORBIT.CY}
          r={ORBIT.R * 0.44}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />

        {/* Center glow disk */}
        <circle
          cx={ORBIT.CX}
          cy={ORBIT.CY}
          r={ORBIT.CENTER_SIZE * 0.9}
          fill="url(#centerGlow)"
          opacity={0.8}
        />

        {/* Connection lines — active node to related, or all-to-all in finale */}
        {activeIndex >= 0 && (
          <ConnectionsForActive
            activeIndex={activeIndex}
            rotation={rotation}
            progress={activeProgress}
          />
        )}
        {globalFrame >= allActiveStart && (
          <AllConnections opacity={allActiveProgress} rotation={rotation} />
        )}
      </svg>

      {/* Center brand node */}
      <CenterNode />

      {/* 8 orbital nodes */}
      {USE_CASES.map((uc, idx) => {
        const isActive = activeIndex === idx
        const isRelated =
          activeIndex >= 0 && USE_CASES[activeIndex].relatedIds.includes(uc.id)
        const isAllActive = globalFrame >= allActiveStart
        return (
          <OrbitalNode
            key={uc.id}
            index={idx}
            rotation={rotation}
            isActive={isActive}
            isRelated={isRelated}
            isAllActive={isAllActive}
            allActiveProgress={allActiveProgress}
            activeProgress={activeProgress}
            entryDelay={idx * 5}
            orbitInDuration={orbitInDuration}
          />
        )
      })}
    </AbsoluteFill>
  )
}

// ---------- Center node ("S") ----------

function CenterNode() {
  const frame = useCurrentFrame()
  const pulse = 1 + 0.04 * Math.sin((frame / FPS) * 1.2 * Math.PI)
  return (
    <div
      style={{
        position: 'absolute',
        left: ORBIT.CX - ORBIT.CENTER_SIZE / 2,
        top: ORBIT.CY - ORBIT.CENTER_SIZE / 2,
        width: ORBIT.CENTER_SIZE,
        height: ORBIT.CENTER_SIZE,
        borderRadius: '50%',
        background:
          'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(139, 92, 246, 0.9) 60%, rgba(76, 29, 149, 1) 100%)',
        boxShadow:
          '0 0 80px rgba(139, 92, 246, 0.55), inset 0 0 40px rgba(255,255,255,0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT_STACK,
        fontWeight: 600,
        fontSize: 56,
        color: 'white',
        letterSpacing: '-0.03em',
        transform: `scale(${pulse})`,
        textShadow: '0 2px 16px rgba(0,0,0,0.4)',
      }}
    >
      S
    </div>
  )
}

// ---------- Individual orbital node ----------

function OrbitalNode({
  index,
  rotation,
  isActive,
  isRelated,
  isAllActive,
  allActiveProgress,
  activeProgress,
  entryDelay,
  orbitInDuration,
}: {
  index: number
  rotation: number
  isActive: boolean
  isRelated: boolean
  isAllActive: boolean
  allActiveProgress: number
  activeProgress: number
  entryDelay: number
  orbitInDuration: number
}) {
  const frame = useCurrentFrame()
  const uc = USE_CASES[index]
  const { x, y } = nodePosition(index, rotation)
  const Icon = ICONS[uc.id]

  // Entry: stagger per-index
  const entry = interpolate(
    frame,
    [entryDelay, Math.max(entryDelay + 20, orbitInDuration)],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.34, 1.1, 0.64, 1),
    },
  )

  // Active pulse: grows during highlight, shrinks at tail
  const activePulse = isActive
    ? 1 + 0.22 * Math.sin(activeProgress * Math.PI) // 1 at edges, 1.22 mid
    : 1

  // Scale factor:
  //  - dormant = 1
  //  - active = up to 1.35
  //  - all active finale = 1.12
  let scale = entry
  if (isActive) scale *= activePulse * 1.15
  else if (isAllActive)
    scale *= interpolate(allActiveProgress, [0, 1], [1, 1.12])
  else if (isRelated) scale *= 1.06

  // Opacity: dim non-related during a highlight
  const dim =
    (!isActive && !isRelated && !isAllActive && activeProgress > 0)
      ? 0.42
      : 1
  const opacity = entry * dim

  // Glow color scales with state
  const glowIntensity = isActive
    ? 0.9
    : isAllActive
    ? 0.55 * allActiveProgress + 0.3
    : isRelated
    ? 0.45
    : 0.18

  const ringScale = isActive ? 1 + activeProgress * 0.4 : 1
  const ringOpacity = isActive ? (1 - activeProgress) * 0.6 : 0

  return (
    <div
      style={{
        position: 'absolute',
        left: x - ORBIT.NODE_SIZE / 2,
        top: y - ORBIT.NODE_SIZE / 2,
        width: ORBIT.NODE_SIZE,
        height: ORBIT.NODE_SIZE,
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: 'center',
      }}
    >
      {/* Expanding "ping" ring during active pulse */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `2px solid ${uc.color}`,
          transform: `scale(${ringScale})`,
          opacity: ringOpacity,
        }}
      />
      {/* Node body */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: isActive
            ? `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), ${uc.color} 75%)`
            : `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15), rgba(30, 30, 50, 0.92) 80%)`,
          border: `1.5px solid ${
            isActive ? uc.color : 'rgba(255,255,255,0.25)'
          }`,
          boxShadow: `0 0 ${isActive ? 40 : 16}px ${hexWithAlpha(
            uc.color,
            glowIntensity,
          )}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon
          size={38}
          color={isActive ? '#fff' : 'rgba(255,255,255,0.88)'}
          strokeWidth={1.8}
        />
      </div>

      {/* Title label (always rendered, but only visible when active or all-active) */}
      <div
        style={{
          position: 'absolute',
          top: ORBIT.NODE_SIZE + 12,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: FONT_STACK,
          fontSize: 22,
          fontWeight: 500,
          color: 'white',
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
          opacity: isActive ? 1 : isAllActive ? allActiveProgress * 0.95 : 0,
          textShadow: `0 2px 12px ${hexWithAlpha(uc.color, 0.6)}`,
        }}
      >
        {uc.title}
      </div>
    </div>
  )
}

// ---------- Connections ----------

function ConnectionsForActive({
  activeIndex,
  rotation,
  progress,
}: {
  activeIndex: number
  rotation: number
  progress: number
}) {
  const active = USE_CASES[activeIndex]
  const from = nodePosition(activeIndex, rotation)
  const drawIn = interpolate(progress, [0, 0.25], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  })
  const drawOut = interpolate(progress, [0.85, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeInOut,
  })
  const lineOpacity = drawIn * (1 - drawOut)

  return (
    <>
      {active.relatedIds.map((relId) => {
        const relIdx = USE_CASES.findIndex((u) => u.id === relId)
        if (relIdx === -1) return null
        const to = nodePosition(relIdx, rotation)
        return (
          <line
            key={relId}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={active.color}
            strokeWidth={1.5}
            opacity={lineOpacity * 0.75}
            strokeDasharray="4 6"
          />
        )
      })}
    </>
  )
}

function AllConnections({
  opacity,
  rotation,
}: {
  opacity: number
  rotation: number
}) {
  const edges: Array<{ a: number; b: number; color: string }> = []
  const seen = new Set<string>()
  USE_CASES.forEach((uc, i) => {
    uc.relatedIds.forEach((rid) => {
      const j = USE_CASES.findIndex((u) => u.id === rid)
      if (j === -1) return
      const key = [i, j].sort().join('-')
      if (seen.has(key)) return
      seen.add(key)
      edges.push({ a: i, b: j, color: uc.color })
    })
  })

  return (
    <>
      {edges.map((e, i) => {
        const pa = nodePosition(e.a, rotation)
        const pb = nodePosition(e.b, rotation)
        return (
          <line
            key={i}
            x1={pa.x}
            y1={pa.y}
            x2={pb.x}
            y2={pb.y}
            stroke={e.color}
            strokeWidth={1.25}
            opacity={opacity * 0.7}
          />
        )
      })}
    </>
  )
}

// ---------- Caption strip (bottom) ----------

function CaptionStrip() {
  const frame = useCurrentFrame()
  const framesPerNode = Math.round(TIMING.SECONDS_PER_NODE * FPS)
  const nodeIndex = Math.min(
    Math.floor(frame / framesPerNode),
    TIMING.NODES_PER_CYCLE - 1,
  )
  const local = frame - nodeIndex * framesPerNode
  const uc = USE_CASES[nodeIndex]

  // In-out fade for each node's caption
  const inOpacity = interpolate(local, [0, 10, framesPerNode - 12, framesPerNode], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeInOut,
  })
  const slide = interpolate(local, [0, 18], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  })

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 110,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: FONT_STACK,
        opacity: inOpacity,
        transform: `translateY(${slide}px)`,
      }}
    >
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: '0.18em',
          color: uc.color,
          marginBottom: 16,
        }}
      >
        {uc.category}
      </div>
      <div
        style={{
          fontSize: 56,
          fontWeight: 500,
          letterSpacing: '-0.025em',
          color: 'white',
          marginBottom: 14,
        }}
      >
        {uc.title}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 400,
          color: 'rgba(255,255,255,0.72)',
          textAlign: 'center',
          maxWidth: 920,
          lineHeight: 1.4,
        }}
      >
        {uc.narration}
      </div>
      {/* Progress pips */}
      <div
        style={{
          marginTop: 32,
          display: 'flex',
          gap: 8,
        }}
      >
        {USE_CASES.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === nodeIndex ? 28 : 6,
              height: 6,
              borderRadius: 3,
              background:
                i === nodeIndex
                  ? uc.color
                  : i < nodeIndex
                  ? 'rgba(255,255,255,0.45)'
                  : 'rgba(255,255,255,0.18)',
              transition: 'none',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ---------- All-active headline ----------

function AllActiveHeadline() {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 15, 50, 70], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeInOut,
  })
  const lift = interpolate(frame, [0, 20], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  })
  return (
    <div
      style={{
        position: 'absolute',
        top: 110,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontFamily: FONT_STACK,
        opacity,
        transform: `translateY(${lift}px)`,
      }}
    >
      <div
        style={{
          fontSize: 72,
          fontWeight: 500,
          letterSpacing: '-0.03em',
          color: 'white',
        }}
      >
        Eight ways to save.
      </div>
      <div
        style={{
          marginTop: 10,
          fontSize: 36,
          fontWeight: 400,
          color: 'rgba(255,255,255,0.6)',
        }}
      >
        One AI concierge, watching everything.
      </div>
    </div>
  )
}

// ---------- Outro ----------

function Outro({ startDelay }: { startDelay: number }) {
  const frame = useCurrentFrame()
  const opacity = interpolate(
    frame,
    [startDelay, startDelay + 20, startDelay + 55],
    [0, 1, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut },
  )
  const scale = interpolate(frame, [startDelay, startDelay + 25], [0.94, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  })
  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT_STACK,
        opacity,
      }}
    >
      <div
        style={{
          textAlign: 'center',
          transform: `scale(${scale})`,
        }}
      >
        <div
          style={{
            fontSize: 104,
            fontWeight: 600,
            letterSpacing: '-0.04em',
            color: 'white',
            textShadow: '0 0 60px rgba(139, 92, 246, 0.45)',
          }}
        >
          Steward
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 30,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: '0.02em',
          }}
        >
          joinsteward.app
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ---------- Utilities ----------

function hexWithAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
