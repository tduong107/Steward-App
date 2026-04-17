'use client'

import Link from 'next/link'
import { useRef, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import type { BlogArticle } from '@/app/blog/_data/articles'

const S = {
  mint: '#6EE7B7',
  cream: '#F7F6F3',
  serif: 'Georgia, "Times New Roman", serif',
}

export interface CategoryPageClientProps {
  /** Uppercase badge label, e.g. "How We Compare" */
  pillLabel: string
  /** Heading node — can include <em> for the italic accent word */
  heading: ReactNode
  /** Sub copy under the heading */
  subtitle: string
  /** Category accent color (hex) */
  accent: string
  /** Same color as "r, g, b" so we can use rgba() with custom alpha without
   *  relying on color-mix() (which isn't in older Safari/Edge). */
  accentRGB: string
  /** Article list — if empty/undefined, shows the "coming soon" fallback. */
  articles?: BlogArticle[]
  /** Copy for the empty state (insights currently has no articles). */
  comingSoonTitle?: string
  comingSoonBody?: string
  comingSoonIcon?: string
}

/** A single article card — same hover treatment as the /blog resource cards. */
function ArticleCard({ article, index }: { article: BlogArticle; index: number }) {
  const cardRef = useRef<HTMLAnchorElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    const card = cardRef.current
    const inner = innerRef.current
    if (!card || !inner) return
    const rect = card.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    const relY = (e.clientY - rect.top) / rect.height
    card.style.setProperty('--mx', `${relX * 100}%`)
    card.style.setProperty('--my', `${relY * 100}%`)
    // A touch less tilt than the category cards since these are smaller and
    // more numerous — ±8° feels elegant here.
    const tiltX = (0.5 - relY) * 8
    const tiltY = (relX - 0.5) * 8
    inner.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(0)`
  }

  const handleMouseLeave = () => {
    const inner = innerRef.current
    if (!inner) return
    inner.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)'
  }

  return (
    <Link
      ref={cardRef}
      href={`/blog/${article.slug}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="article-card"
      style={{ animationDelay: `${0.4 + index * 0.1}s` } as React.CSSProperties}
    >
      <div ref={innerRef} className="card-inner">
        <span className="accent-bar" aria-hidden />
        <span className="spotlight" aria-hidden />
        <span className="shine" aria-hidden />

        <div className="icon" aria-hidden>
          {article.icon}
        </div>

        <h2 className="card-title">{article.title}</h2>
        <p className="card-desc">{article.description}</p>

        <div className="card-footer">
          <time className="date">
            {new Date(article.publishedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </time>
          <span className="read">
            <span className="read-text">Read</span>
            <span className="arrow" aria-hidden>→</span>
          </span>
        </div>
      </div>
    </Link>
  )
}

/** Empty-state card — polished "Coming Soon" when there are no articles yet. */
function ComingSoonCard({
  title,
  body,
  icon,
}: {
  title: string
  body: string
  icon: string
}) {
  return (
    <div className="coming-soon">
      <div className="icon-wrap" aria-hidden>
        <span className="coming-icon">{icon}</span>
        <span className="pulse-ring" aria-hidden />
        <span className="pulse-ring pulse-ring-2" aria-hidden />
      </div>
      <p className="coming-title">{title}</p>
      <p className="coming-body">{body}</p>
      {/* Animated dots at the bottom — subtle "in progress" feel */}
      <div className="dots" aria-hidden>
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    </div>
  )
}

export default function CategoryPageClient({
  pillLabel,
  heading,
  subtitle,
  accent,
  accentRGB,
  articles,
  comingSoonTitle = 'Coming soon',
  comingSoonBody = "We're working on articles here — check back soon.",
  comingSoonIcon = '✦',
}: CategoryPageClientProps) {
  const hasArticles = (articles?.length ?? 0) > 0

  return (
    <div
      className="category-page"
      style={
        {
          '--accent': accent,
          '--accent-rgb': accentRGB,
        } as React.CSSProperties
      }
    >
      {/* Ambient background orbs — tinted with the category accent */}
      <div className="orb orb-a" aria-hidden />
      <div className="orb orb-b" aria-hidden />

      <div className="page-container">
        {/* Back link */}
        <div className="back-link-wrap">
          <Link href="/blog" className="back-link">
            <span className="back-arrow">←</span>
            <span>Back to Resources</span>
          </Link>
        </div>

        {/* Hero */}
        <div className="hero">
          <div className="pill">
            <span style={{ fontSize: 13, color: accent }}>✦</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: accent,
              }}
            >
              {pillLabel}
            </span>
          </div>

          <h1 className="heading">{heading}</h1>

          <p className="sub">{subtitle}</p>
        </div>

        {/* Article grid or coming-soon state */}
        {hasArticles ? (
          <div className="articles-grid">
            {articles!.map((article, i) => (
              <ArticleCard key={article.slug} article={article} index={i} />
            ))}
          </div>
        ) : (
          <ComingSoonCard
            title={comingSoonTitle}
            body={comingSoonBody}
            icon={comingSoonIcon}
          />
        )}
      </div>

      <style>{`
        .category-page {
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

        /* ─── Ambient orbs, tinted with the category accent ─── */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          will-change: transform;
        }
        .orb-a {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle,
            rgba(var(--accent-rgb), 0.4) 0%,
            transparent 70%);
          opacity: 0.12;
          top: -220px;
          left: -180px;
          animation: orbDriftA 24s ease-in-out infinite;
        }
        .orb-b {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #6EE7B7 0%, transparent 70%);
          opacity: 0.08;
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

        /* ─── Back link ─── */
        .back-link-wrap {
          margin-bottom: 40px;
          animation: fadeIn 0.6s ease-out backwards;
        }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 500;
          color: ${S.mint};
          text-decoration: none;
          transition: color 0.25s ease, gap 0.25s ease;
        }
        .back-link:hover {
          color: var(--accent);
          gap: 10px;
        }
        .back-arrow {
          display: inline-block;
          transition: transform 0.25s ease;
        }
        .back-link:hover .back-arrow {
          transform: translateX(-3px);
        }

        /* ─── Hero ─── */
        .hero {
          margin-bottom: 56px;
        }
        .pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(var(--accent-rgb), 0.08);
          border: 1px solid rgba(var(--accent-rgb), 0.2);
          border-radius: 30px;
          padding: 6px 16px;
          margin-bottom: 20px;
          animation: pillIn 0.7s 0.05s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
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
          margin: 0 0 12px;
          animation: headingReveal 0.9s 0.15s cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        .heading :global(em) {
          color: ${S.mint};
          font-style: italic;
        }
        @keyframes headingReveal {
          from { opacity: 0; filter: blur(10px); transform: translateY(18px); }
          to   { opacity: 1; filter: blur(0); transform: translateY(0); }
        }

        .sub {
          font-size: 16px;
          line-height: 1.6;
          color: rgba(247, 246, 243, 0.55);
          font-weight: 300;
          max-width: 540px;
          margin: 0;
          animation: fadeIn 0.9s 0.3s ease-out backwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ─── Articles grid ─── */
        .articles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        @media (min-width: 1100px) {
          .articles-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
          }
        }

        /* ─── Article card ─── */
        .article-card {
          position: relative;
          display: block;
          text-decoration: none;
          border-radius: 18px;
          animation: cardEntry 0.75s cubic-bezier(0.22, 1, 0.36, 1) backwards;
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
          perspective: 1200px;
        }
        @keyframes cardEntry {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .article-card:hover {
          transform: translateY(-5px);
        }

        .card-inner {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-height: 260px;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 18px;
          padding: 28px 26px;
          overflow: hidden;
          isolation: isolate;
          transform-style: preserve-3d;
          transform: perspective(1000px) rotateX(0) rotateY(0) translateZ(0);
          transition:
            transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
            border-color 0.35s ease,
            background 0.35s ease,
            box-shadow 0.35s ease;
          will-change: transform;
        }
        .article-card:hover .card-inner {
          border-color: rgba(var(--accent-rgb), 0.45);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015));
          box-shadow:
            0 24px 56px -24px rgba(0, 0, 0, 0.7),
            0 0 0 1px rgba(var(--accent-rgb), 0.15) inset,
            0 0 56px -10px rgba(var(--accent-rgb), 0.3);
        }

        /* Accent strip at top */
        .accent-bar {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg,
            transparent 0%,
            var(--accent) 50%,
            transparent 100%);
          transform: scaleX(0);
          transform-origin: center;
          transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
          pointer-events: none;
          z-index: 3;
        }
        .article-card:hover .accent-bar {
          transform: scaleX(1);
        }

        /* Spotlight */
        .spotlight {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(
            450px circle at var(--mx, 50%) var(--my, 50%),
            rgba(var(--accent-rgb), 0.26) 0%,
            rgba(var(--accent-rgb), 0.08) 30%,
            transparent 60%
          );
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
          z-index: 0;
        }
        .article-card:hover .spotlight { opacity: 1; }

        /* Shine sweep */
        .shine {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(
            120deg,
            transparent 30%,
            rgba(var(--accent-rgb), 0.14) 50%,
            transparent 70%
          );
          background-size: 250% 250%;
          background-position: 200% 200%;
          pointer-events: none;
          z-index: 1;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .article-card:hover .shine {
          opacity: 1;
          animation: shineSweep 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes shineSweep {
          0%   { background-position: 200% 200%; }
          100% { background-position: -100% -100%; }
        }

        /* Icon emoji in a styled circle */
        .icon {
          font-size: 28px;
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          background: rgba(var(--accent-rgb), 0.1);
          border: 1px solid rgba(var(--accent-rgb), 0.18);
          border-radius: 14px;
          position: relative;
          z-index: 2;
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1),
                      background 0.3s ease,
                      border-color 0.3s ease;
        }
        .article-card:hover .icon {
          background: rgba(var(--accent-rgb), 0.18);
          border-color: rgba(var(--accent-rgb), 0.35);
          transform: scale(1.08) rotate(-4deg);
        }

        .card-title {
          font-family: ${S.serif};
          font-size: 19px;
          font-weight: 700;
          color: ${S.cream};
          line-height: 1.3;
          margin: 0;
          position: relative;
          z-index: 2;
          transition: color 0.35s ease;
        }
        .article-card:hover .card-title {
          color: var(--accent);
        }

        .card-desc {
          font-size: 14px;
          color: rgba(247, 246, 243, 0.5);
          line-height: 1.55;
          margin: 0;
          flex: 1;
          position: relative;
          z-index: 2;
          transition: color 0.35s ease;
        }
        .article-card:hover .card-desc {
          color: rgba(247, 246, 243, 0.7);
        }

        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 2;
          margin-top: auto;
        }
        .date {
          font-size: 12px;
          color: rgba(247, 246, 243, 0.3);
          transition: color 0.3s ease;
        }
        .article-card:hover .date {
          color: rgba(247, 246, 243, 0.5);
        }

        .read {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          font-weight: 600;
          color: ${S.mint};
          transition: color 0.35s ease;
        }
        .article-card:hover .read {
          color: var(--accent);
        }
        .read-text {
          position: relative;
        }
        .read-text::after {
          content: '';
          position: absolute;
          left: 0; right: 0; bottom: -3px;
          height: 1px;
          background: currentColor;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .article-card:hover .read-text::after {
          transform: scaleX(1);
        }
        .arrow {
          display: inline-block;
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .article-card:hover .arrow {
          transform: translateX(6px);
        }

        /* ─── Coming soon state ─── */
        .coming-soon {
          background:
            linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.005));
          border: 1px solid rgba(var(--accent-rgb), 0.15);
          border-radius: 22px;
          padding: 80px 40px;
          text-align: center;
          position: relative;
          overflow: hidden;
          animation: cardEntry 0.75s 0.4s cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        /* Ambient glow inside the coming-soon card */
        .coming-soon::before {
          content: '';
          position: absolute;
          inset: -1px;
          background: radial-gradient(
            ellipse at center top,
            rgba(var(--accent-rgb), 0.12) 0%,
            transparent 60%);
          pointer-events: none;
        }
        .icon-wrap {
          position: relative;
          display: inline-grid;
          place-items: center;
          width: 80px;
          height: 80px;
          margin-bottom: 24px;
        }
        .coming-icon {
          font-size: 32px;
          display: grid;
          place-items: center;
          width: 64px;
          height: 64px;
          background: rgba(var(--accent-rgb), 0.12);
          border: 1px solid rgba(var(--accent-rgb), 0.3);
          border-radius: 20px;
          color: var(--accent);
          animation: iconFloat 4s ease-in-out infinite;
          position: relative;
          z-index: 2;
        }
        @keyframes iconFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        .pulse-ring {
          position: absolute;
          inset: 8px;
          border-radius: 20px;
          border: 1px solid rgba(var(--accent-rgb), 0.5);
          animation: pulseRing 3s ease-out infinite;
          pointer-events: none;
        }
        .pulse-ring-2 {
          animation-delay: 1.5s;
        }
        @keyframes pulseRing {
          0%   { opacity: 0.6; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.6); }
        }

        .coming-title {
          font-family: ${S.serif};
          font-size: 24px;
          font-weight: 700;
          color: ${S.cream};
          margin: 0 0 12px;
          position: relative;
          z-index: 1;
        }
        .coming-body {
          font-size: 15px;
          color: rgba(247, 246, 243, 0.5);
          max-width: 460px;
          margin: 0 auto 28px;
          line-height: 1.65;
          position: relative;
          z-index: 1;
        }
        .dots {
          display: inline-flex;
          gap: 8px;
          position: relative;
          z-index: 1;
        }
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(var(--accent-rgb), 0.7);
          animation: dotBounce 1.4s ease-in-out infinite;
        }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dotBounce {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30%           { opacity: 1;   transform: translateY(-4px); }
        }

        /* Touch-device tap feedback */
        @media (hover: none) {
          .article-card:active { transform: translateY(-2px); }
          .article-card:active .accent-bar { transform: scaleX(1); }
        }

        /* Reduced motion — strip everything */
        @media (prefers-reduced-motion: reduce) {
          .orb,
          .pill, .heading, .sub, .back-link-wrap,
          .article-card, .card-inner,
          .accent-bar, .spotlight, .shine,
          .icon, .card-title, .card-desc, .date,
          .read, .read-text::after, .arrow,
          .coming-soon, .coming-icon, .pulse-ring, .dot {
            animation: none !important;
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  )
}
