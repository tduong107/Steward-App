import { createBrowserClient } from '@supabase/ssr'

let cachedClient: ReturnType<typeof createBrowserClient> | null = null

/**
 * Returns a memoized Supabase browser client. Safe to call from any
 * number of hooks — they'll all share one instance.
 *
 * Behavior when env vars are missing:
 * - **Browser runtime** (`typeof window !== 'undefined'`): throws. A
 *   deployed build with missing `NEXT_PUBLIC_*` vars is a real bug —
 *   we surface it loudly at the caller rather than silently returning
 *   a placeholder client that fails every request.
 * - **Server / build-time** (SSR, SSG pre-render, `next build`): returns
 *   a placeholder client *without* caching. `NEXT_PUBLIC_*` vars are
 *   baked into the client bundle at build time, so the placeholder is
 *   only ever returned from server-side evaluation paths where real
 *   network calls won't happen anyway.
 */
export function createClient() {
  if (cachedClient) return cachedClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    if (typeof window !== 'undefined') {
      throw new Error(
        'Supabase env vars missing at browser runtime. ' +
        'Check deployment NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      )
    }
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
    )
  }

  cachedClient = createBrowserClient(url, key)
  return cachedClient
}
