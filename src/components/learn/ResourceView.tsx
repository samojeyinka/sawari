import { LuCheck } from 'react-icons/lu'
import type { Resource } from '../../types'
import { Button } from '../ui/Button'
import { cx } from '../../lib/utils'

const kindLabels: Record<Resource['kind'], string> = {
  article: 'Article',
  video: 'Video',
  book: 'Book',
  template: 'Template',
}

export function ResourceView({
  resource,
  done,
  onComplete,
}: {
  resource: Resource
  done: boolean
  onComplete: () => void
}) {
  return (
    <article className="mx-auto max-w-3xl animate-rise">
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-accent">
        Read <span className="text-line-strong">·</span>
        <span className="text-muted">{resource.minutes} min</span>
      </div>

      <div className="mt-2 flex items-start gap-4 rounded-xl border border-line bg-canvas/70 p-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-line bg-panel text-body">
          <ResourceGlyph kind={resource.kind} />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-ink">{resource.title}</h2>
          <p className="mt-1 text-[13px] text-muted">
            <span className={cx(resource.kind === 'template' && 'text-accent-strong')}>
              {kindLabels[resource.kind]}
            </span>{' '}
            · {resource.source} · {resource.minutes} min
          </p>
        </div>
      </div>

      <p className="mt-5 text-[16px] leading-[1.7] text-ink-soft">{resource.summary}</p>

      <div className="mt-4 space-y-4">
        {resource.body.map((paragraph, i) => (
          <p key={i} className="text-[15.5px] leading-[1.75] text-body">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-5">
        {done ? (
          <span className="inline-flex items-center gap-2 text-sm font-medium text-success">
            <LuCheck className="h-4 w-4" /> Marked as read
          </span>
        ) : (
          <>
            <Button onClick={onComplete}>Mark as read</Button>
            <span className="text-[13px] text-muted">Take your time, then move to practice.</span>
          </>
        )}
      </div>
    </article>
  )
}

function ResourceGlyph({ kind }: { kind: Resource['kind'] }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      {kind === 'template' ? (
        <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      ) : kind === 'video' ? (
        <path d="M9 7.5v9l7.5-4.5L9 7.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      ) : (
        <path
          d="M5 5.5A1.5 1.5 0 0 1 6.5 4H12v16H6.5A1.5 1.5 0 0 1 5 18.5v-13ZM19 5.5A1.5 1.5 0 0 0 17.5 4H12v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}
