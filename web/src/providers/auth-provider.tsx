'use client'

import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Failed to fetch profile:', error.message)
        setProfile(null)
      } else {
        setProfile(data as Profile)
      }
    },
    [supabase]
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }, [supabase])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchProfile(currentUser.id)
      }
      setLoading(false)
    })

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        fetchProfile(currentUser.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
