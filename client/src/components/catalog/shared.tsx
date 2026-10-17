import { LuStar, LuStarHalf } from 'react-icons/lu'
import type { ExperienceLevel } from '../../types'
import { cx } from '../../lib/utils'

/** Human labels for the catalog level filter and tags. */
export const levelLabels: Record<ExperienceLevel, string> = {
  beginner: 'Beginner',
  some: 'Some experience',
  comfortable: 'Comfortable',
  advanced: 'Advanced',
}

/** A small mono pill for a level, level-less paths render nothing. */
export function LevelTag({ level, className }: { level: ExperienceLevel | null; className?: string }) {
  if (!level) return null
  return (
    <span
      className={cx(
        'border border-on-band/15 px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-band-dim',
        className,
      )}
    >
      {levelLabels[level]}
    </span>
  )
}

/**
 * Five-star display that rounds to the nearest half. Empty stars stay muted
 * so a low rating never looks like a filled one at a glance.
 */
export function Stars({ value, className }: { value: number; className?: string }) {
  const clamped = Math.max(0, Math.min(5, value))
  return (
    <span className={cx('inline-flex items-center gap-0.5', className)} aria-label={`${clamped} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const position = i + 1
        if (clamped >= position) {
          return <LuStar key={i} className="h-3.5 w-3.5 text-accent-bright" />
        }
        if (clamped >= position - 0.5) {
          return <LuStarHalf key={i} className="h-3.5 w-3.5 text-accent-bright" />
        }
        return <LuStar key={i} className="h-3.5 w-3.5 text-on-band/20" />
      })}
    </span>
  )
}

/** Compact rating line: stars, numeric average and review count. */
export function RatingSummary({ avg, count }: { avg: number; count: number }) {
  if (count === 0) {
    return (
      <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-band-dim">
        No reviews yet
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-2">
      <Stars value={avg} />
      <span className="text-[12.5px] text-on-band-muted">
        {avg.toFixed(1)} · {count} {count === 1 ? 'review' : 'reviews'}
      </span>
    </span>
  )
}
