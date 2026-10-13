import { LuCheck, LuLock } from 'react-icons/lu'
import type { Resource } from '../../types'
import { Button } from '../ui/Button'
import { formatPacingTime, useActivityPacing } from '../../hooks/useActivityPacing'
import { DigestionTracker } from './DigestionTracker'
import { PreviewNotice } from './PreviewNotice'
import { ResourceBlock } from './ResourceBlock'

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
      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-5">
        {done ? (
          <span className="inline-flex items-center gap-2 text-sm font-medium text-success">
            <LuCheck className="h-4 w-4" /> {allVideo ? 'Marked as watched' : 'Marked as read'}
          </span>
        ) : preview ? (
          <PreviewNotice />
        ) : !pacing.isUnlocked ? (
          <>
            <Button disabled variant="secondary" className="cursor-not-allowed opacity-60">
              <LuLock className="h-4 w-4" /> Unlocks in {formatPacingTime(pacing.remainingSeconds)}
            </Button>
            <span className="text-[13px] text-muted">
              {allVideo
                ? 'Absorb the videos. Unlocks after digestion time.'
                : 'Read the sources and reflect on key concepts.'}
            </span>
          </>
        ) : (
          <>
            <Button onClick={onComplete} variant="primary">
              <LuCheck className="h-4 w-4" />{' '}
              {allVideo ? 'Finish watching & continue' : 'Finish reading & continue'}
            </Button>
            <span className="text-[13px] text-muted">
              Pacing requirement met. Next up: hands-on practice.
            </span>
          </>
        )}
      </div>
    </article>
  )
}
