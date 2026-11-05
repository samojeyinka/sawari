import type { Assessment, AssessmentResult } from '../../types'
import { Button } from '../ui/Button'
import { monoLabel } from '../layout/nav'
import { PreviewNotice } from './PreviewNotice'
import { cx, formatDuration } from '../../lib/utils'

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
      <p className={monoLabel}>check · {formatDuration(assessment.minutes)}</p>
      <h2 className="mt-3 font-display text-[26px] font-extrabold leading-[1.1] tracking-[-0.04em] text-on-band sm:text-[32px]">
        {assessment.title}
      </h2>

      <div className="mt-5 rounded-2xl border border-line bg-white p-5 shadow-[0_8px_28px_rgba(33,27,42,.04)] sm:p-6">
        <p className="text-[14px] leading-relaxed text-on-band-muted">{assessment.intro}</p>
        <p className={cx(monoLabel, 'mt-3')}>
          {assessment.questions.length} questions · explanations after each answer
        </p>

        {result && (
          <div className="mt-4 rounded-xl border border-line bg-band-soft px-4 py-3">
            <p className={monoLabel}>
              last time <span className="font-bold text-on-band">{result.score} / {result.total}</span> · {result.date}
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
