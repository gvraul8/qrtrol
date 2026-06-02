import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PUT /api/company/[id]
export async function PUT(
  request: NextRequest,
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

  if (!profile || profile.role !== 'admin' || profile.company_id !== id) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const body = await request.json()
  const update: { name?: string; address?: string | null; qr_duration_seconds?: number; logo_url?: string | null } = {}
  if (body.name) update.name = String(body.name)
  if (body.address !== undefined) update.address = body.address ?? null
  if (body.qr_duration_seconds) {
    update.qr_duration_seconds = Math.min(Math.max(Number(body.qr_duration_seconds), 10), 300)
  }
  if (body.logo_url !== undefined) {
    if (body.logo_url === null || body.logo_url === '') {
      update.logo_url = null
    } else if (typeof body.logo_url === 'string' && body.logo_url.startsWith('data:image/')) {
      update.logo_url = body.logo_url
    } else {
      return NextResponse.json({ error: 'Logo inválido' }, { status: 400 })
    }
  }

  const { data, error } = await supabase
    .from('companies')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ company: data })
}
