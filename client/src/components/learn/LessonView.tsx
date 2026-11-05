import type { Lesson, LessonBlock } from '../../types'
import { monoLabel } from '../layout/nav'
import { formatPacingTime, useActivityPacing } from '../../hooks/useActivityPacing'
import { DigestionTracker } from './DigestionTracker'
import { PreviewNotice } from './PreviewNotice'
import { cx, formatDuration } from '../../lib/utils'

const primaryBtn =
  'group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-[#51249c] px-6 ' +
  'text-[13px] font-extrabold text-white shadow-[0_5px_14px_rgba(113,59,209,.2)] transition-[transform,box-shadow] ' +
  'hover:-translate-y-px hover:shadow-[0_8px_20px_rgba(113,59,209,.25)]'
const quietBtn =
  'inline-flex h-11 items-center justify-center rounded-full border border-line-strong bg-white px-5 text-[12px] ' +
  'font-bold text-on-band-muted transition-colors hover:border-accent-bright/50 hover:text-accent-bright'

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
      <p className={monoLabel}>learn · {formatDuration(lesson.minutes)} base</p>
      <h2 className="mt-3 font-display text-[26px] font-extrabold leading-[1.1] tracking-[-0.04em] text-on-band sm:text-[32px]">
        {lesson.title}
      </h2>
      <p className="mt-5 border-l-2 border-accent-bright/50 pl-5 text-[14px] leading-relaxed text-on-band-muted">
        {lesson.intro}
      </p>

      {!preview && <DigestionTracker pacing={pacing} baseMinutes={lesson.minutes} />}

      <div className="mt-8">
        {lesson.blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </div>

        <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-line pt-6">
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
      return <p className="mb-5 text-[14px] leading-[1.75] text-on-band-muted">{block.text}</p>

    case 'h':
      return (
        <h3 className="mb-3 mt-9 font-display text-[18px] font-extrabold tracking-[-0.03em] text-on-band">
          {block.text}
        </h3>
      )

    case 'list':
      return (
        <ul className="mb-6 space-y-3">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3.5 text-[14px] leading-[1.75] text-on-band-muted">
              <span
                aria-hidden="true"
                className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-bright/70"
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
            <li key={i} className="flex gap-4 text-[14px] leading-[1.75] text-on-band-muted">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line-strong bg-white text-[10px] font-extrabold text-on-band-dim">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      )

    case 'note':
      return (
        <aside className="mb-7 rounded-xl border-l-2 border-accent-bright/50 bg-band-soft px-5 py-4">
          <p className={cx(monoLabel, 'text-accent-bright')}>{block.title}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-on-band-muted">{block.text}</p>
        </aside>
      )
  }
}
