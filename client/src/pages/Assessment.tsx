import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { LuArrowLeft, LuCheck, LuX } from 'react-icons/lu'
import { useApp } from '../state/store'
import { isSectionAttendable } from '../lib/sections'
import { getSessionActivities } from '../data'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { cx } from '../lib/utils'

export function AssessmentPage() {
  const { sectionId } = useParams()
  const { activePath, sessionContentFor, submitAssessment, toast } = useApp()
  const navigate = useNavigate()

  const section = activePath?.sections.find((s) => s.id === sectionId)
  const content = section ? sessionContentFor(section.id) : null
  const assessment = content?.assessment
  const questions = assessment?.questions ?? []
  const sessionMinutes =
    activePath && section && content
      ? getSessionActivities(activePath.id, section.id, content).reduce(
          (sum, a) => sum + a.minutes,
          0,
        )
      : 0

  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null))
  const [phase, setPhase] = useState<'question' | 'results'>('question')

  if (!activePath || !section || !content || !assessment) {
    return <Navigate to="/app/today" replace />
  }

  // Checks are attendance only: previewing sections fall back to the session.
  if (!isSectionAttendable(activePath, section.id)) {
    return <Navigate to={`/app/session/${section.id}`} replace />
  }

  // Legacy or hand-made rows can carry an empty question list; bounce back
  // to the session instead of crashing on `questions[0]`.
  if (questions.length === 0) {
    return <Navigate to={`/app/session/${section.id}`} replace />
  }

  const question = questions[index]
  const selected = answers[index]
  const answeredCount = answers.filter((a) => a !== null).length

  const select = (choice: number) => {
    if (selected !== null) return
    setAnswers((prev) => prev.map((v, i) => (i === index ? choice : v)))
  }

  const next = () => {
    if (index < questions.length - 1) {
      setIndex(index + 1)
      return
    }
    const score = answers.reduce<number>(
      (sum, ans, i) => (ans !== null && ans === questions[i].correctIndex ? sum + 1 : sum),
      0,
    )
    submitAssessment(
      activePath.id,
      section.id,
      assessment.id,
      section.title,
      score,
      questions.length,
      sessionMinutes,
    )
    toast('Path updated')
    setPhase('results')
  }

  const restart = () => {
    setAnswers(questions.map(() => null))
    setIndex(0)
    setPhase('question')
  }

  const score = answers.reduce<number>(
    (sum, ans, i) => (ans !== null && ans === questions[i].correctIndex ? sum + 1 : sum),
    0,
  )

  const topic = assessment.topic ?? section.title.toLowerCase()
  const ratio = questions.length ? score / questions.length : 0
  const headline =
    ratio >= 0.8
      ? `You have a strong understanding of ${topic}.`
      : ratio >= 0.6
        ? `A good base in ${topic}. One short review and it will stick.`
        : `Worth another pass. We will start tomorrow with ${topic}.`

  const reviewLabel =
    score === questions.length
      ? 'Nothing, you are clear'
      : (assessment.reviewTopic ?? 'the questions you missed')

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8 sm:py-10">
      <Link
        to={`/app/session/${section.id}`}
        className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink"
      >
        <LuArrowLeft className="h-3.5 w-3.5" />
        {section.title}
      </Link>

      {phase === 'question' ? (
        <div className="animate-rise">
          <div className="mt-4 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-medium uppercase tracking-[0.08em] text-accent">
                Check your understanding
              </div>
              <h1 className="mt-1.5 text-xl font-semibold text-ink sm:text-2xl">
                Question {index + 1} of {questions.length}
              </h1>
            </div>
            <span className="shrink-0 whitespace-nowrap text-sm text-muted">
              {answeredCount} answered
            </span>
          </div>

          <ProgressBar
            value={(answeredCount / questions.length) * 100}
            className="mt-4"
            size="sm"
          />

          <div className="mt-6 rounded-xl border border-line bg-panel p-5 sm:p-6">
            <p className="text-[17px] font-semibold leading-relaxed text-ink">{question.prompt}</p>

            <div className="mt-5 space-y-2.5">
              {question.choices.map((choice, i) => {
                const chosen = selected === i
                const correct = selected !== null && question.correctIndex === i
                const wrong = chosen && selected !== question.correctIndex
                return (
                  <button
                    key={choice}
                    onClick={() => select(i)}
                    disabled={selected !== null}
                    className={cx(
                      'flex w-full items-center gap-3 rounded-lg border px-4 py-3.5 text-left text-[15px] transition-all duration-150',
                      selected === null &&
                        'border-line bg-panel text-body hover:border-accent/50 hover:bg-accent-soft/40',
                      correct && 'border-success bg-success-soft font-medium text-success',
                      wrong && 'border-danger bg-danger-soft text-danger',
                      selected !== null && !correct && !wrong && 'border-line bg-canvas text-faint',
                    )}
                  >
                    <span
                      className={cx(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold',
                        correct
                          ? 'border-success bg-success text-band'
                          : wrong
                            ? 'border-danger bg-danger text-band'
                            : 'border-line-strong text-muted',
                      )}
                    >
                      {correct ? (
                        <LuCheck className="h-3.5 w-3.5" strokeWidth={3} />
                      ) : wrong ? (
                        <LuX className="h-3.5 w-3.5" strokeWidth={3} />
                      ) : (
                        String.fromCharCode(65 + i)
                      )}
                    </span>
                    {choice}
                  </button>
                )
              })}
            </div>

            {selected !== null && (
              <div className="mt-5 animate-rise border-t border-line pt-4">
                <p
                  className={cx(
                    'text-[13px] font-semibold uppercase tracking-[0.06em]',
                    selected === question.correctIndex ? 'text-success' : 'text-danger',
                  )}
                >
                  {selected === question.correctIndex ? 'Correct' : 'Not the best move'}
                </p>
                <p className="mt-1.5 text-[15px] leading-relaxed text-body">
                  {question.explanation}
                </p>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="text-[13px] text-muted">
                    {index + 1 < questions.length
                      ? `${questions.length - index - 1} to go`
                      : 'Last question'}
                  </span>
                  <Button onClick={next}>
                    {index + 1 < questions.length ? 'Next question' : 'See your results'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="animate-rise">
          <div className="mt-4 text-xs font-medium uppercase tracking-[0.08em] text-accent">
            Results
          </div>

          <div className="mt-3 rounded-xl border border-line bg-panel px-5 py-8 text-center sm:px-6">
            <p className="text-4xl font-semibold text-ink">
              {score} <span className="text-line-strong">/</span> {questions.length}
            </p>
            <p className="mx-auto mt-3 max-w-md text-[15.5px] leading-relaxed text-ink-soft">
              {headline}
            </p>

            <div className="mx-auto mt-6 max-w-md space-y-2.5 text-left">
              <ResultRow tone="good" label="Understood" value={topic} />
              <ResultRow tone="warn" label="Review" value={reviewLabel} />
              <ResultRow
                tone="next"
                label="Next step"
                value={score === questions.length ? 'New material tomorrow' : 'Additional practice'}
              />
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-accent/25 bg-accent-soft/60 px-4 py-4">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-accent-strong">
              Path updated
            </p>
            <p className="mt-1 text-sm leading-relaxed text-accent-strong">
              {activePath.adaptationNote ??
                `Your path was checked against this result and stays on plan.`}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              size="lg"
              className="sm:w-auto"
              onClick={() => navigate(`/app/session/${section.id}`)}
            >
              Continue learning
            </Button>
            <button
              onClick={restart}
              className="inline-flex items-center justify-center text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              Retake the check
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ResultRow({
  tone,
  label,
  value,
}: {
  tone: 'good' | 'warn' | 'next'
  label: string
  value: string
}) {
  const toneClass = {
    good: 'text-success',
    warn: 'text-warn',
    next: 'text-muted',
  }[tone]
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-canvas/60 px-3.5 py-2.5">
      <span
        className={cx(
          'w-24 shrink-0 text-[13px] font-medium uppercase tracking-wide',
          toneClass,
        )}
      >
        {label}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{value}</span>
    </div>
  )
}
