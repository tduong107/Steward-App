import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

// Matcher excludes paths that must never be auth-gated:
//
// - `_next/static`, `_next/image`, `favicon.ico` — Next.js asset
//   pipeline; auth on these breaks builds and dev tooling.
// - `opengraph-image`, `twitter-image` — Next.js metadata convention
//   files (`app/opengraph-image.tsx`, `app/twitter-image.tsx`).
//   These routes are fetched by social crawlers (Twitter,
//   Facebook, Slack, LinkedIn, Discord, iMessage previewer) which
//   never carry auth cookies. Without this exclusion, every
//   social-share preview was redirected to `/login` and rendered as
//   "Login | Steward" with no image — costing every link share
//   we've ever made on the internet.
// - `icon`, `apple-icon` — same convention pattern for favicons.
// - `*.svg|png|jpg|jpeg|gif|webp` — static image extensions.
//
// Static text resources (`robots.txt`, `sitemap.xml`,
// `llms.txt`, `manifest.webmanifest`, `.well-known/*`) are also
// allowed through but are handled inside `updateSession()` via the
// `isStaticFile` check rather than excluded here, so cookie refresh
// can still attach to those responses if a logged-in user happens
// to fetch them.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|opengraph-image|twitter-image|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
