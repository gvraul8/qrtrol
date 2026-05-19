'use client'

import { useState } from 'react'
import { FileText, FileSpreadsheet, CalendarDays, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { downloadExcel, downloadPDF, buildDailySummary, type ExportEntry } from '@/lib/export-utils'
import { toast } from 'sonner'
import type { UserProfile } from '@/types/auth.types'

interface Props {
  employee: UserProfile | null
  allEntries: (ExportEntry & { user_id: string })[]
  onClose: () => void
}

export function EmployeeDownloadModal({ employee, allEntries, onClose }: Props) {
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [month, setMonth] = useState(defaultMonth)
  const [loading, setLoading] = useState<'pdf' | 'excel' | null>(null)

  if (!employee) return null

  const filtered = allEntries.filter(
    (e) => e.user_id === employee.id && e.created_at.startsWith(month),
  )

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
        await downloadExcel(filtered, employee.full_name, month)
      } else {
        await downloadPDF(filtered, employee.full_name, month)
      }
      toast.success('Archivo descargado')
    } catch {
      toast.error('Error al generar el archivo')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Dialog open={!!employee} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Descargar informe mensual</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Empleado:{' '}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {employee.full_name}
            </span>
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Mes
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Summary stats */}
          <div className="rounded-lg border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/40 px-4 py-3 flex gap-5">
            <div className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
              <CalendarDays className="h-4 w-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{workingDays}</span>
              {' '}días
            </div>
            <div className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
              <Clock className="h-4 w-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{totalLabel}</span>
              {' '}totales
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1 gap-2"
              variant="outline"
              onClick={() => handle('pdf')}
              disabled={loading !== null}
            >
              <FileText className="h-4 w-4" />
              {loading === 'pdf' ? 'Generando…' : 'PDF'}
            </Button>
            <Button
              className="flex-1 gap-2"
              variant="outline"
              onClick={() => handle('excel')}
              disabled={loading !== null}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {loading === 'excel' ? 'Generando…' : 'Excel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
