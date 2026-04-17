'use client'

import Link from 'next/link'
import { useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'

// Palette — matches the rest of the marketing site.
const S = {
  mint: '#6EE7B7',
  cream: '#F7F6F3',
  serif: 'Georgia, "Times New Roman", serif',
}

type Category = {
  title: string
  desc: string
  href: string
  accent: string // hex without #, used for color-mix & gradients
}

const CATEGORIES: Category[] = [
  {
    title: 'How We Compare',
    desc: 'See how Steward stacks up against Honey, CamelCamelCamel, and other price trackers.',
    href: '/blog/comparisons',
    accent: '#F59E0B', // amber — for comparisons (warmer, analytical)
  },
  {
    title: 'Guides',
    desc: 'Step-by-step guides on tracking campsites, restaurants, flights, and event tickets.',
    href: '/blog/guides',
    accent: '#6EE7B7', // mint — on-brand primary
  },
  {
    title: 'Insights',
    desc: 'Tips on saving money, tracking strategies, product updates, and behind-the-scenes looks.',
    href: '/blog/insights',
    accent: '#A882FF', // purple — for thought-leadership
  },
]

function ResourceCard({ cat, index }: { cat: Category; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null)
  // Spotlight coords (percent) — default 50/50 so the first hover doesn't pop
  const [spot, setSpot] = useState({ x: 50, y: 50 })
  // 3D tilt (deg). Small amplitude so it feels premium, not cartoony.
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    const relY = (e.clientY - rect.top) / rect.height
    setSpot({ x: relX * 100, y: relY * 100 })
    // Tilt: cursor on the left tilts right-side toward user, etc.
    // Clamp to ±6deg for a subtle, not-nauseating effect.
    setTilt({
      x: (0.5 - relY) * 6,
      y: (relX - 0.5) * 6,
    })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
    // Don't reset spot — let it fade with the opacity transition.
  }

  return (
    <Link
      ref={ref}
      href={cat.href}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="resource-card"
      style={
        {
          '--accent': cat.accent,
          '--mx': `${spot.x}%`,
          '--my': `${spot.y}%`,
          '--tiltX': `${tilt.x}deg`,
          '--tiltY': `${tilt.y}deg`,
          animationDelay: `${0.35 + index * 0.12}s`,
        } as React.CSSProperties
      }
    >
      {/* Accent strip at top — draws from center on hover */}
      <span className="accent-bar" aria-hidden />

      {/* Radial spotlight that follows the cursor */}
      <span className="spotlight" aria-hidden />

      <h2 className="card-title">{cat.title}</h2>
      <p className="card-desc">{cat.desc}</p>
      <span className="explore">
        Explore <span className="arrow">→</span>
      </span>
    </Link>
  )
}

export default function ResourcesClient() {
  return (
    <div className="resources-root">
      {/* Ambient background orbs — slow drift, very subtle */}
      <div className="orb orb-a" aria-hidden />
      <div className="orb orb-b" aria-hidden />

      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '60px 24px 80px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Hero */}
        <div className="hero">
          <div className="pill">
            <span style={{ fontSize: 13, color: S.mint }}>✦</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: S.mint,
              }}
            >
              Resources
            </span>
          </div>

          <h1 className="heading">
            Comparisons, guides &amp;{' '}
            <em>insights</em>
          </h1>

          <p className="sub">
            Learn how Steward stacks up against competitors and discover new ways to track the things that matter to you.
          </p>
        </div>

        {/* Category cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 20,
          }}
        >
          {CATEGORIES.map((cat, i) => (
            <ResourceCard key={cat.title} cat={cat} index={i} />
          ))}
        </div>
      </div>

      <style>{`
        .resources-root {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
        }

        /* ─── Ambient drifting orbs ─── */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          opacity: 0.14;
          will-change: transform;
        }
        .orb-a {
          width: 620px;
          height: 620px;
          background: radial-gradient(circle, #6EE7B7 0%, transparent 70%);
          top: -240px;
          left: -180px;
          animation: orbDriftA 22s ease-in-out infinite;
        }
        .orb-b {
          width: 520px;
          height: 520px;
          background: radial-gradient(circle, #A882FF 0%, transparent 70%);
          bottom: -180px;
          right: -160px;
          animation: orbDriftB 28s ease-in-out infinite;
        }
        @keyframes orbDriftA {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(110px, -70px) scale(1.08); }
        }
        @keyframes orbDriftB {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(-120px, 80px) scale(0.94); }
        }

        /* ─── Hero ─── */
        .hero {
          text-align: center;
          margin-bottom: 60px;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(110, 231, 183, 0.08);
          border: 1px solid rgba(110, 231, 183, 0.18);
          border-radius: 30px;
          padding: 6px 16px;
          margin-bottom: 24px;
          animation: pillIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
        }
        @keyframes pillIn {
          from { opacity: 0; transform: scale(0.7) translateY(-8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .heading {
          font-family: ${S.serif};
          font-size: clamp(32px, 5vw, 48px);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.03em;
          color: ${S.cream};
          margin: 0 0 16px;
          animation: headingReveal 0.9s 0.15s cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        .heading em {
          color: ${S.mint};
          font-style: italic;
          display: inline-block;
          position: relative;
        }
        /* Gentle "breathing" glow on the italic word — subtle enough to feel
           alive without being distracting. */
        .heading em::after {
          content: '';
          position: absolute;
          inset: -8px -16px;
          background: radial-gradient(ellipse at center,
            rgba(110, 231, 183, 0.25) 0%,
            transparent 70%);
          z-index: -1;
          opacity: 0;
          animation: emGlow 4s 1.5s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes headingReveal {
          from { opacity: 0; filter: blur(10px); transform: translateY(18px); }
          to   { opacity: 1; filter: blur(0); transform: translateY(0); }
        }
        @keyframes emGlow {
          0%, 100% { opacity: 0; }
          50%      { opacity: 1; }
        }

        .sub {
          font-size: 16px;
          line-height: 1.6;
          color: rgba(247, 246, 243, 0.5);
          font-weight: 300;
          max-width: 500px;
          margin: 0 auto;
          animation: fadeIn 0.9s 0.35s ease-out backwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ─── Cards ─── */
        .resource-card {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          padding: 32px 28px;
          text-decoration: none;
          overflow: hidden;
          isolation: isolate; /* keep the spotlight pseudo layering local */
          /* 3D transform driven by the --tiltX / --tiltY vars. perspective on
             parent would be more realistic but per-card is fine at this scale. */
          transform: perspective(900px) rotateX(var(--tiltX, 0deg)) rotateY(var(--tiltY, 0deg)) translateZ(0);
          transform-style: preserve-3d;
          transition:
            transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
            border-color 0.3s ease,
            background 0.3s ease,
            box-shadow 0.3s ease;
          animation: cardEntry 0.75s cubic-bezier(0.22, 1, 0.36, 1) backwards;
          will-change: transform;
        }
        @keyframes cardEntry {
          from { opacity: 0; transform: translateY(28px) perspective(900px) rotateX(0) rotateY(0); }
          to   { opacity: 1; transform: translateY(0)   perspective(900px) rotateX(0) rotateY(0); }
        }

        .resource-card:hover {
          border-color: color-mix(in srgb, var(--accent) 38%, transparent);
          background: rgba(255, 255, 255, 0.035);
          box-shadow:
            0 20px 40px -20px rgba(0, 0, 0, 0.6),
            0 0 40px -10px color-mix(in srgb, var(--accent) 25%, transparent);
        }

        /* Accent strip at the top — draws from center on hover */
        .accent-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg,
            transparent 0%,
            var(--accent) 50%,
            transparent 100%);
          transform: scaleX(0);
          transform-origin: center;
          transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
          pointer-events: none;
          z-index: 2;
        }
        .resource-card:hover .accent-bar {
          transform: scaleX(1);
        }

        /* Cursor spotlight — radial gradient at --mx/--my vars */
        .spotlight {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(
            420px circle at var(--mx, 50%) var(--my, 50%),
            color-mix(in srgb, var(--accent) 14%, transparent) 0%,
            color-mix(in srgb, var(--accent) 4%, transparent) 35%,
            transparent 65%
          );
          opacity: 0;
          transition: opacity 0.35s ease;
          pointer-events: none;
          z-index: 0;
        }
        .resource-card:hover .spotlight {
          opacity: 1;
        }

        .card-title {
          font-family: ${S.serif};
          font-size: 22px;
          font-weight: 700;
          color: ${S.cream};
          line-height: 1.2;
          margin: 0;
          position: relative;
          z-index: 1;
          transition: color 0.3s ease;
        }
        .resource-card:hover .card-title {
          color: color-mix(in srgb, var(--accent) 20%, ${S.cream});
        }

        .card-desc {
          font-size: 14px;
          color: rgba(247, 246, 243, 0.45);
          line-height: 1.5;
          margin: 0;
          flex: 1;
          position: relative;
          z-index: 1;
        }

        .explore {
          font-size: 13px;
          font-weight: 600;
          color: ${S.mint};
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .explore .arrow {
          display: inline-block;
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .resource-card:hover .explore .arrow {
          transform: translateX(6px);
        }

        /* Respect OS-level "reduce motion" — strip all animations + transitions. */
        @media (prefers-reduced-motion: reduce) {
          .orb,
          .pill,
          .heading,
          .heading em::after,
          .sub,
          .resource-card,
          .accent-bar,
          .spotlight,
          .explore .arrow,
          .card-title {
            animation: none !important;
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  )
}
