'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ExternalLink,
  Share2,
  Pause,
  Play,
  Trash2,
  Pencil,
  CheckCircle,
  Lock,
  AlertTriangle,
  Eye,
  Copy,
  Clock,
  Zap,
  Bell,
  Mail,
  Smartphone,
  Calendar,
  RefreshCw,
  Target,
  Timer,
  Activity,
  ChevronDown,
  ShieldCheck,
  ShieldAlert,
  ShoppingCart,
  CircleOff,
} from 'lucide-react'
import posthog from 'posthog-js'
import { createClient } from '@/lib/supabase/client'
import { useSub } from '@/hooks/use-subscription'
import { useAuth } from '@/hooks/use-auth'
import { PaywallDialog } from '@/components/paywall-dialog'
import {
  effectiveResponseMode,
  autoActLabelFor,
  autoActSubtitleFor,
  isAutoActFunctional,
  inspectSession,
} from '@/lib/auto-act'
import type { Watch, CheckResult, CheckFrequency, ResponseMode } from '@/lib/types'
import { timeAgo, nextCheckLabel, getDomain, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Dropdown } from '@/components/ui/dropdown'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'
import { PriceHistoryChart } from '@/components/price-history-chart'

/// Minimum subscription tier required for each response mode (matches iOS).
const responseModeRequiredTier: Record<ResponseMode, 'free' | 'pro' | 'premium'> = {
  notify: 'free',
  quickLink: 'pro',
  stewardActs: 'premium',
}

/// Sections the Edit dialog can scroll to / highlight on open. Matches the
/// stat cards that are now tap-to-edit, so clicking a card deep-links into
/// the relevant section.
type EditScrollTarget = 'name' | 'frequency' | 'time' | 'notify' | 'triggered' | null

export default function WatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const watchId = params.id as string
  const supabaseRef = useRef(createClient())
  const { tier } = useSub()
  const { user, profile } = useAuth()

  // Whether the user has email / phone configured anywhere (matches iOS
  // `authManager.effectiveEmail` / `.effectivePhone` which falls back across
  // auth user + profile overrides). If neither is present we hide that row
  // from the Notify Channels picker.
  const hasEmail = Boolean(user?.email || profile?.notification_email)
  const hasPhone = Boolean(user?.phone || profile?.phone_number)

  const [watch, setWatch] = useState<Watch | null>(null)
  const [checkResults, setCheckResults] = useState<CheckResult[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showAllChecks, setShowAllChecks] = useState(false)

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editFrequency, setEditFrequency] = useState('')
  const [editPreferredTime, setEditPreferredTime] = useState('')
  const [editNotifyChannels, setEditNotifyChannels] = useState<string[]>([])
  const [editResponseMode, setEditResponseMode] = useState<ResponseMode>('notify')
  const [editNotifyAnyDrop, setEditNotifyAnyDrop] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editScrollTarget, setEditScrollTarget] = useState<EditScrollTarget>(null)

  // Secondary paywall opened when a user taps a locked response mode.
  const [paywallOpen, setPaywallOpen] = useState(false)

  // Share state
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)

  // When the edit dialog opens with a specific target section, scroll that
  // section into view on the next frame (after the portal has mounted +
  // animated in). We look it up by the data-edit-section attribute so each
  // section stays self-describing.
  useEffect(() => {
    if (!editOpen || !editScrollTarget) return
    const t = requestAnimationFrame(() => {
      const el = document.querySelector(
        `[data-edit-section="${editScrollTarget}"]`,
      ) as HTMLElement | null
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // Brief highlight so the user can see what they tapped jumped them to.
      el.classList.add('wd-edit-section-focus')
      window.setTimeout(() => el.classList.remove('wd-edit-section-focus'), 1400)
    })
    return () => cancelAnimationFrame(t)
  }, [editOpen, editScrollTarget])

  // Fetch watch and check results
  useEffect(() => {
    if (!watchId) return

    const fetchData = async () => {
      setLoading(true)
      const supabase = supabaseRef.current

      const [watchRes, checksRes] = await Promise.all([
        supabase
          .from('watches')
          .select('*')
          .eq('id', watchId)
          .single(),
        supabase
          .from('check_results')
          .select('*')
          .eq('watch_id', watchId)
          .order('checked_at', { ascending: false })
          .limit(50),
      ])

      if (watchRes.data) {
        setWatch(watchRes.data as Watch)
      }
      if (checksRes.data) {
        setCheckResults(checksRes.data as CheckResult[])
      }
      setLoading(false)
    }

    fetchData()
  }, [watchId])

  // Price history data
  const priceHistory = useMemo(() => {
    return checkResults
      .filter((cr) => cr.price != null && cr.price > 0)
      .map((cr) => ({
        date: cr.checked_at,
        price: cr.price as number,
      }))
      .reverse()
  }, [checkResults])

  // Notify channels parsed
  const notifyChannels = useMemo(() => {
    if (!watch?.notify_channels) return []
    try {
      return JSON.parse(watch.notify_channels) as string[]
    } catch {
      return watch.notify_channels.split(',').map((c) => c.trim())
    }
  }, [watch?.notify_channels])

  const handleUpdate = useCallback(
    async (data: Partial<Watch>) => {
      if (!watch) return
      setActionLoading(true)
      try {
        await supabaseRef.current
          .from('watches')
          .update(data)
          .eq('id', watch.id)
        setWatch((prev) => (prev ? { ...prev, ...data } : prev))
      } catch (err) {
        console.error('Update failed:', err)
      } finally {
        setActionLoading(false)
      }
    },
    [watch],
  )

  const handleTogglePause = useCallback(() => {
    if (!watch) return
    const newStatus = watch.status === 'paused' ? 'watching' : 'paused'
    posthog.capture(newStatus === 'paused' ? 'watch_paused' : 'watch_resumed', { watch_id: watch.id, watch_name: watch.name })
    handleUpdate({ status: newStatus })
  }, [watch, handleUpdate])

  const handleDelete = useCallback(async () => {
    if (!watch) return
    setActionLoading(true)
    try {
      await supabaseRef.current
        .from('watches')
        .update({ status: 'deleted' as const })
        .eq('id', watch.id)
      posthog.capture('watch_deleted', { watch_id: watch.id, watch_name: watch.name, action_type: watch.action_type })
      router.push('/home')
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setActionLoading(false)
    }
  }, [watch, router])

  const handleShare = useCallback(async () => {
    if (!watch) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/share-watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchId: watch.id }),
      })
      const data = await res.json()
      if (data.shareUrl) {
        setShareUrl(data.shareUrl)
        posthog.capture('watch_shared', { watch_id: watch.id, watch_name: watch.name })
      }
    } catch (err) {
      console.error('Share failed:', err)
    } finally {
      setActionLoading(false)
    }
  }, [watch])

  const handleCopyShare = useCallback(() => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2000)
  }, [shareUrl])

  /// Parses the stored `notify_channels` value (may be JSON-encoded array,
  /// comma-separated string, or blank) into a deduped array of channel keys.
  const parseChannels = useCallback((raw: string | null | undefined): string[] => {
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map(String)
    } catch {
      /* not JSON — fall through */
    }
    return raw.split(',').map((c) => c.trim()).filter(Boolean)
  }, [])

  const openEditDialog = useCallback(
    (target: EditScrollTarget = null) => {
      if (!watch) return
      setEditName(watch.name)
      setEditFrequency(watch.check_frequency)
      setEditPreferredTime(watch.preferred_check_time || '')
      setEditNotifyChannels(parseChannels(watch.notify_channels))
      // Derive from auto_act first — iOS writes auto_act without touching
      // response_mode, so the stored response_mode can lie for iOS watches.
      setEditResponseMode(effectiveResponseMode(watch))
      setEditNotifyAnyDrop(Boolean(watch.notify_any_price_drop))
      setEditScrollTarget(target)
      setEditOpen(true)
    },
    [watch, parseChannels],
  )

  const handleSaveEdit = useCallback(async () => {
    if (!watch) return

    // Invariant: at least one notify channel must be selected. Fall back to
    // "push" if we somehow end up empty rather than block saving.
    const channels = editNotifyChannels.length > 0 ? editNotifyChannels : ['push']

    setEditSaving(true)
    try {
      const updates: Partial<Watch> = {
        name: editName,
        check_frequency: editFrequency as CheckFrequency,
        // Persist channels as CSV — iOS already stores/parses this shape.
        notify_channels: channels.join(','),
        response_mode: editResponseMode,
        // Sync auto_act alongside response_mode. The check-watch edge
        // function only reads auto_act, so without this write the
        // "Auto Add to Cart" selection would be a no-op on the backend.
        // For non-stewardActs modes we explicitly clear auto_act so the
        // user doesn't end up with both flags contradicting each other
        // (e.g. response_mode='notify' but auto_act=true from an earlier
        // iOS-side toggle).
        auto_act: editResponseMode === 'stewardActs',
      }
      if (editPreferredTime) {
        updates.preferred_check_time = editPreferredTime
      }
      // Only send notify_any_price_drop when it's meaningful for this watch.
      if (watch.action_type === 'price') {
        updates.notify_any_price_drop = editNotifyAnyDrop
      }
      await supabaseRef.current
        .from('watches')
        .update(updates)
        .eq('id', watch.id)
      setWatch((prev) => (prev ? { ...prev, ...updates } : prev))
      setEditOpen(false)
    } catch (err) {
      console.error('Edit save failed:', err)
    } finally {
      setEditSaving(false)
    }
  }, [
    watch,
    editName,
    editFrequency,
    editPreferredTime,
    editNotifyChannels,
    editResponseMode,
    editNotifyAnyDrop,
  ])

  /// Toggle a channel in the local edit state. Enforces the "at least one
  /// selected" invariant on toggle (you can't remove the last channel).
  const toggleChannel = useCallback((channel: string) => {
    setEditNotifyChannels((prev) => {
      if (prev.includes(channel)) {
        // Refuse to remove the last remaining channel.
        if (prev.length === 1) return prev
        return prev.filter((c) => c !== channel)
      }
      return [...prev, channel].sort()
    })
  }, [])

  /// Called when a user taps a locked response mode. Opens the paywall
  /// dialog rather than silently selecting. Matches iOS behavior.
  const selectResponseMode = useCallback(
    (mode: ResponseMode) => {
      const required = responseModeRequiredTier[mode]
      const tierRank = { free: 0, pro: 1, premium: 2 } as const
      const hasAccess = tierRank[tier] >= tierRank[required]
      if (!hasAccess) {
        setPaywallOpen(true)
        return
      }
      setEditResponseMode(mode)
    },
    [tier],
  )

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6 pb-24">
        <Skeleton className="h-8 w-24" />
        <div className="wd-hero-skeleton rounded-[var(--radius-xl)] overflow-hidden">
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-[var(--radius-lg)]" />
      </div>
    )
  }

  // Not found
  if (!watch) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-2xl">🔍</p>
        <p className="mt-2 text-sm text-[var(--color-ink-mid)]">Watch not found</p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => router.push('/home')}
        >
          Go back
        </Button>
      </div>
    )
  }

  // Use auto_act as source of truth when set — iOS writes it without
  // syncing response_mode, so `response_mode` alone can lie about what
  // the watch is actually going to do. The stewardActs label also varies
  // by action_type (Auto Add to Cart / Auto Book / Auto Fill & Submit).
  const displayResponseMode = effectiveResponseMode(watch)
  const stewardActsLabel = autoActLabelFor(watch.action_type) ?? 'Auto Add to Cart'
  const responseModeLabel: Record<string, string> = {
    notify: 'Notify Me',
    quickLink: 'Notify + Quick Link',
    stewardActs: stewardActsLabel,
  }

  const visibleChecks = showAllChecks ? checkResults : checkResults.slice(0, 10)

  return (
    <div className="wd-page space-y-6 pb-28">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.push('/home')}
        className="wd-back-btn inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-mid)] hover:text-[var(--color-ink)] transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back
      </button>

      {/* ===== HERO HEADER ===== */}
      <div className="wd-hero relative overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-[var(--shadow-lg)]" style={{ animationDelay: '0.05s' }}>
        {/* Gradient accent strip at top */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-mint)] to-[var(--color-accent)]" />

        <div className="p-6 pt-8 sm:p-8 sm:pt-10">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Product image / emoji hero */}
            {watch.image_url ? (
              <div className="wd-hero-image relative shrink-0">
                <Image
                  src={watch.image_url}
                  alt={watch.name}
                  width={96}
                  height={96}
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-[var(--radius-lg)] object-cover shadow-[var(--shadow-md)] ring-1 ring-[var(--color-border)]"
                />
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-[var(--color-bg-card)] flex items-center justify-center" style={{ background: watch.status === 'watching' && !watch.triggered ? 'var(--color-accent)' : watch.triggered ? 'var(--color-green)' : watch.status === 'paused' ? 'var(--color-ink-light)' : 'var(--color-gold)' }}>
                  {watch.status === 'watching' && !watch.triggered && <Eye className="h-2.5 w-2.5 text-white" />}
                  {watch.triggered && <CheckCircle className="h-2.5 w-2.5 text-white" />}
                  {watch.status === 'paused' && <Pause className="h-2.5 w-2.5 text-white" />}
                  {watch.needs_attention && !watch.triggered && watch.status !== 'paused' && <AlertTriangle className="h-2.5 w-2.5 text-white" />}
                </div>
              </div>
            ) : (
              <div className="wd-hero-image relative shrink-0">
                <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] ring-1 ring-[var(--color-border)]" style={{ background: 'linear-gradient(135deg, var(--color-accent-light), var(--color-accent-mid))' }}>
                  <span className="text-4xl sm:text-5xl">{watch.emoji || '👀'}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-[var(--color-bg-card)] flex items-center justify-center" style={{ background: watch.status === 'watching' && !watch.triggered ? 'var(--color-accent)' : watch.triggered ? 'var(--color-green)' : watch.status === 'paused' ? 'var(--color-ink-light)' : 'var(--color-gold)' }}>
                  {watch.status === 'watching' && !watch.triggered && <Eye className="h-2.5 w-2.5 text-white" />}
                  {watch.triggered && <CheckCircle className="h-2.5 w-2.5 text-white" />}
                  {watch.status === 'paused' && <Pause className="h-2.5 w-2.5 text-white" />}
                  {watch.needs_attention && !watch.triggered && watch.status !== 'paused' && <AlertTriangle className="h-2.5 w-2.5 text-white" />}
                </div>
              </div>
            )}

            <div className="min-w-0 flex-1">
              {/* Name + badge */}
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-ink)]">
                  {watch.name}
                </h1>
                {watch.triggered && <Badge variant="triggered" className="wd-badge-glow-green">Triggered</Badge>}
                {watch.needs_attention && !watch.triggered && (
                  <Badge variant="warning" className="wd-badge-glow-amber">Needs attention</Badge>
                )}
                {watch.status === 'paused' && (
                  <Badge variant="secondary">Paused</Badge>
                )}
                {watch.status === 'watching' && !watch.triggered && !watch.needs_attention && (
                  <Badge variant="default" className="wd-badge-pulse">Watching</Badge>
                )}
              </div>

              {/* Domain link — uses affiliate action_url when available */}
              <a
                href={watch.action_url || watch.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:underline transition-colors"
              >
                <img
                  src={`https://www.google.com/s2/favicons?domain=${getDomain(watch.url)}&sz=16`}
                  alt=""
                  className="h-4 w-4 rounded-sm"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                {getDomain(watch.url)}
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>

              {/* Quick stats pills */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="wd-pill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--color-bg-deep)] text-[var(--color-ink-mid)] border border-[var(--color-border-subtle)]">
                  <Clock className="h-3 w-3" />
                  {watch.last_checked ? timeAgo(watch.last_checked) : 'Not checked yet'}
                </span>
                <span className="wd-pill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--color-bg-deep)] text-[var(--color-ink-mid)] border border-[var(--color-border-subtle)]">
                  <Timer className="h-3 w-3" />
                  {watch.status === 'paused' ? 'Paused' : `Next: ${nextCheckLabel(watch.last_checked, watch.check_frequency)}`}
                </span>
                <span className="wd-pill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--color-bg-deep)] text-[var(--color-ink-mid)] border border-[var(--color-border-subtle)]">
                  <RefreshCw className="h-3 w-3" />
                  {watch.check_frequency}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== STATUS BANNERS (Glass Cards) ===== */}
      {watch.triggered && (
        <div className="wd-glass-card wd-glass-green relative overflow-hidden rounded-[var(--radius-lg)] p-5 border border-green-200/60" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(110,231,183,0.12))' }}>
          {/* Decorative dots */}
          <div className="absolute top-3 right-3 flex gap-1 opacity-40">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-1.5 w-1.5 rounded-full bg-[var(--color-green)]" style={{ animationDelay: `${i * 0.3}s` }} />
            ))}
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-green)]/15">
              <CheckCircle className="h-5 w-5 text-[var(--color-green)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--color-green)]">
                {watch.change_note || 'Condition triggered'}
              </p>
            </div>
            {watch.action_url && (
              <a
                href={watch.action_url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <Button size="sm">
                  {watch.action_type === 'book' ? 'Open & Reserve'
                    : watch.action_type === 'price' ? 'Open & Buy'
                    : watch.action_type === 'cart' ? 'Open & Add to Cart'
                    : 'View Page'}
                </Button>
              </a>
            )}
          </div>
        </div>
      )}

      {watch.needs_attention && !watch.triggered && (
        <div className="wd-glass-card wd-glass-amber relative overflow-hidden rounded-[var(--radius-lg)] p-5 border border-amber-200/60" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(251,191,36,0.12))' }}>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-gold)]/15">
              <AlertTriangle className="h-5 w-5 text-[var(--color-gold)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--color-gold)]">
                {watch.last_error || 'This watch needs your attention'}
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleUpdate({ needs_attention: false, consecutive_failures: 0 })}
            >
              Try to fix
            </Button>
          </div>
        </div>
      )}

      {/* Expired date warning */}
      {(() => {
        const text = `${watch.condition || ''} ${watch.url || ''}`
        const today = new Date(); today.setHours(0,0,0,0)
        const dateMatch = text.match(/date=(\d{4}-\d{2}-\d{2})/i) ||
          text.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2})(?:,?\s*(\d{4}))?/i)
        if (dateMatch) {
          let watchDate: Date | null = null
          if (dateMatch[0].includes('=')) {
            watchDate = new Date(dateMatch[1])
          } else {
            const months: Record<string, number> = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11}
            const m = months[dateMatch[1].toLowerCase().slice(0,3)]
            const d = parseInt(dateMatch[2])
            const y = dateMatch[3] ? parseInt(dateMatch[3]) : today.getFullYear()
            if (m !== undefined) watchDate = new Date(y, m, d)
          }
          if (watchDate && !isNaN(watchDate.getTime()) && watchDate < today) {
            return (
              <div className="wd-section flex items-start gap-3 rounded-[var(--radius-lg)] p-4 border border-orange-500/20" style={{ background: 'rgba(245,158,11,0.06)' }}>
                <span className="text-xl mt-0.5">📅</span>
                <div>
                  <p className="text-sm font-semibold text-orange-500">Date has passed</p>
                  <p className="text-xs text-[var(--color-ink-mid)] mt-1">
                    This watch was for {watchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} which has already passed. Update the date or remove this watch to free up a slot.
                  </p>
                </div>
              </div>
            )
          }
        }
        return null
      })()}

      {/* Alternative source suggestion */}
      {watch.alt_source_url && watch.alt_source_domain && (
        <div className="wd-glass-card relative overflow-hidden rounded-[var(--radius-lg)] p-5 border border-[var(--color-accent-mid)]" style={{ background: 'linear-gradient(135deg, var(--color-accent-light), rgba(110,231,183,0.06))' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] animate-pulse-dot" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
              Found on another site
            </span>
          </div>
          <p className="text-sm font-medium text-[var(--color-ink)] mb-1">
            {watch.name} is also on {watch.alt_source_domain}
            {watch.alt_source_price != null && ` for $${watch.alt_source_price.toFixed(2)}`}
          </p>
          <p className="text-xs text-[var(--color-ink-mid)] mb-4">
            {watch.alt_source_domain === 'resy.com'
              ? 'Resy shows real-time cancellations and last-minute openings. Steward can monitor Resy directly for faster, more accurate availability alerts.'
              : watch.alt_source_domain === 'opentable.com'
              ? 'OpenTable shows live reservation slots. Switching may give more accurate availability data.'
              : watch.alt_source_price != null
              ? `This source has the product for $${watch.alt_source_price.toFixed(2)}. Switching could save you money.`
              : 'This source may provide more accurate or up-to-date information.'}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() =>
                handleUpdate({
                  url: watch.alt_source_url!,
                  consecutive_failures: 0,
                  last_error: null,
                  needs_attention: false,
                  alt_source_url: null,
                  alt_source_domain: null,
                  alt_source_price: null,
                  alt_source_found_at: null,
                })
              }
              disabled={actionLoading}
            >
              Switch to {watch.alt_source_domain}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                handleUpdate({
                  alt_source_url: null,
                  alt_source_domain: null,
                  alt_source_price: null,
                  alt_source_found_at: null,
                })
              }
              disabled={actionLoading}
            >
              Keep current
            </Button>
          </div>
        </div>
      )}

      {/* ===== AUTO-CART STATUS (only when the user opted into Auto Add to Cart) ===== */}
      {watch.auto_act && (() => {
        const session = inspectSession(watch)
        const functional = isAutoActFunctional(watch.action_type, watch.url)

        // Build the session-row content based on state.
        let sessionIcon = <CircleOff className="h-4 w-4 text-[var(--color-ink-light)]" />
        let sessionLabel = 'No session stored'
        let sessionHint = 'Sign in via the iOS share sheet to enable auto-cart. Until then, triggers fall back to a push notification with a one-tap cart link.'
        let sessionBg = 'bg-[var(--color-bg-deep)]'
        if (session.status === 'active') {
          sessionIcon = <ShieldCheck className="h-4 w-4 text-[var(--color-green)]" />
          // Pick the shortest human-readable expiry — days if >= 1, else hours.
          if (session.earliestExpiry) {
            const ms = new Date(session.earliestExpiry).getTime() - Date.now()
            const days = Math.floor(ms / (1000 * 60 * 60 * 24))
            const hours = Math.floor(ms / (1000 * 60 * 60))
            const expiryText = days >= 1 ? `${days} day${days === 1 ? '' : 's'}` : `${hours} hour${hours === 1 ? '' : 's'}`
            sessionLabel = `Session active · expires in ${expiryText}`
          } else {
            sessionLabel = 'Session active'
          }
          sessionHint = session.domain ? `Signed into ${session.domain}.` : 'Auto-cart is armed for this watch.'
          sessionBg = 'bg-[var(--color-green)]/10'
        } else if (session.status === 'expired') {
          sessionIcon = <ShieldAlert className="h-4 w-4 text-[var(--color-gold)]" />
          sessionLabel = 'Session expired'
          sessionHint = 'Re-sign in via the iOS share sheet. Until then, triggers fall back to a push notification with a one-tap cart link.'
          sessionBg = 'bg-[var(--color-gold)]/10'
        }

        // Last-attempt row.
        let attemptIcon = <Clock className="h-4 w-4 text-[var(--color-ink-light)]" />
        let attemptLabel = 'No auto-cart attempts yet'
        let attemptHint = functional
          ? 'This watch will attempt auto-cart the next time it triggers.'
          : 'Auto-cart isn\'t wired up for this retailer yet — triggers fall back to a cart link.'
        let attemptBg = 'bg-[var(--color-bg-deep)]'
        if (watch.action_executed && watch.action_executed_at) {
          attemptIcon = <ShoppingCart className="h-4 w-4 text-[var(--color-green)]" />
          attemptLabel = `Added to cart · ${timeAgo(watch.action_executed_at)}`
          attemptHint = watch.change_note || 'Auto-cart fired successfully on the last trigger.'
          attemptBg = 'bg-[var(--color-green)]/10'
        }

        return (
          <div className="wd-section rounded-[var(--radius-xl)] bg-[var(--color-bg-card)] border border-[var(--color-border)] p-5 sm:p-6 shadow-[var(--shadow-xs)]" style={{ animationDelay: '0.08s' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent-light)]">
                <Zap className="h-3.5 w-3.5 text-[var(--color-accent)]" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--color-ink)]">
                Auto-Cart Status
              </h3>
              <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-gold)]/12 text-[var(--color-gold)]">
                PREMIUM
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Session row */}
              <div className={`rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] p-4 ${sessionBg}`}>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-card)]">
                    {sessionIcon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-light)]">
                      Session
                    </p>
                    <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                      {sessionLabel}
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--color-ink-mid)] leading-relaxed">
                      {sessionHint}
                    </p>
                  </div>
                </div>
              </div>

              {/* Last-attempt row */}
              <div className={`rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] p-4 ${attemptBg}`}>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-card)]">
                    {attemptIcon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-light)]">
                      Last attempt
                    </p>
                    <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                      {attemptLabel}
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--color-ink-mid)] leading-relaxed line-clamp-2">
                      {attemptHint}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ===== DETAILS GRID (Visual Stats Cards) ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Condition */}
        <div className="wd-stat-card group rounded-[var(--radius-lg)] bg-[var(--color-bg-card)] border border-[var(--color-border)] p-4 transition-all hover:shadow-[var(--shadow-sm)] hover:border-[var(--color-border-mid)]" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-blue-light)] transition-transform group-hover:scale-105">
              <Target className="h-4 w-4 text-[var(--color-blue)]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-light)]">
                Condition
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--color-ink)] leading-snug">
                {watch.condition}
              </p>
            </div>
          </div>
        </div>

        {/* When found */}
        <div className="wd-stat-card group rounded-[var(--radius-lg)] bg-[var(--color-bg-card)] border border-[var(--color-border)] p-4 transition-all hover:shadow-[var(--shadow-sm)] hover:border-[var(--color-border-mid)]" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-green-light)] transition-transform group-hover:scale-105">
              <Zap className="h-4 w-4 text-[var(--color-green)]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-light)]">
                When Found
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                {watch.action_type === 'book' ? 'Notify when available'
                  : watch.action_type === 'price' ? 'Notify on price drop'
                  : watch.action_type === 'cart' ? 'Notify when in stock'
                  : watch.action_type === 'form' ? 'Notify when open'
                  : 'Send notification'}
              </p>
            </div>
          </div>
        </div>

        {/* Frequency — click to edit */}
        <button
          type="button"
          onClick={() => openEditDialog('frequency')}
          aria-label="Edit check frequency"
          className="wd-stat-card wd-stat-card-editable group rounded-[var(--radius-lg)] bg-[var(--color-bg-card)] border border-[var(--color-border)] p-4 text-left transition-all hover:shadow-[var(--shadow-sm)] hover:border-[var(--color-accent-mid)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-light)] transition-transform group-hover:scale-105">
              <RefreshCw className="h-4 w-4 text-[var(--color-accent)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-light)]">
                Frequency
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                {watch.check_frequency}
              </p>
            </div>
            <Pencil className="wd-stat-edit-icon h-3.5 w-3.5 text-[var(--color-ink-light)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        </button>

        {/* Next check */}
        <div className="wd-stat-card group rounded-[var(--radius-lg)] bg-[var(--color-bg-card)] border border-[var(--color-border)] p-4 transition-all hover:shadow-[var(--shadow-sm)] hover:border-[var(--color-border-mid)]" style={{ animationDelay: '0.25s' }}>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-amber-light)] transition-transform group-hover:scale-105">
              <Timer className="h-4 w-4 text-[var(--color-amber)]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-light)]">
                Next Check
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                {watch.status === 'paused'
                  ? 'Paused'
                  : nextCheckLabel(watch.last_checked, watch.check_frequency)}
              </p>
            </div>
          </div>
        </div>

        {/* Last checked */}
        <div className="wd-stat-card group rounded-[var(--radius-lg)] bg-[var(--color-bg-card)] border border-[var(--color-border)] p-4 transition-all hover:shadow-[var(--shadow-sm)] hover:border-[var(--color-border-mid)]" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-deep)] transition-transform group-hover:scale-105">
              <Clock className="h-4 w-4 text-[var(--color-ink-mid)]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-light)]">
                Last Checked
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                {watch.last_checked ? timeAgo(watch.last_checked) : 'Not yet'}
              </p>
            </div>
          </div>
        </div>

        {/* When triggered — click to edit */}
        <button
          type="button"
          onClick={() => openEditDialog('triggered')}
          aria-label="Edit what happens when this watch is triggered"
          className="wd-stat-card wd-stat-card-editable group rounded-[var(--radius-lg)] bg-[var(--color-bg-card)] border border-[var(--color-border)] p-4 text-left transition-all hover:shadow-[var(--shadow-sm)] hover:border-[var(--color-accent-mid)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
          style={{ animationDelay: '0.35s' }}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-pink-light)] transition-transform group-hover:scale-105">
              <Activity className="h-4 w-4 text-[var(--color-pink)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-light)]">
                When Triggered
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                {responseModeLabel[displayResponseMode] || displayResponseMode}
              </p>
            </div>
            <Pencil className="wd-stat-edit-icon h-3.5 w-3.5 text-[var(--color-ink-light)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        </button>

        {/* Notify channels — spans full row on smallest screen, click to edit */}
        <button
          type="button"
          onClick={() => openEditDialog('notify')}
          aria-label="Edit notify channels"
          className="wd-stat-card wd-stat-card-editable group rounded-[var(--radius-lg)] bg-[var(--color-bg-card)] border border-[var(--color-border)] p-4 text-left sm:col-span-2 lg:col-span-3 transition-all hover:shadow-[var(--shadow-sm)] hover:border-[var(--color-accent-mid)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
          style={{ animationDelay: '0.4s' }}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-blue-light)] transition-transform group-hover:scale-105">
              <Bell className="h-4 w-4 text-[var(--color-blue)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-light)]">
                Notify Channels
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {notifyChannels.includes('push') && (
                  <Badge variant="secondary">
                    <Bell className="mr-1 h-3 w-3" />
                    Push
                  </Badge>
                )}
                {notifyChannels.includes('email') && (
                  <Badge variant="secondary">
                    <Mail className="mr-1 h-3 w-3" />
                    Email
                  </Badge>
                )}
                {notifyChannels.includes('sms') && (
                  <Badge variant="secondary">
                    <Smartphone className="mr-1 h-3 w-3" />
                    SMS
                  </Badge>
                )}
                {notifyChannels.length === 0 && (
                  <span className="text-sm text-[var(--color-ink-mid)]">None configured</span>
                )}
              </div>
            </div>
            <Pencil className="wd-stat-edit-icon h-3.5 w-3.5 text-[var(--color-ink-light)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        </button>
      </div>

      {/* ===== PRICE CHART SECTION ===== */}
      {priceHistory.length > 0 && (
        <div className="wd-section rounded-[var(--radius-xl)] bg-[var(--color-bg-card)] border border-[var(--color-border)] p-5 sm:p-6 shadow-[var(--shadow-xs)]" style={{ animationDelay: '0.45s' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent-light)]">
              <Activity className="h-3.5 w-3.5 text-[var(--color-accent)]" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">
              Price History
            </h3>
          </div>
          <PriceHistoryChart data={priceHistory} />
        </div>
      )}

      {/* Price Source Indicator */}
      {checkResults.length > 0 && (() => {
        const latestText = typeof checkResults[0].result_data === 'object'
          ? ((checkResults[0].result_data as Record<string, unknown>).text as string || '')
          : ''
        const source = latestText.includes('tables available') || latestText.includes('reservation') ? { icon: '🍽', color: 'green', label: 'Live availability', detail: 'Real-time from Resy / OpenTable', badge: 'Live' }
          : latestText.includes('Campground') || latestText.includes('campsite') ? { icon: '🏕', color: 'green', label: 'Live availability', detail: 'Real-time from Recreation.gov', badge: 'Live' }
          : latestText.includes('→') && (latestText.includes('Airlines') || latestText.includes('Spirit') || latestText.includes('Delta') || latestText.includes('United') || latestText.includes('Frontier')) ? { icon: '✈️', color: 'blue', label: 'Live flight data', detail: 'Real-time from airline APIs', badge: 'Live' }
          : latestText.includes('via AI search') ? { icon: '✨', color: 'orange', label: 'AI price estimate', detail: 'Price from search results — may differ from retailer', badge: 'Estimated' }
          : latestText.includes('estimated') ? { icon: '✨', color: 'orange', label: 'AI price estimate', detail: 'Approximate price from AI analysis', badge: 'Estimated' }
          : latestText.includes('Best:') ? { icon: '🔍', color: 'blue', label: 'Best price found', detail: 'Compared across multiple stores', badge: 'Compared' }
          : latestText.includes('(via ') ? { icon: '🌐', color: 'cyan', label: 'Cross-checked price', detail: 'Verified from alternative source', badge: 'Checked' }
          : latestText.includes('Could not reach') ? { icon: '📡', color: 'red', label: 'Page unreachable', detail: "Couldn't connect to the retailer", badge: 'Error' }
          : latestText.includes('Price not found') ? { icon: '❓', color: 'gray', label: 'Price not found', detail: 'Page loaded but no price detected', badge: 'Unknown' }
          : (latestText.includes('no change') || latestText.includes('Price dropped') || latestText.includes('Current price') || latestText.includes('Flight dropped')) ? { icon: '✅', color: 'green', label: 'Verified from retailer', detail: 'Price fetched directly from the product page', badge: 'Verified' }
          : latestText.includes('→') ? { icon: '✈️', color: 'blue', label: 'Live flight data', detail: 'Real-time from airline APIs', badge: 'Live' }
          : { icon: '📊', color: 'gray', label: 'Price data', detail: 'Steward is monitoring this product', badge: 'Tracked' }
        const colorMap: Record<string, string> = { orange: 'bg-orange-500/10 text-orange-600', blue: 'bg-blue-500/10 text-blue-600', green: 'bg-green-500/10 text-green-600', red: 'bg-red-500/10 text-red-600', cyan: 'bg-cyan-500/10 text-cyan-600', gray: 'bg-gray-500/10 text-[var(--color-ink-light)]' }
        return (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] text-xs border border-[var(--color-border-subtle)] ${colorMap[source.color] || colorMap.gray}`}>
            <span className="text-base">{source.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[var(--color-ink)] text-[12px]">{source.label}</div>
              <div className="text-[11px] text-[var(--color-ink-mid)]">{source.detail}</div>
            </div>
            <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold ${colorMap[source.color] || colorMap.gray}`}>
              {source.badge}
            </span>
          </div>
        )
      })()}

      {/* ===== CHECK HISTORY TIMELINE ===== */}
      {checkResults.length > 0 && (
        <div className="wd-section rounded-[var(--radius-xl)] bg-[var(--color-bg-card)] border border-[var(--color-border)] p-5 sm:p-6 shadow-[var(--shadow-xs)]" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-bg-deep)]">
              <Clock className="h-3.5 w-3.5 text-[var(--color-ink-mid)]" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">
              Check History
            </h3>
            <span className="ml-auto text-[11px] text-[var(--color-ink-light)]">
              {checkResults.length} check{checkResults.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[var(--color-border)]" />

            <div className="space-y-0">
              {visibleChecks.map((cr, index) => {
                const resultText =
                  typeof cr.result_data === 'object'
                    ? (cr.result_data as Record<string, unknown>).summary as string ||
                      (cr.result_data as Record<string, unknown>).text as string ||
                      ''
                    : ''

                const priceData = cr.result_data as Record<string, unknown>
                const hasPrice = typeof priceData?.price === 'number'
                const prevCheck = checkResults[index + 1]
                const prevPrice = prevCheck ? (prevCheck.result_data as Record<string, unknown>)?.price as number | undefined : undefined
                const currentPrice = hasPrice ? priceData.price as number : undefined
                const priceDiff = currentPrice !== undefined && prevPrice !== undefined ? currentPrice - prevPrice : undefined

                return (
                  <div
                    key={cr.id}
                    className={cn(
                      'wd-timeline-item relative flex items-start gap-4 py-3 pl-0 rounded-[var(--radius-md)] transition-colors',
                      index % 2 === 0 ? '' : '',
                    )}
                    style={{ animationDelay: `${0.05 * index}s` }}
                  >
                    {/* Timeline dot */}
                    <div className="relative z-10 mt-1.5">
                      <div
                        className={cn(
                          'h-[9px] w-[9px] rounded-full ring-2 ring-[var(--color-bg-card)]',
                          cr.changed
                            ? 'bg-[var(--color-green)] shadow-[0_0_6px_rgba(34,197,94,0.4)]'
                            : 'bg-[var(--color-ink-light)]',
                        )}
                      />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 pb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-[var(--color-ink-light)]">
                          {timeAgo(cr.checked_at)}
                        </span>
                        {cr.changed && (
                          <Badge variant="triggered">Changed</Badge>
                        )}
                        {priceDiff !== undefined && priceDiff !== 0 && (
                          <span className={cn(
                            'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold',
                            priceDiff < 0
                              ? 'bg-green-500/10 text-green-600'
                              : 'bg-red-500/10 text-red-600',
                          )}>
                            {priceDiff < 0 ? '↓' : '↑'} ${Math.abs(priceDiff).toFixed(2)}
                          </span>
                        )}
                      </div>
                      {resultText && (
                        <p className="mt-1 text-sm text-[var(--color-ink-mid)] leading-relaxed line-clamp-2">
                          {resultText}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Show more button */}
            {checkResults.length > 10 && !showAllChecks && (
              <button
                type="button"
                onClick={() => setShowAllChecks(true)}
                className="relative z-10 mt-2 ml-7 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] hover:text-[var(--color-ink)] transition-colors"
              >
                <ChevronDown className="h-3.5 w-3.5" />
                Show {checkResults.length - 10} more
              </button>
            )}
            {showAllChecks && checkResults.length > 10 && (
              <button
                type="button"
                onClick={() => setShowAllChecks(false)}
                className="relative z-10 mt-2 ml-7 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] hover:text-[var(--color-ink)] transition-colors"
              >
                Show less
              </button>
            )}
          </div>
        </div>
      )}

      {/* Share URL display */}
      {shareUrl && (
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-ink-light)]">
              Share Link
            </p>
            <div className="mt-2 flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                className="h-9 flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-deep)] px-3 text-xs text-[var(--color-ink)]"
              />
              <Button size="sm" variant="secondary" onClick={handleCopyShare}>
                <Copy className="h-3.5 w-3.5" />
                {shareCopied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== FLOATING ACTION BAR ===== */}
      <div className="wd-action-bar fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="mx-auto max-w-2xl px-4 pb-4 sm:pb-6">
          <div className="pointer-events-auto flex items-center justify-center gap-2 rounded-[var(--radius-xl)] bg-[var(--color-bg-card)]/80 backdrop-blur-xl border border-[var(--color-border)] p-2.5 shadow-[var(--shadow-xl)]">
            <Button variant="secondary" size="sm" onClick={() => openEditDialog()} disabled={actionLoading} className="wd-action-btn">
              <Pencil className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={handleShare} disabled={actionLoading} className="wd-action-btn">
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={handleTogglePause} disabled={actionLoading} className="wd-action-btn">
              {watch.status === 'paused' ? (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Resume</span>
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Pause</span>
                </>
              )}
            </Button>
            <div className="w-px h-6 bg-[var(--color-border)]" />
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={actionLoading} className="wd-action-btn">
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Edit Watch">
        <div className="space-y-5">
          <div data-edit-section="name">
            <Input
              label="Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          {/* Frequency picker with tier sections (matches iOS) */}
          <div data-edit-section="frequency">
            <label className="block text-xs font-medium text-[var(--color-ink-mid)] mb-2">Check Frequency</label>
            {[
              { tier: 'FREE', price: '', frequencies: ['Daily'] },
              { tier: 'PRO', price: '$4.99/mo', frequencies: ['Every 12 hours'] },
              { tier: 'PREMIUM', price: '$9.99/mo', frequencies: ['Every 6 hours', 'Every 4 hours', 'Every 2 hours'] },
            ].map(section => {
              const isCurrentOrLower = section.tier === 'FREE' ? true
                : section.tier === 'PRO' ? (tier === 'pro' || tier === 'premium')
                : tier === 'premium'
              return (
                <div key={section.tier} className="mb-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[11px] font-bold tracking-wide ${
                      section.tier === 'PREMIUM' ? 'text-[var(--color-gold)]'
                      : section.tier === 'PRO' ? 'text-[var(--color-accent)]'
                      : 'text-[var(--color-ink-light)]'
                    }`}>
                      {section.tier}
                    </span>
                    {section.price && (
                      <span className="text-[11px] text-[var(--color-ink-light)]">· {section.price}</span>
                    )}
                  </div>
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] overflow-hidden">
                    {section.frequencies.map((freq, i) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => {
                          if (isCurrentOrLower) {
                            setEditFrequency(freq)
                          } else {
                            setPaywallOpen(true)
                          }
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                          i > 0 ? 'border-t border-[var(--color-border)]' : ''
                        } ${editFrequency === freq
                          ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)] font-semibold'
                          : isCurrentOrLower
                            ? 'bg-[var(--color-bg-card)] text-[var(--color-ink)] hover:bg-[var(--color-bg-deep)] cursor-pointer'
                            : 'bg-[var(--color-bg-deep)] text-[var(--color-ink-light)] cursor-pointer hover:opacity-80'
                        }`}
                      >
                        <span>{freq}</span>
                        {editFrequency === freq && (
                          <CheckCircle size={18} className="text-[var(--color-accent)]" />
                        )}
                        {!isCurrentOrLower && (
                          <Lock size={14} className="text-[var(--color-ink-light)]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div data-edit-section="time">
            <Input
              label="Preferred Check Time"
              type="time"
              value={editPreferredTime}
              onChange={(e) => setEditPreferredTime(e.target.value)}
            />
          </div>

          {/* Notify Channels — matches iOS NotificationPickerSheet */}
          <div data-edit-section="notify">
            <label className="block text-xs font-medium text-[var(--color-ink-mid)] mb-2">
              Notify Channels
            </label>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] overflow-hidden">
              {[
                { key: 'push', icon: Bell, title: 'Push Notification', subtitle: 'Get notified instantly on your device', available: true },
                hasEmail && {
                  key: 'email',
                  icon: Mail,
                  title: 'Email',
                  subtitle: user?.email || profile?.notification_email || 'Receive a detailed email alert',
                  available: true,
                },
                hasPhone && {
                  key: 'sms',
                  icon: Smartphone,
                  title: 'SMS',
                  subtitle: profile?.phone_number || user?.phone || 'Get a text when triggered',
                  available: true,
                },
              ].filter(Boolean).map((row, i, arr) => {
                const r = row as { key: string; icon: React.ComponentType<{ size?: number; className?: string }>; title: string; subtitle: string; available: boolean }
                const Icon = r.icon
                const isSelected = editNotifyChannels.includes(r.key)
                const isOnlyOne = isSelected && editNotifyChannels.length === 1
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => toggleChannel(r.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      i > 0 ? 'border-t border-[var(--color-border)]' : ''
                    } ${isSelected ? 'bg-[var(--color-accent-light)]' : 'bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-deep)]'} ${
                      isOnlyOne ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    aria-disabled={isOnlyOne}
                    title={isOnlyOne ? 'At least one channel must be selected' : undefined}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] ${
                      isSelected ? 'bg-[var(--color-accent)]/20' : 'bg-[var(--color-bg-deep)]'
                    }`}>
                      <Icon size={14} className={isSelected ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink-light)]'} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className={`font-medium ${isSelected ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink)]'}`}>
                        {r.title}
                      </div>
                      <div className="text-[11px] text-[var(--color-ink-light)] truncate">
                        {r.subtitle}
                      </div>
                    </div>
                    {isSelected ? (
                      <CheckCircle size={18} className="text-[var(--color-accent)] shrink-0" />
                    ) : (
                      <div className="h-[18px] w-[18px] rounded-full border border-[var(--color-border-mid)] shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
            {(!hasEmail || !hasPhone) && (
              <p className="mt-2 text-[11px] text-[var(--color-ink-light)]">
                Add your {!hasEmail && !hasPhone ? 'email and phone number' : !hasEmail ? 'email' : 'phone number'} in Settings to unlock more channels.
              </p>
            )}
            <p className="mt-1 text-[11px] text-[var(--color-ink-light)]">
              At least one channel must be selected.
            </p>
          </div>

          {/* When Triggered — matches iOS autoActSection in DetailScreen.swift.
              The stewardActs row is dynamic: label + subtitle + availability
              depend on watch.action_type + URL + subscription tier. */}
          <div data-edit-section="triggered">
            <label className="block text-xs font-medium text-[var(--color-ink-mid)] mb-2">
              When Triggered
            </label>
            <p className="text-[12px] text-[var(--color-ink-light)] mb-2">
              What should Steward do when your watch condition is met?
            </p>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] overflow-hidden">
              {(() => {
                // Derive the stewardActs row state from the watch. For notify
                // watches we omit it entirely; for others we show it with the
                // iOS-matching label ("Auto Add to Cart" / "Auto Book" / etc.)
                // and grey-out any combo the backend can't actually execute.
                const stewardActsLabel = autoActLabelFor(watch.action_type)
                const stewardActsAvailable = isAutoActFunctional(watch.action_type, watch.url)
                const stewardActsSubtitle = autoActSubtitleFor(watch.action_type, watch.url)

                const rows: Array<{
                  mode: ResponseMode
                  title: string
                  description: string
                  badge: 'Pro' | 'Premium' | null
                  functionalityAvailable: boolean
                }> = [
                  { mode: 'notify', title: 'Notify Me', description: 'Steward sends you a push notification. You decide what to do next.', badge: null, functionalityAvailable: true },
                  { mode: 'quickLink', title: 'Notify + Quick Link', description: 'Notification with a smart action link — one tap to add to cart, book, or open checkout.', badge: 'Pro', functionalityAvailable: true },
                ]
                if (stewardActsLabel) {
                  rows.push({
                    mode: 'stewardActs',
                    title: stewardActsLabel,
                    description: stewardActsSubtitle,
                    badge: 'Premium',
                    functionalityAvailable: stewardActsAvailable,
                  })
                }
                return rows
              })().map((opt, i, rows) => {
                const required = responseModeRequiredTier[opt.mode]
                const tierRank = { free: 0, pro: 1, premium: 2 } as const
                const hasTier = tierRank[tier] >= tierRank[required]
                // Fully-selectable only when tier AND functionality checks both pass.
                const isSelectable = hasTier && opt.functionalityAvailable
                const isSelected = editResponseMode === opt.mode
                return (
                  <button
                    key={opt.mode}
                    type="button"
                    onClick={() => {
                      // Don't let the user pick an unavailable option. For
                      // tier-locked rows we still open the paywall; for
                      // store-unsupported rows we quietly no-op (matches iOS).
                      if (!opt.functionalityAvailable) return
                      selectResponseMode(opt.mode)
                    }}
                    aria-disabled={!opt.functionalityAvailable}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-sm transition-colors text-left ${
                      i < rows.length - 1 ? 'border-b border-[var(--color-border)]' : ''
                    } ${isSelected
                      ? 'bg-[var(--color-accent-light)]'
                      : isSelectable
                        ? 'bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-deep)] cursor-pointer'
                        : !opt.functionalityAvailable
                          ? 'bg-[var(--color-bg-deep)] cursor-not-allowed opacity-70'
                          : 'bg-[var(--color-bg-deep)] cursor-pointer hover:opacity-90'
                    }`}
                  >
                    <div className="pt-0.5 shrink-0">
                      {isSelected ? (
                        <CheckCircle size={18} className="text-[var(--color-accent)]" />
                      ) : (
                        <div className="h-[18px] w-[18px] rounded-full border border-[var(--color-border-mid)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-medium ${isSelectable ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-light)]'}`}>
                          {opt.title}
                        </span>
                        {opt.badge === 'Pro' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-accent)]/12 text-[var(--color-accent)]">
                            PRO
                          </span>
                        )}
                        {opt.badge === 'Premium' && (
                          <>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-accent)] text-white">
                              BETA
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-gold)]/12 text-[var(--color-gold)]">
                              PREMIUM
                            </span>
                          </>
                        )}
                      </div>
                      <p className={`mt-1 text-[12px] leading-relaxed ${isSelectable ? 'text-[var(--color-ink-mid)]' : 'text-[var(--color-ink-light)]'}`}>
                        {opt.description}
                      </p>
                    </div>
                    {!hasTier && opt.functionalityAvailable && (
                      <Lock size={12} className="text-[var(--color-ink-light)] shrink-0 mt-1" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notify on any price drop — only for price watches, matches iOS toggle */}
          {watch.action_type === 'price' && (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4 flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-accent)]/12">
                <Zap size={14} className="text-[var(--color-accent)]" />
              </div>
              <div className="flex-1 min-w-0">
                <label className="flex items-start justify-between gap-3 cursor-pointer">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--color-ink)]">
                      Notify on any price drop
                    </div>
                    <div className="text-[11px] text-[var(--color-ink-light)] mt-0.5">
                      Alert even for small decreases
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={editNotifyAnyDrop}
                    onChange={(e) => setEditNotifyAnyDrop(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-[var(--color-accent)] cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-[var(--color-bg-card)] -mx-4 sm:-mx-5 px-4 sm:px-5 pb-1 border-t border-[var(--color-border)] pt-4">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={editSaving}>
              {editSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Paywall for locked frequency / response mode options */}
      <PaywallDialog open={paywallOpen} onClose={() => setPaywallOpen(false)} />

      {/* ===== Custom styles for this page ===== */}
      <style>{`
        /* Staggered entrance animation for all major sections */
        .wd-page > .wd-hero,
        .wd-page > .wd-glass-card,
        .wd-page > .wd-section,
        .wd-stat-card {
          animation: wd-fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes wd-fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Pulsing badge for "Watching" status */
        .wd-badge-pulse {
          position: relative;
        }
        .wd-badge-pulse::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          background: inherit;
          opacity: 0;
          animation: wd-badgePulse 2.5s ease-in-out infinite;
        }
        @keyframes wd-badgePulse {
          0%, 100% { opacity: 0; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.15); }
        }

        /* Glowing badge for triggered */
        .wd-badge-glow-green {
          box-shadow: 0 0 8px rgba(34,197,94,0.3);
        }
        .wd-badge-glow-amber {
          box-shadow: 0 0 8px rgba(245,158,11,0.3);
        }

        /* Timeline items entrance */
        .wd-timeline-item {
          animation: wd-fadeSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* Pill hover */
        .wd-pill {
          transition: background-color 0.2s, border-color 0.2s;
        }
        .wd-pill:hover {
          background-color: var(--color-accent-light);
          border-color: var(--color-accent-mid);
        }

        /* Floating action bar entrance */
        .wd-action-bar > div > div {
          animation: wd-slideUpBar 0.5s 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes wd-slideUpBar {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Action button hover */
        .wd-action-btn {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .wd-action-btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        .wd-action-btn:active:not(:disabled) {
          transform: translateY(0px);
        }

        /* Hero image subtle float */
        .wd-hero-image {
          animation: wd-gentleFloat 6s ease-in-out infinite;
        }
        @keyframes wd-gentleFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        /* Back button arrow */
        .wd-back-btn:hover .h-4 {
          transform: translateX(-2px);
        }

        /* Editable stat cards — subtle lift on hover so users discover
           they're interactive without making the layout noisy. */
        .wd-stat-card-editable {
          cursor: pointer;
          width: 100%;
        }
        .wd-stat-card-editable:hover {
          transform: translateY(-1px);
        }
        .wd-stat-card-editable:active {
          transform: translateY(0);
        }

        /* Brief focus pulse on the edit dialog section that was tapped
           into — nudges the eye to the right row after opening. */
        .wd-edit-section-focus {
          animation: wd-editFocusPulse 1.2s ease-out;
        }
        @keyframes wd-editFocusPulse {
          0% { background: transparent; }
          30% { background: rgba(74, 222, 128, 0.10); }
          100% { background: transparent; }
        }
      `}</style>
    </div>
  )
}
