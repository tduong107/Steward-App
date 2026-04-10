'use client'

import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import posthog from 'posthog-js'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef(createClient())
  const mountedRef = useRef(true)

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data, error } = await supabaseRef.current
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // Only update state if still mounted
      if (!mountedRef.current) return

      if (error) {
        console.error('Failed to fetch profile:', error.message)
        setProfile(null)
      } else {
        setProfile(data as Profile)
      }
    },
    []
  )

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  const signOut = useCallback(async () => {
    posthog.reset()
    await supabaseRef.current.auth.signOut()
    setUser(null)
    setProfile(null)
    sessionStorage.removeItem('steward_animation_shown')
    router.push('/')
  }, [router])

  useEffect(() => {
    mountedRef.current = true
    const supabase = supabaseRef.current

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mountedRef.current) return
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) fetchProfile(currentUser.id)
      setLoading(false)
    })

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchProfile(currentUser.id)
        // Identify user in PostHog on sign-in events
        if (event === 'SIGNED_IN') {
          posthog.identify(currentUser.id, {
            email: currentUser.email,
            phone: currentUser.phone,
          })
        }
      } else {
        setProfile(null)
      }
    })

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
