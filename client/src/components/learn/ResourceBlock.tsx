import { LuBookOpen, LuCompass, LuExternalLink, LuPlay } from 'react-icons/lu'
import type { Resource } from '../../types'
import { domainOf } from '../../lib/media'
import { MediaEmbed } from './MediaEmbed'
import { cx } from '../../lib/utils'

const kindLabels: Record<Resource['kind'], string> = {
  article: 'Article',
  video: 'Video',
  book: 'Book',
  template: 'Template',
}

const kindVerbs: Record<Resource['kind'], string> = {
  article: 'Read',
  video: 'Watch',
  book: 'Read',
  template: 'Use',
}

const ctaLabels: Record<Resource['kind'], string> = {
  article: 'Read full article',
  video: 'Watch video',
  book: 'Open book',
  template: 'Open template',
}

/**
 * One full resource: header, playable video or a rich article link card
 * (link + description), summary, and key takeaways. Shared by the session
 * reader and the resource preview modal so both stay identical.
 */
export function ResourceBlock({
  resource,
  index,
  total,
  showHeader = true,
}: {
  resource: Resource
  index?: number
  total?: number
  showHeader?: boolean
}) {
  const isVideo = resource.kind === 'video'
  const domain = domainOf(resource.url)
  const part = total !== undefined && total > 1 && index !== undefined ? ` · Part ${index + 1} of ${total}` : ''

  return (
    <section className="mt-10 first:mt-0">
      {showHeader ? (
        <>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-accent">
            {kindVerbs[resource.kind]} <span className="text-line-strong">·</span>
            <span className="text-muted">
              {resource.minutes} min base{part}
            </span>
          </div>

          <div className="mt-2 flex items-start justify-between gap-4 rounded-xl border border-line bg-canvas/70 p-4">
            <div className="flex min-w-0 items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-line bg-panel text-body">
                <ResourceGlyph kind={resource.kind} />
              </span>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-ink">{resource.title}</h3>
                <p className="mt-1 text-[13px] text-muted">
                  <span className={cx(resource.kind === 'template' && 'text-accent-strong')}>
                    {kindLabels[resource.kind]}
                  </span>{' '}
                  · {resource.source} · {resource.minutes} min
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
          <span
            className={cx(
              'rounded-md border border-line px-2 py-0.5 text-xs font-medium uppercase tracking-wide',
              resource.kind === 'template' ? 'text-accent-strong' : 'text-body',
            )}
          >
            {kindLabels[resource.kind]}
          </span>
          <span>{resource.source}</span>
          {domain && <span>{domain}</span>}
          <span>
            {resource.minutes} min {isVideo ? 'watch' : 'read'}
          </span>
        </div>
      )}

      {/* Video plays inline; articles/books get a rich link card with the description. */}
      {isVideo && resource.url && <MediaEmbed url={resource.url} title={resource.title} />}

      {!isVideo && resource.url && (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent-soft p-4 transition-colors hover:bg-accent/20"
        >
          <span className="min-w-0">
            <span className="flex items-center gap-2 text-sm font-semibold text-accent-strong">
              <LuBookOpen className="h-4 w-4 shrink-0" />
              {ctaLabels[resource.kind]}
            </span>
            <span className="mt-0.5 block text-[12.5px] text-muted">
              Opens {domain ?? resource.source} in a new tab · {resource.minutes} min{' '}
              {isVideo ? 'watch' : 'read'}
            </span>
          </span>
          <LuExternalLink className="h-4 w-4 shrink-0 text-accent" />
        </a>
      )}

      <div className="mt-6 rounded-xl border border-line bg-panel/50 p-5">
        <h4 className="text-sm font-semibold uppercase tracking-[0.05em] text-accent">
          {isVideo ? 'Video Overview' : `About this ${kindLabels[resource.kind].toLowerCase()} & Study Scope`}
        </h4>
        <p className="mt-2 text-[15.5px] leading-[1.7] text-ink-soft">{resource.summary}</p>

        {resource.url && !isVideo && (
          <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3.5">
            <span className="text-[12.5px] text-muted">
              Source: <strong className="text-ink">{resource.source}</strong>
              {domain && (
                <>
                  {' '}
                  · <span>{domain}</span>
                </>
              )}
            </span>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline"
            >
              Open original source <LuExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      {resource.body.length > 0 && (
        <div className="mt-6">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <LuCompass className="h-4 w-4 text-accent" />
            {isVideo ? 'Key Mechanisms Covered in Video' : 'Key Concepts to Focus On & Learn'}
          </h4>
          <p className="mt-1 text-xs text-muted">
            {isVideo
              ? 'Watch the video above and look for these practical domain principles:'
              : 'Read the full piece at the source above and extract these core concepts:'}
          </p>

          <div className="mt-3.5 space-y-2.5">
            {resource.body.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-line bg-canvas/60 p-3.5 text-[14.5px] leading-relaxed text-body"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[11px] font-semibold text-accent">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">{item}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function ResourceGlyph({ kind }: { kind: Resource['kind'] }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      {kind === 'template' ? (
        <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      ) : kind === 'video' ? (
        <LuPlay className="h-5 w-5" />
      ) : (
        <LuBookOpen className="h-5 w-5" />
      )}
    </svg>
  )
}
