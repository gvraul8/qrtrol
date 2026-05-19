'use client'

import { useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Search, FileDown, LogIn, LogOut, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmployeeFormModal } from '@/components/admin/EmployeeFormModal'
import { EmployeeDownloadModal } from '@/components/admin/EmployeeDownloadModal'
import { getInitials, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { UserProfile } from '@/types/auth.types'
import type { TimeEntry } from '@/types/time-entry.types'

interface Props {
  initialEmployees: UserProfile[]
  companyId: string
  initialEntries: TimeEntry[]
}

export function EmployeesPageClient({ initialEmployees, companyId, initialEntries }: Props) {
  // ── Employees tab ─────────────────────────────────────────────────────────
  const [employees, setEmployees] = useState(initialEmployees)
  const [empSearch, setEmpSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<UserProfile | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [downloadTarget, setDownloadTarget] = useState<UserProfile | null>(null)

  const filteredEmployees = employees.filter((e) =>
    e.full_name.toLowerCase().includes(empSearch.toLowerCase()) ||
    e.email.toLowerCase().includes(empSearch.toLowerCase())
  )

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/employees?company_id=${companyId}`)
    const data = await res.json()
    setEmployees(data.employees ?? [])
  }, [companyId])

  const handleDelete = async (id: string) => {
    setDeleting(id)
    const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Empleado eliminado')
      setEmployees((prev) => prev.filter((e) => e.id !== id))
    } else {
      toast.error('Error al eliminar empleado')
    }
    setDeleting(null)
  }

  // ── Hours tab ─────────────────────────────────────────────────────────────
  const [entries, setEntries] = useState(initialEntries ?? [])
  const [hoursSearch, setHoursSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [exporting, setExporting] = useState(false)

  const filteredEntries = entries.filter((e) => {
    const name = (e.users?.full_name ?? '').toLowerCase()
    const email = (e.users?.email ?? '').toLowerCase()
    return name.includes(hoursSearch.toLowerCase()) || email.includes(hoursSearch.toLowerCase())
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
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Empleados</h1>
        <p className="text-sm text-zinc-500">{employees.length} en plantilla</p>
      </div>

      <Tabs defaultValue="gestion">
        <TabsList className="mb-4">
          <TabsTrigger value="gestion">Gestión</TabsTrigger>
          <TabsTrigger value="horas">Horas e informes</TabsTrigger>
        </TabsList>

        {/* ── Gestión tab ───────────────────────────────────────────────── */}
        <TabsContent value="gestion" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Buscar por nombre o email…"
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => { setEditing(null); setModalOpen(true) }} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              Nuevo
            </Button>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Empleado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide hidden sm:table-cell">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Rol</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp, i) => (
                  <motion.tr
                    key={emp.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-gray-100 dark:border-zinc-800 hover:bg-blue-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {emp.avatar_url && <AvatarImage src={emp.avatar_url} alt={emp.full_name} />}
                          <AvatarFallback className="text-xs">{getInitials(emp.full_name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{emp.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-zinc-400 hidden sm:table-cell">{emp.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={emp.role === 'admin' ? 'blue' : 'default'}>
                        {emp.role === 'admin' ? 'Admin' : 'Empleado'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDownloadTarget(emp)}
                          className="h-8 w-8 p-0 text-gray-400 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400"
                          title="Descargar fichajes"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditing(emp); setModalOpen(true) }}
                          className="h-8 w-8 p-0 text-gray-400 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(emp.id)}
                          disabled={deleting === emp.id}
                          className="h-8 w-8 p-0 text-gray-400 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {!filteredEmployees.length && (
              <div className="py-12 text-center text-sm text-zinc-500">
                {empSearch ? 'Sin resultados' : 'Sin empleados. Crea el primero.'}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Horas tab ─────────────────────────────────────────────────── */}
        <TabsContent value="horas" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-zinc-500">{filteredEntries.length} registros</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('excel')} disabled={exporting} className="gap-1.5">
                <FileDown className="h-3.5 w-3.5" /> Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} disabled={exporting} className="gap-1.5">
                <FileDown className="h-3.5 w-3.5" /> PDF
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Buscar empleado…"
                value={hoursSearch}
                onChange={(e) => setHoursSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
            <Button onClick={handleFilter} size="sm">Filtrar</Button>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Empleado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Fecha y hora</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, i) => (
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
                      <Badge variant={entry.type === 'entry' ? 'success' : 'secondary'}>
                        {entry.type === 'entry'
                          ? <><LogIn className="h-3 w-3 mr-1" />Entrada</>
                          : <><LogOut className="h-3 w-3 mr-1" />Salida</>
                        }
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-zinc-400">{formatDateTime(entry.created_at)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {!filteredEntries.length && (
              <div className="py-12 text-center text-sm text-zinc-500">Sin registros para los filtros seleccionados</div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <EmployeeFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={refresh}
        employee={editing}
      />

      <EmployeeDownloadModal
        employee={downloadTarget}
        allEntries={entries}
        onClose={() => setDownloadTarget(null)}
      />
    </div>
  )
}
