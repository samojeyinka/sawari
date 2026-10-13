import type { Resource } from '../../types'
import { domainOf } from '../../lib/media'
import { monoLabel } from '../layout/nav'
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
  const part =
    total !== undefined && total > 1 && index !== undefined
      ? ` · Part ${index + 1} of ${total}`
      : ''

  return (
    <section className="mt-10 border-t border-on-band/10 pt-10 first:mt-0 first:border-t-0 first:pt-0">
      {showHeader ? (
        <>
          <p className={monoLabel}>
            {kindVerbs[resource.kind]} · {resource.minutes} min base{part}
          </p>
          <h3 className="mt-3 font-display text-[22px] font-light leading-[1.2] tracking-[-0.015em] text-on-band">
            {resource.title}
          </h3>
          <p className={cx(monoLabel, 'mt-2')}>
            {kindLabels[resource.kind]} · {resource.source} · {resource.minutes} min
          </p>
        </>
      ) : (
        <p className={monoLabel}>
          {kindLabels[resource.kind]} · {resource.source}
          {domain && ` · ${domain}`} · {resource.minutes} min {isVideo ? 'watch' : 'read'}
        </p>
      )}

      {/* Video plays inline; articles/books get a rich link card with the description. */}
      {isVideo && resource.url && <MediaEmbed url={resource.url} title={resource.title} />}

      {!isVideo && resource.url && (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex items-center justify-between gap-3 border border-on-band/20 px-5 py-4 transition-colors hover:border-on-band/45"
        >
          <span className="min-w-0">
            <span className="block text-[14.5px] font-medium text-on-band">
              {ctaLabels[resource.kind]}
            </span>
            <span className={cx(monoLabel, 'mt-1 block')}>
              opens {domain ?? resource.source} in a new tab
            </span>
          </span>
          <span className={cx(monoLabel, 'shrink-0 text-accent-bright')}>open</span>
        </a>
      )}

      <div className="mt-6">
        <p className={monoLabel}>
          {isVideo ? 'video overview' : `about this ${kindLabels[resource.kind].toLowerCase()}`}
        </p>
        <p className="mt-2 text-[15.5px] leading-[1.7] text-on-band-muted">{resource.summary}</p>
      </div>

      {resource.body.length > 0 && (
        <div className="mt-6">
          <p className={monoLabel}>
            {isVideo ? 'key mechanisms covered in video' : 'key concepts to focus on'}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-on-band-dim">
            {isVideo
              ? 'Watch the video above and look for these practical domain principles:'
              : 'Read the full piece at the source above and extract these core concepts:'}
          </p>

          <ul className="mt-3 space-y-2.5">
            {resource.body.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3.5 border border-on-band/15 px-4 py-3.5 text-[14.5px] leading-relaxed text-on-band-muted"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border border-on-band/20 font-mono text-[11px] text-on-band-dim">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
