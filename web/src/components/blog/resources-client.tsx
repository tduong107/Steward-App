'use client'

import Link from 'next/link'
import { useRef, type MouseEvent as ReactMouseEvent } from 'react'

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
  accent: string
  /** rgb tuple of the accent, so we can build glows with rgba() and not
   *  depend on color-mix() (which older Safari/Edge don't support). */
  accentRGB: string
}

const CATEGORIES: Category[] = [
  {
    title: 'How We Compare',
    desc: 'See how Steward stacks up against Honey, CamelCamelCamel, and other price trackers.',
    href: '/blog/comparisons',
    accent: '#F59E0B',
    accentRGB: '245, 158, 11', // amber
  },
  {
    title: 'Guides',
    desc: 'Step-by-step guides on tracking campsites, restaurants, flights, and event tickets.',
    href: '/blog/guides',
    accent: '#6EE7B7',
    accentRGB: '110, 231, 183', // mint
  },
  {
    title: 'Insights',
    desc: 'Tips on saving money, tracking strategies, product updates, and behind-the-scenes looks.',
    href: '/blog/insights',
    accent: '#A882FF',
    accentRGB: '168, 130, 255', // purple
  },
]

function ResourceCard({ cat, index }: { cat: Category; index: number }) {
  // Direct DOM updates via refs — avoids React re-renders on every
  // mousemove frame, which keeps the tilt buttery-smooth.
  const cardRef = useRef<HTMLAnchorElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    const card = cardRef.current
    const inner = innerRef.current
    if (!card || !inner) return

    const rect = card.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    const relY = (e.clientY - rect.top) / rect.height

    // Update CSS vars for the spotlight position (percent).
    card.style.setProperty('--mx', `${relX * 100}%`)
    card.style.setProperty('--my', `${relY * 100}%`)

    // Apply tilt on the INNER element so the wrapper's entrance animation
    // doesn't fight with it. Tilt amplitude ±12° — visible but not dizzying.
    const tiltX = (0.5 - relY) * 12
    const tiltY = (relX - 0.5) * 12
    inner.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(0)`
  }

  const handleMouseLeave = () => {
    const inner = innerRef.current
    if (!inner) return
    // Smoothly return to rest — the CSS transition on .card-inner handles easing.
    inner.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)'
  }

  return (
    <Link
      ref={cardRef}
      href={cat.href}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="resource-card"
      style={
        {
          '--accent': cat.accent,
          '--accent-rgb': cat.accentRGB,
          animationDelay: `${0.35 + index * 0.12}s`,
        } as React.CSSProperties
      }
    >
      <div ref={innerRef} className="card-inner">
        {/* Accent strip — draws from center on hover */}
        <span className="accent-bar" aria-hidden />

        {/* Spotlight that follows the cursor */}
        <span className="spotlight" aria-hidden />

        {/* Shine sweep — animates across the card once on hover */}
        <span className="shine" aria-hidden />

        <h2 className="card-title">{cat.title}</h2>
        <p className="card-desc">{cat.desc}</p>
        <span className="explore">
          <span className="explore-text">Explore</span>
          <span className="arrow" aria-hidden>→</span>
        </span>
      </div>
    </Link>
  )
}

export default function ResourcesClient() {
  return (
    <div className="resources-root">
      {/* Ambient background orbs */}
      <div className="orb orb-a" aria-hidden />
      <div className="orb orb-b" aria-hidden />

      <div className="page-container">
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
            Comparisons, guides &amp; <em>insights</em>
          </h1>

          <p className="sub">
            Learn how Steward stacks up against competitors and discover new ways to track the things that matter to you.
          </p>
        </div>

        {/* Category cards */}
        <div className="cards-grid">
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

        .page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 24px 80px;
          position: relative;
          z-index: 1;
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
          margin-bottom: 72px;
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
          font-size: clamp(32px, 5vw, 52px);
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
          color: rgba(247, 246, 243, 0.55);
          font-weight: 300;
          max-width: 540px;
          margin: 0 auto;
          animation: fadeIn 0.9s 0.35s ease-out backwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ─── Cards grid ─── */
        .cards-grid {
          display: grid;
          /* Default: as-many-as-fit with 320px minimum (mobile/tablet) */
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }
        /* On desktop, force a clean 3-column layout so the 3 cards each
           get a generous ~370px width instead of being cramped at 320px. */
        @media (min-width: 1100px) {
          .cards-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 28px;
          }
        }

        /* ─── Cards ─── */
        /* The outer wrapper carries the entrance animation + hover lift,
           so the inner layer can freely control tilt without conflict. */
        .resource-card {
          position: relative;
          display: block;
          text-decoration: none;
          border-radius: 22px;
          animation: cardEntry 0.75s cubic-bezier(0.22, 1, 0.36, 1) backwards;
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
          perspective: 1200px; /* enables 3D on the inner element */
        }
        @keyframes cardEntry {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .resource-card:hover {
          transform: translateY(-6px);
        }

        .card-inner {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 18px;
          min-height: 280px;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 22px;
          padding: 36px 32px;
          overflow: hidden;
          isolation: isolate;
          transform-style: preserve-3d;
          transform: perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0);
          /* Slightly longer transition so the settle feels smooth when the
             cursor leaves the card. During active hover, the inline transform
             overrides this, so there's no lag while tracking. */
          transition:
            transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
            border-color 0.35s ease,
            background 0.35s ease,
            box-shadow 0.35s ease;
          will-change: transform;
        }

        .resource-card:hover .card-inner {
          border-color: rgba(var(--accent-rgb), 0.45);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015));
          box-shadow:
            0 24px 60px -24px rgba(0, 0, 0, 0.7),
            0 0 0 1px rgba(var(--accent-rgb), 0.15) inset,
            0 0 60px -10px rgba(var(--accent-rgb), 0.35);
        }

        /* Accent strip at top */
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

        /* Cursor-follow spotlight — now much more visible */
        .spotlight {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(
            500px circle at var(--mx, 50%) var(--my, 50%),
            rgba(var(--accent-rgb), 0.28) 0%,
            rgba(var(--accent-rgb), 0.1)  28%,
            transparent 60%
          );
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
          z-index: 0;
        }
        .resource-card:hover .spotlight {
          opacity: 1;
        }

        /* Shine sweep — diagonal highlight that sweeps across on hover */
        .shine {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(
            120deg,
            transparent 30%,
            rgba(var(--accent-rgb), 0.16) 50%,
            transparent 70%
          );
          background-size: 250% 250%;
          background-position: 200% 200%;
          pointer-events: none;
          z-index: 1;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .resource-card:hover .shine {
          opacity: 1;
          animation: shineSweep 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes shineSweep {
          0%   { background-position: 200% 200%; }
          100% { background-position: -100% -100%; }
        }

        .card-title {
          font-family: ${S.serif};
          font-size: 24px;
          font-weight: 700;
          color: ${S.cream};
          line-height: 1.2;
          margin: 0;
          position: relative;
          z-index: 2;
          transition: color 0.35s ease, transform 0.35s ease;
        }
        .resource-card:hover .card-title {
          color: var(--accent);
          transform: translateX(2px);
        }

        .card-desc {
          font-size: 14.5px;
          color: rgba(247, 246, 243, 0.55);
          line-height: 1.55;
          margin: 0;
          flex: 1;
          position: relative;
          z-index: 2;
          transition: color 0.35s ease;
        }
        .resource-card:hover .card-desc {
          color: rgba(247, 246, 243, 0.7);
        }

        .explore {
          font-size: 13.5px;
          font-weight: 600;
          color: ${S.mint};
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: color 0.35s ease;
        }
        .resource-card:hover .explore {
          color: var(--accent);
        }
        .explore-text {
          position: relative;
        }
        /* Animated underline on the "Explore" text */
        .explore-text::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: -3px;
          height: 1px;
          background: currentColor;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .resource-card:hover .explore-text::after {
          transform: scaleX(1);
        }
        .arrow {
          display: inline-block;
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .resource-card:hover .arrow {
          transform: translateX(8px);
        }

        /* Touch-device / no-hover: show a simplified lift state on :active for
           the brief tap feedback. */
        @media (hover: none) {
          .resource-card:active {
            transform: translateY(-3px);
          }
          .resource-card:active .accent-bar {
            transform: scaleX(1);
          }
        }

        /* Respect OS-level "reduce motion" — strip all animations + transitions. */
        @media (prefers-reduced-motion: reduce) {
          .orb,
          .pill,
          .heading,
          .heading em::after,
          .sub,
          .resource-card,
          .card-inner,
          .accent-bar,
          .spotlight,
          .shine,
          .explore,
          .explore-text::after,
          .arrow,
          .card-title,
          .card-desc {
            animation: none !important;
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  )
}
