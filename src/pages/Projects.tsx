import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../state/store'
import { Page, PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Tabs } from '../components/ui/Tabs'
import { cx } from '../lib/utils'

const statusLabel: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  available: 'Available',
}

export function ProjectsPage() {
  const { state } = useApp()
  const [tab, setTab] = useState('active')

  const counts = {
    active: state.projects.filter((p) => p.status === 'active').length,
    completed: state.projects.filter((p) => p.status === 'completed').length,
    available: state.projects.filter((p) => p.status === 'available').length,
  }

  const visible = state.projects.filter((p) => p.status === tab)

  return (
    <Page width="wide">
      <PageHeader
        eyebrow="Projects"
        title="Learn by doing"
        subtitle="Real work you can finish and get reviewed. Each one ties back to a section of your path."
      />

      <Tabs
        items={[
          { id: 'active', label: `Active (${counts.active})` },
          { id: 'completed', label: `Completed (${counts.completed})` },
          { id: 'available', label: `Available (${counts.available})` },
        ]}
        active={tab}
        onChange={setTab}
        className="mb-6"
      />

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong bg-canvas px-6 py-14 text-center">
          <p className="text-sm font-medium text-ink">
            {tab === 'active' ? 'No project in progress' : 'Nothing here yet'}
          </p>
          <p className="mx-auto mt-1 max-w-xs text-[13px] text-muted">
            {tab === 'active'
              ? 'Open an available project when you want to practise what you are learning.'
              : 'Projects you start will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((project) => {
            const done = project.completedTaskIds.length
            const total = project.tasks.length
            const pct = Math.round((done / total) * 100)
            return (
              <article
                key={project.id}
                className={cx(
                  'flex flex-col rounded-xl border bg-panel p-5 transition-all duration-200',
                  project.status === 'active'
                    ? 'border-accent/40 shadow-[0_2px_12px_rgba(15,118,110,0.07)]'
                    : 'border-line hover:border-line-strong',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={cx(
                      'rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                      project.status === 'active' && 'border-accent/30 bg-accent-soft text-accent-strong',
                      project.status === 'completed' && 'border-success/30 bg-success-soft text-success',
                      project.status === 'available' && 'border-line bg-canvas text-muted',
                    )}
                  >
                    {statusLabel[project.status]}
                  </span>
                  <span className="text-xs text-muted">{project.estHours}h</span>
                </div>

                <h3 className="mt-3 text-lg font-semibold text-ink">{project.title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">
                  {project.description}
                </p>

                {project.status !== 'available' && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-muted">
                        {done} of {total} tasks complete
                      </span>
                      <span className="font-medium text-ink">{pct}%</span>
                    </div>
                    <ProgressBar value={pct} size="sm" className="mt-2" />
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                  <span className="text-[13px] text-muted">{project.level}</span>
                  <Link to={`/app/projects/${project.id}`}>
                    <Button size="sm" variant={project.status === 'active' ? 'primary' : 'secondary'}>
                      {project.status === 'completed' ? 'View feedback' : 'Open project'}
                    </Button>
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <div className="mt-8 rounded-xl border border-line bg-canvas/70 px-5 py-4">
        <p className="text-sm leading-relaxed text-body">
          Projects unlock as your path moves. Finishing one adds it to your progress and to your
          portfolio of work.
          <Link
            to="/app/progress"
            className="ml-1.5 font-medium text-accent hover:text-accent-strong"
          >
            See progress
          </Link>
        </p>
      </div>
    </Page>
  )
}
