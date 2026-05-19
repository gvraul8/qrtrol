import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

// Supabase OAuth callback handler — exchanges the code for a session.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
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

    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user) {
      // Invited users haven't set a password yet — send them to the setup page
      const isInvited = !!user.user_metadata?.invited_at
      const hasSetPassword = !!user.user_metadata?.password_set
      if (isInvited && !hasSetPassword) {
        return NextResponse.redirect(`${origin}/setup-password`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Invalid or missing code — redirect back to login with an error flag
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
