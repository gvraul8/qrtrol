'use client'

import { motion } from 'framer-motion'
import { LogIn, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getInitials, formatDateTime } from '@/lib/utils'
import type { TimeEntry } from '@/types/time-entry.types'

interface Props {
  entries: TimeEntry[]
}

export function RecentActivity({ entries }: Props) {
  if (!entries.length) {
    return <p className="text-sm text-zinc-500 py-4 text-center">Sin actividad reciente</p>
  }

  return (
    <ul className="space-y-3">
      {entries.map((entry, i) => (
        <motion.li
          key={entry.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex items-center gap-3"
        >
          <Avatar className="h-8 w-8 shrink-0">
            {entry.users?.avatar_url && <AvatarImage src={entry.users.avatar_url} alt={entry.users.full_name} />}
            <AvatarFallback className="text-[10px]">
              {getInitials(entry.users?.full_name ?? '?')}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {entry.users?.full_name ?? 'Empleado'}
            </p>
            <p className="text-xs text-zinc-500">{formatDateTime(entry.created_at)}</p>
          </div>

          <Badge variant={entry.type === 'entry' ? 'success' : 'secondary'}>
            {entry.type === 'entry'
              ? <><LogIn className="h-3 w-3" /> Entrada</>
              : <><LogOut className="h-3 w-3" /> Salida</>
            }
          </Badge>
        </motion.li>
      ))}
    </ul>
  )
}
