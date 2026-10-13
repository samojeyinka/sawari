import type { Lesson, LessonBlock } from '../../types'
import { monoLabel } from '../layout/nav'
import { formatPacingTime, useActivityPacing } from '../../hooks/useActivityPacing'
import { DigestionTracker } from './DigestionTracker'
import { PreviewNotice } from './PreviewNotice'
import { cx } from '../../lib/utils'

const primaryBtn =
  'group relative inline-flex h-12 items-center justify-center overflow-hidden bg-on-band px-7 ' +
  'text-[14.5px] font-medium text-band transition-colors'
const quietBtn =
  'inline-flex h-11 items-center justify-center border border-on-band/20 px-5 text-[13.5px] ' +
  'text-on-band-dim transition-colors hover:border-on-band/45 hover:text-on-band'

export function LessonView({
  activityId,
  lesson,
  done,
  preview = false,
  onComplete,
}: {
  activityId: string
  lesson: Lesson
  done: boolean
  preview?: boolean
  onComplete: () => void
}) {
  const pacing = useActivityPacing({
    activityId,
    baseMinutes: lesson.minutes,
    done,
    disabled: preview,
  })

  return (
    <article className="mx-auto max-w-3xl animate-rise">
      <p className={monoLabel}>learn · {lesson.minutes} min base</p>
      <h2 className="mt-3 font-display text-[26px] font-light leading-[1.15] tracking-[-0.025em] text-on-band sm:text-[32px]">
        {lesson.title}
      </h2>
      <p className="mt-5 border-l-2 border-accent-bright/50 pl-5 text-[16.5px] leading-relaxed text-on-band-muted">
        {lesson.intro}
      </p>

      {!preview && <DigestionTracker pacing={pacing} baseMinutes={lesson.minutes} />}

      <div className="mt-8">
        {lesson.blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-on-band/10 pt-6">
        {done ? (
          <span className={cx(monoLabel, 'text-success-bright')}>lesson complete</span>
        ) : preview ? (
          <PreviewNotice />
        ) : !pacing.isUnlocked ? (
          <button type="button" disabled className={cx(quietBtn, 'opacity-60')}>
            Unlocks in {formatPacingTime(pacing.remainingSeconds)}
          </button>
        ) : (
          <>
            <button type="button" onClick={onComplete} className={primaryBtn}>
              Complete lesson &amp; continue
            </button>
            <span className="text-[13px] leading-relaxed text-on-band-dim">
              Pacing requirement met. Next up: resource reading.
            </span>
          </>
        )}
      </div>
    </article>
  )
}

function Block({ block }: { block: LessonBlock }) {
  switch (block.type) {
    case 'p':
      return <p className="mb-5 text-[15.5px] leading-[1.75] text-on-band-muted">{block.text}</p>

    case 'h':
      return (
        <h3 className="mb-3 mt-9 font-display text-[19px] font-light tracking-[-0.015em] text-on-band">
          {block.text}
        </h3>
      )

    case 'list':
      return (
        <ul className="mb-6 space-y-3">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3.5 text-[15.5px] leading-[1.75] text-on-band-muted">
              <span
                aria-hidden="true"
                className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-accent-bright/70"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )

    case 'steps':
      return (
        <ol className="mb-6 space-y-3.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-4 text-[15.5px] leading-[1.75] text-on-band-muted">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border border-on-band/20 font-mono text-[11px] text-on-band-dim">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      )

    case 'note':
      return (
        <aside className="mb-7 border-l-2 border-accent-bright/50 bg-band-deep px-5 py-4">
          <p className={cx(monoLabel, 'text-accent-bright')}>{block.title}</p>
          <p className="mt-2 text-[15px] leading-relaxed text-on-band-muted">{block.text}</p>
        </aside>
      )
  }
}
