'use client'

import { useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TimeEntry } from '@/types/time-entry.types'

export function useRealtimeEntries(
  companyId: string,
  onInsert: (entry: TimeEntry) => void
) {
  const supabaseRef = useRef(createClient())
  // Random ID per component instance — avoids name collisions after HMR or remounts
  const instanceId = useRef(Math.random().toString(36).slice(2))
  const stableOnInsert = useCallback(onInsert, [onInsert])

  useEffect(() => {
    const supabase = supabaseRef.current
    const channelName = `te:${companyId}:${instanceId.current}`

    // Remove any stale channel with this name before subscribing
    const stale = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`)
    if (stale) supabase.removeChannel(stale)

    const channel = supabase
      .channel(channelName)
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
