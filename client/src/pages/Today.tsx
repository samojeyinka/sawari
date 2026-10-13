import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LuCheck, LuLoaderCircle, LuTriangleAlert } from 'react-icons/lu'
import { useApp } from '../state/store'
import { getSessionActivities, pathPercent, formatHours } from '../data'
import { kindLabels } from '../components/learn/kinds'
import { SessionPending } from '../components/learn/SessionPending'
import { Page } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { greeting, cx } from '../lib/utils'

export function TodayPage() {
  const {
    activePath,
    state,
    sessionContentFor,
    ensureSessionContent,
    sessionContentError,
  } = useApp()
  const navigate = useNavigate()

  const section = activePath?.sections.find((s) => s.id === activePath.currentSectionId)
  const content = section ? sessionContentFor(section.id) : null
  const error = section ? sessionContentError(section.id) : null

  useEffect(() => {
    if (section && !content && !error) void ensureSessionContent(section.id)
  }, [section, content, error, ensureSessionContent])

  if (!activePath) return <NoPathToday />

  const buildStatus = activePath.generationStatus
  if (buildStatus === 'queued' || buildStatus === 'generating' || buildStatus === 'idle') {
    return (
      <Page width="narrow">
        <div className="rounded-xl border border-line bg-panel p-8 text-center animate-rise">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <LuLoaderCircle className="h-6 w-6 animate-spin" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-ink">Building today&apos;s session…</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Your {activePath.subject} path is still being designed. This page updates automatically
            when it is ready — no need to refresh.
          </p>
          <div className="mx-auto mt-5 max-w-xs">
            <ProgressBar value={buildStatus === 'generating' ? 66 : 33} />
          </div>
          <Link
            to="/app/path"
            className="mt-4 inline-block text-[13px] font-medium text-accent transition-colors hover:text-accent-strong"
          >
            Open learning path
          </Link>
        </div>
      </Page>
    )
  }

  if (buildStatus === 'failed') {
    return (
      <Page width="narrow">
        <div className="rounded-xl border border-line bg-panel p-8 text-center animate-rise">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
            <LuTriangleAlert className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-ink">Could not design your path</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Something went wrong while generating your {activePath.subject} sections. You can try
            again from the path overview.
          </p>
          <Link to="/app/path" className="mt-6 inline-block">
            <Button variant="secondary">Open learning path</Button>
          </Link>
        </div>
      </Page>
    )
  }

  if (!section) return <NoPathToday />

  if (error && !content) {
    return (
      <Page width="narrow">
        <div className="rounded-xl border border-line bg-panel p-8 text-center animate-rise">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
            <LuTriangleAlert className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-ink">Could not load today's session</h2>
          <p className="mt-2 text-sm text-muted">{error}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => void ensureSessionContent(section.id, true)}>
              Retry
            </Button>
            <Link to="/app/path">
              <Button variant="secondary">View path</Button>
            </Link>
          </div>
        </div>
      </Page>
    )
  }

  if (!content) return <SessionPending />

  const activities = getSessionActivities(activePath.id, section.id, content)
  const doneIds = activities.map((a) => activePath.completedActivities.includes(a.id))
  const doneCount = doneIds.filter(Boolean).length
  const sessionMinutes = activities.reduce((sum, a) => sum + a.minutes, 0)
  const allDone = activities.length > 0 && doneCount === activities.length

  const percent = pathPercent(activePath)
  const nextMilestone = activePath.sections.find((s) => s.status !== 'completed')
  const project = state.projects.find((p) => p.status === 'active')
  const userName = state.user?.firstName ?? 'there'

  return (
    <Page width="wide">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-semibold text-ink sm:text-[28px]">
          {greeting()}, {userName}.
        </h1>
        <p className="mt-1.5 text-[15px] text-muted">Here is what to do today.</p>
      </header>

      {activePath.adaptationNote && (
        <p className="mb-5 border-l-2 border-accent/50 pl-4 text-sm leading-relaxed text-accent-strong animate-rise">
          {activePath.adaptationNote}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* focus card */}
        <section className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-line bg-panel shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="border-b border-line px-5 py-5 sm:px-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.08em] text-accent">
                    Today's session
                  </div>
                  <h2 className="mt-1.5 text-xl font-semibold text-ink sm:text-2xl">
                    {section?.title ?? activePath.subject}
                  </h2>
                  <p className="mt-1.5 text-sm text-muted">
                    {sessionMinutes} min · {doneCount} of {activities.length} activities done
                  </p>
                </div>
                {!allDone && (
                  <div className="w-28">
                    <ProgressBar value={(doneCount / Math.max(activities.length, 1)) * 100} />
                  </div>
                )}
              </div>
            </div>

            <ul className="divide-y divide-line">
              {activities.map((activity, i) => {
                const done = doneIds[i]
                return (
                  <li key={activity.id}>
                    <Link
                      to={`/app/session/${section?.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-canvas sm:px-6"
                    >
                      <span
                        className={cx(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                          done ? 'border-success/40 bg-success-soft text-success' : 'border-line',
                        )}
                      >
                        {done && <LuCheck className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium uppercase tracking-wide text-faint">
                          {kindLabels[activity.kind]}
                        </span>
                        <span
                          className={cx(
                            'block truncate text-sm',
                            done ? 'text-muted line-through' : 'font-medium text-ink',
                          )}
                        >
                          {activity.title}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm text-muted">{activity.minutes} min</span>
                    </Link>
                  </li>
                )
              })}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-canvas/60 px-5 py-4 sm:px-6">
              <p className="text-[13px] text-muted">
                {allDone
                  ? 'Everything for today is done. Nice work.'
                  : 'One session, then you are free for the day.'}
              </p>
              <Button
                onClick={() => navigate(`/app/session/${section?.id}`)}
                size="lg"
                className="w-full sm:w-auto"
              >
                {allDone ? 'Review session' : doneCount > 0 ? 'Continue session' : 'Start session'}
              </Button>
            </div>
          </div>
        </section>

        {/* side column */}
        <aside className="space-y-5">
          <Panel title="Current progress">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-semibold text-ink">{percent}%</span>
              <span className="text-sm text-muted">
                {formatHours(
                  activePath.sections.reduce(
                    (sum, s) => sum + Math.max(0, s.minutes - s.doneMinutes),
                    0,
                  ),
                )}{' '}
                left
                </span>
            </div>
            <ProgressBar value={percent} className="mt-3" />
            <div className="mt-4 border-t border-line pt-4">
              <p className="text-[13px] text-muted">Next milestone</p>
              <p className="text-sm font-medium text-ink">
                {nextMilestone ? nextMilestone.title : 'Path complete'}
              </p>
            </div>
            <Link
              to="/app/path"
              className="mt-3 inline-block text-[13px] font-medium text-accent transition-colors hover:text-accent-strong"
            >
              Open learning path
            </Link>
          </Panel>

          <Panel title="Recently completed">
            {state.recent.length === 0 ? (
              <p className="text-sm text-muted">Nothing yet. Finish an activity and it shows up here.</p>
            ) : (
              <ul className="space-y-3">
                {state.recent.slice(0, 4).map((item) => (
                  <li key={item.id} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                      <LuCheck className="h-3 w-3" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-ink">{item.title}</span>
                      <span className="block text-xs text-faint">{item.when}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {project && (
            <Panel title="Upcoming project">
              <p className="text-sm font-medium text-ink">{project.title}</p>
              <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted">
                {project.description}
              </p>
              <p className="mt-3 text-[13px] text-muted">
                {project.completedTaskIds.length} of {project.tasks.length} tasks complete
              </p>
              <ProgressBar
                value={(project.completedTaskIds.length / project.tasks.length) * 100}
                size="sm"
                className="mt-2"
              />
              <Link to={`/app/projects/${project.id}`} className="mt-4 block">
                <Button variant="secondary" size="sm" className="w-full">
                  Open project
                </Button>
              </Link>
            </Panel>
          )}
        </aside>
      </div>
    </Page>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-panel p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <h3 className="mb-3 text-[13px] font-medium uppercase tracking-[0.08em] text-muted">
        {title}
      </h3>
      {children}
    </section>
  )
}

function NoPathToday() {
  return (
    <Page width="narrow">
      <div className="rounded-xl border border-line bg-canvas px-6 py-16 text-center">
        <h1 className="mt-4 text-xl font-semibold text-ink">No learning path yet</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Tell us what you want to learn and we will build the path. Your first session takes about
          45 minutes.
        </p>
        <Link to="/setup" className="mt-6 inline-block">
          <Button size="lg">Build my learning path</Button>
        </Link>
      </div>
    </Page>
  )
}
