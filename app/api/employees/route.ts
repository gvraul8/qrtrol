import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

  const adminClient = createAdminClient()

  if (mode === 'direct') {
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const { data: created, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, company_id: adminProfile.company_id, role },
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Insert into public.users explicitly in case the trigger doesn't fire
    const { error: profileError } = await adminClient
      .from('users')
      .upsert({
        id: created.user.id,
        company_id: adminProfile.company_id,
        full_name,
        email,
        role,
      })

    if (profileError) {
      // Roll back: delete the auth user to avoid orphaned records
      await adminClient.auth.admin.deleteUser(created.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, user_id: created.user.id })
  }

  // Default: invite via email
  const origin = new URL(request.url).origin
  const { data: invited, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name, company_id: adminProfile.company_id, role },
    redirectTo: `${origin}/setup-password`,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, user_id: invited.user.id })
}
