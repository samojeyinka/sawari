import type { Assessment, AssessmentResult } from '../../types'
import { Button } from '../ui/Button'
import { monoLabel } from '../layout/nav'
import { PreviewNotice } from './PreviewNotice'
import { cx } from '../../lib/utils'

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
      <p className={monoLabel}>check · {assessment.minutes} min</p>
      <h2 className="mt-3 font-display text-[26px] font-light leading-[1.15] tracking-[-0.025em] text-on-band sm:text-[32px]">
        {assessment.title}
      </h2>

      <div className="mt-5 border border-on-band/15 bg-panel p-5 sm:p-6">
        <p className="text-[15.5px] leading-relaxed text-on-band-muted">{assessment.intro}</p>
        <p className={cx(monoLabel, 'mt-3')}>
          {assessment.questions.length} questions · explanations after each answer
        </p>

        {result && (
          <div className="mt-4 border border-on-band/10 bg-band-deep px-4 py-3">
            <p className={monoLabel}>
              last time <span className="text-on-band">{result.score} / {result.total}</span> · {result.date}
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

      <p className="mt-4 text-[13px] text-on-band-dim">
        Finishing this updates your path with what to do next.
      </p>
    </div>
  )
}
