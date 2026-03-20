'use client'

import { useCallback, useRef, useState } from 'react'
import { LogOut, Sun, Moon, Monitor, Bell, Mail, CreditCard } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useSub } from '@/hooks/use-subscription'
import { useTheme } from '@/providers/theme-provider'
import { createClient } from '@/lib/supabase/client'
import { tierLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { PaywallDialog } from '@/components/paywall-dialog'

type Theme = 'light' | 'dark' | 'system'

const themeOptions: { label: string; value: Theme; icon: typeof Sun }[] = [
  { label: 'Light', value: 'light', icon: Sun },
  { label: 'Dark', value: 'dark', icon: Moon },
  { label: 'System', value: 'system', icon: Monitor },
]

export default function SettingsPage() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const { tier } = useSub()
  const { theme, setTheme } = useTheme()
  const supabaseRef = useRef(createClient())

  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  const [pushEnabled, setPushEnabled] = useState(false)
  const [emailNotif, setEmailNotif] = useState(true)

  const [paywallOpen, setPaywallOpen] = useState(false)

  // Save profile
  const handleSaveProfile = useCallback(async () => {
    if (!user) return
    setProfileSaving(true)
    try {
      const { error } = await supabaseRef.current
        .from('profiles')
        .upsert({ id: user.id, display_name: displayName })
      if (error) throw error
      await refreshProfile()
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
    } catch (err) {
      console.error('Failed to save profile:', err)
    } finally {
      setProfileSaving(false)
    }
  }, [user, displayName])

  // Request push notifications
  const handleTogglePush = useCallback(async () => {
    if (pushEnabled) {
      setPushEnabled(false)
      return
    }

    if (!('Notification' in window)) {
      alert('This browser does not support push notifications.')
      return
    }

    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      setPushEnabled(true)
    }
  }, [pushEnabled])

  // Manage subscription
  const handleManageSubscription = useCallback(async () => {
    if (tier === 'free') {
      setPaywallOpen(true)
      return
    }

    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Failed to open portal:', err)
      setPaywallOpen(true)
    }
  }, [tier])

  return (
    <div className="space-y-6">
      {/* Title */}
      <h2 className="text-2xl font-semibold font-[var(--font-serif)] text-[var(--color-ink)]">
        Settings
      </h2>

      {/* Profile section */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">Profile</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-ink)]">
              Email
            </label>
            <input
              readOnly
              value={user?.email || ''}
              className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-deep)] px-3 text-sm text-[var(--color-ink-mid)] cursor-not-allowed"
            />
          </div>
          <Button
            size="sm"
            onClick={handleSaveProfile}
            disabled={profileSaving}
          >
            {profileSaved ? 'Saved!' : profileSaving ? 'Saving...' : 'Save'}
          </Button>
        </CardContent>
      </Card>

      {/* Appearance section */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">Appearance</h3>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {themeOptions.map((opt) => {
              const Icon = opt.icon
              const isActive = theme === opt.value

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-2 rounded-[var(--radius-md)] border p-3 transition-colors duration-150',
                    isActive
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]'
                      : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-deep)]',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      isActive
                        ? 'text-[var(--color-accent)]'
                        : 'text-[var(--color-ink-mid)]',
                    )}
                  />
                  <span
                    className={cn(
                      'text-xs font-medium',
                      isActive
                        ? 'text-[var(--color-accent)]'
                        : 'text-[var(--color-ink-mid)]',
                    )}
                  >
                    {opt.label}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Subscription section */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">Subscription</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-[var(--color-ink-mid)]" />
            <div>
              <p className="text-sm font-medium text-[var(--color-ink)]">
                Current plan
              </p>
              <Badge variant={tier === 'free' ? 'secondary' : 'default'}>
                {tierLabel(tier)}
              </Badge>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleManageSubscription}
          >
            {tier === 'free' ? 'Upgrade Plan' : 'Manage Subscription'}
          </Button>
        </CardContent>
      </Card>

      {/* Notifications section */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">Notifications</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Browser push */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-[var(--color-ink-mid)]" />
              <div>
                <p className="text-sm font-medium text-[var(--color-ink)]">
                  Browser Notifications
                </p>
                <p className="text-xs text-[var(--color-ink-mid)]">
                  Get notified in this browser
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={pushEnabled}
              onClick={handleTogglePush}
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
                pushEnabled
                  ? 'bg-[var(--color-accent)]'
                  : 'bg-[var(--color-border)]',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
                  pushEnabled && 'translate-x-5',
                )}
              />
            </button>
          </div>

          {/* Email notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-[var(--color-ink-mid)]" />
              <div>
                <p className="text-sm font-medium text-[var(--color-ink)]">
                  Email Notifications
                </p>
                <p className="text-xs text-[var(--color-ink-mid)]">
                  Receive alerts via email
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={emailNotif}
              onClick={() => setEmailNotif(!emailNotif)}
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
                emailNotif
                  ? 'bg-[var(--color-accent)]'
                  : 'bg-[var(--color-border)]',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
                  emailNotif && 'translate-x-5',
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Account section */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">Account</h3>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Paywall dialog */}
      <PaywallDialog open={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  )
}
