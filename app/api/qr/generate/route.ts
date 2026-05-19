import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateQRToken, generateQRDataURL, getTokenExpiry } from '@/lib/qr/generate'

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

  // Get company QR duration
  const { data: company } = await supabase
    .from('companies')
    .select('qr_duration_seconds')
    .eq('id', profile.company_id)
    .single()

  const body = await request.json().catch(() => ({}))
  const durationSeconds = Math.min(
    Number(body.duration_seconds) || company?.qr_duration_seconds || 20,
    300
  )

  const token = generateQRToken()
  const expiresAt = getTokenExpiry(durationSeconds)

  const { data: session, error } = await supabase
    .from('qr_sessions')
    .insert({
      company_id: profile.company_id,
      token,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Error al crear QR' }, { status: 500 })
  }

  const host = request.headers.get('host') ?? 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${protocol}://${host}`

  const qrDataUrl = await generateQRDataURL(token, baseUrl)

  return NextResponse.json({ session, qr_data_url: qrDataUrl })
}
