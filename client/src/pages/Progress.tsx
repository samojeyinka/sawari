import { Link } from 'react-router-dom'
import { LuCheck } from 'react-icons/lu'
import { useApp } from '../state/store'
import { formatHours, mockMilestones, pathPercent } from '../data'
import { Page, PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { cx } from '../lib/utils'

const dayLabels = () => {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return names[d.getDay()]
  })
}

export function ProgressPage() {
  const { activePath, state } = useApp()

  if (!activePath) {
    return (
      <Page width="narrow">
        <div className="rounded-xl border border-line bg-canvas px-6 py-16 text-center">
          <h1 className="text-xl font-semibold text-ink">Nothing to show yet</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Build a learning path and your sessions, projects and milestones land here.
          </p>
          <Link to="/setup" className="mt-6 inline-block">
            <Button>Build my learning path</Button>
          </Link>
        </div>
      </Page>
    )
  }

  const percent = pathPercent(activePath)
  const stats = activePath.stats
  const currentSection = activePath.sections.find((s) => s.status === 'current')
  const activeProject = state.projects.find((p) => p.status === 'active')
  const labels = dayLabels()
  const maxWeek = Math.max(...stats.week, 60)

  const statsList = [
    { label: 'Path completed', value: `${percent}%` },
    { label: 'Sessions completed', value: String(stats.sessionsCompleted) },
    { label: 'Learning time', value: formatHours(stats.minutesLearned) },
    { label: 'Projects completed', value: String(stats.projectsCompleted) },
    { label: 'Topics explored', value: String(stats.topicsExplored) },
  ]

  return (
    <Page width="wide">
      <PageHeader
        eyebrow="Progress"
        title="How far you have come"
        subtitle={`${activePath.subject}, from the first session to where you are now.`}
      />

      {/* headline stats */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 border-y border-line py-6 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-5">
        {statsList.map((stat, i) => (
          <div key={stat.label} className={cx('animate-rise', `stagger-${Math.min(i + 1, 4)}`)}>
            <p className="text-[28px] font-semibold leading-none text-ink">{stat.value}</p>
            <p className="mt-1.5 text-[13px] text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* milestones */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-muted">
              Milestones
            </h2>
            <Link
              to="/app/path"
              className="text-[13px] font-medium text-accent hover:text-accent-strong"
            >
              Open path
            </Link>
          </div>

          <ol className="mt-4">
            {mockMilestones.map((milestone) => (
              <li key={milestone.id} className="relative flex gap-4 pb-6 last:pb-0">
                <span className="relative flex shrink-0 items-center justify-center">
                  {milestone.state === 'done' && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-success text-band">
                      <LuCheck className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  )}
                  {milestone.state === 'current' && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-accent bg-panel">
                      <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                    </span>
                  )}
                  {milestone.state === 'next' && (
                    <span className="h-7 w-7 rounded-full border-2 border-dashed border-line-strong bg-panel" />
                  )}
                  {milestone.state !== 'next' && (
                    <span className="absolute top-8 h-full w-px bg-line" />
                  )}
                </span>

                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p
                      className={cx(
                        'text-[15px] font-semibold',
                        milestone.state === 'next' ? 'text-muted' : 'text-ink',
                      )}
                    >
                      {milestone.title}
                    </p>
                    <span className="text-xs font-medium uppercase tracking-wide text-faint">
                      {milestone.date}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">{milestone.detail}</p>
                  {milestone.state === 'current' && (
                    <Link to="/app/today" className="mt-2 inline-block">
                      <Button size="sm" variant="secondary">
                        Go to today's session
                      </Button>
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* right column */}
        <aside className="space-y-6">
          <section className="rounded-xl border border-line p-5">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-muted">
              This week
            </h2>
            <div className="mt-4 flex h-32 items-end gap-2">
              {stats.week.map((minutes, i) => {
                const height = minutes === 0 ? 3 : Math.max(8, (minutes / maxWeek) * 100)
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-24 w-full items-end">
                      <div
                        className={cx(
                          'w-full rounded-t-sm transition-all duration-500',
                          minutes === 0 ? 'bg-canvas-deep' : 'bg-accent/80',
                        )}
                        style={{ height: `${height}%` }}
                        title={`${minutes} min`}
                      />
                    </div>
                    <span className="text-[11px] text-muted">{labels[i]}</span>
                  </div>
                )
              })}
            </div>
            <p className="mt-4 border-t border-line pt-3 text-[13px] text-muted">
              {stats.week.reduce((a, b) => a + b, 0)} min across {stats.week.filter((m) => m > 0).length}{' '}
              days. Your plan allows {activePath.weeklyHours} hours a week.
            </p>
          </section>

          <section className="rounded-xl border border-line p-5">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-muted">
              What is next
            </h2>

            <div className="mt-3">
              <p className="text-sm font-medium text-ink">
                {currentSection ? currentSection.title : 'Path complete'}
              </p>
              <p className="mt-0.5 text-[13px] text-muted">
                {currentSection
                  ? `Section ${currentSection.order} of ${activePath.sections.length}, ${Math.round(
                      (currentSection.doneMinutes / currentSection.minutes) * 100,
                    )}% done`
                  : 'Every section complete. Nice.'}
              </p>
            </div>

            {activeProject && (
              <div className="mt-4 border-t border-line pt-4">
                <p className="text-sm font-medium text-ink">{activeProject.title}</p>
                <p className="mt-0.5 text-[13px] text-muted">
                  {activeProject.completedTaskIds.length} of {activeProject.tasks.length} tasks
                  complete
                </p>
                <Link
                  to={`/app/projects/${activeProject.id}`}
                  className="mt-1.5 inline-block text-[13px] font-medium text-accent hover:text-accent-strong"
                >
                  Open project
                </Link>
              </div>
            )}
          </section>
        </aside>
      </div>
    </Page>
  )
}
