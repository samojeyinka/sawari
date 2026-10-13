import type { Resource } from '../../types'
import { Button } from '../ui/Button'
import { monoLabel } from '../layout/nav'
import { formatPacingTime, useActivityPacing } from '../../hooks/useActivityPacing'
import { DigestionTracker } from './DigestionTracker'
import { PreviewNotice } from './PreviewNotice'
import { ResourceBlock } from './ResourceBlock'
import { cx } from '../../lib/utils'

export function ResourceView({
  activityId,
  resources,
  done,
  preview = false,
  onComplete,
}: {
  activityId: string
  resources: Resource[]
  done: boolean
  preview?: boolean
  onComplete: () => void
}) {
  const totalMinutes = resources.reduce((sum, r) => sum + r.minutes, 0)
  const allVideo = resources.length > 0 && resources.every((r) => r.kind === 'video')

  const pacing = useActivityPacing({
    activityId,
    baseMinutes: totalMinutes,
    done,
    disabled: preview,
  })

  return (
    <article className="mx-auto max-w-3xl animate-rise">
      {resources.map((resource, i) => (
        <ResourceBlock key={resource.id} resource={resource} index={i} total={resources.length} />
      ))}

      {/* Digestion pacing tracker */}
      {!preview && <DigestionTracker pacing={pacing} baseMinutes={totalMinutes} />}

      {/* Action / Completion bar */}
      <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-on-band/10 pt-6">
        {done ? (
          <span className={cx(monoLabel, 'text-success-bright')}>
            {allVideo ? 'marked as watched' : 'marked as read'}
          </span>
        ) : preview ? (
          <PreviewNotice />
        ) : !pacing.isUnlocked ? (
          <Button disabled variant="secondary">
            Unlocks in {formatPacingTime(pacing.remainingSeconds)}
          </Button>
        ) : (
          <Button onClick={onComplete} variant="primary">
            {allVideo ? 'Finish watching & continue' : 'Finish reading & continue'}
          </Button>
        )}
      </div>
    </article>
  )
}
