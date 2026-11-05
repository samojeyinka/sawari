import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LuArrowRight, LuCheck, LuClock3, LuLightbulb, LuPlay, LuSparkles } from 'react-icons/lu'
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
  'group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-[#51249c] px-6 ' +
  'text-[13px] font-extrabold text-white shadow-[0_5px_14px_rgba(113,59,209,.2)] transition-[transform,box-shadow] ' +
  'hover:-translate-y-px hover:shadow-[0_8px_20px_rgba(113,59,209,.25)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-bright/20'
const ghostBtn =
  'inline-flex h-11 items-center justify-center rounded-full border border-line-strong bg-white px-5 text-[13px] ' +
  'font-bold text-on-band-muted transition-colors hover:border-accent-bright/50 hover:text-accent-bright'
const smallBtn =
  'inline-flex h-10 w-full items-center justify-center rounded-full border border-line-strong bg-white px-4 ' +
  'text-[12px] font-bold text-on-band-muted transition-colors hover:border-accent-bright/50 hover:text-accent-bright'

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
        <div className="animate-rise rounded-[24px] border border-line bg-white px-6 py-12 text-center shadow-[0_14px_44px_rgba(33,27,42,.06)] sm:px-8 sm:py-14">
          <p className={cx(monoLabel, 'text-accent-bright')}>Building your path</p>
          <h2 className="mt-3 font-display text-[25px] font-extrabold tracking-[-0.04em] text-on-band sm:text-[30px]">
            Building today&apos;s session…
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-on-band-muted">
            Your {activePath.subject} path is still being designed. This page updates automatically
            when it is ready — no need to refresh.
          </p>
          <div className="mx-auto mt-6 max-w-xs">
            <ProgressBar value={buildStatus === 'generating' ? 66 : 33} />
          </div>
          <Link
            to="/app/path"
            className="mt-6 inline-flex items-center gap-2 text-[12px] font-bold text-accent-bright transition-colors hover:text-on-band"
          >
            Open learning path <LuArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </Page>
    )
  }

  if (buildStatus === 'failed') {
    return (
      <Page width="narrow">
        <div className="animate-rise rounded-[24px] border border-line bg-white px-6 py-12 text-center shadow-[0_14px_44px_rgba(33,27,42,.06)] sm:px-8 sm:py-14">
          <p className={cx(monoLabel, 'text-danger-bright')}>Path not ready</p>
          <h2 className="mt-3 font-display text-[25px] font-extrabold tracking-[-0.04em] text-on-band sm:text-[30px]">
            Could not design your path
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-on-band-muted">
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
        <div className="animate-rise rounded-[24px] border border-line bg-white px-6 py-12 text-center shadow-[0_14px_44px_rgba(33,27,42,.06)] sm:px-8 sm:py-14">
          <p className={cx(monoLabel, 'text-danger-bright')}>Could not load</p>
          <h2 className="mt-3 font-display text-[25px] font-extrabold tracking-[-0.04em] text-on-band sm:text-[30px]">
            Today&apos;s session did not load
          </h2>
          <p className="mt-3 text-[13px] leading-relaxed text-on-band-muted">
            We couldn’t prepare this session right now. Please try again shortly.
          </p>
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
  const dateLabel = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())

  return (
    <Page width="wide">
      <header className="mb-7 flex flex-col gap-5 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-accent-bright">{dateLabel}</p>
          <h1 className="mt-2 font-display text-[30px] font-extrabold leading-[1.06] tracking-[-0.045em] text-on-band sm:text-[38px]">
            {greeting()}, {userName}.
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-on-band-muted sm:text-[14px]">
            One focused session is enough for today.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 text-[11px] font-bold text-on-band-muted">
        
          <span className="max-w-[190px] truncate">{activePath.subject}</span>
          {sectionIndex >= 0 && <span className="text-on-band-dim">· {sectionIndex + 1}/{activePath.sections.length}</span>}
        </div>
      </header>

      {activePath.adaptationNote && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-accent-bright/15 bg-accent-soft/70 px-4 py-3.5 text-[12px] leading-relaxed text-on-band-muted sm:px-5">
          <LuLightbulb aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent-bright" />
          <p>{activePath.adaptationNote}</p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
        {/* today's session */}
        <section className="min-w-0 lg:col-span-8">
          <div className="overflow-hidden rounded-[24px] border border-line bg-white shadow-[0_14px_42px_rgba(33,27,42,.055)]">
            <div className="bg-band-soft/70 px-5 py-5 sm:px-7 sm:py-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-accent-bright">Today&apos;s plan</p>
                  <h2 className="mt-2 font-display text-[21px] font-extrabold leading-tight tracking-[-0.035em] text-on-band sm:text-[25px]">
                    {section.title}
                  </h2>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/80 bg-white px-3 py-1.5 text-[11px] font-bold text-on-band-muted">
                  <LuClock3 aria-hidden="true" className="h-3.5 w-3.5 text-accent-bright" />
                  {formatHours(sessionMinutes)}
                </span>
              </div>
              <div className="mt-5 flex items-center gap-3">
                <ProgressBar value={(doneCount / Math.max(activities.length, 1)) * 100} className="h-2 flex-1 rounded-full" />
                <span className="shrink-0 text-[10px] font-bold text-on-band-dim">{doneCount}/{activities.length}</span>
              </div>
            </div>

            <ul className="divide-y divide-line px-2 sm:px-3">
              {activities.map((activity, i) => {
                const done = doneIds[i]
                return (
                  <li key={activity.id}>
                    <Link
                      to={`/app/session/${section.id}`}
                      className="group flex min-h-[70px] items-center justify-between gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-band-soft/60 sm:gap-4 sm:px-4"
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                        <span
                          aria-hidden="true"
                          className={cx(
                            'grid h-8 w-8 shrink-0 place-items-center rounded-full border text-[10px] font-extrabold transition-colors',
                            done
                              ? 'border-success/15 bg-success-soft text-success'
                              : 'border-line bg-white text-on-band-dim group-hover:border-accent-bright/30 group-hover:text-accent-bright',
                          )}
                        >
                          {done ? <LuCheck aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} /> : String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={cx('block truncate text-[12px] font-bold sm:text-[13px]', done ? 'text-on-band-dim' : 'text-on-band')}>
                            {activity.title}
                          </span>
                          <span className="mt-1 block text-[10px] font-semibold text-on-band-dim">
                            {kindLabels[activity.kind]}
                          </span>
                        </span>
                      </span>
                      <span className="shrink-0 text-[10px] font-semibold text-on-band-dim">{formatHours(activity.minutes)}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>

            <div className="flex flex-col items-start justify-between gap-3 border-t border-line bg-white px-5 py-4 sm:flex-row sm:items-center sm:px-7">
              <p className="text-[11px] leading-relaxed text-on-band-dim">
                {allDone
                  ? "That's today handled. You can revisit the session any time."
                  : 'Work through the list at your own pace.'}
              </p>
              <button
                type="button"
                onClick={() => navigate(`/app/session/${section.id}`)}
                className={cx(primaryBtn, 'w-full shrink-0 sm:w-auto')}
              >
                <Sweep />
                <span className="relative">
                  {allDone ? 'Review session' : doneCount > 0 ? 'Continue session' : 'Start session'}
                </span>
                <LuPlay aria-hidden="true" className="relative ml-2 h-4 w-4 fill-current" />
              </button>
            </div>
          </div>
        </section>

        {/* rail */}
        <aside className="min-w-0 space-y-4 lg:col-span-4">
          <Panel title="Your progress">
            <div className="flex items-end justify-between gap-3">
              <div>
                <span className="font-display text-[32px] font-extrabold leading-none tracking-[-0.05em] text-on-band">{percent}%</span>
                <span className="ml-2 text-[11px] font-medium text-on-band-dim">complete</span>
              </div>
              <span className="rounded-full bg-band-soft px-2.5 py-1 text-[10px] font-bold text-on-band-muted">
                {formatHours(
                  activePath.sections.reduce((sum, s) => sum + Math.max(0, s.minutes - s.doneMinutes), 0),
                )}{' '}
                left
              </span>
            </div>
            <ProgressBar value={percent} className="mt-4 h-2 rounded-full" />
            <div className="mt-5 border-t border-line pt-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-on-band-dim">Next milestone</p>
              <p className="mt-1.5 text-[12px] font-bold leading-relaxed text-on-band">
                {nextMilestone ? nextMilestone.title : 'Path complete'}
              </p>
            </div>
            <Link
              to="/app/path"
              className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold text-accent-bright transition-colors hover:text-on-band"
            >
              Open learning path <LuArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </Panel>

          <Panel title="Recently completed">
            {state.recent.length === 0 ? (
              <p className="text-[12px] leading-relaxed text-on-band-dim">
                Nothing yet. Finish an activity and it shows up here.
              </p>
            ) : (
              <ul className="space-y-3">
                {state.recent.slice(0, 4).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2.5"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success-soft text-success"
                    ><LuCheck className="h-3 w-3" strokeWidth={2.5} /></span>
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-bold text-on-band">{item.title}</span>
                      <span className="mt-0.5 block text-[10px] font-medium text-on-band-dim">{item.when}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {project && (
            <Panel title="Your project">
              <p className="text-[12px] font-bold text-on-band">{project.title}</p>
              <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-on-band-dim">
                {project.description}
              </p>
              <p className="mt-4 text-[10px] font-semibold text-on-band-dim">
                {project.completedTaskIds.length} of {project.tasks.length} tasks complete
              </p>
              <ProgressBar
                value={(project.completedTaskIds.length / project.tasks.length) * 100}
                size="sm"
                className="mt-2.5 rounded-full"
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
    <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_8px_28px_rgba(33,27,42,.04)]">
      <div className="border-b border-line px-4 py-3.5">
        <h3 className="text-[10px] font-extrabold uppercase tracking-[0.09em] text-on-band-dim">{title}</h3>
      </div>
      <div className="px-4 py-4">{children}</div>
    </section>
  )
}

function NoPathToday() {
  return (
    <Page width="narrow">
      <div className="rounded-[24px] border border-line bg-white px-6 py-12 text-center shadow-[0_14px_44px_rgba(33,27,42,.06)] sm:px-8 sm:py-14">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent-bright">
          <LuSparkles aria-hidden="true" className="h-5 w-5" />
        </span>
        <p className={cx(monoLabel, 'mt-4 text-accent-bright')}>Your next step</p>
        <h1 className="mt-2 font-display text-[26px] font-extrabold tracking-[-0.04em] text-on-band sm:text-[32px]">
          Start with a learning path.
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-on-band-muted">
          Choose a subject, set the time you have, and we will map out a clear first session.
        </p>
        <Link to="/setup" className={cx(primaryBtn, 'mt-7 gap-2')}>
          <Sweep />
          <span className="relative">Build my learning path</span>
          <LuArrowRight aria-hidden="true" className="relative h-4 w-4" />
        </Link>
      </div>
    </Page>
  )
}
