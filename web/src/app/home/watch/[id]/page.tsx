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
} from 'lucide-react'
import posthog from 'posthog-js'
import { createClient } from '@/lib/supabase/client'
import { useSub } from '@/hooks/use-subscription'
import type { Watch, CheckResult, CheckFrequency } from '@/lib/types'
import { timeAgo, nextCheckLabel, getDomain, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Dropdown } from '@/components/ui/dropdown'
import { Skeleton } from '@/components/ui/skeleton'
import { PriceHistoryChart } from '@/components/price-history-chart'

const allFrequencyOptions = [
  { label: 'Daily', value: 'Daily' },
  { label: 'Every 12 hours', value: 'Every 12 hours' },
  { label: 'Every 6 hours', value: 'Every 6 hours' },
  { label: 'Every 4 hours', value: 'Every 4 hours' },
  { label: 'Every 2 hours', value: 'Every 2 hours' },
]

const tierFrequencies: Record<string, string[]> = {
  free: ['Daily'],
  pro: ['Daily', 'Every 12 hours'],
  premium: ['Daily', 'Every 12 hours', 'Every 6 hours', 'Every 4 hours', 'Every 2 hours'],
}

export default function WatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const watchId = params.id as string
  const supabaseRef = useRef(createClient())
  const { tier } = useSub()
  const frequencyOptions = allFrequencyOptions.filter(f => (tierFrequencies[tier] ?? ['Daily']).includes(f.value))

  const [watch, setWatch] = useState<Watch | null>(null)
  const [checkResults, setCheckResults] = useState<CheckResult[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editFrequency, setEditFrequency] = useState('')
  const [editPreferredTime, setEditPreferredTime] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  // Share state
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)

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
      .filter((cr) => {
        const data = cr.result_data as Record<string, unknown>
        return typeof data?.price === 'number'
      })
      .map((cr) => ({
        date: cr.checked_at,
        price: (cr.result_data as Record<string, unknown>).price as number,
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

  const openEditDialog = useCallback(() => {
    if (!watch) return
    setEditName(watch.name)
    setEditFrequency(watch.check_frequency)
    setEditPreferredTime(watch.preferred_check_time || '')
    setEditOpen(true)
  }, [watch])

  const handleSaveEdit = useCallback(async () => {
    if (!watch) return
    setEditSaving(true)
    try {
      const updates: Partial<Watch> = {
        name: editName,
        check_frequency: editFrequency as CheckFrequency,
      }
      if (editPreferredTime) {
        updates.preferred_check_time = editPreferredTime
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
  }, [watch, editName, editFrequency, editPreferredTime])

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
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

  const responseModeLabel: Record<string, string> = {
    notify: 'Notify Me',
    quickLink: 'Notify + Quick Link',
    stewardActs: 'Auto Add to Cart',
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.push('/home')}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-mid)] hover:text-[var(--color-ink)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Watch header */}
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-light)]">
          <span className="text-2xl">{watch.emoji || '👀'}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">
              {watch.name}
            </h2>
            {watch.triggered && <Badge variant="triggered">Triggered</Badge>}
            {watch.needs_attention && !watch.triggered && (
              <Badge variant="warning">Needs attention</Badge>
            )}
            {watch.status === 'paused' && (
              <Badge variant="secondary">Paused</Badge>
            )}
            {watch.status === 'watching' && !watch.triggered && !watch.needs_attention && (
              <Badge variant="default">Watching</Badge>
            )}
          </div>
          <a
            href={watch.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-sm text-[var(--color-accent)] hover:underline"
          >
            {getDomain(watch.url)}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Status banners */}
      {watch.triggered && (
        <div className="flex items-start gap-3 rounded-[var(--radius-md)] bg-[var(--color-green-light)] p-4">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-green)]" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--color-green)]">
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
      )}

      {watch.needs_attention && !watch.triggered && (
        <div className="flex items-start gap-3 rounded-[var(--radius-md)] bg-[var(--color-gold-light)] p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-gold)]" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--color-gold)]">
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
      )}

      {/* Alternative source suggestion */}
      {watch.alt_source_url && watch.alt_source_domain && (
        <div className="rounded-[var(--radius-md)] bg-[var(--color-accent-light)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
              Found on another site
            </span>
          </div>
          <p className="text-sm font-medium text-[var(--color-ink)] mb-1">
            {watch.name} is available on {watch.alt_source_domain}
            {watch.alt_source_price != null && ` for $${watch.alt_source_price.toFixed(2)}`}
          </p>
          <p className="text-xs text-[var(--color-ink-mid)] mb-3">
            Would you like to switch to tracking this source instead?
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

      {/* Details grid */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Condition */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-ink-light)]">
                Condition
              </p>
              <p className="mt-1 text-sm text-[var(--color-ink)]">
                {watch.condition}
              </p>
            </div>

            {/* When found */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-ink-light)]">
                When found
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm text-[var(--color-ink)]">
                  {watch.action_type === 'book' ? 'Notify when available'
                    : watch.action_type === 'price' ? 'Notify on price drop'
                    : watch.action_type === 'cart' ? 'Notify when in stock'
                    : watch.action_type === 'form' ? 'Notify when open'
                    : 'Send notification'}
                </span>
              </div>
            </div>

            {/* Frequency */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-ink-light)]">
                Frequency
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[var(--color-ink-mid)]" />
                <span className="text-sm text-[var(--color-ink)]">
                  {watch.check_frequency}
                </span>
              </div>
            </div>

            {/* Next check */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-ink-light)]">
                Next Check
              </p>
              <p className="mt-1 text-sm text-[var(--color-ink)]">
                {watch.status === 'paused'
                  ? 'Paused'
                  : nextCheckLabel(watch.last_checked, watch.check_frequency)}
              </p>
            </div>

            {/* Last checked */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-ink-light)]">
                Last Checked
              </p>
              <p className="mt-1 text-sm text-[var(--color-ink)]">
                {watch.last_checked ? timeAgo(watch.last_checked) : 'Not yet'}
              </p>
            </div>

            {/* When triggered */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-ink-light)]">
                When Triggered
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-[var(--color-ink-mid)]" />
                <span className="text-sm text-[var(--color-ink)]">
                  {responseModeLabel[watch.response_mode] || watch.response_mode}
                </span>
              </div>
            </div>

            {/* Notify channels */}
            <div className="sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-ink-light)]">
                Notify Channels
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2">
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
          </div>
        </CardContent>
      </Card>

      {/* Price history chart */}
      {priceHistory.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">
            Price History
          </h3>
          <PriceHistoryChart data={priceHistory} />

          {/* Price Confidence Indicator */}
          {watch.price_confidence && (
            <div className={`flex items-center gap-2 mt-2 px-3 py-2 rounded-[var(--radius-md)] text-xs ${
              watch.price_confidence === 'high' ? 'bg-green-500/10 text-green-600' :
              watch.price_confidence === 'medium' ? 'bg-yellow-500/10 text-yellow-600' :
              watch.price_confidence === 'low' ? 'bg-orange-500/10 text-orange-600' :
              'bg-gray-500/10 text-[var(--color-ink-light)]'
            }`}>
              <span className="text-sm">
                {watch.price_confidence === 'high' ? '🛡️' :
                 watch.price_confidence === 'medium' ? '🛡️' :
                 watch.price_confidence === 'low' ? '⚠️' : '❓'}
              </span>
              <span className="font-medium">
                {watch.price_confidence === 'high' ? 'High confidence — price verified from page' :
                 watch.price_confidence === 'medium' ? 'Medium confidence — price detected with some uncertainty' :
                 watch.price_confidence === 'low' ? 'Low confidence — price from search results' :
                 'Estimated — could not verify from retailer'}
              </span>
              {(watch.price_confidence === 'none' || watch.price_confidence === 'low') && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-500 text-[10px] font-bold">
                  Estimated
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Check history */}
      {checkResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">
            Check History
          </h3>
          <Card>
            <CardContent className="divide-y divide-[var(--color-border)]">
              {checkResults.slice(0, 10).map((cr) => {
                const resultText =
                  typeof cr.result_data === 'object'
                    ? (cr.result_data as Record<string, unknown>).summary as string ||
                      (cr.result_data as Record<string, unknown>).text as string ||
                      ''
                    : ''

                return (
                  <div key={cr.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <div
                      className={cn(
                        'mt-1 h-2 w-2 shrink-0 rounded-full',
                        cr.changed
                          ? 'bg-[var(--color-green)]'
                          : 'bg-[var(--color-ink-light)]',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--color-ink-light)]">
                          {timeAgo(cr.checked_at)}
                        </span>
                        {cr.changed && (
                          <Badge variant="triggered">Changed</Badge>
                        )}
                      </div>
                      {resultText && (
                        <p className="mt-0.5 truncate text-sm text-[var(--color-ink-mid)]">
                          {resultText}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
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

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={openEditDialog} disabled={actionLoading}>
          <Pencil className="h-4 w-4" />
          Edit Watch
        </Button>
        <Button variant="secondary" onClick={handleShare} disabled={actionLoading}>
          <Share2 className="h-4 w-4" />
          Share Watch
        </Button>
        <Button variant="secondary" onClick={handleTogglePause} disabled={actionLoading}>
          {watch.status === 'paused' ? (
            <>
              <Play className="h-4 w-4" />
              Resume
            </>
          ) : (
            <>
              <Pause className="h-4 w-4" />
              Pause
            </>
          )}
        </Button>
        <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
          <Trash2 className="h-4 w-4" />
          Delete Watch
        </Button>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Edit Watch">
        <div className="space-y-4">
          <Input
            label="Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          {/* Frequency picker with tier sections (matches iOS) */}
          <div>
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
                        onClick={() => isCurrentOrLower && setEditFrequency(freq)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                          i > 0 ? 'border-t border-[var(--color-border)]' : ''
                        } ${editFrequency === freq
                          ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)] font-semibold'
                          : isCurrentOrLower
                            ? 'bg-[var(--color-bg-card)] text-[var(--color-ink)] hover:bg-[var(--color-bg-deep)] cursor-pointer'
                            : 'bg-[var(--color-bg-deep)] text-[var(--color-ink-light)] cursor-not-allowed opacity-60'
                        }`}
                        disabled={!isCurrentOrLower}
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
          <Input
            label="Preferred Check Time"
            type="time"
            value={editPreferredTime}
            onChange={(e) => setEditPreferredTime(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={editSaving}>
              {editSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
