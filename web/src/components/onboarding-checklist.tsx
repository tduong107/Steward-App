'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, ChevronRight, X, Sparkles, Bell, Smartphone, Eye, PartyPopper } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useWatches } from '@/hooks/use-watches'
import { useChatDrawer } from '@/providers/chat-provider'

interface ChecklistStep {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  done: boolean
  action?: () => void
  recommended?: boolean
}

export function OnboardingChecklist() {
  const { user, profile, refreshProfile } = useAuth()
  const { watches } = useWatches()
  const { openChat } = useChatDrawer()

  // Persistent state in localStorage
  const [dismissed, setDismissed] = useState(true) // start hidden, show after check
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationText, setCelebrationText] = useState('')
  const [showPhoneInput, setShowPhoneInput] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')
  const [isSavingPhone, setIsSavingPhone] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  // Load state from localStorage
  useEffect(() => {
    if (!user) return
    const key = `steward_onboarding_${user.id}`
    const stored = localStorage.getItem(key)
    if (stored) {
      const data = JSON.parse(stored)
      if (data.dismissed) {
        setDismissed(true)
        return
      }
      setCompletedSteps(new Set(data.completed || []))
    }
    setDismissed(false)
  }, [user])

  // Save state to localStorage
  const saveState = (completed: Set<string>, isDismissed: boolean) => {
    if (!user) return
    const key = `steward_onboarding_${user.id}`
    localStorage.setItem(key, JSON.stringify({
      completed: Array.from(completed),
      dismissed: isDismissed,
    }))
  }

  // Auto-complete steps based on actual state
  useEffect(() => {
    if (dismissed || !user) return
    const newCompleted = new Set(completedSteps)
    let changed = false

    // Account created — always done
    if (!newCompleted.has('account')) {
      newCompleted.add('account')
      changed = true
    }

    // First watch — check if user has any watches
    const activeWatches = watches.filter(w => w.status !== 'deleted')
    if (!newCompleted.has('first_watch') && activeWatches.length > 0) {
      newCompleted.add('first_watch')
      changed = true
      // Show celebration
      setCelebrationText('First watch created! 🎉')
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
    }

    // Notifications — check if browser push is enabled
    if (!newCompleted.has('notifications') && 'Notification' in window && Notification.permission === 'granted') {
      newCompleted.add('notifications')
      changed = true
    }

    // Phone — check profile
    if (!newCompleted.has('phone') && profile?.phone_number) {
      newCompleted.add('phone')
      changed = true
    }

    if (changed) {
      setCompletedSteps(newCompleted)
      saveState(newCompleted, false)

      // Auto-dismiss after all steps complete
      if (newCompleted.size >= 4) {
        setCelebrationText("You're all set! 🎊")
        setShowCelebration(true)
        setTimeout(() => {
          setShowCelebration(false)
          handleDismiss()
        }, 3500)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watches, user, profile, dismissed])

  const markComplete = (stepId: string) => {
    const newCompleted = new Set(completedSteps)
    newCompleted.add(stepId)
    setCompletedSteps(newCompleted)
    saveState(newCompleted, false)
  }

  const handleDismiss = () => {
    setDismissed(true)
    saveState(completedSteps, true)
  }

  const handleNotifications = async () => {
    if (!('Notification' in window)) return
    const perm = await Notification.requestPermission()
    if (perm === 'granted') {
      markComplete('notifications')
      setCelebrationText('Notifications enabled! 🔔')
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
    }
  }

  const handleSavePhone = async () => {
    if (!phoneInput.trim() || !user) return
    setIsSavingPhone(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const fullPhone = phoneInput.startsWith('+') ? phoneInput : `+1${phoneInput.replace(/\D/g, '')}`
      await supabase
        .from('profiles')
        .update({ phone_number: fullPhone, sms_alerts: true })
        .eq('id', user.id)
      await refreshProfile()
      markComplete('phone')
      setShowPhoneInput(false)
      setCelebrationText('SMS alerts activated! 📱')
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
    } catch (e) {
      console.error('Failed to save phone:', e)
    } finally {
      setIsSavingPhone(false)
    }
  }

  if (dismissed || !user) return null

  const completedCount = completedSteps.size
  const totalSteps = 4

  const steps: ChecklistStep[] = [
    {
      id: 'account',
      title: 'Account created',
      subtitle: "You're signed in and ready",
      icon: <Sparkles size={16} />,
      done: completedSteps.has('account'),
    },
    {
      id: 'first_watch',
      title: 'Create your first watch',
      subtitle: 'Tell Steward what to monitor',
      icon: <Eye size={16} />,
      done: completedSteps.has('first_watch'),
      action: () => openChat(),
    },
    {
      id: 'notifications',
      title: 'Enable notifications',
      subtitle: completedSteps.has('notifications') ? 'Push alerts are on' : 'Get alerted when things change',
      icon: <Bell size={16} />,
      done: completedSteps.has('notifications'),
      action: handleNotifications,
    },
    {
      id: 'phone',
      title: 'Add your phone number',
      subtitle: completedSteps.has('phone') ? 'SMS alerts enabled' : 'SMS is the fastest way to get alerts',
      icon: <Smartphone size={16} />,
      done: completedSteps.has('phone'),
      recommended: true,
      action: () => setShowPhoneInput(true),
    },
  ]

  return (
    <div className="relative animate-fade-in-up [animation-delay:50ms]">
      {/* Celebration Toast */}
      {showCelebration && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white shadow-lg animate-bounce-in">
          <PartyPopper size={16} />
          {celebrationText}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[var(--color-accent-mid)]/30 bg-gradient-to-br from-[#0F2018] to-[#1C3D2E] shadow-xl">
        {/* Header */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center gap-3 px-5 py-4 text-left cursor-pointer"
        >
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[#F7F6F3] font-[var(--font-serif)]">
              Getting Started
            </h3>
            {!isExpanded && (
              <p className="text-[11px] text-[#F7F6F3]/50 mt-0.5">
                {completedCount} of {totalSteps} complete
              </p>
            )}
          </div>

          {/* Progress pill */}
          <span className="rounded-full bg-[#6EE7B7]/12 px-2.5 py-1 text-[11px] font-semibold text-[#6EE7B7]">
            {completedCount}/{totalSteps}
          </span>

          {/* Skip / Collapse */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleDismiss() }}
            className="text-[11px] font-medium text-[#F7F6F3]/35 hover:text-[#F7F6F3]/60 transition-colors ml-1"
          >
            Skip
          </button>
        </button>

        {/* Expandable body */}
        {isExpanded && (
          <div className="px-3 pb-4 space-y-1.5">
            {steps.map((step) => (
              <div key={step.id}>
                <button
                  type="button"
                  onClick={() => !step.done && step.action?.()}
                  disabled={step.done || !step.action}
                  className={`group flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-left transition-all duration-200 ${
                    step.done
                      ? 'bg-white/[0.02]'
                      : 'bg-white/[0.04] hover:bg-white/[0.07] cursor-pointer'
                  }`}
                >
                  {/* Check circle */}
                  <div className="shrink-0">
                    {step.done ? (
                      <CheckCircle2 size={22} className="text-[#6EE7B7] transition-transform duration-300" strokeWidth={2.5} />
                    ) : (
                      <Circle size={22} className="text-[#6EE7B7]/40" strokeWidth={2} />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[13px] font-medium transition-all duration-200 ${
                        step.done ? 'text-[#F7F6F3]/45 line-through decoration-[#F7F6F3]/25' : 'text-[#F7F6F3]'
                      }`}>
                        {step.title}
                      </span>
                      {step.recommended && !step.done && (
                        <span className="rounded-full bg-amber-500 px-1.5 py-[1px] text-[9px] font-bold text-[#0F2018]">
                          Recommended
                        </span>
                      )}
                    </div>
                    <span className={`text-[11px] ${step.done ? 'text-[#F7F6F3]/25' : 'text-[#F7F6F3]/50'}`}>
                      {step.subtitle}
                    </span>
                  </div>

                  {/* Chevron */}
                  {!step.done && step.action && (
                    <ChevronRight size={14} className="shrink-0 text-[#6EE7B7]/40 group-hover:text-[#6EE7B7]/70 transition-colors" />
                  )}
                </button>

                {/* Inline phone input */}
                {step.id === 'phone' && showPhoneInput && !step.done && (
                  <div className="mx-4 mt-2 mb-1 space-y-2 animate-fade-in-up">
                    <div className="flex gap-2">
                      <span className="flex items-center rounded-lg bg-[#1C3D2E] px-2.5 text-xs text-[#F7F6F3]/60 font-medium">
                        +1
                      </span>
                      <input
                        type="tel"
                        placeholder="Phone number"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="flex-1 rounded-lg bg-[#1C3D2E] px-3 py-2 text-sm text-[#F7F6F3] placeholder:text-[#F7F6F3]/30 outline-none focus:ring-1 focus:ring-[#6EE7B7]/40"
                      />
                      <button
                        type="button"
                        onClick={handleSavePhone}
                        disabled={!phoneInput.trim() || isSavingPhone}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6EE7B7] text-[#0F2018] transition-opacity disabled:opacity-40"
                      >
                        {isSavingPhone ? (
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0F2018] border-t-transparent" />
                        ) : (
                          <CheckCircle2 size={16} strokeWidth={2.5} />
                        )}
                      </button>
                    </div>
                    <p className="flex items-center gap-1 text-[10px] text-[#F7F6F3]/35">
                      <Sparkles size={10} className="text-amber-500" />
                      SMS alerts reach you even when you&apos;re away from notifications
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
