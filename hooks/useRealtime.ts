'use client'

import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TimeEntry } from '@/types/time-entry.types'

export function useRealtimeEntries(
  companyId: string,
  onInsert: (entry: TimeEntry) => void
) {
  const supabase = createClient()
  const stableOnInsert = useCallback(onInsert, [onInsert])

  useEffect(() => {
    const channel = supabase
      .channel(`time_entries:company:${companyId}`)
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
  }, [companyId, stableOnInsert, supabase])
}
