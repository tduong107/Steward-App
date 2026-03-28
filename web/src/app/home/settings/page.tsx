'use client'

import { useCallback, useRef, useState } from 'react'
import { LogOut, Sun, Moon, Monitor, Bell, Mail, MessageSquare, CreditCard } from 'lucide-react'
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
import { Dialog } from '@/components/ui/dialog'
import { PaywallDialog } from '@/components/paywall-dialog'

type Theme = 'light' | 'dark' | 'system'

const themeOptions: { label: string; value: Theme; icon: typeof Sun }[] = [
  { label: 'Light', value: 'light', icon: Sun },
  { label: 'Dark', value: 'dark', icon: Moon },
  { label: 'System', value: 'system', icon: Monitor },
]

function isValidEmail(email: string): boolean {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  return phone.startsWith('+') && digits.length >= 10
}

export default function SettingsPage() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const { tier } = useSub()
  const { theme, setTheme } = useTheme()
  const supabaseRef = useRef(createClient())

  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  const [pushEnabled, setPushEnabled] = useState(false)
  const [emailNotif, setEmailNotif] = useState(profile?.email_alerts ?? true)
  const [smsNotif, setSmsNotif] = useState(profile?.sms_alerts ?? false)

  // Email entry dialog
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)

  // Phone entry dialog
  const [showPhoneDialog, setShowPhoneDialog] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')
  const [phoneSaving, setPhoneSaving] = useState(false)

  const [paywallOpen, setPaywallOpen] = useState(false)

  // Effective contact info (matches iOS effectiveEmail/effectivePhone)
  const effectiveEmail = profile?.notification_email || user?.email || null
  const effectivePhone = profile?.phone_number || null

  // Persist notification preferences to DB
  const updateNotifPref = useCallback(async (field: string, value: boolean) => {
    if (!user) return
    try {
      await supabaseRef.current
        .from('profiles')
        .update({ [field]: value })
        .eq('id', user.id)
    } catch (err) {
      console.error(`Failed to update ${field}:`, err)
    }
  }, [user])

  // Handle email toggle — show dialog if no email on file
  const handleToggleEmail = useCallback(() => {
    if (emailNotif) {
      // Turning off — just disable
      setEmailNotif(false)
      updateNotifPref('email_alerts', false)
      return
    }

    if (effectiveEmail) {
      // Has email — just enable
      setEmailNotif(true)
      updateNotifPref('email_alerts', true)
    } else {
      // No email — show entry dialog
      setEmailInput('')
      setShowEmailDialog(true)
    }
  }, [emailNotif, effectiveEmail, updateNotifPref])

  // Handle SMS toggle — show dialog if no phone on file
  const handleToggleSMS = useCallback(() => {
    if (smsNotif) {
      // Turning off — just disable
      setSmsNotif(false)
      updateNotifPref('sms_alerts', false)
      return
    }

    if (effectivePhone) {
      // Has phone — just enable
      setSmsNotif(true)
      updateNotifPref('sms_alerts', true)
    } else {
      // No phone — show entry dialog
      setPhoneInput('')
      setShowPhoneDialog(true)
    }
  }, [smsNotif, effectivePhone, updateNotifPref])

  // Save email and enable notifications
  const handleSaveEmail = useCallback(async () => {
    if (!user || !isValidEmail(emailInput)) return
    setEmailSaving(true)
    try {
      await supabaseRef.current
        .from('profiles')
        .update({ notification_email: emailInput, email_alerts: true })
        .eq('id', user.id)
      setEmailNotif(true)
      setShowEmailDialog(false)
      await refreshProfile()
    } catch (err) {
      console.error('Failed to save email:', err)
    } finally {
      setEmailSaving(false)
    }
  }, [user, emailInput, refreshProfile])

  // Save phone and enable SMS
  const handleSavePhone = useCallback(async () => {
    if (!user || !isValidPhone(phoneInput)) return
    setPhoneSaving(true)
    try {
      await supabaseRef.current
        .from('profiles')
        .update({ phone_number: phoneInput, sms_alerts: true })
        .eq('id', user.id)
      setSmsNotif(true)
      setShowPhoneDialog(false)
      await refreshProfile()
    } catch (err) {
      console.error('Failed to save phone:', err)
    } finally {
      setPhoneSaving(false)
    }
  }, [user, phoneInput, refreshProfile])

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
  const { source } = useSub()
  const [subMessage, setSubMessage] = useState<string | null>(null)

  const handleManageSubscription = useCallback(async () => {
    if (tier === 'free') {
      setPaywallOpen(true)
      return
    }

    if (source === 'apple') {
      setSubMessage(
        'Your subscription is managed through the App Store. To change or cancel your plan, go to Settings → Apple ID → Subscriptions on your iPhone.'
      )
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
      } else {
        setSubMessage(data.error || 'Unable to open subscription management. Please try again.')
      }
    } catch (err) {
      console.error('Failed to open portal:', err)
      setSubMessage('Unable to open subscription management. Please try again.')
    }
  }, [tier, source])

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
              <div className="flex items-center gap-2">
                <Badge variant={tier === 'free' ? 'secondary' : 'default'}>
                  {tierLabel(tier)}
                </Badge>
                {source !== 'none' && tier !== 'free' && (
                  <span className="text-[10px] text-[var(--color-ink-light)]">
                    via {source === 'apple' ? 'App Store' : 'Stripe'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleManageSubscription}
          >
            {tier === 'free'
              ? 'Upgrade Plan'
              : source === 'apple'
                ? 'View Plan'
                : 'Manage Subscription'}
          </Button>
          {subMessage && (
            <div className="rounded-[var(--radius-md)] bg-amber-500/10 border border-amber-500/20 p-3">
              <p className="text-xs text-amber-600 dark:text-amber-400">{subMessage}</p>
            </div>
          )}
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
                  {effectiveEmail
                    ? effectiveEmail
                    : 'Add an email for alerts'}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={emailNotif}
              onClick={handleToggleEmail}
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

          {/* SMS notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-[var(--color-ink-mid)]" />
              <div>
                <p className="text-sm font-medium text-[var(--color-ink)]">
                  SMS Notifications
                </p>
                <p className="text-xs text-[var(--color-ink-mid)]">
                  {effectivePhone
                    ? effectivePhone
                    : 'Add a phone number for texts'}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={smsNotif}
              onClick={handleToggleSMS}
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
                smsNotif
                  ? 'bg-[var(--color-accent)]'
                  : 'bg-[var(--color-border)]',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
                  smsNotif && 'translate-x-5',
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

      {/* Email entry dialog */}
      <Dialog open={showEmailDialog} onClose={() => setShowEmailDialog(false)}>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold font-[var(--font-serif)] text-[var(--color-ink)]">
              Add your email
            </h3>
            <p className="mt-1 text-sm text-[var(--color-ink-mid)]">
              We&apos;ll send watch alerts to this email address.
            </p>
          </div>

          <Input
            label="Email address"
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="you@example.com"
          />

          <Button
            className="w-full"
            disabled={!isValidEmail(emailInput) || emailSaving}
            onClick={handleSaveEmail}
          >
            {emailSaving ? 'Saving...' : 'Save & enable email alerts'}
          </Button>

          <p className="text-[11px] text-[var(--color-ink-light)] leading-relaxed">
            By saving, you agree to receive watch alert emails from Steward.
            You can turn this off anytime in Settings.
          </p>
        </div>
      </Dialog>

      {/* Phone entry dialog */}
      <Dialog open={showPhoneDialog} onClose={() => setShowPhoneDialog(false)}>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold font-[var(--font-serif)] text-[var(--color-ink)]">
              Add your phone number
            </h3>
            <p className="mt-1 text-sm text-[var(--color-ink-mid)]">
              We&apos;ll send SMS alerts when your watches trigger.
            </p>
          </div>

          <Input
            label="Phone number"
            type="tel"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="+1 (555) 000-0000"
          />

          <Button
            className="w-full"
            disabled={!isValidPhone(phoneInput) || phoneSaving}
            onClick={handleSavePhone}
          >
            {phoneSaving ? 'Saving...' : 'Agree & enable SMS alerts'}
          </Button>

          <p className="text-[11px] text-[var(--color-ink-light)] leading-relaxed">
            By tapping &quot;Agree &amp; enable SMS alerts&quot; you consent to receive
            automated text messages from Steward at this number. Message frequency
            varies based on your watches. Msg &amp; data rates may apply. Reply STOP
            to cancel anytime.
          </p>
        </div>
      </Dialog>
    </div>
  )
}
