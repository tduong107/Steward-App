import { ImageResponse } from 'next/og'

/**
 * Shared OG-image renderer for blog articles.
 *
 * Each blog post owns a tiny `opengraph-image.tsx` (and matching
 * `twitter-image.tsx`) that just imports `renderArticleOgImage` and
 * passes its title + category. The actual layout, fonts, brand
 * colors, and edge runtime live here so we have one place to
 * update if the brand evolves.
 *
 * Why per-post OG images instead of one site-wide one:
 *   - When somebody shares "/blog/steward-vs-honey" on Twitter or
 *     Slack, the preview now shows the article title baked into the
 *     image, not just the generic site card.
 *   - Higher CTR from social shares (the title is also the hook).
 *   - Distinguishes our 4 articles from each other in any UI that
 *     stacks multiple OG previews (e.g. iMessage threads, Notion
 *     embeds).
 *
 * Satori-related notes (the renderer behind ImageResponse):
 *   - Only a subset of CSS works. No `gap`, no `box-shadow` blur, no
 *     CSS transforms beyond translate/scale/rotate.
 *   - Every container that has multiple children must explicitly
 *     declare `display: flex` (not implicit block layout).
 *   - Font fallbacks are brittle — stick to system / generic
 *     families.
 */

const colors = {
  bg: '#080A08',
  forest: '#0F2018',
  green: '#1C3D2E',
  mint: '#6EE7B7',
  cream: '#F7F6F3',
  textDim: 'rgba(247,246,243,0.62)',
}

export const ogImageSize = { width: 1200, height: 630 }
export const ogImageContentType = 'image/png'

export interface ArticleOgProps {
  /** Article title shown as the dominant text in the image. */
  title: string
  /** Category eyebrow, e.g. "Comparison" or "Guide". Drawn small
   *  above the title. */
  category: string
}

export function renderArticleOgImage({ title, category }: ArticleOgProps) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: `radial-gradient(ellipse 80% 60% at 80% 20%, ${colors.green} 0%, ${colors.forest} 45%, ${colors.bg} 100%)`,
          padding: '72px 88px',
          fontFamily: 'Georgia, serif',
          color: colors.cream,
          position: 'relative',
        }}
      >
        {/* Brand row (top-left) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 26,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: colors.mint,
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              background: colors.mint,
              marginRight: 14,
            }}
          />
          Steward
        </div>

        {/* Category eyebrow */}
        <div
          style={{
            display: 'flex',
            marginTop: 'auto',
            marginBottom: 18,
            fontSize: 22,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: colors.mint,
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 600,
          }}
        >
          {category}
        </div>

        {/* Article title — wraps naturally; line-height tuned so a
            three-line title still fits inside the box. */}
        <div
          style={{
            display: 'flex',
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: colors.cream,
            maxWidth: 1024,
          }}
        >
          {title}
        </div>

        {/* Footer row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 44,
            fontSize: 22,
            color: colors.textDim,
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: '0.02em',
          }}
        >
          <span>joinsteward.app/blog</span>
          <span>By Tienhung Duong</span>
        </div>
      </div>
    ),
    { ...ogImageSize }
  )
}
