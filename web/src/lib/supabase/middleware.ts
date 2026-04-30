import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users away from dashboard
  // Allow static verification files and well-known paths through without auth
  const path = request.nextUrl.pathname
  const isStaticFile = path.endsWith('.xml') || path.endsWith('.txt') || path.endsWith('.json') || path.startsWith('/.well-known')

  if (!user && !isStaticFile && !path.startsWith('/login') && !path.startsWith('/signup') && !path.startsWith('/forgot-password') && !path.startsWith('/welcome') && !path.startsWith('/shared') && !path.startsWith('/auth/callback') && !path.startsWith('/api/') && !path.startsWith('/privacy') && !path.startsWith('/terms') && !path.startsWith('/support') && !path.startsWith('/blog') && !path.startsWith('/labs') && path !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages AND the marketing
  // landing. Phase 13: previously the redirect for `/` lived inside
  // `app/page.tsx` as a Server Component side effect, which forced the
  // page into `dynamic = 'force-dynamic'` and ran `auth.getUser()` a
  // SECOND time per request (this middleware already ran it once at
  // line 26). Moving the redirect here removes that duplicate auth
  // check on every landing request (~80–150ms TTFB win for anon users)
  // and lets the landing page itself be statically rendered.
  if (
    user &&
    (request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/signup') ||
      request.nextUrl.pathname === '/')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/home'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
