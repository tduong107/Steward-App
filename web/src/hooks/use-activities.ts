'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Activity } from '@/lib/types'
import { useAuth } from '@/hooks/use-auth'

export function useActivities() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef(createClient())

  // Fetch activities
  useEffect(() => {
    if (!user) {
      setActivities([])
      setLoading(false)
      return
    }

    const fetchActivities = async () => {
      setLoading(true)

      const { data, error } = await supabaseRef.current
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Failed to fetch activities:', error.message)
      } else {
        setActivities((data as Activity[]) ?? [])
      }

      setLoading(false)
    }

    fetchActivities()
  }, [user])

  // Realtime subscription
  useEffect(() => {
    if (!user) return

    const supabase = supabaseRef.current
    const channel = supabase
      .channel(`activities:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newActivity = payload.new as Activity
          setActivities((prev) => [newActivity, ...prev].slice(0, 100))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  return { activities, loading }
}
