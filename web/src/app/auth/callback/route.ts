import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/home'

  if (code) {
    const redirectUrl = new URL(next, origin)
    redirectUrl.searchParams.set('welcome', '1')

    // We need a mutable reference so setAll can attach cookies to the redirect
    let response = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Set cookies on the request so subsequent getAll() calls see them
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            )
            // Recreate the redirect response with updated cookies
            response = NextResponse.redirect(redirectUrl)
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            )
          },
        },
      },
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Ensure profile exists for OAuth users
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existingProfile) {
        const displayName =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.display_name ||
          data.user.email?.split('@')[0] ||
          'User'

        await supabase.from('profiles').upsert({
          id: data.user.id,
          display_name: displayName,
        })
      }

      return response
    }
  }

  // If something went wrong, redirect to login with error info
  const errorUrl = new URL('/login', request.nextUrl.origin)
  errorUrl.searchParams.set('error', 'auth_callback_failed')
  return NextResponse.redirect(errorUrl)
}
