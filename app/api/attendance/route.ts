import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  let query = supabase
    .from('time_entries')
    .select('*, users(full_name, email, avatar_url)')
    .order('created_at', { ascending: false })

  if (profile.role === 'admin') {
    query = query.eq('company_id', profile.company_id)
  } else {
    query = query.eq('user_id', user.id)
  }

  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ entries: data })
}

// POST /api/attendance — create a manual time entry (admin only)
export async function POST(request: NextRequest) {
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

  const { user_id, type, created_at } = await request.json()
  if (!user_id || !type || !created_at) {
    return NextResponse.json({ error: 'Empleado, tipo y fecha son requeridos' }, { status: 400 })
  }

  // Ensure the target employee belongs to the same company
  const { data: target } = await supabase
    .from('users')
    .select('id')
    .eq('id', user_id)
    .eq('company_id', profile.company_id)
    .single()

  if (!target) return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 })

  const { data: entry, error } = await supabase
    .from('time_entries')
    .insert({ user_id, company_id: profile.company_id, type, created_at, qr_session_id: null })
    .select('*, users(full_name, email, avatar_url)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry })
}
