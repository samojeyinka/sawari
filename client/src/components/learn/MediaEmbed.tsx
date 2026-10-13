import { parseMediaUrl } from '../../lib/media'
import { monoLabel } from '../layout/nav'
import { cx } from '../../lib/utils'

/** Renders a video/site resource inline. YouTube and Vimeo play in an embedded
 *  frame; other sites get a clean "open on site" card. */
export function MediaEmbed({ url, title }: { url: string; title: string }) {
  const media = parseMediaUrl(url)
  if (!media) return null

  if (media.embedUrl) {
    return (
      <figure className="mt-5 border border-on-band/15 bg-band-deep">
        <div className="relative aspect-video w-full">
          <iframe
            src={media.embedUrl}
            title={title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
        <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-on-band/10 px-4 py-3">
          <span className={monoLabel}>playing from {media.label}</span>
          <a
            href={media.watchUrl}
            target="_blank"
            rel="noreferrer"
            className={cx(monoLabel, 'text-accent-bright transition-colors hover:text-on-band')}
          >
            open on {media.label}
          </a>
        </figcaption>
      </figure>
    )
  }

  return (
    <a
      href={media.watchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-5 flex items-center justify-between gap-3 border border-on-band/20 px-5 py-4 transition-colors hover:border-on-band/45"
    >
      <span className="text-[14.5px] font-medium text-on-band">Open resource on {media.label}</span>
      <span className={cx(monoLabel, 'shrink-0 text-accent-bright')}>open</span>
    </a>
  )
}
