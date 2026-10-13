import { useState } from 'react'
import type { Practice } from '../../types'
import { aiApi, type PracticeReviewResult } from '../../lib/api'
import { Button } from '../ui/Button'
import { inputClass } from '../ui/ProgressBar'
import { monoLabel } from '../layout/nav'
import { PreviewNotice } from './PreviewNotice'
import { cx } from '../../lib/utils'

const reviewTone: Record<
  PracticeReviewResult['status'],
  { text: string; box: string; label: string }
> = {
  correct: {
    text: 'text-success-bright',
    box: 'border-success-bright/40 bg-success-bright/10',
    label: 'Accurate & On Target',
  },
  close: {
    text: 'text-warn-bright',
    box: 'border-warn-bright/40 bg-warn-bright/10',
    label: 'Close · Good Grasp',
  },
  needs_improvement: {
    text: 'text-danger-bright',
    box: 'border-danger-bright/40 bg-danger-bright/10',
    label: 'Needs Improvement',
  },
}

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
      <div className="flex items-start justify-between gap-3">
        <p className={monoLabel}>practice · {practice.minutes} min</p>
        {practice.kind === 'classify' && !done && (
          <p className={monoLabel}>
            {answered} of {items.length} answered
          </p>
        )}
      </div>

      <h2 className="mt-3 font-display text-[26px] font-light leading-[1.15] tracking-[-0.025em] text-on-band sm:text-[32px]">
        {practice.title}
      </h2>
      <p className="mt-3 text-[15.5px] leading-relaxed text-on-band-muted">{practice.brief}</p>

      {practice.kind === 'classify' ? (
        <div className="mt-6 space-y-4">
          {items.map((item) => {
            const picked = answers[item.id]
            const hasAnswer = picked !== undefined
            const choiceIsRight = hasAnswer && picked === item.correctIndex

            return (
              <div key={item.id} className="border border-on-band/15 bg-panel p-4 sm:p-5">
                <p className="text-[15px] font-medium text-on-band">{item.label}</p>
                {item.detail && <p className="mt-0.5 text-sm text-on-band-dim">{item.detail}</p>}

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
                          'flex items-center justify-between gap-2 border px-3.5 py-2.5 text-left text-sm transition-colors duration-150',
                          !hasAnswer &&
                            'border-on-band/20 text-on-band hover:border-on-band/45 hover:bg-on-band/[0.03]',
                          correct && 'border-success-bright/40 bg-success-bright/10 font-medium text-success-bright',
                          chosen && !correct && 'border-danger-bright/40 bg-danger-bright/10 text-danger-bright',
                          hasAnswer && !correct && !chosen && 'border-on-band/10 text-on-band-dim',
                        )}
                      >
                        <span>{option}</span>
                        {correct && (
                          <span className={cx(monoLabel, 'shrink-0 text-success-bright')}>correct</span>
                        )}
                        {chosen && !correct && (
                          <span className={cx(monoLabel, 'shrink-0 text-danger-bright')}>yours</span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {hasAnswer && (
                  <div
                    className={cx(
                      'mt-3 border px-3.5 py-3',
                      choiceIsRight
                        ? 'border-success-bright/40 bg-success-bright/10'
                        : 'border-warn-bright/40 bg-warn-bright/10',
                    )}
                  >
                    <p
                      className={cx(
                        monoLabel,
                        choiceIsRight ? 'text-success-bright' : 'text-warn-bright',
                      )}
                    >
                      {choiceIsRight ? 'correct' : 'not quite'}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-on-band-muted">{item.feedback}</p>
                    {!choiceIsRight && (
                      <p className="mt-1.5 text-[13px] text-on-band-dim">
                        Best answer: <span className="font-medium text-on-band">{item.options[item.correctIndex]}</span>
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
          <label htmlFor="practice-answer" className="mb-2 block text-sm font-medium text-on-band">
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
            <div className="mt-3.5 flex flex-wrap items-center gap-4">
              <Button
                type="button"
                onClick={() => void handleCheckAi()}
                disabled={checking || text.trim().length < 5}
                variant={review?.acceptable ? 'secondary' : 'primary'}
              >
                {checking ? 'Checking…' : review ? 'Re-check with AI' : 'Check answer with AI'}
              </Button>

              {!revealed && (
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className={cx(monoLabel, 'transition-colors hover:text-on-band')}
                >
                  reveal example answer
                </button>
              )}
            </div>
          )}

          {error && <p className="mt-2.5 text-[13px] text-danger-bright">{error}</p>}

          {/* AI Review feedback card */}
          {review && (
            <div className={cx('mt-5 border p-4 sm:p-5', reviewTone[review.status].box)}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={cx(monoLabel, reviewTone[review.status].text)}>
                  {reviewTone[review.status].label}
                </p>
                <p className={monoLabel}>accuracy score {review.score}/100</p>
              </div>

              <div className="mt-3 space-y-2.5 text-sm leading-relaxed">
                <div>
                  <p className={cx(monoLabel, 'text-on-band-dim')}>what you got right</p>
                  <p className="mt-1 text-on-band">{review.feedback}</p>
                </div>

                <div className="border-t border-on-band/10 pt-2.5">
                  <p className={cx(monoLabel, 'text-on-band-dim')}>how it can be better</p>
                  <p className="mt-1 text-on-band-muted">{review.improvements}</p>
                </div>
              </div>
            </div>
          )}

          {revealed && practice.modelAnswer && (
            <div className="mt-5 border border-on-band/15 bg-band-deep px-5 py-4">
              <p className={monoLabel}>exemplar / model answer</p>
              <p className="mt-2 text-[15px] leading-relaxed text-on-band-muted">
                {practice.modelAnswer}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-on-band/10 pt-6">
        {done ? (
          <span className={cx(monoLabel, 'text-success-bright')}>practice complete</span>
        ) : preview ? (
          <PreviewNotice />
        ) : (
          <>
            <Button
              onClick={() => void finish()}
              disabled={
                checking ||
                (practice.kind === 'classify' && !allAnswered) ||
                (practice.kind === 'written' && !revealed && (!review || !review.acceptable))
              }
            >
              Complete practice
            </Button>
            {practice.kind === 'classify' && !allAnswered && (
              <span className="text-[13px] text-on-band-dim">
                Answer all {items.length} to finish.
              </span>
            )}
            {practice.kind === 'written' && !review && !revealed && (
              <span className="text-[13px] text-on-band-dim">
                Check with AI above to verify your answer before completing.
              </span>
            )}
            {practice.kind === 'written' && review && !review.acceptable && !revealed && (
              <span className="text-[13px] font-medium text-warn-bright">
                Improve your answer above based on feedback, or reveal example answer.
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
