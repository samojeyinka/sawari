import type { Resource } from '../../types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { MediaEmbed } from '../learn/MediaEmbed'
import { cx } from '../../lib/utils'

const kindLabels: Record<Resource['kind'], string> = {
  article: 'Article',
  video: 'Video',
  book: 'Book',
  template: 'Template',
}

export function ResourcePreviewModal({
  open,
  resource,
  onClose,
}: {
  open: boolean
  resource: Resource | null
  onClose: () => void
}) {
  if (!resource) return null

  const isVideo = resource.kind === 'video'

  return (
    <Modal open={open} onClose={onClose} size="lg" title={resource.title}>
      <div className="space-y-4">
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
          <span>
            {resource.minutes} min {isVideo ? 'watch' : 'read'}
          </span>
        </div>

        {resource.url && <MediaEmbed url={resource.url} title={resource.title} />}

        <p className="text-[15px] leading-relaxed text-ink-soft">{resource.summary}</p>

        <div className="space-y-4 border-t border-line pt-4">
          {resource.body.map((paragraph, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-body">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="flex justify-end border-t border-line pt-4">
          <Button onClick={onClose}>{isVideo ? 'Done watching' : 'Done reading'}</Button>
        </div>
      </div>
    </Modal>
  )
}
