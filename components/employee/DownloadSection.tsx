'use client'

import { useState } from 'react'
import { FileDown, FileText, FileSpreadsheet, CalendarDays, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { downloadExcel, downloadPDF, buildDailySummary, type ExportEntry } from '@/lib/export-utils'
import { toast } from 'sonner'

interface Props {
  entries: ExportEntry[]
  employeeName: string
}

export function DownloadSection({ entries, employeeName }: Props) {
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [month, setMonth] = useState(defaultMonth)
  const [loading, setLoading] = useState<'pdf' | 'excel' | null>(null)

  const filtered = entries.filter((e) => e.created_at.startsWith(month))
  const { workingDays, totalMinutes } = buildDailySummary(filtered)

  const totalH = Math.floor(totalMinutes / 60)
  const totalM = Math.round(totalMinutes % 60)
  const totalLabel = totalMinutes > 0
    ? `${totalH > 0 ? `${totalH} h ` : ''}${totalM > 0 ? `${totalM} min` : ''}`
    : '0 h'

  const [year, m] = month.split('-')
  const monthLabel = new Date(+year, +m - 1, 1).toLocaleString('es-ES', {
    month: 'long',
    year: 'numeric',
  })

  const handle = async (format: 'pdf' | 'excel') => {
    if (filtered.length === 0) {
      toast.info(`No hay fichajes en ${monthLabel}`)
      return
    }
    setLoading(format)
    try {
      if (format === 'excel') {
        await downloadExcel(filtered, employeeName, month)
      } else {
        await downloadPDF(filtered, employeeName, month)
      }
      toast.success('Archivo descargado')
    } catch {
      toast.error('Error al generar el archivo')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 p-4 sm:p-5 space-y-4">
      {/* Title + month picker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
          <FileDown className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          Descargar informe mensual
        </h2>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 self-start sm:self-auto"
        />
      </div>

      {/* Summary stats */}
      <div className="flex gap-4">
        <div className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
          <CalendarDays className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{workingDays}</span>
          {' '}días trabajados
        </div>
        <div className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
          <Clock className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{totalLabel}</span>
          {' '}totales
        </div>
      </div>

      {/* Download buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handle('pdf')}
          disabled={loading !== null}
          className="gap-1.5"
        >
          <FileText className="h-3.5 w-3.5" />
          {loading === 'pdf' ? 'Generando…' : 'PDF'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handle('excel')}
          disabled={loading !== null}
          className="gap-1.5"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          {loading === 'excel' ? 'Generando…' : 'Excel'}
        </Button>
      </div>
    </div>
  )
}
