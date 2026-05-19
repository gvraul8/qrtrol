import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/employees/active?company_id=...
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

  const { data: employees } = await supabase
    .from('users')
    .select('id, full_name, email, avatar_url')
    .eq('company_id', profile.company_id)
    .eq('role', 'employee')

  const active = []
  for (const emp of employees ?? []) {
    const { data: lastEntry } = await supabase
      .from('time_entries')
      .select('type, created_at')
      .eq('user_id', emp.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (lastEntry?.type === 'entry') {
      active.push({ ...emp, company_id: profile.company_id, checked_in_at: lastEntry.created_at })
    }
  }

  return NextResponse.json({ workers: active })
}
