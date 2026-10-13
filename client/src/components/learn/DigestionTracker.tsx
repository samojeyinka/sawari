import {
  LuBrain,
  LuCheck,
  LuClock,
  LuFastForward,
  LuPause,
  LuSparkles,
} from 'react-icons/lu'
import { formatPacingTime, type PacingState } from '../../hooks/useActivityPacing'
import { cx } from '../../lib/utils'

export function DigestionTracker({
  pacing,
  baseMinutes,
}: {
  pacing: PacingState
  baseMinutes: number
}) {
  const {
    elapsedSeconds,
    targetSeconds,
    remainingSeconds,
    progressPercent,
    isUnlocked,
    status,
    fastForward,
  } = pacing

  const targetMinutes = Math.round(targetSeconds / 60)

  return (
    <section className="my-6 rounded-2xl border border-line bg-canvas/60 p-4.5 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cx(
              'flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors',
              isUnlocked
                ? 'bg-success-soft text-success'
                : 'bg-accent/10 text-accent',
            )}
          >
            {isUnlocked ? <LuSparkles className="h-4 w-4" /> : <LuBrain className="h-4 w-4" />}
          </span>
          <div>
            <h3 className="text-sm font-semibold text-ink">
              {isUnlocked ? 'Digestion Goal Achieved' : 'Deep Absorption Pacing'}
            </h3>
            <p className="text-[12px] text-muted">
              {isUnlocked
                ? `You invested the necessary focus time for deep comprehension.`
                : `Base estimate ${baseMinutes} min · Required digestion ${targetMinutes} min (2× pacing)`}
            </p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          {status === 'active' && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success-soft/70 px-2.5 py-1 text-[11px] font-medium text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-ping" />
              Actively absorbing · {formatPacingTime(remainingSeconds)} left
            </span>
          )}

          {status === 'paused_tab' && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              <LuPause className="h-3 w-3" />
              Paused · Tab in background
            </span>
          )}

          {status === 'paused_idle' && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              <LuClock className="h-3 w-3" />
              Paused · Inactive (move mouse to resume)
            </span>
          )}

          {status === 'unlocked' && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success-soft px-2.5 py-1 text-[11px] font-medium text-success">
              <LuCheck className="h-3.5 w-3.5" />
              Pacing complete
            </span>
          )}

          {import.meta.env.DEV && !isUnlocked && (
            <button
              type="button"
              onClick={fastForward}
              title="Fast-forward timer (Dev only)"
              className="inline-flex items-center gap-1 rounded border border-line bg-panel px-2 py-1 text-[11px] text-muted hover:text-ink"
            >
              <LuFastForward className="h-3 w-3" />
              Dev skip
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3.5">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-canvas-deep">
          <div
            className={cx(
              'h-full rounded-full transition-all duration-300',
              isUnlocked ? 'bg-success' : 'bg-accent',
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted">
          <span>Active focus: {formatPacingTime(elapsedSeconds)}</span>
          <span>Target: {formatPacingTime(targetSeconds)}</span>
        </div>
      </div>

      {/* Pedagogical info banner */}
      {!isUnlocked && (
        <p className="mt-3 rounded-lg border border-line/60 bg-panel/60 p-2.5 text-[12px] leading-relaxed text-muted">
          💡 <strong className="text-ink">Why pacing is enforced:</strong> Sawari prioritizes long-term retention over speed-reading. Taking 2× the base time gives your brain room to re-read difficult paragraphs, take notes, and deeply internalize the principles before advancing.
        </p>
      )}
    </section>
  )
}
