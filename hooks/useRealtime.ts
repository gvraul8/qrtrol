'use client'

import { useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TimeEntry } from '@/types/time-entry.types'

export function useRealtimeEntries(
  companyId: string,
  onInsert: (entry: TimeEntry) => void
) {
  const supabaseRef = useRef(createClient())
  const mountKeyRef = useRef(0)
  const stableOnInsert = useCallback(onInsert, [onInsert])

  useEffect(() => {
    const supabase = supabaseRef.current
    const key = ++mountKeyRef.current
    const channel = supabase
      .channel(`time_entries:company:${companyId}:${key}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'time_entries',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => stableOnInsert(payload.new as TimeEntry)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [companyId, stableOnInsert])
}
