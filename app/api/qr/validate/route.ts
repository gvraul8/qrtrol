import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isTokenValid, isTokenExpired } from '@/lib/qr/validate'
import type { QRValidateRequest } from '@/types/qr.types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = (await request.json()) as QRValidateRequest

  if (!isTokenValid(body.token)) {
    return NextResponse.json({ error: 'Formato de token inválido' }, { status: 400 })
  }
  if (!['entry', 'exit'].includes(body.type)) {
    return NextResponse.json({ error: 'Tipo de fichaje inválido' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('company_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

  const { data: session } = await supabase
    .from('qr_sessions')
    .select()
    .eq('token', body.token)
    .eq('company_id', profile.company_id)
    .single()

  if (!session) return NextResponse.json({ error: 'QR no encontrado' }, { status: 404 })
  if (session.used) return NextResponse.json({ error: 'QR ya utilizado' }, { status: 409 })
  if (isTokenExpired(session.expires_at)) return NextResponse.json({ error: 'QR expirado' }, { status: 410 })

  const { data: entry, error } = await supabase
    .from('time_entries')
    .insert({
      user_id: user.id,
      company_id: profile.company_id,
      qr_session_id: session.id,
      type: body.type,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Error al registrar fichaje' }, { status: 500 })
  }

  // Mark session as used
  await supabase.from('qr_sessions').update({ used: true }).eq('id', session.id)

  const label = body.type === 'entry' ? 'Entrada' : 'Salida'
  return NextResponse.json({
    success: true,
    message: `${label} registrada correctamente`,
    entry_id: entry.id,
    user_name: profile.full_name,
  })
}
