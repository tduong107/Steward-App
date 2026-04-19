export const dynamic = 'force-dynamic'

import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { SharedWatch, ActionType } from '@/lib/types'

const ACTION_LABELS: Record<ActionType, string> = {
  price: 'Price Watch',
  cart: 'Auto Cart',
  book: 'Auto Book',
  form: 'Auto Form',
  notify: 'Notify Me',
}

const ACTION_COLORS: Record<ActionType, string> = {
  price: 'bg-[var(--color-gold-light)] text-[var(--color-gold)]',
  cart: 'bg-[var(--color-green-light)] text-[var(--color-green)]',
  book: 'bg-[var(--color-blue-light)] text-[var(--color-blue)]',
  form: 'bg-[var(--color-accent-light)] text-[var(--color-accent)]',
  notify: 'bg-[var(--color-red-light)] text-[var(--color-red)]',
}

function truncateUrl(url: string, maxLength = 40): string {
  try {
    const parsed = new URL(url)
    const display = parsed.hostname + parsed.pathname
    return display.length > maxLength
      ? display.slice(0, maxLength) + '...'
      : display
  } catch {
    return url.length > maxLength ? url.slice(0, maxLength) + '...' : url
  }
}

export default async function SharedWatchPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.functions.invoke('get-shared-watch', {
    body: { share_code: code },
  })

  if (error || !data) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[var(--color-bg)] px-6">
        <div className="text-center max-w-sm">
          <span className="text-5xl mb-4 block">🔍</span>
          <h1 className="text-2xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-2">
            Watch not found
          </h1>
          <p className="text-[var(--color-ink-mid)] mb-8">
            This shared watch link may have expired or been removed.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] text-white font-medium px-6 py-3 text-base transition-opacity hover:opacity-90"
          >
            Go to Steward
          </Link>
        </div>
      </div>
    )
  }

  const watch = data as SharedWatch

  return (
    <div className="min-h-dvh flex flex-col items-center bg-[var(--color-bg)] px-6 py-12">
      {/* Branding */}
      <div className="text-center mb-10">
        <Image src="/steward-logo.png" alt="Steward" width={56} height={56} className="mx-auto mb-2 rounded-2xl" />
        <h1 className="text-2xl font-bold font-[var(--font-serif)] text-[var(--color-ink)]">
          Steward
        </h1>
        <p className="text-sm text-[var(--color-ink-mid)] mt-1">
          Watch the web for you
        </p>
      </div>

      {/* Shared watch card */}
      <div className="w-full max-w-md">
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden shadow-sm">
          {/* Product image */}
          {watch.image_url && (
            <div className="relative w-full h-48 bg-[var(--color-bg-deep)] overflow-hidden">
              <Image
                src={watch.image_url}
                alt={watch.name}
                fill
                sizes="(max-width: 448px) 100vw, 448px"
                className="object-cover"
              />
            </div>
          )}

          <div className="p-6">
            {/* Emoji + Name */}
            <div className="flex items-start gap-3 mb-4">
              <span className="text-4xl leading-none shrink-0">{watch.emoji}</span>
              <div className="min-w-0">
                <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] leading-tight">
                  {watch.name}
                </h2>
                <p className="text-sm text-[var(--color-ink-light)] mt-0.5">
                  Shared by {watch.shared_by_name}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 mb-6">
              {/* Condition */}
              <div className="flex items-start gap-2">
                <span className="text-sm text-[var(--color-ink-light)] shrink-0 w-20">Watching</span>
                <span className="text-sm text-[var(--color-ink)] font-medium">
                  {watch.condition}
                </span>
              </div>

              {/* URL */}
              <div className="flex items-start gap-2">
                <span className="text-sm text-[var(--color-ink-light)] shrink-0 w-20">Source</span>
                <a
                  href={watch.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--color-accent)] hover:underline truncate"
                >
                  {truncateUrl(watch.url)}
                </a>
              </div>

              {/* Check frequency */}
              <div className="flex items-start gap-2">
                <span className="text-sm text-[var(--color-ink-light)] shrink-0 w-20">Checks</span>
                <span className="text-sm text-[var(--color-ink)]">
                  {watch.check_frequency}
                </span>
              </div>

              {/* Action type */}
              <div className="flex items-start gap-2">
                <span className="text-sm text-[var(--color-ink-light)] shrink-0 w-20">Action</span>
                <span
                  className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    ACTION_COLORS[watch.action_type] || ACTION_COLORS.notify
                  }`}
                >
                  {ACTION_LABELS[watch.action_type] || watch.action_label}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[var(--color-border)] mb-6" />

            {/* CTA */}
            <Link
              href={`/signup?shared=${code}`}
              className="w-full inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] text-white font-medium px-6 py-3 text-base transition-opacity hover:opacity-90"
            >
              Add to My Watches
            </Link>

            <p className="text-center mt-4">
              <Link
                href="/"
                className="text-sm text-[var(--color-accent)] font-medium hover:underline"
              >
                Learn more about Steward
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[var(--color-ink-light)] mt-8">
          Steward watches the web so you don&apos;t have to.
        </p>
      </div>
    </div>
  )
}
