import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  LuArrowLeft,
  LuCheck,
  LuLoaderCircle,
} from 'react-icons/lu'
import { useApp } from '../state/store'
import { Page } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { SubmitProjectModal } from '../components/modals/SubmitProjectModal'
import { cx } from '../lib/utils'

function formatSubmittedAt(value: string | null): string {
  if (!value) return 'just now'
  const time = Date.parse(value)
  if (Number.isNaN(time)) return value
  return new Date(time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function ProjectWorkspacePage() {
  const { projectId } = useParams()
  const { state, toggleTask, submitProject, reviewProject, toast } = useApp()
  const [submitOpen, setSubmitOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const project = state.projects.find((p) => p.id === projectId)
  if (!project) return <Navigate to="/app/projects" replace />

  const total = project.tasks.length
  const done = project.completedTaskIds.length
  const pct = Math.round((done / total) * 100)
  const allTasksDone = done === total

  const handleToggle = (taskId: string, title: string) => {
    toggleTask(project.id, taskId)
    const wasDone = project.completedTaskIds.includes(taskId)
    toast(wasDone ? 'Task reopened' : `Done: ${title}`)
  }

  const handleConfirmSubmit = async (note: string) => {
    setSubmitOpen(false)
    setSubmitting(true)
    submitProject(project.id, note)
    try {
      await reviewProject(project.id)
      toast('Project reviewed')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Review failed. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Page width="wide">
      <Link
        to="/app/projects"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink"
      >
        <LuArrowLeft className="h-3.5 w-3.5" />
        Projects
      </Link>

      <header className="mt-4 border-b border-line pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={cx(
                  'rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                  project.status === 'active' && 'border-accent/30 bg-accent-soft text-accent-strong',
                  project.status === 'completed' && 'border-success/30 bg-success-soft text-success',
                  project.status === 'available' && 'border-line bg-canvas text-muted',
                )}
              >
                {project.status === 'active'
                  ? 'Active'
                  : project.status === 'completed'
                    ? 'Completed'
                    : 'Available'}
              </span>
              <span className="text-[13px] text-muted">
                {project.estHours} hours · {project.level}
              </span>
            </div>
            <h1 className="mt-2.5 text-2xl font-semibold text-ink sm:text-[30px]">
              {project.title}
            </h1>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">
              {project.description}
            </p>
          </div>

          <div className="w-full sm:w-56">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Progress</span>
              <span className="font-semibold text-ink">
                {done} of {total}
              </span>
            </div>
            <ProgressBar value={pct} className="mt-2" />
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {/* objectives */}
          <section>
            <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-muted">
              Objectives
            </h2>
            <ul className="mt-3 space-y-2.5">
              {project.objectives.map((objective) => (
                <li key={objective} className="flex gap-3 text-[15px] leading-relaxed text-body">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
                  {objective}
                </li>
              ))}
            </ul>
          </section>

          {/* tasks */}
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-muted">
                Tasks
              </h2>
              <span className="text-[13px] text-muted">{pct}%</span>
            </div>
            <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line">
              {project.tasks.map((task, i) => {
                const checked = project.completedTaskIds.includes(task.id)
                return (
                  <li key={task.id}>
                    <button
                      onClick={() => handleToggle(task.id, task.title)}
                      className={cx(
                        'flex w-full items-start gap-3.5 px-4 py-3.5 text-left transition-colors',
                        checked ? 'bg-success-soft/40' : 'bg-panel hover:bg-canvas',
                      )}
                    >
                      <span
                        className={cx(
                          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-150',
                          checked
                            ? 'border-success bg-success text-band'
                            : 'border-line-strong bg-panel',
                        )}
                      >
                        {checked && <LuCheck className="h-3.5 w-3.5" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cx(
                            'block text-[15px] font-medium',
                            checked ? 'text-muted line-through' : 'text-ink',
                          )}
                        >
                          {i + 1}. {task.title}
                        </span>
                        <span className="mt-0.5 block text-[13px] leading-relaxed text-muted">
                          {task.detail}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            {!allTasksDone && (
              <p className="mt-2.5 text-[13px] text-muted">
                {total - done} task{total - done > 1 ? 's' : ''} to go. You can submit earlier if
                you are proud of it.
              </p>
            )}
          </section>

          {/* submission */}
          <section className="rounded-xl border border-line bg-canvas/70 p-5">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-muted">
              Submission
            </h2>

            {submitting ? (
              <div className="mt-4 flex items-center gap-3">
                <LuLoaderCircle className="h-5 w-5 animate-spin text-accent" />
                <div>
                  <p className="text-sm font-medium text-ink">Reviewing your project</p>
                  <p className="text-[13px] text-muted">Checking it against the rubric.</p>
                </div>
              </div>
            ) : project.reviewed && project.feedback ? (
              <div className="mt-4 animate-rise">
                <div>
                  <p className="text-[15px] font-semibold text-ink">Project reviewed.</p>
                  <p className="text-[13px] text-muted">Submitted {formatSubmittedAt(project.submittedAt)}</p>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-line bg-panel p-4">
                    <p className="text-[13px] font-semibold uppercase tracking-wide text-success">
                      Strengths
                    </p>
                    <ul className="mt-2 space-y-2">
                      {project.feedback.strengths.map((s) => (
                        <li key={s} className="flex gap-2 text-sm text-body">
                          <LuCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-line bg-panel p-4">
                    <p className="text-[13px] font-semibold uppercase tracking-wide text-warn">
                      Improve
                    </p>
                    <ul className="mt-2 space-y-2">
                      {project.feedback.improve.map((s) => (
                        <li key={s} className="flex gap-2 text-sm text-body">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-warn/70" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-muted">{project.feedback.note}</p>

                <div className="mt-4">
                  <Button variant="secondary" size="sm" onClick={() => setSubmitOpen(true)}>
                    Revise and resubmit
                  </Button>
                </div>
              </div>
            ) : project.submitted ? (
              <div className="mt-4 flex items-center gap-3">
                <LuLoaderCircle className="h-5 w-5 animate-spin text-accent" />
                <div>
                  <p className="text-sm font-medium text-ink">Under review</p>
                  <p className="text-[13px] text-muted">Feedback lands here shortly.</p>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-sm leading-relaxed text-body">
                  {allTasksDone
                    ? 'All tasks are done. Send it over for review.'
                    : 'Done is better than perfect. Submit when you have something real to show.'}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button onClick={() => setSubmitOpen(true)}>Submit project</Button>
                  {!allTasksDone && (
                    <span className="text-[13px] text-muted">
                      {done} of {total} tasks complete
                    </span>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* side column */}
        <aside className="space-y-6">
          <section className="rounded-xl border border-line p-5">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-muted">
              Required deliverables
            </h2>
            <ul className="mt-3 space-y-2.5">
              {project.deliverables.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-body">
                  <LuCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-line p-5">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-muted">
              Related learning
            </h2>
            <ul className="mt-3 space-y-2">
              {project.related.map((sectionId) => {
                const section = state.paths
                  .flatMap((p) => p.sections)
                  .find((s) => s.id === sectionId)
                return (
                  <li key={sectionId}>
                    <Link
                      to={`/app/session/${sectionId}`}
                      className="block rounded-lg border border-line px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:border-line-strong hover:bg-canvas"
                    >
                      {section ? section.title : 'Learning section'}
                    </Link>
                  </li>
                )
              })}
            </ul>
            <p className="mt-3 text-[13px] text-muted">
              Refresh these sections before your final presentation.
            </p>
          </section>

          {project.status === 'completed' && (
            <section className="rounded-xl border border-success/30 bg-success-soft/50 p-5">
              <p className="text-sm font-semibold text-success">Completed</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-body">
                This project counts towards your progress. Revisit it any time.
              </p>
            </section>
          )}
        </aside>
      </div>

      <SubmitProjectModal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        onSubmit={handleConfirmSubmit}
        title={project.title}
      />
    </Page>
  )
}
