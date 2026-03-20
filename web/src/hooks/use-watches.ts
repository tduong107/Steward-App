'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Watch } from '@/lib/types'
import { useAuth } from '@/hooks/use-auth'

export function useWatches() {
  const { user } = useAuth()
  const [watches, setWatches] = useState<Watch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabaseRef = useRef(createClient())

  const fetchWatches = useCallback(async () => {
    if (!user) {
      setWatches([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabaseRef.current
      .from('watches')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    setWatches((data as Watch[]) ?? [])
    setLoading(false)
  }, [user])

  // Initial fetch
  useEffect(() => {
    fetchWatches()
  }, [fetchWatches])

  // Realtime subscription
  useEffect(() => {
    if (!user) return

    const supabase = supabaseRef.current
    const channel = supabase
      .channel(`watches:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'watches',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newWatch = payload.new as Watch
          if (newWatch.status !== 'deleted') {
            setWatches((prev) => [newWatch, ...prev])
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'watches',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as Watch
          if (updated.status === 'deleted') {
            setWatches((prev) => prev.filter((w) => w.id !== updated.id))
          } else {
            setWatches((prev) =>
              prev.map((w) => (w.id === updated.id ? updated : w))
            )
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'watches',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const deleted = payload.old as { id: string }
          setWatches((prev) => prev.filter((w) => w.id !== deleted.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const createWatch = useCallback(
    async (data: Partial<Watch>): Promise<Watch> => {
      if (!user) throw new Error('Not authenticated')

      // Ensure all required fields have defaults (matches iOS Watch initializer)
      const watchPayload = {
        user_id: user.id,
        emoji: data.emoji || '👀',
        name: data.name || 'New Watch',
        url: data.url || '',
        condition: data.condition || '',
        action_label: data.action_label || 'Notify when changed',
        action_type: data.action_type || 'notify',
        action_url: data.action_url || null,
        status: 'watching' as const,
        triggered: false,
        change_note: null,
        notify_channels: 'push',
        check_frequency: data.check_frequency || 'Daily',
        preferred_check_time: null,
        image_url: data.image_url || null,
        watch_mode: data.watch_mode || 'url',
        search_query: data.search_query || null,
        consecutive_failures: 0,
        last_error: null,
        needs_attention: false,
        auto_act: false,
        spending_limit: null,
        response_mode: 'notify' as const,
        coupon_code: null,
        action_executed: false,
      }

      const { data: created, error: createError } = await supabaseRef.current
        .from('watches')
        .insert(watchPayload)
        .select()
        .single()

      if (createError) throw new Error(createError.message)
      return created as Watch
    },
    [user]
  )

  const updateWatch = useCallback(
    async (id: string, data: Partial<Watch>): Promise<void> => {
      const { error: updateError } = await supabaseRef.current
        .from('watches')
        .update(data)
        .eq('id', id)

      if (updateError) throw new Error(updateError.message)
    },
    []
  )

  const deleteWatch = useCallback(
    async (id: string): Promise<void> => {
      const { error: deleteError } = await supabaseRef.current
        .from('watches')
        .update({ status: 'deleted' as const })
        .eq('id', id)

      if (deleteError) throw new Error(deleteError.message)
    },
    []
  )

  return {
    watches,
    loading,
    error,
    refetch: fetchWatches,
    createWatch,
    updateWatch,
    deleteWatch,
  }
}
