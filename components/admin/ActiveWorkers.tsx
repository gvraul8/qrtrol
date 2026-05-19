'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Users, Clock } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useRealtimeEntries } from '@/hooks/useRealtime'
import { getInitials, formatDuration } from '@/lib/utils'
import type { ActiveWorker } from '@/types/time-entry.types'

interface Props {
  companyId: string
  initialWorkers?: ActiveWorker[]
}

export function ActiveWorkers({ companyId, initialWorkers = [] }: Props) {
  const router = useRouter()
  const [workers, setWorkers] = useState<ActiveWorker[]>(initialWorkers)
  const [loading, setLoading] = useState(!initialWorkers.length)

  const fetchWorkers = useCallback(() => {
    fetch(`/api/employees/active?company_id=${companyId}`)
      .then((r) => r.json())
      .then((d) => setWorkers(d.workers ?? []))
      .catch(() => {})
  }, [companyId])

  useEffect(() => {
    if (initialWorkers.length) return
    fetch(`/api/employees/active?company_id=${companyId}`)
      .then((r) => r.json())
      .then((d) => setWorkers(d.workers ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [companyId, initialWorkers.length])

  // Sync whenever the server refreshes (router.refresh) and sends new initialWorkers
  useEffect(() => {
    setWorkers(initialWorkers)
    setLoading(false)
  }, [initialWorkers])

  // Stable callback so the realtime subscription never re-subscribes unnecessarily
  const handleNewEntry = useCallback(() => {
    fetchWorkers()
    router.refresh()
  }, [fetchWorkers, router])

  useRealtimeEntries(companyId, handleNewEntry)

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-2.5 w-20" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!workers.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-zinc-500">
        <Users className="h-8 w-8 text-zinc-400 dark:text-zinc-700" />
        <p className="text-sm">Sin empleados activos ahora</p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {workers.map((w, i) => (
        <motion.li
          key={w.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-3"
        >
          <div className="relative">
            <Avatar className="h-9 w-9">
              {w.avatar_url && <AvatarImage src={w.avatar_url} alt={w.full_name} />}
              <AvatarFallback className="text-xs">{getInitials(w.full_name)}</AvatarFallback>
            </Avatar>
            {/* Green dot */}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{w.full_name}</p>
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(Math.floor((Date.now() - new Date(w.checked_in_at).getTime()) / 60000))}
            </p>
          </div>
        </motion.li>
      ))}
    </ul>
  )
}
