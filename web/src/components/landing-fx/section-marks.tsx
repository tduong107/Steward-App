'use client'

/**
 * SectionMarks — Huly-style corner labels. Drop one inside any
 * `position: relative` section.
 *
 *   <SectionMarks index={1} topic="Hero" right="3 steps · ≈ 12s" />
 *
 * Renders:
 *   top-left:  · S/01 — HERO          (mint, 50% opacity)
 *   top-right: 3 STEPS · ≈ 12S        (white, 30% opacity)
 *
 * Pure decorative. Don't pass user-actionable copy here.
 */

export function SectionMarks({
  index,
  topic,
  right,
}: {
  index: number
  topic: string
  right?: string
}) {
  const num = String(index).padStart(2, '0')
  return (
    <>
      <span className="section-mark section-mark--left" aria-hidden="true">
        · S/{num} — {topic}
      </span>
      {right && (
        <span className="section-mark section-mark--right" aria-hidden="true">
          {right}
        </span>
      )}
    </>
  )
}
