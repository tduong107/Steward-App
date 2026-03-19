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

      const { data: created, error: createError } = await supabaseRef.current
        .from('watches')
        .insert({ ...data, user_id: user.id })
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
