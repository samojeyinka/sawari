import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../state/store'
import { Page, PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Tabs } from '../components/ui/Tabs'
import { monoLabel } from '../components/layout/nav'
import { cx } from '../lib/utils'

const statusTone: Record<string, string> = {
  active: 'border-accent-bright/40 bg-accent-bright/10 text-accent-bright',
  completed: 'border-success-bright/40 bg-success-bright/10 text-success-bright',
  available: 'border-on-band/15 text-on-band-dim',
}

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
        <div className="border border-dashed border-on-band/20 bg-panel px-6 py-14 text-center">
          <p className={monoLabel}>
            {tab === 'active' ? 'no project in progress' : 'nothing here yet'}
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-on-band-dim">
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
            const pct = total > 0 ? Math.round((done / total) * 100) : 0
            return (
              <article
                key={project.id}
                className={cx(
                  'flex min-w-0 flex-col border bg-panel p-5 transition-colors duration-200',
                  project.status === 'active'
                    ? 'border-accent-bright/40'
                    : 'border-on-band/15 hover:border-on-band/35',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={cx(monoLabel, 'border px-2 py-0.5', statusTone[project.status])}>
                    {statusLabel[project.status]}
                  </span>
                  <span className={monoLabel}>{project.estHours}h</span>
                </div>

                <h3 className="mt-3 text-[17px] font-medium leading-snug text-on-band">{project.title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-on-band-muted">
                  {project.description}
                </p>

                {project.status !== 'available' && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between gap-3 text-[13px]">
                      <span className="text-on-band-dim">
                        {done} of {total} tasks complete
                      </span>
                      <span className="font-medium text-on-band">{pct}%</span>
                    </div>
                    <ProgressBar value={pct} size="sm" className="mt-2" />
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-on-band/10 pt-4">
                  <span className="text-[13px] text-on-band-dim">{project.level}</span>
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

      <div className="mt-8 border border-on-band/15 bg-panel px-5 py-4">
        <p className="text-sm leading-relaxed text-on-band-muted">
          Projects unlock as your path moves. Finishing one adds it to your progress and to your
          portfolio of work.
          <Link
            to="/app/progress"
            className="ml-1.5 font-medium text-accent-bright transition-colors hover:text-on-band"
          >
            See progress
          </Link>
        </p>
      </div>
    </Page>
  )
}
