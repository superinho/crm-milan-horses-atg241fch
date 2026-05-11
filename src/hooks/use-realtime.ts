import { useEffect, useRef } from 'react'
import supabase from '@/lib/supabase/client'

type RealtimePayload<TRecord = any> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: TRecord
  old: Partial<TRecord>
}

export function useRealtime<TRecord = any>(
  tableName: string,
  callback: (data: RealtimePayload<TRecord>) => void,
  enabled: boolean = true,
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return

    const channel = supabase
      .channel(`public:${tableName}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
        },
        (payload) => {
          callbackRef.current(payload as RealtimePayload<TRecord>)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tableName, enabled])
}

export default useRealtime
