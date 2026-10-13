import type { Resource } from '../../types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ResourceBlock } from '../learn/ResourceBlock'

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
        <ResourceBlock resource={resource} showHeader={false} />

        <div className="flex justify-end border-t border-line pt-4">
          <Button onClick={onClose}>{isVideo ? 'Done watching' : 'Done reading'}</Button>
        </div>
      </div>
    </Modal>
  )
}
