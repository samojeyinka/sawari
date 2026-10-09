import { LuCheck } from 'react-icons/lu'
import type { Lesson, LessonBlock } from '../../types'
import { Button } from '../ui/Button'
import { cx } from '../../lib/utils'

export function LessonView({
  lesson,
  done,
  onComplete,
}: {
  lesson: Lesson
  done: boolean
  onComplete: () => void
}) {
  return (
    <article className="mx-auto max-w-3xl animate-rise">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-accent">
        Learn <span className="text-line-strong">·</span>
        <span className="text-muted">{lesson.minutes} min</span>
      </div>
      <h2 className="mt-2 text-2xl font-semibold text-ink">{lesson.title}</h2>
      <p className="mt-3 border-l-2 border-accent/40 pl-4 text-[16px] leading-relaxed text-ink-soft">
        {lesson.intro}
      </p>

      <div className="mt-6">
        {lesson.blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-5">
        {done ? (
          <span className="inline-flex items-center gap-2 text-sm font-medium text-success">
            <LuCheck className="h-4 w-4" /> Lesson complete
          </span>
        ) : (
          <>
            <Button onClick={onComplete}>Mark lesson complete</Button>
            <span className="text-[13px] text-muted">
              Next up: the reading, then practice.
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
      return (
        <p className="mb-4 text-[15.5px] leading-[1.75] text-body">{block.text}</p>
      )
    case 'h':
      return (
        <h3 className="mb-2.5 mt-7 text-[17px] font-semibold text-ink">{block.text}</h3>
      )
    case 'list':
      return (
        <ul className="mb-5 space-y-2.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-[15.5px] leading-[1.7] text-body">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )
    case 'steps':
      return (
        <ol className="mb-5 space-y-3">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3.5 text-[15.5px] leading-[1.7] text-body">
              <span
                className={cx(
                  'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                  'border border-line bg-canvas text-xs font-semibold text-ink',
                )}
              >
                {i + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      )
    case 'note':
      return (
        <aside className="mb-6 rounded-lg border border-accent/25 bg-accent-soft/50 px-4 py-3.5">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-accent-strong">
            {block.title}
          </p>
          <p className="mt-1 text-[15px] leading-relaxed text-ink-soft">{block.text}</p>
        </aside>
      )
  }
}
