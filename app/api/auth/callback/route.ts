import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

// Supabase OAuth / invite callback handler
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // Invitation link — verify token and redirect to password setup
  if (tokenHash && type === 'invite') {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'invite' })
    if (!error) {
      return NextResponse.redirect(`${origin}/setup-password`)
    }
    return NextResponse.redirect(`${origin}/login?error=invalid_invite`)
  }

  // Recovery / magic-link — verify token and redirect accordingly
  if (tokenHash && (type === 'recovery' || type === 'magiclink' || type === 'email')) {
    const otpType = type as 'recovery' | 'magiclink' | 'email'
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType })
    if (!error) {
      const destination = type === 'recovery' ? '/setup-password' : next
      return NextResponse.redirect(`${origin}${destination}`)
    }
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  // PKCE code exchange (OAuth providers)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Invalid or missing token — redirect back to login with an error flag
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
