import type { MetadataRoute } from 'next'
import { articles } from './blog/_data/articles'

/**
 * Manually-tracked last-modified date for the static landing surfaces
 * (homepage, signup, legal, blog index, etc.). Bump this whenever you
 * meaningfully edit those pages — copy changes, new sections, etc.
 *
 * Why not `new Date()`? Setting `lastModified` to the build time told
 * Google "every page on the site changed today" on every deploy,
 * which is a noisy signal that wastes crawl budget and trains Google
 * to under-trust our freshness reporting. A static date that bumps
 * deliberately is a much cleaner crawl-priority hint.
 */
const STATIC_PAGES_LAST_MODIFIED = '2026-04-29'

/**
 * Most recent blog article publish date — used as the lastModified
 * value for the blog index and category pages, since those pages
 * effectively "change" whenever a new article goes live.
 *
 * Falls back to STATIC_PAGES_LAST_MODIFIED if there are no articles
 * yet (defensive — the blog ships with seed posts so this branch
 * shouldn't fire in production).
 */
const blogIndexLastModified =
  articles
    .map((a) => a.publishedAt)
    .sort()
    .reverse()[0] ?? STATIC_PAGES_LAST_MODIFIED

export default function sitemap(): MetadataRoute.Sitemap {
  // Per-article entries — `lastModified` comes from the staggered
  // `publishedAt` in `_data/articles.ts`. When we ship visible
  // "Last updated" UI we should also surface a `dateModified` field
  // on each article and use it here in preference to `publishedAt`.
  const blogArticleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `https://www.joinsteward.app/blog/${article.slug}`,
    lastModified: article.publishedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [
    {
      url: 'https://www.joinsteward.app',
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://www.joinsteward.app/support',
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://www.joinsteward.app/signup',
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://www.joinsteward.app/login',
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://www.joinsteward.app/privacy',
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: 'https://www.joinsteward.app/terms',
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: 'https://www.joinsteward.app/blog',
      lastModified: blogIndexLastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://www.joinsteward.app/blog/comparisons',
      lastModified: blogIndexLastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://www.joinsteward.app/blog/guides',
      lastModified: blogIndexLastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://www.joinsteward.app/blog/insights',
      lastModified: blogIndexLastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...blogArticleEntries,
  ]
}
