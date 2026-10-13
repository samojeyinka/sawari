import { ProgressBar } from '../ui/ProgressBar'
import { monoLabel } from '../layout/nav'
import { formatPacingTime, type PacingState } from '../../hooks/useActivityPacing'
import { cx } from '../../lib/utils'

/**
 * Pacing readout for a lesson. It reports the same thing the old version did —
 * how long you have been in the lesson, how long it wants you there, and
 * whether the page has been left idle — but as a plain ruled panel instead of
 * a dashboard of badges.
 */
export function DigestionTracker({
  pacing,
  baseMinutes,
}: {
  pacing: PacingState
  baseMinutes: number
}) {
  const { elapsedSeconds, targetSeconds, remainingSeconds, progressPercent, isUnlocked, status, fastForward } =
    pacing

  const targetMinutes = Math.round(targetSeconds / 60)

  const statusTag =
    status === 'active'
      ? { text: `absorbing · ${formatPacingTime(remainingSeconds)} left`, tone: 'text-accent-bright' }
      : status === 'paused_tab'
        ? { text: 'paused · tab in background', tone: 'text-warn-bright' }
        : status === 'paused_idle'
          ? { text: 'paused · inactive', tone: 'text-warn-bright' }
          : { text: 'pacing complete', tone: 'text-success-bright' }

  return (
    <section className="my-8 border border-on-band/15 bg-panel">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-on-band/10 px-5 py-4">
        <div className="min-w-0">
          <p className={cx(monoLabel, isUnlocked ? 'text-success-bright' : 'text-accent-bright')}>
            {isUnlocked ? 'digestion complete' : 'deep absorption pacing'}
          </p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-on-band-muted">
            {isUnlocked
              ? 'You invested the focus time required for deep comprehension.'
              : `Base estimate ${baseMinutes} min · required digestion ${targetMinutes} min`}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <span className={cx(monoLabel, statusTag.tone)}>{statusTag.text}</span>
          {import.meta.env.DEV && !isUnlocked && (
            <button
              type="button"
              onClick={fastForward}
              title="Fast-forward timer (dev only)"
              className="border border-on-band/20 px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-band-dim transition-colors hover:border-on-band/45 hover:text-on-band"
            >
              dev skip
            </button>
          )}
        </div>
      </div>

      <div className="px-5 py-4">
        <ProgressBar value={progressPercent} tone={isUnlocked ? 'success' : 'accent'} />
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
          <span className={monoLabel}>active focus {formatPacingTime(elapsedSeconds)}</span>
          <span className={monoLabel}>target {formatPacingTime(targetSeconds)}</span>
        </div>
      </div>

      {!isUnlocked && (
        <div className="border-t border-on-band/10 bg-band-deep px-5 py-4">
          <p className="text-[13px] leading-relaxed text-on-band-dim">
            <span className="text-on-band-muted">Why pacing is enforced. </span>
            Sawari prioritises retention over speed-reading. Giving a lesson twice its base time
            leaves room to re-read the difficult paragraphs and take notes before moving on.
          </p>
        </div>
      )}
    </section>
  )
}
