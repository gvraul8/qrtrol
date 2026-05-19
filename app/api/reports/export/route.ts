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

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') ?? 'excel'
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  let query = supabase
    .from('time_entries')
    .select('created_at, type, users(full_name, email)')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })

  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)

  const { data: entries, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  type Row = { Nombre: string; Email: string; Tipo: string; 'Fecha y hora': string }
  const rows: Row[] = (entries ?? []).map((e: any) => ({
    Nombre: e.users?.full_name ?? '-',
    Email: e.users?.email ?? '-',
    Tipo: e.type === 'entry' ? 'Entrada' : 'Salida',
    'Fecha y hora': new Date(e.created_at).toLocaleString('es-ES'),
  }))

  if (format === 'pdf') {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF()
    doc.text('Informe de fichajes — QRtrol', 14, 18)

    autoTable(doc, {
      head: [['Nombre', 'Email', 'Tipo', 'Fecha y hora']],
      body: rows.map((r) => [r['Nombre'], r['Email'], r['Tipo'], r['Fecha y hora']]),
      startY: 28,
      styles: { fontSize: 9 },
    })

    const pdfBuf = Buffer.from(doc.output('arraybuffer'))
    return new NextResponse(pdfBuf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="informe-qrtrol.pdf"',
      },
    })
  }

  // Excel (default)
  const XLSX = await import('xlsx')
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Fichajes')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="informe-qrtrol.xlsx"',
    },
  })
}
