import { useState } from 'react'
import { LuCheck, LuSparkles, LuX } from 'react-icons/lu'
import type { Practice } from '../../types'
import { aiApi, type PracticeReviewResult } from '../../lib/api'
import { Button } from '../ui/Button'
import { inputClass } from '../ui/ProgressBar'
import { PreviewNotice } from './PreviewNotice'
import { cx } from '../../lib/utils'

export function PracticeView({
  practice,
  done,
  preview = false,
  onComplete,
}: {
  practice: Practice
  done: boolean
  preview?: boolean
  onComplete: () => void
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [text, setText] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [error, setError] = useState('')
  const [review, setReview] = useState<PracticeReviewResult | null>(null)
  const [checking, setChecking] = useState(false)

  const items = practice.items ?? []
  const answered = Object.keys(answers).length
  const allAnswered = answered === items.length

  const answer = (itemId: string, index: number) => {
    if (answers[itemId] !== undefined) return
    setAnswers((prev) => ({ ...prev, [itemId]: index }))
  }

  const handleCheckAi = async () => {
    if (text.trim().length < 5) {
      setError('Please type your response first before checking with AI.')
      return
    }
    setError('')
    setChecking(true)
    try {
      const res = await aiApi.reviewPractice({
        prompt: practice.prompt ?? practice.title,
        userAnswer: text.trim(),
        modelAnswer: practice.modelAnswer,
        topic: practice.title,
      })
      setReview(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not check answer with AI.')
    } finally {
      setChecking(false)
    }
  }

  const finish = async () => {
    if (practice.kind === 'written') {
      if (text.trim().length < 5 && !revealed) {
        setError('Write your answer first, or reveal the example answer.')
        return
      }
      if (!review && !revealed) {
        await handleCheckAi()
        return
      }
      if (review && !review.acceptable && !revealed) {
        setError('Please improve your answer to address the prompt, or reveal the example answer to continue.')
        return
      }
    }
    setError('')
    onComplete()
  }

  return (
    <div className="mx-auto max-w-3xl animate-rise">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-medium uppercase tracking-[0.08em] text-accent">
          Practice <span className="text-line-strong">·</span>
          <span className="ml-1 text-muted">{practice.minutes} min</span>
        </div>
        {practice.kind === 'classify' && !done && (
          <span className="text-[13px] text-muted">
            {answered} of {items.length} answered
          </span>
        )}
      </div>

      <h2 className="mt-2 text-2xl font-semibold text-ink">{practice.title}</h2>
      <p className="mt-2 text-[15.5px] leading-relaxed text-body">{practice.brief}</p>

      {practice.kind === 'classify' ? (
        <div className="mt-6 space-y-4">
          {items.map((item) => {
            const picked = answers[item.id]
            const hasAnswer = picked !== undefined
            const choiceIsRight = hasAnswer && picked === item.correctIndex

            return (
              <div key={item.id} className="rounded-xl border border-line bg-panel p-4 sm:p-5">
                <p className="text-[15px] font-semibold text-ink">{item.label}</p>
                {item.detail && <p className="mt-0.5 text-sm text-muted">{item.detail}</p>}

                <div className="mt-3.5 grid gap-2 sm:grid-cols-2">
                  {item.options.map((option, index) => {
                    const chosen = hasAnswer && picked === index
                    const correct = hasAnswer && item.correctIndex === index
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={hasAnswer || preview}
                        onClick={() => answer(item.id, index)}
                        className={cx(
                          'flex items-center justify-between gap-2 rounded-lg border px-3.5 py-2.5 text-left text-sm transition-all duration-150',
                          !hasAnswer &&
                            'border-line bg-panel text-body hover:border-accent/50 hover:bg-accent-soft/40',
                          correct && 'border-success bg-success-soft font-medium text-success',
                          chosen && !correct && 'border-danger bg-danger-soft text-danger',
                          hasAnswer && !correct && !chosen && 'border-line bg-canvas text-faint',
                        )}
                      >
                        <span>{option}</span>
                        {correct && <LuCheck className="h-4 w-4 shrink-0" />}
                        {chosen && !correct && <LuX className="h-4 w-4 shrink-0" />}
                      </button>
                    )
                  })}
                </div>

                {hasAnswer && (
                  <div
                    className={cx(
                      'mt-3 animate-rise rounded-lg border px-3.5 py-3',
                      choiceIsRight
                        ? 'border-success/30 bg-success-soft/70'
                        : 'border-warn/30 bg-warn-soft',
                    )}
                  >
                    <p
                      className={cx(
                        'text-[13px] font-semibold uppercase tracking-wide',
                        choiceIsRight ? 'text-success' : 'text-warn',
                      )}
                    >
                      {choiceIsRight ? 'Correct' : 'Not quite'}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{item.feedback}</p>
                    {!choiceIsRight && (
                      <p className="mt-1.5 text-[13px] text-muted">
                        Best answer: <span className="font-medium text-ink">{item.options[item.correctIndex]}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="mt-6">
          <label htmlFor="practice-answer" className="mb-2 block text-sm font-medium text-ink">
            {practice.prompt}
          </label>
          <textarea
            id="practice-answer"
            value={text}
            disabled={preview}
            onChange={(e) => {
              setText(e.target.value)
              if (error) setError('')
            }}
            rows={5}
            placeholder="Write your answer here. Explain the key concepts, mechanisms, or steps."
            className={cx(inputClass, 'min-h-32 resize-y leading-relaxed')}
          />

          {!preview && (
            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                onClick={() => void handleCheckAi()}
                loading={checking}
                disabled={text.trim().length < 5}
                variant={review?.acceptable ? 'secondary' : 'primary'}
              >
                <LuSparkles className="mr-2 h-4 w-4" />
                {review ? 'Re-check with AI' : 'Check answer with AI'}
              </Button>

              {!revealed && (
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className="text-sm font-medium text-muted transition-colors hover:text-ink"
                >
                  Reveal example answer
                </button>
              )}
            </div>
          )}

          {error && <p className="mt-2.5 text-[13px] text-danger">{error}</p>}

          {/* AI Review feedback card */}
          {review && (
            <div
              className={cx(
                'mt-5 animate-rise rounded-xl border p-4 sm:p-5',
                review.status === 'correct' && 'border-success/35 bg-success-soft/50',
                review.status === 'close' && 'border-warn/35 bg-warn-soft/50',
                review.status === 'needs_improvement' && 'border-danger/35 bg-danger-soft/50',
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={cx(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider',
                    review.status === 'correct' && 'bg-success text-band',
                    review.status === 'close' && 'bg-warn text-band',
                    review.status === 'needs_improvement' && 'bg-danger text-band',
                  )}
                >
                  {review.status === 'correct' ? (
                    <>
                      <LuCheck className="h-3.5 w-3.5" strokeWidth={3} />
                      Accurate & On Target
                    </>
                  ) : review.status === 'close' ? (
                    <>
                      <LuSparkles className="h-3.5 w-3.5" />
                      Close · Good Grasp
                    </>
                  ) : (
                    <>
                      <LuX className="h-3.5 w-3.5" strokeWidth={3} />
                      Needs Improvement
                    </>
                  )}
                </span>
                <span className="text-xs font-semibold text-muted">
                  Accuracy Score: {review.score}/100
                </span>
              </div>

              <div className="mt-3.5 space-y-2.5 text-sm leading-relaxed">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    What you got right
                  </p>
                  <p className="mt-0.5 text-ink">{review.feedback}</p>
                </div>

                <div className="border-t border-line/40 pt-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    How it can be better
                  </p>
                  <p className="mt-0.5 text-ink-soft">{review.improvements}</p>
                </div>
              </div>
            </div>
          )}

          {revealed && practice.modelAnswer && (
            <div className="mt-5 animate-rise rounded-xl border border-line bg-canvas px-4 py-4">
              <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-muted">
                Exemplar / Model answer
              </p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">
                {practice.modelAnswer}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-5">
        {done ? (
          <span className="inline-flex items-center gap-2 text-sm font-medium text-success">
            <LuCheck className="h-4 w-4" /> Practice complete
          </span>
        ) : preview ? (
          <PreviewNotice />
        ) : (
          <>
            <Button
              onClick={() => void finish()}
              loading={checking}
              disabled={
                (practice.kind === 'classify' && !allAnswered) ||
                (practice.kind === 'written' && !revealed && (!review || !review.acceptable))
              }
            >
              Complete practice
            </Button>
            {practice.kind === 'classify' && !allAnswered && (
              <span className="text-[13px] text-muted">
                Answer all {items.length} to finish.
              </span>
            )}
            {practice.kind === 'written' && !review && !revealed && (
              <span className="text-[13px] text-muted">
                Check with AI above to verify your answer before completing.
              </span>
            )}
            {practice.kind === 'written' && review && !review.acceptable && !revealed && (
              <span className="text-[13px] font-medium text-warn">
                Improve your answer above based on feedback, or reveal example answer.
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
