'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileDown, LogIn, LogOut, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { TimeEntry } from '@/types/time-entry.types'

interface Props {
  initialEntries: TimeEntry[]
  companyId: string
}

export function ReportsPageClient({ initialEntries, companyId }: Props) {
  const [entries, setEntries] = useState(initialEntries)
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [exporting, setExporting] = useState(false)

  const filtered = entries.filter((e) => {
    const name = e.users?.full_name?.toLowerCase() ?? ''
    const email = e.users?.email?.toLowerCase() ?? ''
    return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase())
  })

  const handleFilter = async () => {
    const params = new URLSearchParams({ company_id: companyId })
    if (fromDate) params.set('from', fromDate)
    if (toDate) params.set('to', toDate + 'T23:59:59')
    const res = await fetch(`/api/attendance?${params}`)
    const data = await res.json()
    setEntries(data.entries ?? [])
  }

  const handleExport = async (format: 'pdf' | 'excel') => {
    setExporting(true)
    try {
      const params = new URLSearchParams({ format, company_id: companyId })
      if (fromDate) params.set('from', fromDate)
      if (toDate) params.set('to', toDate + 'T23:59:59')
      const res = await fetch(`/api/reports/export?${params}`)
      if (!res.ok) throw new Error('Error al exportar')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `informe-qrtrol.${format === 'pdf' ? 'pdf' : 'xlsx'}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Error al exportar el informe')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-50">Informes</h1>
          <p className="text-sm text-zinc-500">{filtered.length} registros</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('excel')}
            disabled={exporting}
            className="gap-1.5"
          >
            <FileDown className="h-3.5 w-3.5" />
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="gap-1.5"
          >
            <FileDown className="h-3.5 w-3.5" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Buscar empleado…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="w-40"
          placeholder="Desde"
        />
        <Input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="w-40"
          placeholder="Hasta"
        />
        <Button onClick={handleFilter} size="sm">Filtrar</Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Empleado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Fecha y hora</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, i) => (
              <motion.tr
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7">
                      {entry.users?.avatar_url && <AvatarImage src={entry.users.avatar_url} alt={entry.users.full_name} />}
                      <AvatarFallback className="text-[10px]">{getInitials(entry.users?.full_name ?? '?')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-zinc-100 font-medium">{entry.users?.full_name ?? 'Empleado'}</p>
                      <p className="text-xs text-zinc-500">{entry.users?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={entry.type === 'entry' ? 'success' : 'secondary'}>
                    {entry.type === 'entry'
                      ? <><LogIn className="h-3 w-3" /> Entrada</>
                      : <><LogOut className="h-3 w-3" /> Salida</>
                    }
                  </Badge>
                </td>
                <td className="px-4 py-3 text-zinc-400">{formatDateTime(entry.created_at)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="py-12 text-center text-sm text-zinc-500">Sin registros para los filtros seleccionados</div>
        )}
      </div>
    </div>
  )
}
