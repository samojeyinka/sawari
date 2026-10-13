import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../state/store'
import { getSessionActivities, pathPercent, formatHours } from '../data'
import { kindLabels } from '../components/learn/kinds'
import { SessionPending } from '../components/learn/SessionPending'
import { Page } from '../components/layout/PageHeader'
import { monoLabel } from '../components/layout/nav'
import { Sweep } from '../components/ui/Sweep'
import { ProgressBar } from '../components/ui/ProgressBar'
import { greeting, cx } from '../lib/utils'

const primaryBtn =
  'group relative inline-flex h-12 items-center justify-center overflow-hidden bg-on-band px-7 ' +
  'text-[14.5px] font-medium text-band transition-colors'
const ghostBtn =
  'inline-flex h-12 items-center justify-center border border-on-band/20 px-6 text-[14.5px] ' +
  'font-medium text-on-band transition-colors hover:border-on-band/45'
const smallBtn =
  'inline-flex h-10 w-full items-center justify-center border border-on-band/20 px-5 ' +
  'text-[13px] text-on-band transition-colors hover:border-on-band/45'

export function TodayPage() {
  const { activePath, state, sessionContentFor, ensureSessionContent, sessionContentError } = useApp()
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
        <div className="animate-rise border border-on-band/15 bg-panel px-8 py-14 text-center">
          <p className={cx(monoLabel, 'text-accent-bright')}>building</p>
          <h2 className="mt-4 font-display text-[26px] font-light tracking-[-0.025em] text-on-band">
            Building today&apos;s session…
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-[14.5px] leading-relaxed text-on-band-muted">
            Your {activePath.subject} path is still being designed. This page updates automatically
            when it is ready — no need to refresh.
          </p>
          <div className="mx-auto mt-6 max-w-xs">
            <ProgressBar value={buildStatus === 'generating' ? 66 : 33} />
          </div>
          <Link
            to="/app/path"
            className="mt-6 inline-block text-[13px] text-accent-bright transition-colors hover:text-on-band"
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
        <div className="animate-rise border border-danger-bright/40 bg-panel px-8 py-14 text-center">
          <p className={cx(monoLabel, 'text-danger-bright')}>failed</p>
          <h2 className="mt-4 font-display text-[26px] font-light tracking-[-0.025em] text-on-band">
            Could not design your path
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-[14.5px] leading-relaxed text-on-band-muted">
            Something went wrong while generating your {activePath.subject} sections. You can try
            again from the path overview.
          </p>
          <Link to="/app/path" className={cx(ghostBtn, 'mt-7')}>
            Open learning path
          </Link>
        </div>
      </Page>
    )
  }

  if (!section) return <NoPathToday />

  if (error && !content) {
    return (
      <Page width="narrow">
        <div className="animate-rise border border-danger-bright/40 bg-panel px-8 py-14 text-center">
          <p className={cx(monoLabel, 'text-danger-bright')}>could not load</p>
          <h2 className="mt-4 font-display text-[26px] font-light tracking-[-0.025em] text-on-band">
            Today&apos;s session did not load
          </h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-on-band-muted">{error}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => void ensureSessionContent(section.id, true)}
              className={primaryBtn}
            >
              <Sweep />
              <span className="relative">Try again</span>
            </button>
            <Link to="/app/path" className={ghostBtn}>
              View path
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

  const sectionIndex = activePath.sections.findIndex((s) => s.id === activePath.currentSectionId)

  return (
    <Page width="wide">
      <header className="mb-8 sm:mb-10">
        <p className={monoLabel}>
          {activePath.subject}
          {sectionIndex >= 0 && ` · section ${sectionIndex + 1} of ${activePath.sections.length}`}
        </p>
        <h1 className="mt-3 font-display text-[30px] font-light leading-[1.12] tracking-[-0.025em] text-on-band sm:text-[38px]">
          {greeting()}, {userName}.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-on-band-muted">
          Here is what to do today.
        </p>
      </header>

      {activePath.adaptationNote && (
        <p className="mb-6 animate-rise border-l-2 border-accent-bright/60 pl-4 text-[14px] leading-relaxed text-on-band-muted">
          {activePath.adaptationNote}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* today's session */}
        <section className="min-w-0 lg:col-span-2">
          <div className="border border-on-band/15 bg-panel">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-on-band/10 px-6 py-5">
              <div className="min-w-0">
                <p className={monoLabel}>today&apos;s session</p>
                <h2 className="mt-2.5 font-display text-[22px] font-light tracking-[-0.02em] text-on-band sm:text-[26px]">
                  {section.title}
                </h2>
                <p className={cx(monoLabel, 'mt-2.5')}>
                  {sessionMinutes} min · {doneCount} of {activities.length} done
                </p>
              </div>
              {!allDone && (
                <div className="w-32 pt-1">
                  <ProgressBar value={(doneCount / Math.max(activities.length, 1)) * 100} />
                </div>
              )}
            </div>

            <ul>
              {activities.map((activity, i) => {
                const done = doneIds[i]
                return (
                  <li key={activity.id} className="border-t border-on-band/10 first:border-t-0">
                    <Link
                      to={`/app/session/${section.id}`}
                      className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-on-band/[0.03]"
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-4 sm:gap-5">
                        <span
                          aria-hidden="true"
                          className={cx(
                            'h-2.5 w-2.5 shrink-0 border',
                            done ? 'border-accent-bright bg-accent-bright' : 'border-on-band/30',
                          )}
                        />
                        <span
                          className={cx(
                            monoLabel,
                            'w-[64px] shrink-0 sm:w-[74px]',
                            done ? 'text-on-band-dim' : 'text-accent-bright',
                          )}
                        >
                          {kindLabels[activity.kind]}
                        </span>
                        <span
                          className={cx(
                            'min-w-0 truncate text-[14px]',
                            done ? 'text-on-band-dim line-through' : 'text-on-band',
                          )}
                        >
                          {activity.title}
                        </span>
                      </span>
                      <span className={cx(monoLabel, 'shrink-0')}>{activity.minutes} min</span>
                    </Link>
                  </li>
                )
              })}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-on-band/10 bg-band-deep px-6 py-4">
              <p className="text-[13.5px] text-on-band-dim">
                {allDone
                  ? 'Everything for today is done. Nice work.'
                  : 'One session, then you are free for the day.'}
              </p>
              <button
                type="button"
                onClick={() => navigate(`/app/session/${section.id}`)}
                className={cx(primaryBtn, 'w-full sm:w-auto')}
              >
                <Sweep />
                <span className="relative">
                  {allDone ? 'Review session' : doneCount > 0 ? 'Continue session' : 'Start session'}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* rail */}
        <aside className="min-w-0 space-y-5">
          <Panel title="your path">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-display text-[30px] font-light text-on-band">{percent}%</span>
              <span className={monoLabel}>
                {formatHours(
                  activePath.sections.reduce((sum, s) => sum + Math.max(0, s.minutes - s.doneMinutes), 0),
                )}{' '}
                left
              </span>
            </div>
            <ProgressBar value={percent} className="mt-4" />
            <div className="mt-4 border-t border-on-band/10 pt-4">
              <p className={monoLabel}>next milestone</p>
              <p className="mt-1.5 text-[13.5px] text-on-band">
                {nextMilestone ? nextMilestone.title : 'Path complete'}
              </p>
            </div>
            <Link
              to="/app/path"
              className="mt-4 inline-block text-[13px] text-accent-bright transition-colors hover:text-on-band"
            >
              Open learning path
            </Link>
          </Panel>

          <Panel title="recently completed">
            {state.recent.length === 0 ? (
              <p className="text-[13.5px] leading-relaxed text-on-band-dim">
                Nothing yet. Finish an activity and it shows up here.
              </p>
            ) : (
              <ul>
                {state.recent.slice(0, 4).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 border-t border-on-band/10 py-3 first:border-t-0 first:pt-0"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-2.5 w-2.5 shrink-0 border border-accent-bright bg-accent-bright"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] text-on-band">{item.title}</span>
                      <span className={cx(monoLabel, 'mt-0.5 block')}>{item.when}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {project && (
            <Panel title="upcoming project">
              <p className="text-[13.5px] text-on-band">{project.title}</p>
              <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-on-band-dim">
                {project.description}
              </p>
              <p className={cx(monoLabel, 'mt-4')}>
                {project.completedTaskIds.length} of {project.tasks.length} tasks complete
              </p>
              <ProgressBar
                value={(project.completedTaskIds.length / project.tasks.length) * 100}
                size="sm"
                className="mt-2.5"
              />
              <Link to={`/app/projects/${project.id}`} className={cx(smallBtn, 'mt-5')}>
                Open project
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
    <section className="border border-on-band/15 bg-panel">
      <div className="border-b border-on-band/10 px-5 py-3.5">
        <h3 className={monoLabel}>{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  )
}

function NoPathToday() {
  return (
    <Page width="narrow">
      <div className="border border-on-band/15 bg-panel px-8 py-16 text-center">
        <p className={monoLabel}>no path yet</p>
        <h1 className="mt-4 font-display text-[28px] font-light tracking-[-0.025em] text-on-band">
          Nothing to do today, yet.
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-[14.5px] leading-relaxed text-on-band-muted">
          Tell us what you want to learn and we will build the path. Your first session takes about
          45 minutes.
        </p>
        <Link to="/setup" className={cx(primaryBtn, 'mt-7')}>
          <Sweep />
          <span className="relative">Build my learning path</span>
        </Link>
      </div>
    </Page>
  )
}
