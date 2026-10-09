import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  LuArrowLeft,
  LuCheck,
  LuLock,
} from 'react-icons/lu'
import type { ActivityKind } from '../types'
import { useApp } from '../state/store'
import { getSessionActivities, pathPercent } from '../data'
import { kindLabels } from '../components/learn/kinds'
import { LessonView } from '../components/learn/LessonView'
import { ResourceView } from '../components/learn/ResourceView'
import { PracticeView } from '../components/learn/PracticeView'
import { CheckView } from '../components/learn/CheckView'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { cx } from '../lib/utils'

const order: ActivityKind[] = ['learn', 'read', 'practice', 'check']

export function SessionPage() {
  const { sectionId } = useParams()
  const { activePath, sessionContentFor, completeActivity, toast } = useApp()
  const navigate = useNavigate()

  const section = activePath?.sections.find((s) => s.id === sectionId)
  const content = section ? sessionContentFor(section.id) : null
  const activities =
    activePath && section && content
      ? getSessionActivities(activePath.id, section.id, content)
      : []

  const isDone = (id: string) => activePath?.completedActivities.includes(id) ?? false
  const doneCount = activities.filter((a) => isDone(a.id)).length
  const allDone = activities.length > 0 && doneCount === activities.length
  const sessionMinutes = activities.reduce((sum, a) => sum + a.minutes, 0)

  const [active, setActive] = useState<ActivityKind>(
    () => order.find((k) => !activities.some((a) => a.kind === k && isDone(a.id))) ?? 'learn',
  )
  const [view, setView] = useState<'activity' | 'complete'>(allDone ? 'complete' : 'activity')

  if (!activePath) {
    return <Navigate to="/app/today" replace />
  }

  if (!section || !content) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center sm:px-8">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-canvas-deep text-muted">
          <LuLock className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-ink">
          {!section
            ? 'Session not found'
            : section.status === 'locked'
              ? 'This section is locked'
              : 'This session opens later'}
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          {section?.note ??
            'Finish the current section first and this one opens up on its own.'}
        </p>
        <Link to="/app/path" className="mt-6 inline-block">
          <Button variant="secondary">Back to learning path</Button>
        </Link>
      </div>
    )
  }

  const result = content
    ? activePath.assessmentResults[content.assessment.id]
    : undefined

  const complete = (kind: ActivityKind) => {
    const activity = activities.find((a) => a.kind === kind)
    if (!activity) return
    const othersDone = order
      .filter((k) => k !== kind)
      .every((k) => activities.some((a) => a.kind === k && isDone(a.id)))

    completeActivity(activePath.id, section.id, kind, activity.title, sessionMinutes)

    if (othersDone) {
      setView('complete')
      toast('Session complete')
      return
    }
    const next = order.find(
      (k) => k !== kind && !activities.some((a) => a.kind === k && isDone(a.id)),
    )
    if (next) setActive(next)
    else setView('complete')
  }

  const percent = pathPercent(activePath)

  return (
    <div>
      {/* session header */}
      <header className="border-b border-line bg-panel">
        <div className="mx-auto max-w-4xl px-5 pt-5 sm:px-8">
          <Link
            to="/app/path"
            className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink"
          >
            <LuArrowLeft className="h-3.5 w-3.5" />
            {activePath.subject}
          </Link>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-ink sm:text-2xl">{section.title}</h1>
              <p className="mt-1 text-sm text-muted">
                {sessionMinutes} min · {doneCount} of {activities.length} activities complete
              </p>
            </div>
            <div className="hidden w-44 sm:block">
              <ProgressBar value={(doneCount / activities.length) * 100} />
            </div>
          </div>

          <nav className="mt-4 flex gap-1 overflow-x-auto">
            {activities.map((activity, i) => {
              const done = isDone(activity.id)
              const isActive = active === activity.kind
              return (
                <button
                  key={activity.id}
                  onClick={() => {
                    setView('activity')
                    setActive(activity.kind)
                  }}
                  className={cx(
                    'relative flex shrink-0 items-center gap-2 px-3 py-3 text-sm transition-colors duration-150',
                    isActive ? 'font-medium text-ink' : 'text-muted hover:text-ink',
                  )}
                >
                  <span
                    className={cx(
                      'flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors',
                      done
                        ? 'border-success/30 bg-success-soft text-success'
                        : isActive
                          ? 'border-accent text-accent'
                          : 'border-line text-muted',
                    )}
                  >
                    {done ? <LuCheck className="h-3 w-3" strokeWidth={3} /> : i + 1}
                  </span>
                  {kindLabels[activity.kind]}
                  <span className="hidden text-faint sm:inline">· {activity.minutes} min</span>
                  <span
                    className={cx(
                      'absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-accent transition-all duration-200',
                      isActive ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* activity body */}
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
        {view === 'complete' ? (
          <SessionComplete
            minutes={sessionMinutes}
            sessions={activePath.stats.sessionsCompleted}
            percent={percent}
            adaptationNote={activePath.adaptationNote}
            onReview={() => setView('activity')}
            onContinue={() => navigate('/app/today')}
          />
        ) : (
          <>
            {active === 'learn' && (
              <LessonView
                lesson={content.lesson}
                done={isDone(`${activePath.id}|${section.id}|learn`)}
                onComplete={() => complete('learn')}
              />
            )}
            {active === 'read' && (
              <ResourceView
                resource={content.resource}
                done={isDone(`${activePath.id}|${section.id}|read`)}
                onComplete={() => complete('read')}
              />
            )}
            {active === 'practice' && (
              <PracticeView
                practice={content.practice}
                done={isDone(`${activePath.id}|${section.id}|practice`)}
                onComplete={() => complete('practice')}
              />
            )}
            {active === 'check' && (
              <CheckView
                assessment={content.assessment}
                result={result}
                onStart={() => navigate(`/app/assessment/${section.id}`)}
              />
            )}

            {/* mobile continue bar */}
            <div className="mt-10 flex items-center justify-between gap-3 border-t border-line pt-5 sm:hidden">
              <Button
                variant="ghost"
                onClick={() => {
                  const idx = order.indexOf(active)
                  if (idx > 0) setActive(order[idx - 1])
                }}
                disabled={active === 'learn'}
              >
                Back
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const idx = order.indexOf(active)
                  if (idx < order.length - 1) setActive(order[idx + 1])
                }}
                disabled={active === 'check'}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SessionComplete({
  minutes,
  sessions,
  percent,
  adaptationNote,
  onReview,
  onContinue,
}: {
  minutes: number
  sessions: number
  percent: number
  adaptationNote: string | null
  onReview: () => void
  onContinue: () => void
}) {
  return (
    <div className="mx-auto max-w-xl py-6 text-center animate-rise">
      <h2 className="mt-5 text-2xl font-semibold text-ink">Session complete.</h2>
      <p className="mt-1.5 text-[15px] text-muted">{minutes} minutes completed.</p>

      <div className="mt-7 grid grid-cols-3 divide-x divide-line rounded-xl border border-line">
        <div className="px-3 py-4">
          <p className="text-lg font-semibold text-ink">{sessions}</p>
          <p className="mt-0.5 text-xs text-muted">Sessions</p>
        </div>
        <div className="px-3 py-4">
          <p className="text-lg font-semibold text-ink">{percent}%</p>
          <p className="mt-0.5 text-xs text-muted">Path done</p>
        </div>
        <div className="px-3 py-4">
          <p className="text-lg font-semibold text-ink">{minutes}m</p>
          <p className="mt-0.5 text-xs text-muted">Learned today</p>
        </div>
      </div>

      {adaptationNote && (
        <p className="mt-5 rounded-xl border border-accent/25 bg-accent-soft/60 px-4 py-3 text-left text-sm leading-relaxed text-accent-strong">
          {adaptationNote}
        </p>
      )}

      <div className="mt-7 flex flex-col items-center gap-3">
        <Button size="lg" className="w-full sm:w-auto" onClick={onContinue}>
          Continue
        </Button>
        <button
          onClick={onReview}
          className="text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          Review the activities
        </button>
      </div>
    </div>
  )
}
