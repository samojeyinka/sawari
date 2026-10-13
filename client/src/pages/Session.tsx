import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
import { ProgressBar } from '../components/ui/ProgressBar'
import { monoLabel } from '../components/layout/nav'
import { cx } from '../lib/utils'

const order: ActivityKind[] = ['learn', 'read', 'practice', 'check']

const isTabParam = (value: string | null): value is ActivityKind =>
  value === 'learn' || value === 'read' || value === 'practice' || value === 'check'

const primaryBtn =
  'group relative inline-flex h-12 items-center justify-center overflow-hidden bg-on-band px-7 ' +
  'text-[14.5px] font-medium text-band transition-colors disabled:pointer-events-none disabled:opacity-50'
const ghostBtn =
  'inline-flex h-12 items-center justify-center border border-on-band/20 px-6 text-[14.5px] ' +
  'text-on-band transition-colors hover:border-on-band/45 disabled:pointer-events-none disabled:opacity-40'
const smallGhost =
  'inline-flex h-10 items-center justify-center border border-on-band/20 px-4 text-[13px] ' +
  'text-on-band transition-colors hover:border-on-band/45 disabled:pointer-events-none disabled:opacity-40'

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
    activePath && section && content ? getSessionActivities(activePath.id, section.id, content) : []

  const isDone = (id: string) => activePath?.completedActivities.includes(id) ?? false
  const doneCount = activities.filter((a) => isDone(a.id)).length
  const allDone = activities.length > 0 && doneCount === activities.length
  const sessionMinutes = activities.reduce((sum, a) => sum + a.minutes, 0)

  // Anything that is not the current (or a finished) section opens read-only:
  // learners can see everything ahead, but progress only counts once earlier
  // sections are done.
  const attendable = activePath && section ? isSectionAttendable(activePath, section.id) : false
  const preview = Boolean(section && !attendable)
  const blocker = activePath && section && preview ? firstIncompleteBefore(activePath, section.id) : null

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
      <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
        <div className="border border-on-band/15 bg-panel px-8 py-16 text-center">
          <p className={monoLabel}>not found</p>
          <h1 className="mt-4 font-display text-[28px] font-light tracking-[-0.025em] text-on-band">
            That session is not on this path.
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-[14.5px] leading-relaxed text-on-band-muted">
            The section you are looking for does not exist, or it was removed.
          </p>
          <Link to="/app/path" className={cx(ghostBtn, 'mt-7')}>
            Back to learning path
          </Link>
        </div>
      </div>
    )
  }

  if (error && !content) {
    return (
      <div className="mx-auto max-w-3xl animate-rise px-5 py-20 sm:px-8">
        <div className="border border-danger-bright/40 bg-panel px-8 py-16 text-center">
          <p className={cx(monoLabel, 'text-danger-bright')}>could not load</p>
          <h1 className="mt-4 font-display text-[28px] font-light tracking-[-0.025em] text-on-band">
            This session did not load.
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-[14.5px] leading-relaxed text-on-band-muted">
            {error}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => void ensureSessionContent(section.id, true)}
              className={primaryBtn}
            >
              Try again
            </button>
            <Link to="/app/path" className={ghostBtn}>
              Back to path
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!content) return <SessionPending />

  const result = content ? activePath.assessmentResults[content.assessment.id] : undefined

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
    const next = order.find((k) => k !== kind && !activities.some((a) => a.kind === k && isDone(a.id)))
    if (next) setActiveTab(next)
    else setView('complete')
  }

  const percent = pathPercent(activePath)

  return (
    <div>
      {preview && (
        <div className="border-b border-on-band/10 bg-band-deep">
          <div className="mx-auto max-w-3xl px-5 py-4 sm:px-8">
            <p className={cx(monoLabel, 'text-on-band-muted')}>preview</p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-on-band-dim">
              You are previewing this session.{' '}
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
      <header className="border-b border-on-band/10 bg-panel">
        <div className="mx-auto max-w-3xl px-5 pt-6 sm:px-8">
          <Link
            to="/app/path"
            className={cx(monoLabel, 'transition-colors hover:text-on-band')}
          >
            ← {activePath.subject}
          </Link>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-[28px] font-light leading-[1.15] tracking-[-0.025em] text-on-band sm:text-[34px]">
                {section.title}
              </h1>
              <p className={cx(monoLabel, 'mt-3')}>
                {sessionMinutes} min · {doneCount} of {activities.length} complete
              </p>
            </div>
            <div className="hidden w-44 sm:block">
              <ProgressBar value={(doneCount / activities.length) * 100} />
            </div>
          </div>

          <nav className="-mb-px mt-6 flex gap-0 overflow-x-auto">
            {activities.map((activity, i) => {
              const done = isDone(activity.id)
              const isActive = active === activity.kind
              return (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => {
                    setView('activity')
                    setActiveTab(activity.kind)
                  }}
                  className={cx(
                    'flex shrink-0 items-center gap-3 border-b-2 px-4 py-3.5 text-[13.5px] transition-colors duration-150',
                    isActive
                      ? 'border-accent-bright text-on-band'
                      : 'border-transparent text-on-band-dim hover:text-on-band',
                  )}
                >
                  <span
                    className={cx(
                      'font-mono text-[10.5px]',
                      done
                        ? 'text-success-bright'
                        : isActive
                          ? 'text-accent-bright'
                          : 'text-on-band-dim',
                    )}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {done && (
                    <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 bg-success-bright" />
                  )}
                  {activity.kind === 'read' && content && contentIsAllVideo(content)
                    ? 'Watch'
                    : kindLabels[activity.kind]}
                  <span className={cx(monoLabel, 'hidden sm:inline')}>{activity.minutes} min</span>
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* activity body */}
      <div className="px-5 py-10 sm:px-8">
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

            {/* mobile pager */}
            <div className="mx-auto mt-10 flex max-w-3xl items-center justify-between gap-3 border-t border-on-band/10 pt-6">
              <button
                type="button"
                onClick={() => {
                  const idx = order.indexOf(active)
                  if (idx > 0) setActiveTab(order[idx - 1])
                }}
                disabled={active === 'learn'}
                className={smallGhost}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  const idx = order.indexOf(active)
                  if (idx < order.length - 1) setActiveTab(order[idx + 1])
                }}
                disabled={active === 'check'}
                className={smallGhost}
              >
                Next
              </button>
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
  const stats: [string, string][] = [
    [String(sessions), 'sessions'],
    [`${percent}%`, 'path done'],
    [`${minutes}m`, 'learned today'],
  ]

  return (
    <div className="mx-auto max-w-xl animate-rise py-6 text-center">
      <p className={cx(monoLabel, 'text-accent-bright')}>session complete</p>
      <h2 className="mt-4 font-display text-[30px] font-light tracking-[-0.025em] text-on-band">
        That is today done.
      </h2>
      <p className="mt-3 text-[14.5px] text-on-band-muted">{minutes} minutes completed.</p>

      <div className="mt-8 grid border border-on-band/15 bg-panel sm:grid-cols-3">
        {stats.map(([value, label]) => (
          <div
            key={label}
            className="border-b border-on-band/10 px-4 py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
          >
            <p className="font-display text-[24px] font-light text-on-band">{value}</p>
            <p className={cx(monoLabel, 'mt-2')}>{label}</p>
          </div>
        ))}
      </div>

      {adaptationNote && (
        <p className="mt-6 border-l-2 border-accent-bright/50 bg-band-deep px-5 py-4 text-left text-[14px] leading-relaxed text-on-band-muted">
          {adaptationNote}
        </p>
      )}

      <div className="mt-8 flex flex-col items-center gap-4">
        <button type="button" onClick={onContinue} className={cx(primaryBtn, 'w-full sm:w-auto')}>
          Back to today
        </button>
        <button
          type="button"
          onClick={onReview}
          className={cx(monoLabel, 'transition-colors hover:text-on-band')}
        >
          review the activities
        </button>
      </div>
    </div>
  )
}
