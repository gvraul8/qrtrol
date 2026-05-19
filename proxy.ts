import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Session lifetime for cookies: 30 days.
// Make sure your Supabase project's Auth > JWT expiry and Refresh Token
// expiry are set to at least this value (Supabase dashboard → Auth → Configuration).
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days in seconds

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Mock / demo mode: no Supabase credentials → passthrough, no auth checks.
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        // Write incoming cookies into the request (so server components see them)
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))

        // Rebuild the response and write cookies with long maxAge into it
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            ...options,
            // Ensure the cookie survives browser restarts (not a session cookie)
            maxAge: options?.maxAge ?? SESSION_MAX_AGE,
            sameSite: options?.sameSite ?? 'lax',
            httpOnly: options?.httpOnly ?? true,
            secure: options?.secure ?? process.env.NODE_ENV === 'production',
          })
        })
      },
    },
  })

  // This single call does the heavy lifting:
  //  • validates the stored access token
  //  • if expired, uses the refresh token to silently obtain a new one
  //  • writes the refreshed tokens back into the response cookies
  // Without this, users would be logged out after the 1-hour access token expires.
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    // Run on all routes except static assets
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
