import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Direct fetch helper — avoids the supabase-js v2 Headers.append bug where the
// bearer token accumulates across middleware layers when using auth.admin methods.
function adminAuthHeaders() {
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').split(/[\r\n]+/)[0].trim()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
    apikey: key,
  }
}

async function adminDeleteUser(userId: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}`,
    { method: 'DELETE', headers: adminAuthHeaders() },
  )
  if (!res.ok) {
    const text = await res.text()
    const json = text ? JSON.parse(text) : {}
    return { error: json.msg ?? json.message ?? 'Error al eliminar usuario' }
  }
  return { error: null }
}

// PUT /api/employees/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Allow admins OR the user themselves to update
  const { data: callerProfile } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!callerProfile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

  const isAdmin = callerProfile.role === 'admin'
  const isSelf = user.id === id

  if (!isAdmin && !isSelf) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const body = await request.json()
  const update: { full_name?: string; avatar_url?: string | null; role?: 'admin' | 'employee' } = {}
  if (body.full_name) update.full_name = String(body.full_name)
  if (body.avatar_url !== undefined) update.avatar_url = body.avatar_url ?? null
  if (isAdmin && body.role) update.role = body.role as 'admin' | 'employee'

  const { data, error } = await supabase
    .from('users')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ employee: data })
}

// DELETE /api/employees/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

  // Ensure target is in same company
  const { data: target } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', id)
    .single()

  if (!target || target.company_id !== profile.company_id) {
    return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 })
  }

  // Delete from auth.users (cascades to public.users via ON DELETE CASCADE)
  const { error: authError } = await adminDeleteUser(id)
  if (authError) return NextResponse.json({ error: authError }, { status: 500 })

  return NextResponse.json({ success: true })
}
