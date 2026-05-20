import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ---------------------------------------------------------------------------
// Direct Supabase Auth Admin helpers
// The SDK's auth.admin methods trigger a Headers.append bug in supabase-js v2
// (the bearer token accumulates across middleware layers). These helpers call
// the Auth Admin REST API with a fresh fetch to sidestep the issue entirely.
// ---------------------------------------------------------------------------
function adminAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }
}

const authAdminUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/${path}`

async function adminCreateUser(payload: {
  email: string
  password: string
  user_metadata: Record<string, unknown>
}) {
  const res = await fetch(authAdminUrl('users'), {
    method: 'POST',
    headers: adminAuthHeaders(),
    body: JSON.stringify({ ...payload, email_confirm: true }),
  })
  const json = await res.json()
  if (!res.ok) return { user: null, error: json.msg ?? json.message ?? 'Error al crear usuario' }
  return { user: json as { id: string }, error: null }
}

async function adminDeleteUser(userId: string) {
  await fetch(authAdminUrl(`users/${userId}`), {
    method: 'DELETE',
    headers: adminAuthHeaders(),
  })
}

async function adminInviteUser(payload: {
  email: string
  data: Record<string, unknown>
  redirect_to: string
}) {
  const res = await fetch(authAdminUrl('invite'), {
    method: 'POST',
    headers: adminAuthHeaders(),
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) return { user: null, error: json.msg ?? json.message ?? 'Error al invitar usuario' }
  return { user: json as { id: string }, error: null }
}

// GET /api/employees?company_id=...
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const { data: employees, error } = await supabase
    .from('users')
    .select()
    .eq('company_id', profile.company_id)
    .order('full_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ employees })
}

// POST /api/employees — invite new employee
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: adminProfile } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!adminProfile || adminProfile.role !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const body = await request.json()
  const { full_name, email, role = 'employee', mode = 'invite', password } = body

  if (!full_name || !email) {
    return NextResponse.json({ error: 'Nombre y email requeridos' }, { status: 400 })
  }

  if (mode === 'direct') {
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const { user: created, error } = await adminCreateUser({
      email,
      password,
      user_metadata: { full_name, company_id: adminProfile.company_id, role },
    })

    if (error || !created) return NextResponse.json({ error }, { status: 500 })

    // Insert into public.users explicitly in case the trigger doesn't fire
    const adminClient = createAdminClient()
    const { error: profileError } = await adminClient
      .from('users')
      .upsert({
        id: created.id,
        company_id: adminProfile.company_id,
        full_name,
        email,
        role,
      })

    if (profileError) {
      // Roll back: delete the auth user to avoid orphaned records
      await adminDeleteUser(created.id)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, user_id: created.id })
  }

  // Default: invite via email
  const origin = new URL(request.url).origin
  const { user: invited, error: inviteError } = await adminInviteUser({
    email,
    data: { full_name, company_id: adminProfile.company_id, role },
    redirect_to: `${origin}/setup-password`,
  })

  if (inviteError || !invited) return NextResponse.json({ error: inviteError }, { status: 500 })

  return NextResponse.json({ success: true, user_id: invited.id })
}
