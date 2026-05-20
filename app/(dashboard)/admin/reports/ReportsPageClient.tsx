'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileDown, LogIn, LogOut, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import { EntryFormModal } from '@/components/admin/EntryFormModal'
import type { TimeEntry } from '@/types/time-entry.types'
import type { UserProfile } from '@/types/auth.types'

interface Props {
  initialEntries: TimeEntry[]
  companyId: string
}

export function ReportsPageClient({ initialEntries, companyId }: Props) {
  const [entries, setEntries] = useState(initialEntries)
  const [employees, setEmployees] = useState<UserProfile[]>([])
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [exporting, setExporting] = useState(false)
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/employees')
      .then((r) => r.json())
      .then((d) => setEmployees(d.employees ?? []))
  }, [])

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

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este fichaje?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/attendance/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Error al eliminar')
      setEntries((prev) => prev.filter((e) => e.id !== id))
      toast.success('Fichaje eliminado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSaved = (updated: TimeEntry) => {
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === updated.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = updated
        return next
      }
      return [updated, ...prev]
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Informes</h1>
          <p className="text-sm text-zinc-500">{filtered.length} registros</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewModal(true)}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Añadir fichaje
          </Button>
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
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-zinc-800">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Empleado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Fecha y hora</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, i) => (
              <motion.tr
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="border-b border-gray-100 dark:border-zinc-800 hover:bg-blue-50/60 dark:hover:bg-zinc-800/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7">
                      {entry.users?.avatar_url && <AvatarImage src={entry.users.avatar_url} alt={entry.users.full_name} />}
                      <AvatarFallback className="text-[10px]">{getInitials(entry.users?.full_name ?? '?')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-zinc-900 dark:text-zinc-100 font-medium">{entry.users?.full_name ?? 'Empleado'}</p>
                      <p className="text-xs text-zinc-500">{entry.users?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={entry.type === 'entry' ? 'success' : 'destructive'}>
                    {entry.type === 'entry'
                      ? <><LogIn className="h-3 w-3" /> Entrada</>
                      : <><LogOut className="h-3 w-3" /> Salida</>
                    }
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-zinc-400">{formatDateTime(entry.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setEditEntry(entry)}
                      className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-400 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={deletingId === entry.id}
                      className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/40 text-gray-400 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-40"
                      title="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="py-12 text-center text-sm text-zinc-500">Sin registros para los filtros seleccionados</div>
        )}
      </div>

      <EntryFormModal
        open={!!editEntry}
        entry={editEntry}
        employees={employees}
        onClose={() => setEditEntry(null)}
        onSaved={handleSaved}
      />
      <EntryFormModal
        open={showNewModal}
        employees={employees}
        onClose={() => setShowNewModal(false)}
        onSaved={handleSaved}
      />
    </div>
  )
}
