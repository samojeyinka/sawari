import type { Assessment, AssessmentResult } from '../../types'
import { Button } from '../ui/Button'
import { PreviewNotice } from './PreviewNotice'

export function CheckView({
  assessment,
  result,
  preview = false,
  onStart,
}: {
  assessment: Assessment
  result?: AssessmentResult
  preview?: boolean
  onStart: () => void
}) {
  return (
    <div className="mx-auto max-w-3xl animate-rise">
      <div className="text-xs font-medium uppercase tracking-[0.08em] text-accent">
        Check <span className="text-line-strong">·</span>
        <span className="ml-1 text-muted">{assessment.minutes} min</span>
      </div>
      <h2 className="mt-2 text-2xl font-semibold text-ink">{assessment.title}</h2>

      <div className="mt-5 rounded-xl border border-line bg-canvas/70 p-5 sm:p-6">
        <p className="text-[15.5px] leading-relaxed text-ink-soft">{assessment.intro}</p>
        <p className="mt-2 text-sm text-muted">
          {assessment.questions.length} questions. You will see why each answer works before moving
          on.
        </p>

        {result && (
          <div className="mt-4 rounded-lg border border-line bg-panel px-4 py-3">
            <p className="text-sm text-muted">
              Last time:{' '}
              <span className="font-semibold text-ink">
                {result.score} / {result.total}
              </span>{' '}
              on {result.date}
            </p>
          </div>
        )}
      </div>

      <div className="mt-6">
        {preview ? (
          <PreviewNotice />
        ) : (
          <Button size="lg" onClick={onStart}>
            {result ? 'Retake the check' : 'Start the check'}
          </Button>
        )}
      </div>

      <p className="mt-4 text-[13px] text-muted">
        Finishing this updates your path with what to do next.
      </p>
    </div>
  )
}
