import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  LuArrowLeft,
  LuCheck,
  LuEye,
  LuTriangleAlert,
} from 'react-icons/lu'
import type { ActivityKind } from '../types'
import { useApp } from '../state/store'
import { isSectionAttendable, firstIncompleteBefore } from '../lib/sections'
import { contentIsAllVideo, contentResources, getSessionActivities, pathPercent } from '../data'
import { kindLabels } from '../components/learn/kinds'
import { LessonView } from '../components/learn/LessonView'
import { ResourceView } from '../components/learn/ResourceView'
import { PracticeView } from '../components/learn/PracticeView'
import { CheckView } from '../components/learn/CheckView'
import { SessionPending } from '../components/learn/SessionPending'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { cx } from '../lib/utils'

const order: ActivityKind[] = ['learn', 'read', 'practice', 'check']

const isTabParam = (value: string | null): value is ActivityKind =>
  value === 'learn' || value === 'read' || value === 'practice' || value === 'check'

export function SessionPage() {
  const { sectionId } = useParams()
  const {
    activePath,
    sessionContentFor,
    ensureSessionContent,
    completeActivity,
    toast,
    sessionContentError,
  } = useApp()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const section = activePath?.sections.find((s) => s.id === sectionId)
  const content = section ? sessionContentFor(section.id) : null
  const error = section ? sessionContentError(section.id) : null
  const resources = content ? contentResources(content) : []
  const activities =
    activePath && section && content
      ? getSessionActivities(activePath.id, section.id, content)
      : []

  const isDone = (id: string) => activePath?.completedActivities.includes(id) ?? false
  const doneCount = activities.filter((a) => isDone(a.id)).length
  const allDone = activities.length > 0 && doneCount === activities.length
  const sessionMinutes = activities.reduce((sum, a) => sum + a.minutes, 0)

  // Anything that is not the current (or a finished) section opens read-only:
  // learners can see everything ahead, but progress only counts once earlier
  // sections are done.
  const attendable = activePath && section ? isSectionAttendable(activePath, section.id) : false
  const preview = Boolean(section && !attendable)
  const blocker =
    activePath && section && preview ? firstIncompleteBefore(activePath, section.id) : null

  const [active, setActive] = useState<ActivityKind>(() => {
    // A ?tab= param in the URL wins so refreshes (and shared links) reopen
    // the same tab; otherwise resume at the first incomplete activity.
    const param = searchParams.get('tab')
    if (isTabParam(param)) return param
    return order.find((k) => !activities.some((a) => a.kind === k && isDone(a.id))) ?? 'learn'
  })
  const [view, setView] = useState<'activity' | 'complete'>(allDone ? 'complete' : 'activity')

  /** Switch tabs and mirror the choice into ?tab= (replace, not push). */
  const setActiveTab = (kind: ActivityKind) => {
    setActive(kind)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', kind)
        return next
      },
      { replace: true },
    )
  }

  // Normalize the URL so the default tab is also deep-linkable. Once ?tab=
  // is valid this is a no-op, so later tab switches never loop back here.
  useEffect(() => {
    if (isTabParam(searchParams.get('tab'))) return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', active)
        return next
      },
      { replace: true },
    )
  }, [searchParams, setSearchParams, active])

  useEffect(() => {
    if (section && !content && !error) {
      void ensureSessionContent(section.id)
    }
  }, [section, content, error, ensureSessionContent])

  if (!activePath) {
    return <Navigate to="/app/today" replace />
  }

  if (!section) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center sm:px-8">
        <h1 className="mt-4 text-xl font-semibold text-ink">Session not found</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          The section you are looking for is not on this path.
        </p>
        <Link to="/app/path" className="mt-6 inline-block">
          <Button variant="secondary">Back to learning path</Button>
        </Link>
      </div>
    )
  }

  if (error && !content) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center sm:px-8 animate-rise">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
          <LuTriangleAlert className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-ink">Could not load session</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          {error}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => void ensureSessionContent(section.id, true)}>
            Retry
          </Button>
          <Link to="/app/path">
            <Button variant="secondary">Back to path</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!content) return <SessionPending />

  const result = content
    ? activePath.assessmentResults[content.assessment.id]
    : undefined

  const complete = (kind: ActivityKind) => {
    if (preview) return
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
    if (next) setActiveTab(next)
    else setView('complete')
  }

  const percent = pathPercent(activePath)

  return (
    <div>
      {preview && (
        <div className="border-b border-line bg-canvas/70">
          <div className="mx-auto flex max-w-4xl items-start gap-3 px-5 py-3.5 sm:px-8">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-panel text-muted">
              <LuEye className="h-3.5 w-3.5" />
            </span>
            <p className="text-[13px] leading-relaxed text-muted">
              <span className="font-medium text-ink">You are previewing this session. </span>
              {blocker ? (
                <>Complete “{blocker.title}” to unlock it and track your progress.</>
              ) : (
                'Complete the earlier sections to unlock it and track your progress.'
              )}
            </p>
          </div>
        </div>
      )}

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
                    setActiveTab(activity.kind)
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
                  {activity.kind === 'read' && content && contentIsAllVideo(content)
                    ? 'Watch'
                    : kindLabels[activity.kind]}
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
                activityId={`${activePath.id}|${section.id}|learn`}
                lesson={content.lesson}
                done={isDone(`${activePath.id}|${section.id}|learn`)}
                preview={preview}
                onComplete={() => complete('learn')}
              />
            )}
            {active === 'read' && (
              <ResourceView
                activityId={`${activePath.id}|${section.id}|read`}
                resources={resources}
                done={isDone(`${activePath.id}|${section.id}|read`)}
                preview={preview}
                onComplete={() => complete('read')}
              />
            )}
            {active === 'practice' && (
              <PracticeView
                practice={content.practice}
                done={isDone(`${activePath.id}|${section.id}|practice`)}
                preview={preview}
                onComplete={() => complete('practice')}
              />
            )}
            {active === 'check' && (
              <CheckView
                assessment={content.assessment}
                result={result}
                preview={preview}
                onStart={() => navigate(`/app/assessment/${section.id}`)}
              />
            )}

            {/* mobile continue bar */}
            <div className="mt-10 flex items-center justify-between gap-3 border-t border-line pt-5 sm:hidden">
              <Button
                variant="ghost"
                onClick={() => {
                  const idx = order.indexOf(active)
                  if (idx > 0) setActiveTab(order[idx - 1])
                }}
                disabled={active === 'learn'}
              >
                Back
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const idx = order.indexOf(active)
                  if (idx < order.length - 1) setActiveTab(order[idx + 1])
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
        <div className="px-2.5 py-4 sm:px-3">
          <p className="text-base font-semibold text-ink sm:text-lg">{sessions}</p>
          <p className="mt-0.5 text-xs text-muted">Sessions</p>
        </div>
        <div className="px-2.5 py-4 sm:px-3">
          <p className="text-base font-semibold text-ink sm:text-lg">{percent}%</p>
          <p className="mt-0.5 text-xs text-muted">Path done</p>
        </div>
        <div className="px-2.5 py-4 sm:px-3">
          <p className="text-base font-semibold text-ink sm:text-lg">{minutes}m</p>
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
