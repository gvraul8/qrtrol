/**
 * Client-side export utilities for generating PDF and Excel files
 * from attendance entry data without requiring a server API call.
 *
 * Output format: daily summary (date, entry time, exit time, hours worked)
 * with a monthly total row — designed for payroll review.
 */

export type ExportEntry = {
  type: 'entry' | 'exit'
  created_at: string
  users?: { full_name: string; email: string; avatar_url: string | null }
}

// ─── Daily summary helpers ────────────────────────────────────────────────────

type DayRow = {
  fecha: string
  entrada: string
  salida: string
  horas: string
  minutes: number
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

function toTime(date: Date) {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Groups raw entry/exit records into per-shift rows (one row per entry/exit pair).
 * If a day has two shifts, two rows appear for that date.
 * The `fecha` field is populated only on the first row of each day so that
 * multi-shift days render cleanly (blank date on subsequent shifts).
 */
export function buildDailySummary(entries: ExportEntry[]): {
  rows: DayRow[]
  totalMinutes: number
  workingDays: number
} {
  const byDay = new Map<string, ExportEntry[]>()
  for (const e of entries) {
    const day = e.created_at.slice(0, 10)
    if (!byDay.has(day)) byDay.set(day, [])
    byDay.get(day)!.push(e)
  }

  const rows: DayRow[] = []
  let totalMinutes = 0
  let workingDays = 0

  for (const day of [...byDay.keys()].sort()) {
    const sorted = byDay
      .get(day)!
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    const ins = sorted.filter((e) => e.type === 'entry').map((e) => new Date(e.created_at))
    const outs = sorted.filter((e) => e.type === 'exit').map((e) => new Date(e.created_at))

    workingDays++
    const pairs = Math.min(ins.length, outs.length)

    const dateLabel = new Date(`${day}T12:00:00`).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

    // One row per completed shift pair
    for (let j = 0; j < pairs; j++) {
      const mins = (outs[j].getTime() - ins[j].getTime()) / 60_000
      totalMinutes += mins
      rows.push({
        fecha: j === 0 ? dateLabel : '',   // blank on 2nd+ shift of same day
        entrada: toTime(ins[j]),
        salida: toTime(outs[j]),
        horas: formatMinutes(mins),
        minutes: mins,
      })
    }

    // Unpaired entries (no matching exit yet)
    for (let j = pairs; j < ins.length; j++) {
      rows.push({
        fecha: j === 0 ? dateLabel : '',
        entrada: toTime(ins[j]),
        salida: '—',
        horas: 'Sin salida',
        minutes: 0,
      })
    }
  }

  return { rows, totalMinutes, workingDays }
}

// ─── Download triggers ────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function monthLabel(month: string) {
  const [year, m] = month.split('-')
  return new Date(+year, +m - 1, 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' })
}

// ─── Excel ────────────────────────────────────────────────────────────────────

export async function downloadExcel(
  entries: ExportEntry[],
  employeeName: string,
  month: string,
) {
  const XLSX = await import('xlsx')
  const { rows, totalMinutes, workingDays } = buildDailySummary(entries)

  const sheetRows = [
    // Info header rows
    ['Empleado:', employeeName],
    ['Mes:', monthLabel(month)],
    ['Días trabajados:', workingDays],
    ['Total horas:', formatMinutes(totalMinutes)],
    [],
    // Table header
    ['Fecha', 'Entrada', 'Salida', 'Horas trabajadas'],
    // Data rows
    ...rows.map((r) => [r.fecha, r.entrada, r.salida, r.horas]),
    [],
    // Total row
    ['TOTAL', '', '', formatMinutes(totalMinutes)],
  ]

  const ws = XLSX.utils.aoa_to_sheet(sheetRows)

  // Column widths
  ws['!cols'] = [{ wch: 28 }, { wch: 10 }, { wch: 10 }, { wch: 18 }]

  // Bold the header and total rows (row indices 5 and last)
  const headerRowIdx = 5
  const totalRowIdx = sheetRows.length - 1
  const bold = { font: { bold: true } }
  ;['A', 'B', 'C', 'D'].forEach((col) => {
    const hCell = ws[`${col}${headerRowIdx + 1}`]
    if (hCell) hCell.s = bold
    const tCell = ws[`${col}${totalRowIdx + 1}`]
    if (tCell) tCell.s = bold
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Resumen mensual')
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const slug = employeeName.split(' ')[0].toLowerCase()
  triggerDownload(blob, `fichajes-${slug}-${month}.xlsx`)
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

export async function downloadPDF(
  entries: ExportEntry[],
  employeeName: string,
  month: string,
) {
  const { jsPDF } = await import('jspdf')
  // @ts-expect-error: jspdf-autotable adds autoTable to jsPDF prototype
  const autoTable = (await import('jspdf-autotable')).default
  const { rows, totalMinutes, workingDays } = buildDailySummary(entries)
  const label = monthLabel(month)

  const doc = new jsPDF()

  // ── Header block
  doc.setFontSize(16)
  doc.setTextColor(20, 20, 20)
  doc.text('Informe de horas mensuales', 14, 18)

  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text(`Empleado: ${employeeName}`, 14, 27)
  doc.text(`Mes: ${label}`, 14, 33)

  // ── Summary box
  doc.setDrawColor(220, 220, 220)
  doc.setFillColor(245, 247, 250)
  doc.roundedRect(14, 38, 182, 18, 2, 2, 'FD')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`Días trabajados: ${workingDays}`, 20, 45)
  doc.text(`Total horas: ${formatMinutes(totalMinutes)}`, 20, 51)

  // ── Table
  autoTable(doc, {
    head: [['Fecha', 'Entrada', 'Salida', 'Horas trabajadas']],
    body: [
      ...rows.map((r) => [r.fecha, r.entrada, r.salida, r.horas]),
      // Total row
      [{ content: 'TOTAL', styles: { fontStyle: 'bold' } }, '', '', { content: formatMinutes(totalMinutes), styles: { fontStyle: 'bold' } }],
    ],
    startY: 62,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 40, halign: 'right' },
    },
  })

  const slug = employeeName.split(' ')[0].toLowerCase()
  doc.save(`fichajes-${slug}-${month}.pdf`)
}
