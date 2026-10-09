import { useState } from 'react'
import { LuCheck, LuX } from 'react-icons/lu'
import type { Practice } from '../../types'
import { Button } from '../ui/Button'
import { inputClass } from '../ui/ProgressBar'
import { cx } from '../../lib/utils'

export function PracticeView({
  practice,
  done,
  onComplete,
}: {
  practice: Practice
  done: boolean
  onComplete: () => void
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [text, setText] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [error, setError] = useState('')

  const items = practice.items ?? []
  const answered = Object.keys(answers).length
  const allAnswered = answered === items.length

  const answer = (itemId: string, index: number) => {
    if (answers[itemId] !== undefined) return
    setAnswers((prev) => ({ ...prev, [itemId]: index }))
  }

  const finish = () => {
    if (practice.kind === 'written' && text.trim().length < 10 && !revealed) {
      setError('Write a few words first, or reveal the example answer.')
      return
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
                        disabled={hasAnswer}
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
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="Write your answer here. Two or three sentences is plenty."
            className={cx(inputClass, 'min-h-36 resize-y leading-relaxed')}
          />
          {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}

          {revealed && practice.modelAnswer && (
            <div className="mt-4 animate-rise rounded-xl border border-line bg-canvas px-4 py-4">
              <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-muted">
                Example answer
              </p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">
                {practice.modelAnswer}
              </p>
            </div>
          )}

          {!revealed && (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent-strong"
            >
              Reveal example answer
            </button>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-5">
        {done ? (
          <span className="inline-flex items-center gap-2 text-sm font-medium text-success">
            <LuCheck className="h-4 w-4" /> Practice complete
          </span>
        ) : (
          <>
            <Button
              onClick={finish}
              disabled={practice.kind === 'classify' && !allAnswered}
            >
              Complete practice
            </Button>
            {practice.kind === 'classify' && !allAnswered && (
              <span className="text-[13px] text-muted">
                Answer all {items.length} to finish.
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
