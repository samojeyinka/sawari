import { LuExternalLink, LuPlay } from 'react-icons/lu'
import { parseMediaUrl } from '../../lib/media'

/** Renders a video/site resource inline. YouTube and Vimeo play in an embedded
 *  frame; other sites get a clean "open on site" card. */
export function MediaEmbed({ url, title }: { url: string; title: string }) {
  const media = parseMediaUrl(url)
  if (!media) return null

  if (media.embedUrl) {
    return (
      <figure className="mt-5 overflow-hidden rounded-xl border border-line bg-band-deep">
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
        <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-panel px-3.5 py-2.5 text-[12px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <LuPlay className="h-3.5 w-3.5 text-accent" />
            Playing from {media.label}
          </span>
          <a
            href={media.watchUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-accent transition-colors hover:text-accent-strong"
          >
            Open on {media.label}
            <LuExternalLink className="h-3.5 w-3.5" />
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
      className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-line bg-canvas/70 px-4 py-3.5 transition-colors hover:border-line-strong hover:bg-canvas"
    >
      <span className="inline-flex items-center gap-2.5 text-sm text-ink">
        <LuExternalLink className="h-4 w-4 text-accent" />
        Open resource on {media.label}
      </span>
      <LuExternalLink className="h-4 w-4 shrink-0 text-muted" />
    </a>
  )
}
