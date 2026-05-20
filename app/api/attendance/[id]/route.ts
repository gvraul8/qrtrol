import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PUT /api/attendance/[id] — update type and/or created_at (admin only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const { data: existing } = await supabase
    .from('time_entries')
    .select('id')
    .eq('id', id)
    .eq('company_id', profile.company_id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Fichaje no encontrado' }, { status: 404 })

  const { type, created_at } = await request.json()
  if (!type || !created_at) {
    return NextResponse.json({ error: 'Tipo y fecha son requeridos' }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('time_entries')
    .update({ type, created_at })
    .eq('id', id)
    .select('*, users(full_name, email, avatar_url)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry: updated })
}

// DELETE /api/attendance/[id] — remove a time entry (admin only)
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const { data: existing } = await supabase
    .from('time_entries')
    .select('id')
    .eq('id', id)
    .eq('company_id', profile.company_id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Fichaje no encontrado' }, { status: 404 })

  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
